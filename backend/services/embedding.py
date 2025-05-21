from typing import List, Optional, Dict, Any
import os
import time
import traceback
import httpx
import numpy as np
import json

# 为Railway部署减少对配置文件的依赖
# 尽量直接使用环境变量，避免导入错误
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_BASE_URL = os.environ.get("DEEPSEEK_API_BASE_URL", "https://api.deepseek.com/openapi/v1")
DEEPSEEK_EMBEDDING_MODEL = os.environ.get("DEEPSEEK_EMBEDDING_MODEL", "deepseek-embed")

# 对于本地开发环境，尝试从配置文件加载配置
try:
    print("[尝试从配置文件加载]")
    try:
        from backend.config import DEEPSEEK_API_KEY as config_key, DEEPSEEK_API_BASE_URL as config_base, DEEPSEEK_EMBEDDING_MODEL as config_model
    except ImportError:
        try:
            from config import DEEPSEEK_API_KEY as config_key, DEEPSEEK_API_BASE_URL as config_base, DEEPSEEK_EMBEDDING_MODEL as config_model
        except ImportError:
            print("[从配置文件加载失败，使用环境变量]")
            config_key, config_base, config_model = None, None, None
    
    # 如果成功从配置文件读取，覆盖环境变量的值
    if config_key: DEEPSEEK_API_KEY = config_key
    if config_base: DEEPSEEK_API_BASE_URL = config_base
    if config_model: DEEPSEEK_EMBEDDING_MODEL = config_model
except Exception as e:
    print(f"[警告] 加载配置文件时出现错误: {e}")
    print("[继续] 使用环境变量继续运行")

# DeepSeek配置常量
EMBEDDING_DIMENSION = int(os.environ.get("DEEPSEEK_EMBEDDING_DIMENSION", 1024))  # DeepSeek embedding的默认维度
EMBEDDING_BATCH_SIZE = int(os.environ.get("DEEPSEEK_EMBEDDING_BATCH_SIZE", 4))  # 每批处理的文本数量
EMBEDDING_REQUEST_TIMEOUT = int(os.environ.get("DEEPSEEK_REQUEST_TIMEOUT", 60))  # 请求超时时间
EMBEDDING_MAX_RETRIES = int(os.environ.get("DEEPSEEK_MAX_RETRIES", 3))  # 最大重试次数

print(f"[服务初始化] 使用DeepSeek Embedding API: {DEEPSEEK_EMBEDDING_MODEL}, 维度: {EMBEDDING_DIMENSION}")
if not DEEPSEEK_API_KEY:
    print("警告: 未设置DEEPSEEK_API_KEY环境变量。请确保在生产环境中设置此变量。")

