#!/usr/bin/env python
"""
启动RAG企业知识库问答系统后端服务的脚本
"""
import os
import sys
import subprocess
import argparse

def main():
    parser = argparse.ArgumentParser(description='启动企业知识库后端服务')
    parser.add_argument('--host', default='0.0.0.0', help='服务器主机地址')
    parser.add_argument('--port', default=8002, type=int, help='服务器端口')
    parser.add_argument('--reload', action='store_true', help='是否启用热重载')
    args = parser.parse_args()
    
    # 设置环境变量
    os.environ['BACKEND_HOST'] = args.host
    os.environ['BACKEND_PORT'] = str(args.port)
    
    # 确保backend目录在Python路径中
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
    sys.path.insert(0, os.path.dirname(backend_dir))
    
    # 设置Uvicorn的命令参数
    uvicorn_cmd = [
        "uvicorn",
        "backend.main:app",
        "--host", args.host,
        "--port", str(args.port)
    ]
    
    if args.reload:
        uvicorn_cmd.append("--reload")
    
    print(f"启动后端服务于 {args.host}:{args.port}")
    
    # 启动Uvicorn服务器
    subprocess.run(uvicorn_cmd)

if __name__ == "__main__":
    main() 