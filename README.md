# RAG 企业知识库问答系统

本项目是一个基于 RAG (Retrieval Augmented Generation) 架构的企业级知识库问答系统。用户可以上传本地文档，系统会自动处理这些文档并构建知识库。随后，用户可以通过聊天界面就知识库中的内容进行提问，系统会结合检索到的相关信息和大型语言模型的能力，生成精准的答案，并提供答案的来源依据。

## 主要功能

-   **文档上传与管理**:
    -   支持多种文件格式（PDF, DOCX, TXT）。
    -   自动文本提取、内容分块、向量化和索引。
    -   前端展示已上传文档列表和知识库状态。
    -   提供刷新索引和清空知识库的功能。
-   **智能问答**:
    -   用户友好的聊天界面。
    -   基于用户提问，从向量数据库中高效检索相关信息。
    -   利用大型语言模型（如 DeepSeek）结合检索结果生成答案。
    -   答案附带来源信息，方便用户溯源。
-   **前端交互**:
    -   清晰的文档管理和聊天分离式布局。
    -   实时显示 Token 使用量、文档处理进度等。
    -   输入框支持回车发送，Shift+Enter 换行。

## 技术栈

**后端**:
-   Python 3.9+
-   FastAPI: 高性能 Web 框架
-   Uvicorn: ASGI 服务器
-   Langchain: LLM 应用开发框架
-   SentenceTransformers: 文本嵌入模型库
-   FAISS (CPU): 高效相似度搜索库
-   DeepSeek API: (或其他大语言模型 API)
-   `python-dotenv`: 环境变量管理
-   `PyMuPDF`, `python-docx`: 文档解析

**前端**:
-   React
-   TypeScript
-   Vite: 前端构建工具
-   Tailwind CSS: UI 样式框架
-   `@tanstack/react-query`: 数据请求和状态管理
-   `lucide-react`: 图标库

**开发工具**:
-   Git
-   Visual Studio Code (或其他 IDE)
-   Python Virtual Environment (venv)
-   Node.js 和 npm

## 项目结构概览

```
.
├── backend/                  # 后端 FastAPI 应用
│   ├── api/                  # API 路由定义
│   ├── services/             # 核心服务（嵌入、向量存储、RAG流程）
│   ├── utils/                # 工具函数
│   ├── config.py             # 后端配置文件（含默认值）
│   ├── main.py               # FastAPI 应用主入口
│   ├── requirements.txt      # Python 依赖
│   └── .env.example          # 环境变量示例 (需用户创建 .env)
├── client/                   # 前端 React 应用 (实际源码在 src)
│   └── src/                  # 前端主要源码
│       ├── components/       # React 组件
│       ├── hooks/            # 自定义 Hooks
│       ├── lib/              # 工具库、API 封装
│       ├── pages/            # 页面组件
│       ├── App.tsx           # 应用主组件
│       └── main.tsx          # 前端入口
├── data/                     # （可选）存放原始数据或处理后的数据（如上传文件）
├── index/                    # 存放 FAISS 索引文件
├── start_backend.py          # 启动后端服务的脚本
├── package.json              # 前端项目配置和依赖 (位于根目录)
├── vite.config.ts            # Vite 配置文件 (位于根目录)
├── tailwind.config.ts        # Tailwind CSS 配置文件 (位于根目录)
└── README.md                 # 本文档
```

## 环境准备与安装

### 前提条件

-   Python 3.9 或更高版本
-   Node.js (建议 LTS 版本) 和 npm
-   Git

### 1. 克隆仓库

```bash
git clone <your-repository-url>
cd <your-repository-name>
```

### 2. 后端配置与启动

a.  **创建并激活 Python 虚拟环境**:
    ```bash
    cd backend
    python -m venv .venv
    # Windows
    # .venv\\Scripts\\activate
    # macOS/Linux
    source .venv/bin/activate
    ```

b.  **安装后端依赖**:
    ```bash
    pip install -r requirements.txt
    ```

