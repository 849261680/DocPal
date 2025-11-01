"""
嵌入服务模块：将文本转换为向量表示
使用Cohere API生成文本的嵌入向量
优化为在Railway环境中可靠运行
"""

from typing import List, Optional
import os
import time
import traceback
import httpx

# 直接从环境变量获取配置，提高Railway部署的兼容性
COHERE_API_KEY = os.environ.get("COHERE_API_KEY", "")
COHERE_API_BASE_URL = os.environ.get("COHERE_API_BASE_URL", "https://api.cohere.ai")
COHERE_EMBEDDING_MODEL = os.environ.get(
    "COHERE_EMBEDDING_MODEL", "embed-multilingual-v3.0"
)

# Cohere配置常量
EMBEDDING_DIMENSION = int(
    os.environ.get("COHERE_EMBEDDING_DIMENSION", 1024)
)  # Cohere embedding的默认维度
EMBEDDING_BATCH_SIZE = int(
    os.environ.get("COHERE_EMBEDDING_BATCH_SIZE", 5)
)  # 每批处理的文本数量
EMBEDDING_REQUEST_TIMEOUT = int(
    os.environ.get("COHERE_REQUEST_TIMEOUT", 60)
)  # 请求超时时间(秒)
EMBEDDING_MAX_RETRIES = int(os.environ.get("COHERE_MAX_RETRIES", 3))  # 最大重试次数

print(
    f"[服务初始化] 使用Cohere Embedding API: {COHERE_EMBEDDING_MODEL}, 维度: {EMBEDDING_DIMENSION}"
)
if not COHERE_API_KEY:
    print("警告: 未设置COHERE_API_KEY环境变量。请确保在生产环境中设置此变量。")
    print("嵌入功能将不可用，但应用程序会继续启动。")


