#!/bin/bash

# 前端启动脚本
# 启动 Vite + React 前端服务

echo "🚀 启动 DocPal 前端服务..."

# 切换到前端目录
cd frontend

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请确保 Node.js 已正确安装"
    exit 1
fi

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件"
    exit 1
fi

# 检查 node_modules 是否存在，如果不存在则安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 未找到 node_modules，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络连接和 package.json 文件"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "📦 依赖已存在，跳过安装"
fi

echo "🔧 环境配置:"
echo "   - 框架: Vite + React"
echo "   - 默认端口: 5173"
echo "   - 环境: development"

# 启动前端开发服务器
echo "🎯 启动 Vite 开发服务器..."
echo "📱 前端服务将在 http://localhost:5173 启动"
echo "💡 提示: 按 Ctrl+C 停止服务"

npm run dev