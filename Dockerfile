FROM python:3.9-slim as builder

WORKDIR /app

# 安装依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.9-slim

WORKDIR /app

# 仅复制必要的文件
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY backend ./backend
COPY start_backend.py ./

# 设置环境变量
ENV PYTHONPATH=/app

# 运行服务
CMD ["python", "start_backend.py", "--host", "0.0.0.0", "--port", "${PORT:-8000}"] 