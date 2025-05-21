from dotenv import load_dotenv
import os

# 显式指定 .env 文件的路径，使其相对于当前 config.py 文件
#这样无论从哪里运行，都能正确加载 backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    print(f"[Config] Loading .env file from: {dotenv_path}")
    # 设置override=False，确保已存在的环境变量不会被.env文件覆盖
    load_dotenv(dotenv_path=dotenv_path, override=False)
else:
    print(f"[Config] .env file not found at: {dotenv_path}. Using default configurations or environment variables.")

# DeepSeek API 配置（用于聊天/大语言模型）
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_BASE_URL = os.getenv("DEEPSEEK_API_BASE_URL", "https://api.deepseek.com")
CHAT_MODEL = os.getenv("CHAT_MODEL", "deepseek-chat")

# Cohere API 配置（用于嵌入向量）
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
COHERE_API_BASE_URL = os.getenv("COHERE_API_BASE_URL", "https://api.cohere.ai")
COHERE_EMBEDDING_MODEL = os.getenv("COHERE_EMBEDDING_MODEL", "embed-multilingual-v3.0")  # 多语言模型支持中文

# 向量数据库配置
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "./index/faiss_store")
# 确保索引目录存在
# os.makedirs(os.path.dirname(VECTOR_DB_PATH), exist_ok=True) # VECTOR_DB_PATH 是相对路径，这里dirname可能是'.'，不需要创建
if not os.path.isabs(VECTOR_DB_PATH):
    # 将 VECTOR_DB_PATH 转换为相对于项目根目录（config.py的父目录）的路径
    # 假设 config.py 在 backend/ 子目录下
    project_root = os.path.dirname(os.path.dirname(__file__))
    VECTOR_DB_PATH = os.path.join(project_root, VECTOR_DB_PATH)

if not os.path.exists(os.path.dirname(VECTOR_DB_PATH)):
     os.makedirs(os.path.dirname(VECTOR_DB_PATH), exist_ok=True)

# 嵌入模型配置 - 确保始终使用环境变量中的设置
# 从环境变量中直接获取，不使用os.getenv，因为os.getenv会回退到默认值
# 默认模型为 all-MiniLM-L6-v2
EMBEDDING_MODEL_NAME = os.environ.get("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
print(f"[Config] Effective EMBEDDING_MODEL_NAME: {EMBEDDING_MODEL_NAME}") # 增加日志确认模型名称

# 上传文件存储路径
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploaded_files")
if not os.path.isabs(UPLOAD_DIR):
    project_root = os.path.dirname(os.path.dirname(__file__))
    UPLOAD_DIR = os.path.join(project_root, UPLOAD_DIR)

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# 文件上传限制配置
MAX_UPLOAD_SIZE_MB = float(os.getenv("MAX_UPLOAD_SIZE_MB", 50))  # 默认限制每个文件最大为 50 MB
print(f"[Config] MAX_UPLOAD_SIZE_MB: {MAX_UPLOAD_SIZE_MB}")

# RAG 配置
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 800))  # 默认块大小为1000
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 200))  # 默认块重叠为200
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", 5))  # 检索时默认返回前5个相关结果
