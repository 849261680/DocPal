# 路由注册 
from fastapi import APIRouter, File, UploadFile, HTTPException, Body, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
import traceback
import os
from typing import List, Optional
from datetime import datetime

try:
    # 本地开发环境
    from backend.api.models import (
        UploadResponse,
        QueryRequest,
        QueryResponse,
        HealthResponse,
        SourceDocument,
        DocumentMetadata,
        DocumentListResponse,
        AskRequest,
        AskResponse,
        DocumentStatusResponse
    )
    from backend.services.document_loader import (
        load_document,
        split_documents,
        save_uploaded_file
    )
    from backend.services.vector_store import get_vector_store, FAISSVectorStore
    from backend.services.rag import query_rag_pipeline
    from backend.config import TOP_K_RESULTS # 默认的 top_k 值
    from backend.services.document_storage import (
        DocumentInfo, 
        get_all_documents,
        save_document_info, 
        delete_document,
        clear_all_documents,
        get_document_status,
        update_document_status
    )
except ModuleNotFoundError:
    # Railway部署环境（目录结构已扁平化）
    from api.models import (
        UploadResponse,
        QueryRequest,
        QueryResponse,
        HealthResponse,
        SourceDocument,
        DocumentMetadata,
        DocumentListResponse,
        AskRequest,
        AskResponse,
        DocumentStatusResponse
    )
    from services.document_loader import (
        load_document,
        split_documents,
        save_uploaded_file
    )
    from services.vector_store import get_vector_store, FAISSVectorStore
    from services.rag import query_rag_pipeline
    from config import TOP_K_RESULTS # 默认的 top_k 值
    from services.document_storage import (
        DocumentInfo, 
        get_all_documents,
        save_document_info,
        delete_document,
        clear_all_documents,
        get_document_status,
        update_document_status,
        get_document_info
    )

# 直接在Python中定义ProcessingStatus枚举
# 这样可以避免从 TypeScript 文件导入的问题
from enum import Enum

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"

router = APIRouter()

# Dependency to get the vector store instance
def get_db() -> FAISSVectorStore:
    return get_vector_store()

@router.post("/upload_doc/", response_model=UploadResponse)
async def upload_document_route(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    处理文档上传，保存文件并在后台异步处理文档。
    这样可以避免大型文件处理导致的HTTP请求超时问题。
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空。")
    
    # 替换文件名中的空格，避免潜在问题
    safe_filename = file.filename.replace(" ", "_") 
    
    try:
        print(f"接收到上传文件: {safe_filename}, 类型: {file.content_type}, 大小: {file.size if hasattr(file, 'size') else '未知'}")
        content = await file.read()
        file_size = len(content)
        print(f"成功读取文件内容，大小: {file_size} 字节")
        
        # 1. 保存原始文件
        print(f"开始保存文件到磁盘...")
        saved_file_path = await save_uploaded_file(safe_filename, content)
        print(f"原始文件已保存到: {saved_file_path}")

        # 2. 创建文档记录，状态设为处理中
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        doc_info = DocumentInfo(
            filename=safe_filename,
            file_path=saved_file_path,
            upload_time=current_time,
            file_size=file_size,
            status=ProcessingStatus.PENDING,
            progress=0
        )
        save_document_info(doc_info)
        print(f"已保存文件 {safe_filename} 的初始元数据信息")
        
        # 3. 添加后台任务处理文档
        background_tasks.add_task(
            process_document_async, 
            saved_file_path, 
            safe_filename
        )
        
        # 4. 立即返回响应
        return UploadResponse(
            status="processing", 
            filename=safe_filename,
            message=f"文件 '{safe_filename}' 已接收，正在后台处理。请使用 /api/document_status/{safe_filename} 查询状态。"
        )
        
    except Exception as e:
        print(f"处理文件 {safe_filename} 时发生意外错误: {e}")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"处理文件 '{safe_filename}' 时发生内部服务器错误: {str(e)}")
    finally:
        await file.close()