class CohereEmbeddingSingleton:
    """Cohere Embedding API封装类，实现单例模式"""

    _instance = None
    _http_client: Optional[httpx.Client] = None
    _dimension: int = EMBEDDING_DIMENSION
    _model_name: str = COHERE_EMBEDDING_MODEL

    def __new__(cls):
        if cls._instance is None:
            print("[CohereEmbeddingSingleton] 创建新实例")
            cls._instance = super(CohereEmbeddingSingleton, cls).__new__(cls)
        return cls._instance

    def _init_client_if_needed(self):
        """初始化Cohere HTTP客户端（如果尚未初始化）"""
        if self._http_client is None:
            try:
                # 初始化HTTP客户端
                print("[CohereEmbeddingSingleton] 初始化Cohere HTTP客户端")
                self._http_client = httpx.Client(timeout=EMBEDDING_REQUEST_TIMEOUT)

                # 更新模型名称和维度
                self._model_name = COHERE_EMBEDDING_MODEL
                self._dimension = EMBEDDING_DIMENSION

                print("[CohereEmbeddingSingleton] HTTP客户端初始化完成")
            except Exception as e:
                print(f"[CohereEmbeddingSingleton] 客户端初始化失败: {e}")
                traceback.print_exc()
                self._http_client = None

    def get_client(self) -> Optional[httpx.Client]:
        """获取HTTP客户端实例"""
        self._init_client_if_needed()
        return self._http_client

    def get_dimension(self) -> int:
        """获取嵌入向量的维度"""
        return self._dimension

    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """为一批文本生成嵌入向量"""
        if not texts:
            print("[CohereEmbeddingSingleton] 警告: 接收到空文本列表，返回空结果")
            return []

        if not COHERE_API_KEY:
            print(
                "[CohereEmbeddingSingleton] 错误: 未设置COHERE_API_KEY，无法生成嵌入向量"
            )
            # 返回零向量作为占位符
            return [[0.0] * self._dimension for _ in range(len(texts))]

        self._init_client_if_needed()

        try:
            # 准备Cohere API请求
            url = f"{COHERE_API_BASE_URL}/v1/embed"
            headers = {
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            payload = {
                "model": self._model_name,
                "texts": texts,
                "input_type": "search_document",  # 用于文档检索的嵌入类型
            }

            # 打印请求细节（不包含完整API密钥）
            print(f"[CohereEmbeddingSingleton] 请求: {url}")
            print(f"[CohereEmbeddingSingleton] 模型: {self._model_name}")
            print(f"[CohereEmbeddingSingleton] 文本数量: {len(texts)}")

            # 发送请求
            if self._http_client is None:
                raise RuntimeError("HTTP客户端未初始化")
            response = self._http_client.post(url, headers=headers, json=payload)

            # 分析响应
            print(f"[CohereEmbeddingSingleton] 响应状态码: {response.status_code}")

            # 错误处理
            if response.status_code != 200:
                error_message = f"Cohere API错误: 状态码 {response.status_code}"

                try:
                    response_data = response.json()
                    if "message" in response_data:
                        error_message += f", 信息: {response_data['message']}"
                except Exception:
                    response_text = (
                        response.text[:200] + "..."
                        if len(response.text) > 200
                        else response.text
                    )
                    error_message += f", 响应: {response_text}"

                print(f"[CohereEmbeddingSingleton] {error_message}")
                response.raise_for_status()  # 抛出异常以触发重试

            # 从响应中提取嵌入向量
            response_data = response.json()
            embeddings = response_data.get("embeddings", [])

            if len(embeddings) != len(texts):
                print(
                    f"[CohereEmbeddingSingleton] 警告: 返回的嵌入向量数量({len(embeddings)})与请求文本数量({len(texts)})不符"
                )

            print(f"[CohereEmbeddingSingleton] 成功获取 {len(embeddings)} 个嵌入向量")
            return embeddings

        except Exception as e:
            print(f"[CohereEmbeddingSingleton] 生成嵌入向量出错: {e}")
            traceback.print_exc()
            raise  # 让调用函数处理重试逻辑


def get_embedding_model() -> CohereEmbeddingSingleton:
    """获取嵌入模型单例实例"""
    return CohereEmbeddingSingleton()


def get_embedding_dimension() -> int:
    """获取嵌入向量的维度"""
    return CohereEmbeddingSingleton().get_dimension()


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    为一组文本生成嵌入向量

    Args:
        texts: 要处理的文本列表

    Returns:
        List[List[float]]: 嵌入向量列表，每个向量对应一个输入文本
    """
    if not texts:
        return []

    # 如果没有设置API密钥，返回零向量
    if not COHERE_API_KEY:
        print("[embedding] 警告: 未设置COHERE_API_KEY，返回零向量")
        return [[0.0] * EMBEDDING_DIMENSION for _ in range(len(texts))]

    # 获取配置参数
    batch_size = EMBEDDING_BATCH_SIZE
    max_retries = EMBEDDING_MAX_RETRIES
    all_embeddings = []

    print(
        f"[embedding] 使用Cohere模型({COHERE_EMBEDDING_MODEL})为{len(texts)}个文本生成嵌入向量"
    )
    print(f"[embedding] 批处理大小: {batch_size}, 最大重试次数: {max_retries}")

    # 分批处理文本
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(texts) + batch_size - 1) // batch_size

        print(f"[embedding] 处理批次 {batch_num}/{total_batches}")

        # 重试逻辑
        for retry in range(1, max_retries + 1):
            try:
                batch_embeddings = get_embedding_model().generate_batch_embeddings(
                    batch
                )
                all_embeddings.extend(batch_embeddings)
                print(f"[embedding] 批次 {batch_num} 处理成功")
                break
            except Exception as e:
                print(
                    f"[embedding] 批次 {batch_num} 处理失败 (尝试 {retry}/{max_retries}): {str(e)}"
                )

                if retry < max_retries:
                    wait_time = retry * 2  # 逐步增加等待时间
                    print(f"[embedding] 等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                else:
                    print(
                        f"[embedding] 批次 {batch_num} 达到最大重试次数，使用零向量替代"
                    )
                    # 对于失败的批次，使用零向量替代
                    zero_embeddings = [
                        [0.0] * EMBEDDING_DIMENSION for _ in range(len(batch))
                    ]
                    all_embeddings.extend(zero_embeddings)

    print(f"[embedding] 完成所有批次处理，共生成 {len(all_embeddings)} 个嵌入向量")
    return all_embeddings
