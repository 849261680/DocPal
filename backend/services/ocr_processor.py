"""
OCR文本提取处理器
支持扫描版PDF的文本提取
"""

import os
from typing import List

import fitz  # PyMuPDF
from config import CHUNK_OVERLAP, CHUNK_SIZE  # noqa: F401
from langchain_core.documents import Document as LangchainDocument


def is_ocr_available() -> bool:
    """检查OCR功能是否可用"""
    try:
        import pytesseract

        # 尝试运行tesseract命令
        pytesseract.get_tesseract_version()
        return True
    except (ImportError, Exception):
        return False


def extract_text_with_ocr(
    file_path: str, max_pages: int = 50
) -> List[LangchainDocument]:
    """
    使用OCR从扫描版PDF中提取文本

    Args:
        file_path: PDF文件路径
        max_pages: 最大处理页数（OCR处理较慢，限制页数）

    Returns:
        文档列表
    """
    if not is_ocr_available():
        print("OCR功能不可用：缺少pytesseract或tesseract")
        return []

    try:
        import io

        import pytesseract
        from PIL import Image

        print(f"开始OCR处理PDF文件: {file_path}")
        print(f"最多处理前{max_pages}页")

        doc = fitz.open(file_path)
        page_count = len(doc)
        actual_pages = min(page_count, max_pages)

        documents = []

        for page_num in range(actual_pages):
            try:
                if page_num % 5 == 0:  # 每5页打印一次进度
                    print(f"OCR处理进度: {page_num + 1}/{actual_pages} 页")

                # 获取页面
                page = doc[page_num]

                # 将页面转换为图片
                mat = fitz.Matrix(2.0, 2.0)  # 提高分辨率
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")

                # 使用PIL打开图片
                image = Image.open(io.BytesIO(img_data))

                # OCR提取文本
                text = pytesseract.image_to_string(
                    image,
                    lang="chi_sim+eng",  # 支持中英文
                    config="--psm 3",  # 页面分割模式
                )

                if text.strip():
                    metadata = {
                        "source": os.path.basename(file_path),
                        "page": page_num + 1,
                        "extraction_method": "OCR",
                    }
                    documents.append(
                        LangchainDocument(page_content=text, metadata=metadata)
                    )
                    print(f"第{page_num + 1}页OCR提取文本长度: {len(text)}字符")
                else:
                    print(f"第{page_num + 1}页OCR未提取到文本")

            except Exception as page_error:
                print(f"OCR处理第{page_num + 1}页时出错: {page_error}")
                continue

        doc.close()
        print(f"OCR处理完成，提取到 {len(documents)} 个有效页面")
        return documents

    except Exception as e:
        print(f"OCR处理失败: {e}")
        import traceback

        traceback.print_exc()
        return []


def process_scanned_pdf(file_path: str) -> List[LangchainDocument]:
    """
    处理扫描版PDF

    Args:
        file_path: PDF文件路径

    Returns:
        文档列表
    """
    print(f"检测到扫描版PDF，尝试OCR处理: {file_path}")

    if not is_ocr_available():
        print("⚠️  OCR功能不可用")
        print("请安装tesseract和pytesseract:")
        print("  brew install tesseract")
        print("  pip install pytesseract")
        return []

    # 对于大文件，限制OCR处理的页数
    file_size = os.path.getsize(file_path)
    file_size_mb = file_size / 1024 / 1024

    if file_size_mb > 20:  # 大于20MB的文件
        max_pages = 20  # 只处理前20页
        print(f"文件较大({file_size_mb:.1f}MB)，仅处理前{max_pages}页")
    elif file_size_mb > 10:  # 大于10MB的文件
        max_pages = 50
        print(f"文件适中({file_size_mb:.1f}MB)，处理前{max_pages}页")
    else:
        max_pages = 100  # 小文件可以处理更多页

    return extract_text_with_ocr(file_path, max_pages)
