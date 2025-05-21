from sentence_transformers import SentenceTransformer
from typing import List, Optional
import numpy as np
import torch # 确保 torch 可用，sentence-transformers 依赖它
import traceback # 确保导入
import os # 添加os模块导入

# 直接从环境变量获取，不使用配置模块中的值
# from backend.config import EMBEDDING_MODEL_NAME
# 优先使用环境变量中的设置，如果没有则使用默认值
EMBEDDING_MODEL_NAME = os.environ.get("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
print(f"[服务初始化] 从环境变量加载嵌入模型: {EMBEDDING_MODEL_NAME}")

class EmbeddingModelSingleton:
    _instance = None
    _model: Optional[SentenceTransformer] = None
    _dimension: Optional[int] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingModelSingleton, cls).__new__(cls)
            # 只进行基本初始化，不在这里加载模型或计算维度
            # 模型加载和维度计算推迟到首次 get_model() 或 get_dimension() 调用
            print("[EmbeddingSingleton.__new__] Instance created. Model will be loaded on first use.")
        return cls._instance

    def _load_model_if_needed(self):
        # 每次加载前重新检查环境变量
        global EMBEDDING_MODEL_NAME
        EMBEDDING_MODEL_NAME = os.environ.get("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
        
        if self._model is None:
            try:
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
                print(f"[EmbeddingSingleton._load_model_if_needed] 准备初始化 SentenceTransformer: {EMBEDDING_MODEL_NAME} on {device}...")
                self._model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=device)
                print(f"[EmbeddingSingleton._load_model_if_needed] SentenceTransformer 初始化完毕。模型对象: {type(self._model)}")
            except Exception as e_load:
                print(f"[EmbeddingSingleton._load_model_if_needed] 加载/初始化嵌入模型 {EMBEDDING_MODEL_NAME} 失败: {e_load}")
                traceback.print_exc()
                self._model = None # 确保失败时 _model 为 None
                self._dimension = None
                raise RuntimeError(f"无法加载嵌入模型: {e_load}") # 重新抛出，让调用者知道失败

    def get_model(self) -> SentenceTransformer:
        self._load_model_if_needed() # 确保模型已加载
        if self._model is None: # 再次检查，如果 _load_model_if_needed 内部失败但未抛出或被捕获
             raise RuntimeError("嵌入模型未能成功加载，get_model 返回 None 是无效的。")
        return self._model

    def get_dimension(self) -> Optional[int]:
        self._load_model_if_needed() # 确保模型已加载才能获取维度
        if self._model and self._dimension is None:
            print("[EmbeddingSingleton.get_dimension] 模型已加载，但维度未知。准备对测试字符串编码...")
            try:
                dummy_emb = self._model.encode(["test_for_dim_on_get_dimension"])
                self._dimension = dummy_emb.shape[1]
                print(f"[EmbeddingSingleton.get_dimension] 维度计算成功: {self._dimension}")
            except Exception as e_dim:
                print(f"[EmbeddingSingleton.get_dimension] 获取模型 {EMBEDDING_MODEL_NAME} 维度失败: {e_dim}")
                traceback.print_exc()
                # 不将 self._dimension 设为 None，允许后续重试，或者让调用者处理 None
                # 但如果这里失败，很可能 encode 调用都会失败
                return None # 直接返回 None，表示维度获取失败
        
        return self._dimension

def get_embedding_model() -> SentenceTransformer:
    """获取 SentenceTransformer 模型实例"""
    return EmbeddingModelSingleton().get_model()

def get_embedding_dimension() -> Optional[int]: # 新增辅助函数
    return EmbeddingModelSingleton().get_dimension()

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    为一批文本生成嵌入向量。
    返回一个列表，其中每个元素是对应文本的嵌入向量 (float 列表)。
    """
    model = get_embedding_model()
    if not texts:
        return []
    try:
        print(f"使用模型 {EMBEDDING_MODEL_NAME} 为 {len(texts)} 个文本块生成嵌入...")
        # SentenceTransformer 的 encode 方法返回 numpy 数组列表
        embeddings_np = model.encode(texts, batch_size=16, show_progress_bar=True)
        # 将 numpy 数组转换为 float 列表
        embeddings_list = [emb.tolist() for emb in embeddings_np]
        print(f"成功为 {len(texts)} 个文本块生成嵌入。")
        return embeddings_list
    except Exception as e:
        print(f"使用模型 {EMBEDDING_MODEL_NAME} 生成嵌入时发生错误: {e}")
        traceback.print_exc()
        # 根据需要，这里可以返回空列表或重新抛出异常
        return []

# 可以在模块加载时尝试初始化模型，以便尽早发现问题
# get_embedding_model() 