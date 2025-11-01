import os
import json
from typing import List, Dict, Optional

# 文件存储路径 - 使用与 config.py 相同的数据目录
DOCUMENT_METADATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),  # backend/
    "data",
    "document_metadata.json",
)


class DocumentInfo:
    def __init__(
        self,
        filename: str,
        file_path: str,
        upload_time: str,
        file_size: int,
        chunks_count: int = 0,
        status: str = "pending",
        progress: int = 0,
        error: Optional[str] = None,
    ):
        self.filename = filename
        self.file_path = file_path
        self.upload_time = upload_time
        self.file_size = file_size
        self.chunks_count = chunks_count
        self.status = status
        self.progress = progress
        self.error = error

    def to_dict(self) -> Dict:
        return {
            "filename": self.filename,
            "file_path": self.file_path,
            "upload_time": self.upload_time,
            "file_size": self.file_size,
            "chunks_count": self.chunks_count,
            "status": self.status,
            "progress": self.progress,
            "error": self.error,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "DocumentInfo":
        return cls(
            filename=data["filename"],
            file_path=data["file_path"],
            upload_time=data["upload_time"],
            file_size=data["file_size"],
            chunks_count=data.get("chunks_count", 0),
            status=data.get("status", "pending"),
            progress=data.get("progress", 0),
            error=data.get("error", None),
        )


def _ensure_metadata_file():
    """确保元数据文件存在"""
    os.makedirs(os.path.dirname(DOCUMENT_METADATA_FILE), exist_ok=True)
    if not os.path.exists(DOCUMENT_METADATA_FILE):
        with open(DOCUMENT_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def get_all_documents() -> List[DocumentInfo]:
    """获取所有文档信息"""
    _ensure_metadata_file()
    try:
        with open(DOCUMENT_METADATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [DocumentInfo.from_dict(item) for item in data]
    except Exception as e:
        print(f"读取文档元数据时出错: {e}")
        return []


def save_document_info(doc_info: DocumentInfo) -> bool:
    """保存文档信息"""
    _ensure_metadata_file()
    try:
        documents = get_all_documents()

        # 检查是否已存在相同文件名的文档，如果有则更新
        updated = False
        for i, doc in enumerate(documents):
            if doc.filename == doc_info.filename:
                documents[i] = doc_info
                updated = True
                break

        # 如果不存在，则添加新文档
        if not updated:
            documents.append(doc_info)

        # 保存到文件
        with open(DOCUMENT_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(
                [doc.to_dict() for doc in documents], f, ensure_ascii=False, indent=2
            )
        return True
    except Exception as e:
        print(f"保存文档元数据时出错: {e}")
        return False


def delete_document(filename: str) -> bool:
    """删除文档信息"""
    _ensure_metadata_file()
    try:
        documents = get_all_documents()
        documents = [doc for doc in documents if doc.filename != filename]

        with open(DOCUMENT_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(
                [doc.to_dict() for doc in documents], f, ensure_ascii=False, indent=2
            )
        return True
    except Exception as e:
        print(f"删除文档元数据时出错: {e}")
        return False


def clear_all_documents() -> bool:
    """清除所有文档信息"""
    _ensure_metadata_file()
    try:
        with open(DOCUMENT_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        return True
    except Exception as e:
        print(f"清除文档元数据时出错: {e}")
        return False


def update_document_status(
    filename: str,
    status: str,
    progress: Optional[int] = None,
    chunks_count: Optional[int] = None,
    error: Optional[str] = None,
) -> bool:
    """更新文档处理状态"""
    try:
        documents = get_all_documents()
        found = False

        for doc in documents:
            if doc.filename == filename:
                doc.status = status
                if progress is not None:
                    doc.progress = progress
                if chunks_count is not None:
                    doc.chunks_count = chunks_count
                if error is not None:
                    doc.error = error
                found = True
                break

        if not found:
            print(f"未找到要更新状态的文档: {filename}")
            return False

        # 保存更新后的文档列表
        with open(DOCUMENT_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(
                [doc.to_dict() for doc in documents], f, ensure_ascii=False, indent=2
            )

        print(f"已更新文档 {filename} 的状态为: {status}")
        return True
    except Exception as e:
        print(f"更新文档状态时出错: {e}")
        return False


def get_document_info(filename: str) -> Optional[DocumentInfo]:
    """获取指定文档的信息"""
    try:
        documents = get_all_documents()
        for doc in documents:
            if doc.filename == filename:
                return doc
        return None
    except Exception as e:
        print(f"获取文档信息时出错: {e}")
        return None


def get_document_status(filename: str) -> Optional[Dict]:
    """获取文档处理状态

    返回包含 status, progress 和 error 信息的字典
    """
    try:
        doc_info = get_document_info(filename)
        if doc_info:
            return {
                "status": doc_info.status,
                "progress": doc_info.progress,
                "error": doc_info.error,
            }
        return None
    except Exception as e:
        print(f"获取文档状态时出错: {e}")
        return None
