import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false" # 也禁用 tokenizers 的并行处理

# FastAPI 启动入口 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys

# 将项目根目录添加到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 确保在导入任何使用配置的模块之前加载环境变量
# config.py 内部会调用 load_dotenv()
from backend import config 

from backend.api import routes as api_routes
from backend.services.embedding import get_embedding_model # 用于预加载
from backend.services.vector_store import get_vector_store # 用于预加载

# 应用标题和版本，会显示在 Swagger UI
APP_TITLE = "RAG Enterprise Q&A Assistant API"
APP_VERSION = "0.1.0"

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="基于 FastAPI 的 RAG 企业知识库问答系统后端 API"
)

# CORS (Cross-Origin Resource Sharing) 中间件配置
# 指定允许的源，而不是使用通配符
origins = [
    "http://localhost:5173",  # Vite开发服务器默认端口
    "http://localhost:3000",  # 其他可能的开发端口
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 使用具体的源列表
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # 允许所有标准方法
    allow_headers=["*"],  # 允许所有请求头
)

# 应用启动事件处理器
@app.on_event("startup")
async def startup_event():
    print("FastAPI 应用启动中...")
    # 预加载嵌入模型和向量数据库，以便首次请求时更快响应，并能及早发现问题
    try:
        print("正在初始化/加载嵌入模型...")
        get_embedding_model() # 这会触发模型的加载
        print("嵌入模型已准备就绪。")
    except Exception as e:
        print(f"启动时加载嵌入模型失败: {e}")
        # 根据需求，这里可以决定是否因为模型加载失败而阻止应用启动
        # raise RuntimeError(f"嵌入模型加载失败，应用无法启动: {e}")

    try:
        print("正在初始化/加载向量数据库...")
        get_vector_store() # 这会触发 FAISS 索引的加载或初始化
        print("向量数据库已准备就绪。")
    except Exception as e:
        print(f"启动时加载向量数据库失败: {e}")
        # raise RuntimeError(f"向量数据库加载失败，应用无法启动: {e}")
    print("FastAPI 应用启动完成。")

# 应用关闭事件处理器 (如果需要清理资源)
@app.on_event("shutdown")
async def shutdown_event():
    print("FastAPI 应用关闭中...")
    # 在这里可以添加资源清理逻辑，例如关闭数据库连接等
    # 对于 FAISS 和 sentence-transformers，通常不需要显式关闭
    print("FastAPI 应用已关闭。")

# 包含 API 路由
# 可以为 API 路由添加统一的前缀，例如 /api/v1
app.include_router(api_routes.router, prefix="/api")

# 主运行块，用于直接通过 python main.py 启动 (主要用于开发)
if __name__ == "__main__":
    # 从环境变量获取端口，如果未设置则默认为 8000
    # Uvicorn 的 --port 参数会覆盖这里的 host 和 port
    port = int(os.getenv("BACKEND_PORT", "8000"))
    host = os.getenv("BACKEND_HOST", "127.0.0.1") # 默认监听本地地址
    
    print(f"准备在 {host}:{port} 启动 Uvicorn 服务器...")
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=False,
        app_dir=".",
        loop="uvloop"
    ) 