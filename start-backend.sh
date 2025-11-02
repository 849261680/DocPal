#!/bin/bash

# 后端启动脚本
# 启动 FastAPI 后端服务

echo "🚀 启动 DocPal 后端服务..."

# 切换到后端目录
cd backend

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3，请先安装 Python"
    exit 1
fi

# 检查依赖是否安装
if [ ! -f "requirements.txt" ]; then
    echo "❌ 错误: 未找到 requirements.txt 文件"
    exit 1
fi

echo "📦 检查 Python 依赖..."
python3 -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  依赖未安装，正在安装..."
    pip3 install -r requirements.txt
fi

# 设置环境变量
export BACKEND_PORT=8000
export BACKEND_HOST=0.0.0.0

echo "🔧 环境配置:"
echo "   - 端口: $BACKEND_PORT"
echo "   - 主机: $BACKEND_HOST"
echo "   - 环境: development"

# 启动后端服务
echo "🎯 启动 FastAPI 服务..."
python3 main.py

# 如果上面的命令失败，尝试使用 uvicorn 直接启动
if [ $? -ne 0 ]; then
    echo "🔄 尝试使用 uvicorn 启动..."
    uvicorn main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload
fi
