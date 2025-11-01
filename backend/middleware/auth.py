"""
认证中间件
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.auth import User
from ..services.auth_service import AuthService
from ..utils.auth import verify_token

# HTTP Bearer 认证方案
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """获取当前用户"""
    token = credentials.credentials

    # 验证令牌
    payload = verify_token(token, "access")

    username: Optional[str] = payload.get("sub")
    user_id: Optional[int] = payload.get("user_id")

    if username is None or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 获取用户信息
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用户已被禁用"
        )
    return current_user


# 可选认证（允许匿名访问）
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """获取当前用户（可选）"""
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        payload = verify_token(token, "access")

        username: Optional[str] = payload.get("sub")
        user_id: Optional[int] = payload.get("user_id")

        if username is None or user_id is None:
            return None

        auth_service = AuthService(db)
        user = auth_service.get_user_by_id(user_id)

        if user is None or not user.is_active:
            return None

        return user
    except HTTPException:
        return None
