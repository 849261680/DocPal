# 文件处理工具函数 
import os
import shutil
from typing import BinaryIO, List, Optional
from fastapi import UploadFile
import uuid
from datetime import datetime

def get_safe_filename(original_filename: str) -> str:
    """
    生成安全的文件名，避免文件名冲突和特殊字符问题
    """
    # 获取文件扩展名
    if not original_filename:
        return f"unknown_file_{uuid.uuid4().hex}"
    
    # 处理文件名，移除特殊字符
    basename, ext = os.path.splitext(original_filename)
    safe_basename = basename.replace(" ", "_").replace("/", "_").replace("\\", "_")
    # 添加时间戳和随机字符，确保唯一性
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_id = uuid.uuid4().hex[:8]  # 取前8位即可
    
    return f"{safe_basename}_{timestamp}_{unique_id}{ext}"

def ensure_directory(directory_path: str) -> None:
    """
    确保目录存在，如果不存在则创建
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)

def save_uploaded_file(upload_dir: str, file: UploadFile) -> str:
    """
    保存上传的文件到指定目录，返回保存后的文件路径
    """
    ensure_directory(upload_dir)
    
    # 生成安全的文件名
    safe_filename = get_safe_filename(file.filename)
    file_path = os.path.join(upload_dir, safe_filename)
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def clean_temp_files(file_paths: List[str]) -> None:
    """
    清理临时文件
    """
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"清理临时文件 {file_path} 失败: {e}")

def get_file_extension(filename: str) -> Optional[str]:
    """
    获取文件扩展名（小写）
    """
    if not filename:
        return None
    
    _, ext = os.path.splitext(filename)
    return ext.lower() if ext else None 