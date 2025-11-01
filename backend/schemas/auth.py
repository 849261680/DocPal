"""
认证相关的 Pydantic 模式
"""

from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """用户基础模式"""

    username: str
    email: EmailStr
    department: Optional[str] = None


class UserCreate(UserBase):
    """用户创建模式"""

    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("密码长度至少为8位")

        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not (has_letter and has_digit):
            raise ValueError("密码必须包含字母和数字")

        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("用户名长度至少为3位")
        if len(v) > 50:
            raise ValueError("用户名长度不能超过50位")
        return v


class UserLogin(BaseModel):
    """用户登录模式"""

    email: EmailStr
    password: str


class UserResponse(UserBase):
    """用户响应模式"""

    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """令牌模式"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """令牌数据模式"""

    username: Optional[str] = None
    user_id: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求模式"""

    refresh_token: str
