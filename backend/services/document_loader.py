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
    from backend.services.ocr_processor import process_scanned_pdf
except ModuleNotFoundError:
    # Railway部署环境
    from config import CHUNK_SIZE, CHUNK_OVERLAP, UPLOAD_DIR
    from utils.file_utils import ensure_directory, get_safe_filename
    from services.ocr_processor import process_scanned_pdf

# 确保上传目录存在 (虽然 config.py 也做了，但这里作为服务自身依赖明确一下)
ensure_directory(UPLOAD_DIR)

def _load_pdf(file_path: str) -> List[LangchainDocument]:
    """使用 PyMuPDF (fitz) 加载 PDF 文件内容"""
    try:
        print(f"开始加载PDF文件: {file_path}")
        file_size = os.path.getsize(file_path)
        print(f"PDF文件大小: {file_size / 1024 / 1024:.2f} MB")
        
        doc = fitz.open(file_path)
        page_count = len(doc)
        print(f"PDF页数: {page_count}")
        
        # 对于大文件，限制处理页数以避免超时和内存问题
        max_pages = 500  # 最多处理500页
        actual_pages = min(page_count, max_pages)
        
        if page_count > max_pages:
            print(f"注意: PDF有{page_count}页，但只处理前{max_pages}页以确保稳定性")
        
        documents = []
        valid_pages = 0
        empty_pages = 0
        
        # 先检测PDF类型：是否为扫描版
        sample_pages = min(10, actual_pages)  # 检查前10页
        has_text_in_samples = False
        
        print(f"正在检测PDF类型，检查前{sample_pages}页...")
        for i in range(sample_pages):
            try:
                page = doc[i]
                text = page.get_text().strip()
                if text:
                    has_text_in_samples = True
                    break
            except:
                continue
        
        if not has_text_in_samples:
            print("⚠️  检测到扫描版PDF：前10页均无文本内容")
            print("这可能是一个图片扫描的PDF文档，需要OCR(光学字符识别)来提取文本")
            
        for page_num in range(actual_pages):
            try:
                if page_num % 20 == 0:  # 每20页打印一次进度
                    print(f"正在处理第 {page_num + 1}/{actual_pages} 页 (已提取{valid_pages}个有效页面，{empty_pages}个空页面)")
                
                page = doc[page_num]
                text = page.get_text()
                
                if text.strip(): # 只添加包含文本的页面
                    metadata = {"source": os.path.basename(file_path), "page": page_num + 1}
                    documents.append(LangchainDocument(page_content=text, metadata=metadata))
                    valid_pages += 1
                else:
                    empty_pages += 1
                    
                # 每处理50页释放一次内存
                if page_num % 50 == 0 and page_num > 0:
                    import gc
                    gc.collect()
                    
            except Exception as page_error:
                print(f"处理第{page_num + 1}页时出错: {page_error}")
                continue
        
        doc.close()
        print(f"PDF加载完成，从{actual_pages}页中提取到 {valid_pages} 个有效页面，{empty_pages} 个空页面")
        
        if len(documents) == 0:
            if empty_pages > actual_pages * 0.8:  # 如果80%以上的页面都是空的
                print("⚠️  这似乎是一个扫描版PDF文档")
                print("所有页面都没有可提取的文本内容，可能需要OCR处理")
                # 抛出一个特定的异常，让上层知道这是扫描版PDF
                # 尝试使用OCR处理扫描版PDF
                print("尝试使用OCR处理扫描版PDF...")
                ocr_documents = process_scanned_pdf(file_path)
                if ocr_documents:
                    print(f"OCR成功提取到 {len(ocr_documents)} 个文档片段")
                    return ocr_documents
                else:
                    print("OCR处理失败或不可用")
                    raise ValueError("扫描版PDF：OCR处理失败，无法提取文本内容")
            else:
                print("警告: 未能从PDF中提取任何文本内容")
            
        return documents
        
    except ValueError as ve:
        # 重新抛出扫描版PDF的特定错误
        raise ve
    except Exception as e:
        print(f"加载 PDF 文件 {file_path} 失败: {e}")
        import traceback
        traceback.print_exc()
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