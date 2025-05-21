# 加载和切分文档 
import os
from typing import List, Union, Callable
import fitz  # PyMuPDF
import docx2txt
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document as LangchainDocument
from fastapi import UploadFile

try:
    # 本地开发环境
    from backend.config import CHUNK_SIZE, CHUNK_OVERLAP, UPLOAD_DIR
    from backend.utils.file_utils import ensure_directory, get_safe_filename
except ModuleNotFoundError:
    # Railway部署环境
    from config import CHUNK_SIZE, CHUNK_OVERLAP, UPLOAD_DIR
    from utils.file_utils import ensure_directory, get_safe_filename

# 确保上传目录存在 (虽然 config.py 也做了，但这里作为服务自身依赖明确一下)
ensure_directory(UPLOAD_DIR)

def _load_pdf(file_path: str) -> List[LangchainDocument]:
    """使用 PyMuPDF (fitz) 加载 PDF 文件内容"""
    try:
        doc = fitz.open(file_path)
        documents = []
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if text.strip(): # 只添加包含文本的页面
                metadata = {"source": os.path.basename(file_path), "page": page_num + 1}
                documents.append(LangchainDocument(page_content=text, metadata=metadata))
        doc.close()
        return documents
    except Exception as e:
        print(f"加载 PDF 文件 {file_path} 失败: {e}")
        return []

def _load_docx(file_path: str) -> List[LangchainDocument]:
    """使用 docx2txt 加载 DOCX 文件内容"""
    try:
        text = docx2txt.process(file_path)
        if text.strip():
            metadata = {"source": os.path.basename(file_path)}
            return [LangchainDocument(page_content=text, metadata=metadata)]
        return []
    except Exception as e:
        print(f"加载 DOCX 文件 {file_path} 失败: {e}")
        return []

def _load_txt(file_path: str) -> List[LangchainDocument]:
    """加载 TXT 文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        if text.strip():
            metadata = {"source": os.path.basename(file_path)}
            return [LangchainDocument(page_content=text, metadata=metadata)]
        return []
    except Exception as e:
        print(f"加载 TXT 文件 {file_path} 失败: {e}")
        return []

FILE_LOADERS: dict[str, Callable[[str], List[LangchainDocument]]] = {
    ".pdf": _load_pdf,
    ".docx": _load_docx,
    ".txt": _load_txt,
}

def load_document(file_path: str) -> List[LangchainDocument]:
    """
    根据文件扩展名加载文档。
    返回 Langchain Document 对象列表，每个对象包含 page_content 和 metadata。
    """
    file_extension = os.path.splitext(file_path)[1].lower()
    loader = FILE_LOADERS.get(file_extension)
    if loader:
        print(f"使用 {loader.__name__} 加载文件: {file_path}")
        return loader(file_path)
    else:
        print(f"不支持的文件类型: {file_extension} (文件: {file_path})")
        return []

def split_documents(documents: List[LangchainDocument]) -> List[LangchainDocument]:
    """
    使用 RecursiveCharacterTextSplitter 将 Langchain Document 列表分割成更小的块。
    """
    if not documents:
        return []
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        add_start_index=True, # 将块在原始文档中的开始位置添加到 metadata
    )
    
    chunks = text_splitter.split_documents(documents)
    print(f"文档被分割成 {len(chunks)} 个块。块大小: {CHUNK_SIZE}, 重叠: {CHUNK_OVERLAP}")
    return chunks

async def save_uploaded_file(file_name: str, content: bytes) -> str:
    """保存上传的文件到 UPLOAD_DIR 并返回完整路径"""
    # 生成安全的文件名
    safe_filename = get_safe_filename(file_name)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # 确保目录存在
    ensure_directory(UPLOAD_DIR)
    
    # 写入文件
    with open(file_path, "wb") as f:
        f.write(content)
    print(f"文件已保存到: {file_path}")
    return file_path 