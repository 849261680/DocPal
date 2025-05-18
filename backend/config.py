from dotenv import load_dotenv
import os

# 显式指定 .env 文件的路径，使其相对于当前 config.py 文件
#这样无论从哪里运行，都能正确加载 backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    print(f"[Config] Loading .env file from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"[Config] .env file not found at: {dotenv_path}. Using default configurations or environment variables.")

# DeepSeek API 配置
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_BASE_URL = os.getenv("DEEPSEEK_API_BASE_URL", "https://api.deepseek.com")
CHAT_MODEL = os.getenv("CHAT_MODEL", "deepseek-chat")

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

# 嵌入模型配置
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
print(f"[Config] Effective EMBEDDING_MODEL_NAME: {EMBEDDING_MODEL_NAME}") # 增加日志确认模型名称

# 上传文件存储路径
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploaded_files")
if not os.path.isabs(UPLOAD_DIR):
    project_root = os.path.dirname(os.path.dirname(__file__))
    UPLOAD_DIR = os.path.join(project_root, UPLOAD_DIR)

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# 文本分块配置
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

# RAG 配置
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "3"))

# 检查关键配置是否存在
if not DEEPSEEK_API_KEY:
    raise ValueError("DEEPSEEK_API_KEY 未在环境变量中设置。请在 .env 文件中配置。")

if not DEEPSEEK_API_BASE_URL:
    raise ValueError("DEEPSEEK_API_BASE_URL 未在环境变量中设置。请在 .env 文件中配置。") 