class DeepSeekEmbeddingSingleton:
    """DeepSeek Embedding API封装类，实现单例模式"""
    _instance = None
    _http_client: Optional[httpx.Client] = None
    _dimension: int = int(EMBEDDING_DIMENSION)
    _model_name: str = DEEPSEEK_EMBEDDING_MODEL
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DeepSeekEmbeddingSingleton, cls).__new__(cls)
            print("[DeepSeekEmbeddingSingleton.__new__] 实例已创建，客户端将在首次使用时初始化")
        return cls._instance
    
    def _init_client_if_needed(self):
        """初始化DeepSeek HTTP客户端（如果尚未初始化）"""
        if self._http_client is None:
            try:
                # 检查API密钥
                if not DEEPSEEK_API_KEY:
                    raise ValueError("未设置DEEPSEEK_API_KEY环境变量")
                    
                # 初始化HTTP客户端
                print(f"[DeepSeekEmbeddingSingleton] 正在初始化DeepSeek HTTP客户端...")
                self._http_client = httpx.Client(timeout=EMBEDDING_REQUEST_TIMEOUT)
                print(f"[DeepSeekEmbeddingSingleton] DeepSeek HTTP客户端初始化完成")
                
                # 更新模型名称和维度
                self._model_name = os.environ.get("DEEPSEEK_EMBEDDING_MODEL", "deepseek-embed")  # 使用正确的DeepSeek模型名称
                self._dimension = int(os.environ.get("DEEPSEEK_EMBEDDING_DIMENSION", 1024))
                
            except Exception as e:
                print(f"[DeepSeekEmbeddingSingleton] DeepSeek客户端初始化失败: {e}")
                traceback.print_exc()
                self._http_client = None
                raise RuntimeError(f"无法初始化DeepSeek客户端: {e}")
    
    def get_client(self) -> httpx.Client:
        """获取DeepSeek HTTP客户端实例"""
        self._init_client_if_needed()
        if self._http_client is None:
            raise RuntimeError("DeepSeek HTTP客户端未能成功初始化")
        return self._http_client
    
    def get_dimension(self) -> int:
        """获取嵌入向量的维度"""
        return self._dimension
    
    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """为一批文本生成嵌入向量"""
        if not texts:
            return []
            
        self._init_client_if_needed()
        
        try:
            # 准备DeepSeek API请求
            # 构建正确的API端点URL
            # 根据错误日志，避免路径重复
            if "/openapi/v1" in DEEPSEEK_API_BASE_URL:
                url = f"{DEEPSEEK_API_BASE_URL}/embeddings"
            else:
                url = f"{DEEPSEEK_API_BASE_URL}/openapi/v1/embeddings"
            headers = {
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self._model_name,
                "input": texts
            }
            
            # 打印详细调试信息
            print(f"[DEBUG] DeepSeek API 请求细节:")
            print(f"[DEBUG] - URL: {url}")
            print(f"[DEBUG] - 模型: {self._model_name}")
            print(f"[DEBUG] - API密钥是否存在: {bool(DEEPSEEK_API_KEY)}")
            if DEEPSEEK_API_KEY:
                print(f"[DEBUG] - API密钥前几位: {DEEPSEEK_API_KEY[:5]}...")
            print(f"[DEBUG] - 输入文本数量: {len(texts)}")
            if texts:
                print(f"[DEBUG] - 第一个文本开头: {texts[0][:50]}...")
            
            # 发送请求
            print(f"[DEBUG] 请求Headers: {headers}")
            print(f"[DEBUG] 请求Payload: {payload}")
            response = self._http_client.post(url, headers=headers, json=payload)
            
            # 打印完整响应，包括状态码和响应内容，无论成功与否
            print(f"[DEBUG] 响应状态码: {response.status_code}")
            print(f"[DEBUG] 响应头: {dict(response.headers)}")
            try:
                response_text = response.text
                print(f"[DEBUG] 响应内容: {response_text[:500]}...")  # 限制输出大小
                response_json = response.json() if response_text else {}
                print(f"[DEBUG] 响应JSON: {response_json}")
            except Exception as parse_error:
                print(f"[DEBUG] 解析响应失败: {parse_error}")
                print(f"[DEBUG] 原始响应: {response.text[:200]}")
            
            # 分析响应
            print(f"[DEBUG] 响应状态码: {response.status_code}")
            print(f"[DEBUG] 响应头: {dict(response.headers)}")
            
            # 完整分析响应内容
            try:
                response_text = response.text
                print(f"[DEBUG] 原始响应内容: {response_text[:300]}")
                
                # 只在有响应内容时尝试解析JSON
                if response_text:
                    response_data = response.json()
                    print(f"[DEBUG] 响应JSON: {response_data}")
                else:
                    response_data = {}
            except Exception as parse_error:
                print(f"[DEBUG] 解析响应失败: {parse_error}")
                response_data = {}
            
            # API错误处理
            if response.status_code != 200:
                error_message = f"DeepSeek API错误: 状态码 {response.status_code}"
                
                # 尝试从响应中提取错误信息
                if response_data and "error" in response_data:
                    error_message += f", 错误信息: {response_data['error']}"
                elif response_data and "message" in response_data:
                    error_message += f", 错误信息: {response_data['message']}"
                
                print(f"[ERROR] {error_message}")
                print(f"[DEBUG] 尝试其他可能的URL端点:")
                print(f"  - {DEEPSEEK_API_BASE_URL}/v1/embeddings")
                print(f"  - {DEEPSEEK_API_BASE_URL}/api/v1/embeddings")
                print(f"  - {DEEPSEEK_API_BASE_URL}/embeddings")
                
                # 仍然抛出异常以开始重试流程
                response.raise_for_status()
            
            # 从响应中提取嵌入向量
            embeddings = [item.get("embedding", []) for item in response_data.get("data", [])]
            print(f"[成功] 从 DeepSeek API 获取到 {len(embeddings)} 个嵌入向量")
            return embeddings
            
        except Exception as e:
            print(f"[DeepSeekEmbeddingSingleton] 生成嵌入向量失败: {e}")
            traceback.print_exc()
            raise e

def get_embedding_model() -> DeepSeekEmbeddingSingleton:
    """获取DeepSeek Embedding模型单例实例"""
    return DeepSeekEmbeddingSingleton()

def get_embedding_dimension() -> int:
    """获取嵌入向量的维度"""
    return DeepSeekEmbeddingSingleton().get_dimension()

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
    
    print(f"使用DeepSeek {DEEPSEEK_EMBEDDING_MODEL} 为 {len(texts)} 个文本块生成嵌入向量，批处理大小: {batch_size}")
    
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