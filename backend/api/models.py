# 请求/响应模型（Pydantic） 
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UploadResponse(BaseModel):
    status: str
    filename: str
    chunks_stored: Optional[int] = None
    message: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = None # 允许在查询时覆盖默认的 top_k

class SourceDocument(BaseModel):
    filename: str
    page_content: str # 或者 chunk_content，取决于你的数据结构
    metadata: Optional[dict] = None # 例如，页码、块 ID 等

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceDocument]

class HealthResponse(BaseModel):
    status: str

class DocumentMetadata(BaseModel):
    filename: str
    file_path: str
    upload_time: str
    file_size: int
    chunks_count: int = 0

class DocumentListResponse(BaseModel):
    status: str
    documents: List[DocumentMetadata]
    last_updated: Optional[str] = None

# 新增：文档问答模型
class AskRequest(BaseModel):
    question: str
    documentId: Optional[str] = None  # 可选的文档ID

class AskResponse(BaseModel):
    answer: str
    sources: List[str]  # 文档名称列表 