async def process_document_async(file_path: str, filename: str):
    """
    后台异步处理文档，包括加载、分块、生成嵌入并存入向量索引。
    该函数由upload_document_route通过BackgroundTasks调用，不直接暴露为API。
    """
    try:
        # 获取向量存储实例
        db = get_vector_store()
        
        # 1. 更新状态为文档提取中
        update_document_status(filename, ProcessingStatus.EXTRACTING, progress=10)
        
        # 2. 加载文档
        docs = load_document(file_path)
        if not docs:
            update_document_status(
                filename, 
                ProcessingStatus.FAILED, 
                progress=0, 
                error="无法加载或解析文件，可能是不支持的文件类型或文件已损坏。"
            )
            return
            
        # 3. 更新状态为分块中
        update_document_status(filename, ProcessingStatus.CHUNKING, progress=30)
        
        # 4. 分割文档
        chunks = split_documents(docs)
        if not chunks:
            update_document_status(
                filename, 
                ProcessingStatus.FAILED, 
                progress=0, 
                error="文档分块失败，可能为空文件或内容无法处理。"
            )
            return
            
        # 5. 更新状态为嵌入生成中
        update_document_status(filename, ProcessingStatus.EMBEDDING, progress=50)
        
        # 6. 生成嵌入并添加到向量存储
        chunks_added_count = db.add_documents(chunks)
        
        if chunks_added_count > 0:
            # 7. 更新状态为已完成
            update_document_status(
                filename, 
                ProcessingStatus.COMPLETED, 
                progress=100,
                chunks_count=chunks_added_count
            )
            print(f"成功为文件 {filename} 添加了 {chunks_added_count} 个文本块到向量数据库。")
        else:
            update_document_status(
                filename, 
                ProcessingStatus.FAILED, 
                progress=0, 
                error="无法为文档块生成嵌入或添加到向量数据库。"
            )
            
    except Exception as e:
        print(f"后台处理文件 {filename} 时出错: {e}")
        traceback.print_exc()
        update_document_status(
            filename, 
            ProcessingStatus.FAILED, 
            progress=0, 
            error=f"处理错误: {str(e)}"
        )

@router.get("/document_status/{filename}", response_model=DocumentStatusResponse)
async def get_document_status_route(filename: str):
    """
    获取文档处理状态
    """
    doc_info = get_document_info(filename)
    if not doc_info:
        raise HTTPException(status_code=404, detail=f"找不到文档: {filename}")
    
    return DocumentStatusResponse(
        status="success",
        filename=doc_info.filename,
        processing_status=doc_info.status,
        progress=doc_info.progress,
        chunks_count=doc_info.chunks_count,
        error=doc_info.error
    )

