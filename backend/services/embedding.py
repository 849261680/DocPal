from typing import List, Optional, Dict, Any
import os
import traceback
import numpy as np
import time

# 导入OpenAI库
from openai import OpenAI
import tiktoken

# OpenAI配置常量
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
EMBEDDING_MODEL_NAME = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSION = os.environ.get("OPENAI_EMBEDDING_DIMENSION", 1536)  # text-embedding-3-small的维度
EMBEDDING_BATCH_SIZE = int(os.environ.get("OPENAI_EMBEDDING_BATCH_SIZE", 4))  # 每批处理的文本数量
EMBEDDING_REQUEST_TIMEOUT = int(os.environ.get("OPENAI_REQUEST_TIMEOUT", 60))  # 请求超时时间
EMBEDDING_MAX_RETRIES = int(os.environ.get("OPENAI_MAX_RETRIES", 3))  # 最大重试次数

print(f"[服务初始化] 使用OpenAI Embedding API: {EMBEDDING_MODEL_NAME}, 维度: {EMBEDDING_DIMENSION}")
if not OPENAI_API_KEY:
    print("警告: 未设置OPENAI_API_KEY环境变量。请确保在生产环境中设置此变量。")

class OpenAIEmbeddingSingleton:
    """OpenAI Embedding API封装类，实现单例模式"""
    _instance = None
    _client: Optional[OpenAI] = None
    _dimension: int = int(EMBEDDING_DIMENSION)
    _model_name: str = EMBEDDING_MODEL_NAME
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenAIEmbeddingSingleton, cls).__new__(cls)
            print("[OpenAIEmbeddingSingleton.__new__] 实例已创建，客户端将在首次使用时初始化")
        return cls._instance
    
    def _init_client_if_needed(self):
        """初始化OpenAI客户端（如果尚未初始化）"""
        if self._client is None:
            try:
                # 检查API密钥
                if not OPENAI_API_KEY:
                    raise ValueError("未设置OPENAI_API_KEY环境变量")
                    
                # 初始化客户端
                print(f"[OpenAIEmbeddingSingleton] 正在初始化OpenAI客户端...")
                self._client = OpenAI(api_key=OPENAI_API_KEY, timeout=EMBEDDING_REQUEST_TIMEOUT)
                print(f"[OpenAIEmbeddingSingleton] OpenAI客户端初始化完成")
                
                # 更新模型名称和维度
                self._model_name = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
                self._dimension = int(os.environ.get("OPENAI_EMBEDDING_DIMENSION", 1536))
                
            except Exception as e:
                print(f"[OpenAIEmbeddingSingleton] OpenAI客户端初始化失败: {e}")
                traceback.print_exc()
                self._client = None
                raise RuntimeError(f"无法初始化OpenAI客户端: {e}")
    
    def get_client(self) -> OpenAI:
        """获取OpenAI客户端实例"""
        self._init_client_if_needed()
        if self._client is None:
            raise RuntimeError("OpenAI客户端未能成功初始化")
        return self._client
    
    def get_dimension(self) -> int:
        """获取嵌入向量的维度"""
        return self._dimension
    
    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """为一批文本生成嵌入向量"""
        if not texts:
            return []
            
        self._init_client_if_needed()
        
        try:
            response = self._client.embeddings.create(
                model=self._model_name,
                input=texts,
                encoding_format="float"
            )
            
            # 从响应中提取嵌入向量
            embeddings = [item.embedding for item in response.data]
            return embeddings
            
        except Exception as e:
            print(f"[OpenAIEmbeddingSingleton] 生成嵌入向量失败: {e}")
            traceback.print_exc()
            raise e

def get_embedding_model() -> OpenAIEmbeddingSingleton:
    """获取OpenAI Embedding模型单例实例"""
    return OpenAIEmbeddingSingleton()

def get_embedding_dimension() -> int:
    """获取嵌入向量的维度"""
    return OpenAIEmbeddingSingleton().get_dimension()

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    为一批文本生成嵌入向量。
    返回一个列表，其中每个元素是对应文本的嵌入向量。
    实现了批处理和重试逻辑。
    """
    if not texts:
        return []
        
    model = get_embedding_model()
    batch_size = EMBEDDING_BATCH_SIZE
    max_retries = EMBEDDING_MAX_RETRIES
    all_embeddings = []
    
    print(f"使用OpenAI {EMBEDDING_MODEL_NAME} 为 {len(texts)} 个文本块生成嵌入向量，批处理大小: {batch_size}")
    
    # 将文本分批处理
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        retries = 0
        success = False
        
        while not success and retries < max_retries:
            try:
                if retries > 0:
                    print(f"第 {retries} 次重试批次 {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}...")
                    # 指数退避
                    time.sleep(2 ** retries)
                
                batch_embeddings = model.generate_batch_embeddings(batch_texts)
                all_embeddings.extend(batch_embeddings)
                success = True
                print(f"成功处理批次 {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}，{len(batch_texts)} 个文本")
                
            except Exception as e:
                retries += 1
                print(f"批次 {i//batch_size + 1} 处理失败 (尝试 {retries}/{max_retries}): {e}")
                
                if retries >= max_retries:
                    print(f"批次 {i//batch_size + 1} 达到最大重试次数，跳过")
                    # 对于失败的批次，添加空嵌入向量
                    empty_embeddings = [[0.0] * get_embedding_dimension() for _ in range(len(batch_texts))]
                    all_embeddings.extend(empty_embeddings)
    
    if len(all_embeddings) != len(texts):
        print(f"警告: 生成的嵌入向量数量 ({len(all_embeddings)}) 与文本数量 ({len(texts)}) 不匹配")
        # 确保返回结果数量与输入文本数量一致
        while len(all_embeddings) < len(texts):
            all_embeddings.append([0.0] * get_embedding_dimension())
    
    print(f"成功为 {len(texts)} 个文本块生成嵌入向量")
    return all_embeddings