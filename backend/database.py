"""
数据库配置和连接管理
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from typing import AsyncGenerator

# 数据库配置
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
ASYNC_DATABASE_URL = os.getenv("ASYNC_DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

# 创建异步数据库引擎
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in ASYNC_DATABASE_URL else {},
)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 使用 async_sessionmaker 创建异步会话
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# 创建基础模型类
Base = declarative_base()


# 获取数据库会话的依赖注入函数
def get_db():
    """获取同步数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """获取异步数据库会话"""
    async with AsyncSessionLocal() as session:
        yield session


# 创建数据库表
def create_tables():
    """创建所有数据库表"""
    Base.metadata.create_all(bind=engine)


# 异步创建数据库表
async def create_tables_async():
    """异步创建所有数据库表"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