@router.post("/query", response_model=QueryResponse)
async def query_route(request: QueryRequest = Body(...)):
    """
    接收用户查询，通过 RAG 流程生成答案并返回。
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="查询内容不能为空。")
    
    try:
        print(f"接收到查询请求: '{request.query[:100]}...', top_k: {request.top_k or TOP_K_RESULTS}")
        # top_k 可以从请求中获取，如果未提供则使用配置中的默认值
        result = await query_rag_pipeline(request.query, top_k=request.top_k or TOP_K_RESULTS)
        
        # query_rag_pipeline 返回的是一个字典，包含 answer 和 sources
        # QueryResponse 模型期望 answer 是字符串，sources 是 SourceDocument 列表
        # 需要确保 sources 列表中的每个元素都是 SourceDocument 类型
        # rag.py 中的 query_rag_pipeline 已经处理了 sources 的格式化
        
        return QueryResponse(answer=result["answer"], sources=result["sources"])
    
    except Exception as e:
        print(f"处理查询 '{request.query[:100]}...' 时发生意外错误: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"处理查询时发生内部服务器错误。错误详情: {str(e)}")

# 新增：基于文档的问答接口
@router.post("/ask/", response_model=AskResponse)
async def ask_route(request: AskRequest = Body(...), db: FAISSVectorStore = Depends(get_db)):
    """
    基于用户问题和可选的特定文档，生成回答
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="问题内容不能为空。")
    
    try:
        print(f"接收到文档问答请求: '{request.question[:100]}...', 文档ID: {request.documentId or '未指定'}")
        
        # 如果指定了文档ID，检查文档是否存在
        if request.documentId:
            documents = get_all_documents()
            document_exists = any(doc.filename == request.documentId for doc in documents)
            if not document_exists:
                raise HTTPException(status_code=404, detail=f"找不到指定的文档: {request.documentId}")
        
        # 获取回答
        result = await query_rag_pipeline(request.question, top_k=TOP_K_RESULTS)
        
        # 如果指定了文档ID，过滤源文档
        source_filenames = []
        if result["sources"]:
            for source in result["sources"]:
                filename = source.filename
                if not request.documentId or filename == request.documentId:
                    if filename not in source_filenames:
                        source_filenames.append(filename)
        
        return AskResponse(
            answer=result["answer"],
            sources=source_filenames
        )
    
    except HTTPException as http_exc:
        # 重新抛出已知的 HTTP 异常
        raise http_exc
    except Exception as e:
        print(f"处理文档问答请求时发生意外错误: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"处理文档问答请求时发生内部服务器错误。错误详情: {str(e)}")

@router.get("/health/", response_model=HealthResponse)
async def health_check_route():
    """
    健康检查接口。
    """
    # 可以添加更复杂的健康检查，例如检查数据库连接、LLM API 可用性等
    return HealthResponse(status="ok")

# 可以添加一个路由来重置/清空向量数据库，主要用于测试
@router.post("/reset_vector_store/", response_model=dict)
async def reset_vector_store_route(db: FAISSVectorStore = Depends(get_db)):
    """
    清空并重置 FAISS 向量数据库。
    请谨慎使用，这将删除所有已嵌入的文档。
    """
    try:
        print("请求重置向量数据库...")
        db.reset_index()
        # 同时清除文档元数据
        clear_all_documents()
        return {"status": "success", "message": "向量数据库已成功重置。"}
    except Exception as e:
        print(f"重置向量数据库时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"重置向量数据库时发生错误: {str(e)}")

# 获取当前向量数据库中的文档数量
@router.get("/vector_store_size", response_model=dict)
async def get_vector_store_size_route(db: FAISSVectorStore = Depends(get_db)):
    """
    获取当前向量数据库中存储的文档块数量。
    """
    try:
        size = db.get_index_size()
        return {"status": "success", "size": size}
    except Exception as e:
        print(f"获取向量数据库大小时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取向量数据库大小时发生错误: {str(e)}")

# 添加POST方法路由以兼容前端
@router.post("/vector_store_size", response_model=dict)
async def post_vector_store_size_route(db: FAISSVectorStore = Depends(get_db)):
    """
    获取当前向量数据库中存储的文档块数量（POST方法）。
    """
    return await get_vector_store_size_route(db)

# 新增：获取文档列表
@router.delete("/documents/{filename}", response_model=dict)
async def delete_document_route(filename: str, db: FAISSVectorStore = Depends(get_db)):
    """
    删除指定的文档，包括文件、元数据和向量存储中的数据
    """
    try:
        # 1. 获取文档信息
        documents = get_all_documents()
        target_doc = next((doc for doc in documents if doc.filename == filename), None)
        
        if not target_doc:
            raise HTTPException(status_code=404, detail=f"找不到文档: {filename}")
            
        # 2. 删除文件
        if os.path.exists(target_doc.file_path):
            os.remove(target_doc.file_path)
            
        # 3. 删除元数据
        delete_document(filename)
        
        # 4. 重置向量存储（由于FAISS不支持删除单个文档，我们需要重建索引）
        db.reset_index()
        
        # 5. 重新添加其他文档到向量存储
        remaining_docs = [doc for doc in documents if doc.filename != filename]
        for doc in remaining_docs:
            if os.path.exists(doc.file_path):
                docs = load_document(doc.file_path)
                if docs:
                    chunks = split_documents(docs)
                    db.add_documents(chunks)
        
        return {"status": "success", "message": f"文档 {filename} 已成功删除"}
        
    except Exception as e:
        print(f"删除文档时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"删除文档时发生错误: {str(e)}")

@router.get("/documents", response_model=DocumentListResponse)
async def get_documents_route():
    """
    获取已上传的所有文档列表
    """
    try:
        documents = get_all_documents()
        
        # 如果有文档，获取最后更新时间
        last_updated = None
        if documents:
            # 找出最新的上传时间
            last_updated = max([doc.upload_time for doc in documents])
        
        # 转换为响应模型
        doc_metadata = [
            DocumentMetadata(
                filename=doc.filename,
                file_path=doc.file_path,
                upload_time=doc.upload_time,
                file_size=doc.file_size,
                chunks_count=doc.chunks_count
            ) for doc in documents
        ]
        
        return DocumentListResponse(
            status="success",
            documents=doc_metadata,
            last_updated=last_updated
        )
    except Exception as e:
        print(f"获取文档列表时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取文档列表时发生错误: {str(e)}")

# 添加POST方法路由以兼容前端
@router.post("/documents", response_model=DocumentListResponse)
async def post_documents_route():
    """
    获取已上传的所有文档列表（POST方法）
    """
    return await get_documents_route()