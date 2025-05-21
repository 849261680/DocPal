# FAISS 索引构建与查询 
import faiss
import numpy as np
import os
import pickle
from typing import List, Tuple, Dict, Any, Optional
from langchain.docstore.document import Document as LangchainDocument

from backend.config import VECTOR_DB_PATH, TOP_K_RESULTS
from backend.services.embedding import generate_embeddings, get_embedding_model, get_embedding_dimension

METADATA_EXTENSION = ".meta.pkl"
INDEX_EXTENSION = ".index"

class FAISSVectorStore:
    def __init__(self, index_path_prefix: str = VECTOR_DB_PATH):
        self.index_path_prefix = index_path_prefix
        self.index_file = index_path_prefix + INDEX_EXTENSION
        self.metadata_file = index_path_prefix + METADATA_EXTENSION
        
        self.index: Optional[faiss.Index] = None
        self.document_chunks: List[LangchainDocument] = [] # 用于存储与索引向量对应的文档块
        
        self._load_or_initialize()

    def _load_or_initialize(self):
        if os.path.exists(self.index_file) and os.path.exists(self.metadata_file):
            print(f"从 {self.index_file} 和 {self.metadata_file} 加载 FAISS 索引和元数据...")
            try:
                self.index = faiss.read_index(self.index_file)
                with open(self.metadata_file, "rb") as f:
                    self.document_chunks = pickle.load(f)
                print(f"成功加载索引，包含 {self.index.ntotal if self.index else 0} 个向量和 {len(self.document_chunks)} 个文档块元数据。")
            except Exception as e:
                print(f"加载索引或元数据失败: {e}。将重新初始化空索引。")
                self._initialize_empty_index()
        else:
            print("未找到现有索引，正在初始化新的 FAISS 索引...")
            self._initialize_empty_index()

    def _initialize_empty_index(self):
        # 增加重试次数
        max_retries = 3
        retry_delay = 2  # 秒
        
        for attempt in range(max_retries):
            try:
                # 第一步：尝试获取嵌入维度
                dimension = get_embedding_dimension()
                
                # 如果获取失败，尝试显式加载模型
                if dimension is None:
                    print(f"尝试 {attempt+1}/{max_retries}: 无法获取嵌入维度，尝试显式加载模型...")
                    try:
                        # 显式触发模型加载
                        get_embedding_model()
                        # 再次尝试获取维度
                        dimension = get_embedding_dimension()
                    except Exception as model_error:
                        print(f"模型加载失败: {model_error}")
                        # 继续外部异常处理流程
                        raise
                
                # 再次检查维度
                if dimension is None:
                    if attempt < max_retries - 1:
                        print(f"尝试 {attempt+1}/{max_retries}: 维度仍为空，等待 {retry_delay} 秒后重试...")
                        import time
                        time.sleep(retry_delay)
                        continue
                    else:
                        raise RuntimeError(f"经过 {max_retries} 次尝试，仍无法获取嵌入模型维度")
                
                # 成功获取维度，初始化索引
                self.index = faiss.IndexFlatL2(dimension)
                self.document_chunks = []
                print(f"新的 FAISS 索引已初始化，维度: {dimension}。")
                return  # 成功初始化，返回
                
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"尝试 {attempt+1}/{max_retries}: 初始化索引失败: {e}，将重试...")
                    import time
                    time.sleep(retry_delay)
                else:
                    print(f"初始化空 FAISS 索引失败 (已尝试 {max_retries} 次): {e}")
                    # 在最后一次尝试失败后抛出异常
                    raise RuntimeError(f"无法初始化 FAISS 索引: {e}")

    def save_index(self):
        if self.index is not None:
            print(f"正在保存 FAISS 索引到 {self.index_file}...")
            faiss.write_index(self.index, self.index_file)
            with open(self.metadata_file, "wb") as f:
                pickle.dump(self.document_chunks, f)
            print("FAISS 索引和元数据保存成功。")
        else:
            print("警告: 索引未初始化，无法保存。")

    def add_documents(self, documents: List[LangchainDocument]):
        if not documents:
            print("没有要添加到索引的文档块。")
            return 0
        if self.index is None:
            print("错误: FAISS 索引未初始化，无法添加文档。")
            # 尝试重新初始化，或者直接抛出错误
            # self._initialize_empty_index() # 这可能不是最佳做法，取决于应用逻辑
            raise RuntimeError("FAISS 索引未初始化，无法添加文档。请检查初始化过程。")

        texts_to_embed = [doc.page_content for doc in documents]
        print(f"正在为 {len(texts_to_embed)} 个新文档块生成嵌入...")
        embeddings = generate_embeddings(texts_to_embed)
        
        if not embeddings:
            print("未能为文档块生成嵌入，无法添加到索引。")
            return 0

        np_embeddings = np.array(embeddings, dtype=np.float32)
        
        try:
            self.index.add(np_embeddings)
            self.document_chunks.extend(documents) # 保存原始文档块及其元数据
            print(f"{len(documents)} 个文档块及其嵌入已成功添加到 FAISS 索引。当前索引大小: {self.index.ntotal}")
            self.save_index() # 添加文档后立即保存
            return len(documents)
        except Exception as e:
            print(f"向 FAISS 索引添加嵌入时发生错误: {e}")
            return 0

    def search(self, query_text: str, k: int = TOP_K_RESULTS) -> List[Tuple[LangchainDocument, float]]:
        if self.index is None or self.index.ntotal == 0:
            print("警告: FAISS 索引为空或未初始化，无法执行搜索。")
            return []
        
        print(f"为查询文本生成嵌入: '{query_text[:50]}...'")
        query_embedding = generate_embeddings([query_text])
        if not query_embedding:
            print("未能为查询文本生成嵌入，无法执行搜索。")
            return []

        np_query_embedding = np.array(query_embedding, dtype=np.float32)
        
        try:
            print(f"在 FAISS 索引中搜索 top-{k} 个相似结果...")
            distances, indices = self.index.search(np_query_embedding, k)
            
            results = []
            for i in range(len(indices[0])):
                idx = indices[0][i]
                dist = distances[0][i]
                if idx != -1 and idx < len(self.document_chunks): # faiss 可能返回 -1 如果找不到足够的邻居
                    results.append((self.document_chunks[idx], float(dist)))
            
            print(f"找到 {len(results)} 个结果。")
            return results
        except Exception as e:
            print(f"在 FAISS 索引中搜索时发生错误: {e}")
            return []

    def reset_index(self):
        """清空索引和元数据，并重新初始化为空索引。"""
        print("正在重置 FAISS 索引...")
        if os.path.exists(self.index_file):
            os.remove(self.index_file)
        if os.path.exists(self.metadata_file):
            os.remove(self.metadata_file)
        self._initialize_empty_index()
        print("FAISS 索引已重置。")

    def get_index_size(self) -> int:
        return self.index.ntotal if self.index else 0

# 全局向量存储实例 (单例模式)
# 这样应用各处都可以通过 get_vector_store() 获取同一个实例
_vector_store_instance: Optional[FAISSVectorStore] = None

def get_vector_store() -> FAISSVectorStore:
    """
    获取向量存储单例实例，包含错误处理和重试逻辑
    """
    global _vector_store_instance
    if _vector_store_instance is None:
        # 添加异常处理
        try:
            print("正在初始化向量存储实例...")
            _vector_store_instance = FAISSVectorStore()
            print("向量存储实例初始化成功")
        except Exception as e:
            print(f"向量存储实例初始化失败: {e}")
            # 记录全堆栈异常信息
            import traceback
            traceback.print_exc()
            # 允许继续抛出异常，调用者需要妥善处理
            raise
    return _vector_store_instance

# 可以在模块加载时尝试初始化，以便尽早发现问题
# get_vector_store() 