c.  **配置环境变量**:
    在 `backend/` 目录下创建一个 `.env` 文件 (可以复制 `backend/.env.example` 若存在，或手动创建)。至少需要配置以下内容：
    ```env
    DEEPSEEK_API_KEY=\"your_deepseek_api_key\"
    # DEEPSEEK_API_BASE_URL=\"https://api.deepseek.com\" # 可选，默认为此
    # EMBEDDING_MODEL_NAME=\"all-MiniLM-L6-v2\" # 可选，默认使用 all-MiniLM-L6-v2，可更改为其他 SentenceTransformer 模型
    # VECTOR_DB_PATH=\"../index/faiss_store\" # 可选，FAISS索引存储路径，相对于 backend 目录
    # UPLOAD_DIR=\"../data/uploaded_files\"    # 可选，上传文件存储路径，相对于 backend 目录
    ```
    **重要**: 确保将 `your_deepseek_api_key` 替换为您的真实 DeepSeek API 密钥。

d.  **启动后端服务**:
    回到项目根目录:
    ```bash
    cd ..
    python start_backend.py
    ```
    或者，如果您想临时指定嵌入模型而不修改 `.env` 文件或 `config.py`：
    ```bash
    EMBEDDING_MODEL_NAME=\"BAAI/bge-base-zh-v1.5\" python start_backend.py
    ```
    后端服务默认运行在 `http://0.0.0.0:8000`。

### 3. 前端配置与启动

a.  **安装前端依赖** (在项目根目录下执行，因为 `package.json` 在根目录):
    ```bash
    npm install
    ```

b.  **启动前端开发服务器**:
    ```bash
    # 这是 package.json 中定义的脚本，它似乎也启动了一个后端服务 (server/index.ts)
    # 如果您只想运行 Vite 前端开发服务器，可能需要调整或使用 vite 命令
    npm run dev
    ```
    根据 `package.json` 中的 `dev:frontend` 脚本，也可以单独启动 Vite 前端：
    ```bash
    npm run dev:frontend
    ```
    前端服务通常运行在 `http://localhost:5173` (Vite 默认) 或 `package.json` 中指定的端口（如 5001）。请检查终端输出以确认确切的端口。

## 运行应用

1.  确保后端服务已成功启动。
2.  确保前端开发服务器已成功启动。
3.  在浏览器中打开前端应用的地址 (通常是 `http://localhost:5173` 或类似地址)。

## 配置项

-   **后端配置 (`backend/config.py`)**: 此文件包含了大部分后端服务的默认配置，例如嵌入模型、向量数据库路径、上传目录、文本分块大小等。环境变量（通过 `.env` 文件或直接设置）可以覆盖这些默认值。
-   **嵌入模型**: 默认使用 `sentence-transformers/all-MiniLM-L6-v2`。可以通过设置 `EMBEDDING_MODEL_NAME` 环境变量来更改。
-   **FAISS 索引**: 默认存储在项目根目录下的 `index/` 文件夹中。
-   **上传文件**: 默认存储在项目根目录下的 `data/uploaded_files/` 文件夹中。

## API 端点 (简要)

后端 FastAPI 提供以下主要 API 端点 (具体细节请查看 `backend/api/routes.py`):
-   `/api/upload_doc/`: 上传文档
-   `/api/documents/`: 获取已上传文档列表
-   `/api/query/`: 发送查询并获取问答结果
-   `/api/vector_store_size/`: 获取向量数据库大小
-   `/api/reset_vector_store/`: 重置/清空向量数据库

## 部署到云端

本项目的前后端分离架构使其适合云端部署。

-   **后端 (FastAPI)**:
    -   可以容器化 (Docker)。
    -   部署到 AWS ECS/EKS, Google Cloud Run/GKE, Azure App Service/AKS 等。
    -   注意FAISS索引文件的持久化存储和嵌入模型的加载。
-   **前端 (React/Vite)**:
    -   构建为静态文件 (`npm run build`)。
    -   部署到 Vercel, Netlify, AWS S3/CloudFront, Firebase Hosting 等静态托管服务。

确保在云环境中正确配置所有必需的环境变量（尤其是 API 密钥）。

---

希望这份文档能帮助您更好地理解和使用这个项目！ 