#!/bin/bash

# 后端启动脚本
# 启动 FastAPI 后端服务

echo "🚀 启动 DocPal 后端服务..."

# 切换到后端目录
cd backend

# 激活虚拟环境
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo "✅ 已激活虚拟环境: .venv"
else
    echo "⚠️  未找到 .venv，尝试用 uv 创建虚拟环境..."
    uv venv .venv && source .venv/bin/activate && uv pip install -r requirements.txt
fi

PYTHON=".venv/bin/python"
UVICORN=".venv/bin/uvicorn"

# 设置环境变量
export BACKEND_PORT=8004
export BACKEND_HOST=0.0.0.0

echo "🔧 环境配置:"
echo "   - 端口: $BACKEND_PORT"
echo "   - 主机: $BACKEND_HOST"
echo "   - 环境: development"

# 启动后端服务
echo "🎯 启动 FastAPI 服务..."
$PYTHON main.py

# 如果上面的命令失败，尝试使用 uvicorn 直接启动
if [ $? -ne 0 ]; then
    echo "🔄 尝试使用 uvicorn 启动..."
    $UVICORN main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload
fi
