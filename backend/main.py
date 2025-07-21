import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false" # 也禁用 tokenizers 的并行处理

# FastAPI 启动入口 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
from datetime import datetime  # 新增: 用于健康检查端点返回当前时间

# 将当前目录添加到Python路径，确保可以导入同级模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入配置和路由模块
import config
from api import routes as api_routes
from services.embedding import get_embedding_model # 用于预加载
from services.vector_store import get_vector_store # 用于预加载

# 应用标题和版本，会显示在 Swagger UI
APP_TITLE = "RAG Enterprise Q&A Assistant API"
APP_VERSION = "0.1.0"

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="基于 FastAPI 的 RAG 企业知识库问答系统后端 API"
)

# 更直接的CORS处理方式，通过自定义中间件为所有响应添加CORS头
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response

# 移除重复的CORS中间件和OPTIONS处理程序，统一使用FastAPI的标准CORSMiddleware

# 使用标准的CORS中间件处理所有跨域请求
# 使用环境变量来设置允许的源域名
default_origins = [
    "https://enterprise-knowledge-hub.vercel.app",  # Vercel前端
    "https://ragsys.vercel.app", # Vercel前端
    "http://localhost:5173",                       # 本地开发环境 (Vite)
    "http://localhost:3000"                        # 本地开发环境 (CRA)
]

# 从环境变量中获取CORS配置
cors_env = os.environ.get("CORS_ORIGINS", "")
if cors_env:
    # 使用环境变量设置的域名列表（逗号分隔）
    origins = cors_env.split(",")
    print(f"[从环境变量读取CORS域名] {origins}")
else:
    # 使用默认列表
    origins = default_origins
    print(f"[使用默认CORS域名] {origins}")

# 添加特殊配置，添加"*"来允许所有源（开发时使用）
if "*" in origins:
    print("警告: 开启了允许所有源的CORS访问")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False, 
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        max_age=86400
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True, 
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        max_age=86400
    )

# 应用启动事件处理器
@app.on_event("startup")
async def startup_event():
    print("FastAPI 应用启动中...")
    
    # 初始化数据库表
    try:
        print("正在初始化数据库...")
        # 根据环境调整导入方式
        try:
            from backend.database import create_tables
        except ModuleNotFoundError:
            from database import create_tables
        
        create_tables()
        print("数据库表已创建。")
        
        # 验证表是否创建成功
        import sqlite3
        from database import DB_PATH
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"数据库中的表: {tables}")
        conn.close()
    except Exception as e:
        print(f"启动时创建数据库表失败: {e}")
        # raise RuntimeError(f"数据库初始化失败，应用无法启动: {e}")
    
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

# 健康检查端点 - 用于保活机制
@app.get("/api/health")
async def health_check():
    """健康检查端点，返回当前状态和时间戳，用于保活"""
    return {
        "status": "ok",
        "version": APP_VERSION,
        "timestamp": datetime.now().isoformat(),
        "environment": "production" if os.getenv("RENDER") else "development"
    }

# 主运行块，用于直接通过 python main.py 启动 (主要用于开发)
if __name__ == "__main__":
    # 从环境变量获取端口，如果未设置则默认为 8000
    # Uvicorn 的 --port 参数会覆盖这里的 host 和 port
    port = int(os.getenv("BACKEND_PORT", "8002"))
    host = os.getenv("BACKEND_HOST", "0.0.0.0") # 默认监听所有网络接口，确保外部可访问
    
    print(f"准备在 {host}:{port} 启动 Uvicorn 服务器...")
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=False,
        app_dir=".",
        loop="uvloop"
    )