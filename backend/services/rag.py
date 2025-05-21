# RAG 流程：检索 + 构造 Prompt + 调用 LLM 

import httpx
from typing import List, Tuple, Dict, Any, Optional

try:
    # 本地开发环境
    from backend.config import (
        DEEPSEEK_API_KEY,
        DEEPSEEK_API_BASE_URL,
        CHAT_MODEL,
        TOP_K_RESULTS
    )
    from backend.services.vector_store import get_vector_store, LangchainDocument
    from backend.api.models import SourceDocument # 用于格式化返回的 sources
except ModuleNotFoundError:
    # Railway部署环境
    from config import (
        DEEPSEEK_API_KEY,
        DEEPSEEK_API_BASE_URL,
        CHAT_MODEL,
        TOP_K_RESULTS
    )
    from services.vector_store import get_vector_store, LangchainDocument
    from api.models import SourceDocument # 用于格式化返回的 sources

async def generate_answer_from_llm(
    query: str,
    context_chunks: List[LangchainDocument],
    api_key: str = DEEPSEEK_API_KEY,
    base_url: str = DEEPSEEK_API_BASE_URL,
    chat_model: str = CHAT_MODEL
) -> Optional[Dict[str, Any]]:
    """
    使用提供的上下文块和用户查询，调用 DeepSeek API 生成答案。
    """
    if not api_key:
        print("错误: DeepSeek API Key 未配置。")
        return None
    
    if not context_chunks:
        print("警告: 没有提供上下文块，将直接向 LLM提问（可能导致幻觉）。")
        # 或者可以返回一个提示信息，告知用户没有找到相关上下文
        # return {"answer": "抱歉，我没有在已上传的文档中找到与您问题相关的信息。", "sources": []}

    context_str = "\n\n---\n\n".join([doc.page_content for doc in context_chunks])
    
    prompt = f"""基于以下提供的上下文信息，请用中文回答用户的问题。
如果上下文中没有足够的信息来回答问题，请明确说明上下文中没有找到相关答案，不要编造。

上下文信息:
{context_str}

用户问题: {query}

回答:"""

    messages = [
        {"role": "system", "content": "你是一个基于用户提供文档的智能问答助手。请根据文档内容回答问题，如果文档中没有相关信息，请如实告知。"},
        {"role": "user", "content": prompt}
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": chat_model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1500
    }

    # DeepSeek API 端点
    api_endpoint = f"{base_url.rstrip('/')}/v1/chat/completions"

    print(f"向 DeepSeek API ({api_endpoint}) 发送请求...")
    print(f"使用模型: {chat_model}")
    print(f"Prompt (部分): {prompt[:200]}...")

    async with httpx.AsyncClient(timeout=60.0) as client: # 设置超时时间
        try:
            response = await client.post(api_endpoint, headers=headers, json=payload)
            response.raise_for_status()  # 如果是 4xx 或 5xx 错误，则抛出 HTTPError
            
            api_response = response.json()
            print(f"DeepSeek API 响应状态: 成功")
            
            # 检查OpenAI格式的响应
            if "choices" in api_response and len(api_response["choices"]) > 0:
                answer = api_response["choices"][0]["message"]["content"]
                return {"answer": answer.strip(), "raw_response": api_response}
            else:
                print(f"DeepSeek API 返回了意外的响应格式: {api_response}")
                return {"answer": "抱歉，处理模型响应时遇到格式问题。", "raw_response": api_response}
        
        except httpx.HTTPStatusError as e:
            print(f"DeepSeek API 请求失败，状态码: {e.response.status_code}, 响应: {e.response.text}")
            return {"answer": f"抱歉，与语言模型通信时出错 (HTTP {e.response.status_code})。", "raw_response": e.response.text}
        except httpx.RequestError as e:
            print(f"DeepSeek API 请求失败: {e}")
            return {"answer": f"抱歉，与语言模型通信时发生网络错误。", "raw_response": str(e)}
        except Exception as e:
            print(f"处理 DeepSeek API 响应时发生未知错误: {e}")
            return {"answer": f"抱歉，处理语言模型响应时发生未知错误。", "raw_response": str(e)}


async def query_rag_pipeline(
    user_query: str,
    top_k: Optional[int] = None
) -> Dict[str, Any]:
    """
    完整的 RAG 流程：检索、构造 Prompt、调用 LLM。
    """
    vector_store = get_vector_store()
    actual_top_k = top_k if top_k is not None else TOP_K_RESULTS

    if vector_store.get_index_size() == 0:
        print("RAG Pipeline: 向量数据库为空，无法进行检索。")
        # 根据需求，可以直接返回提示，或者尝试不带上下文调用LLM（如果允许）
        # 这里选择提示用户上传文档
        return {
            "answer": "知识库为空，请先上传文档后再进行提问。",
            "sources": []
        }

    print(f"RAG Pipeline: 正在为查询 '{user_query[:50]}...' 检索 top-{actual_top_k} 相关文档块...")
    retrieved_chunks_with_scores = vector_store.search(user_query, k=actual_top_k)
    
    retrieved_docs = [doc for doc, score in retrieved_chunks_with_scores]
    
    if not retrieved_docs:
        print(f"RAG Pipeline: 未能从向量数据库中检索到与查询 '{user_query[:50]}...' 相关的内容。")
        # 可以选择直接告知用户，或者尝试不带上下文调用 LLM
        # llm_response = await generate_answer_from_llm(user_query, []) # 不带上下文
        return {
            "answer": "抱歉，在已上传的文档中未能找到与您问题直接相关的信息。",
            "sources": []
        }
    
    print(f"RAG Pipeline: 已检索到 {len(retrieved_docs)} 个文档块，准备调用 LLM 生成答案...")
    llm_result = await generate_answer_from_llm(user_query, retrieved_docs)
    
    if llm_result and "answer" in llm_result:
        formatted_sources = [
            SourceDocument(
                filename=doc.metadata.get("source", "未知来源"), 
                page_content=doc.page_content,
                metadata=doc.metadata
            ) for doc in retrieved_docs
        ]
        return {"answer": llm_result["answer"], "sources": formatted_sources}
    else:
        # LLM 调用失败或未返回期望格式
        return {
            "answer": llm_result.get("answer", "抱歉，生成答案时发生错误，请稍后再试或联系管理员。"), 
            "sources": []
        } 
