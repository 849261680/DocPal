"""
认证服务
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..models.auth import User, UserSession
from ..schemas.auth import UserCreate
from ..utils.auth import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)


class AuthService:
    """认证服务类"""

    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> User:
        """创建新用户"""
        # 检查用户名是否已存在
        if self.get_user_by_username(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在"
            )

        # 检查邮箱是否已存在
        if self.get_user_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="邮箱已存在"
            )

        # 创建用户
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
            department=user_data.department,
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """通过邮箱认证用户"""
        print(f"[DEBUG] 尝试认证用户邮箱: {email}")
        user = self.get_user_by_email(email)
        if not user:
            print(f"[DEBUG] 用户不存在: {email}")
            return None

        print(
            f"[DEBUG] 用户找到: {user.username} ({user.email}), 活跃状态: {user.is_active}"
        )
        print(f"[DEBUG] 存储的密码哈希: {user.password_hash}")
        print(f"[DEBUG] 输入的密码: {password}")

        password_valid = verify_password(password, user.password_hash)
        print(f"[DEBUG] 密码验证结果: {password_valid}")

        if not password_valid:
            return None

        if not user.is_active:
            print(f"[DEBUG] 用户未激活: {email}")
            return None

        print(f"[DEBUG] 用户认证成功: {user.username} ({email})")
        return user

    def get_user_by_username(self, username: str) -> Optional[User]:
        """通过用户名获取用户"""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """通过ID获取用户"""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user_session(
        self, user: User, access_token: str, refresh_token: str
    ) -> UserSession:
        """创建用户会话"""
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)  # 7天后过期

        session = UserSession(
            token=refresh_token, user_id=user.id, expires_at=expires_at
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session

    def get_user_session(self, token: str) -> Optional[UserSession]:
        """获取用户会话"""
        return (
            self.db.query(UserSession)
            .filter(
                and_(
                    UserSession.token == token,
                    UserSession.is_active,
                    UserSession.expires_at > datetime.now(timezone.utc),
                )
            )
            .first()
        )

    def revoke_user_session(self, token: str) -> bool:
        """撤销用户会话"""
        session = self.db.query(UserSession).filter(UserSession.token == token).first()
        if session:
            session.is_active = False
            self.db.commit()
            return True
        return False

    def revoke_all_user_sessions(self, user_id: int) -> bool:
        """撤销用户所有会话"""
        sessions = (
            self.db.query(UserSession).filter(UserSession.user_id == user_id).all()
        )
        for session in sessions:
            session.is_active = False
        self.db.commit()
        return True

    def generate_tokens(self, user: User) -> "tuple[str, str]":
        """生成访问令牌和刷新令牌"""
        access_token = create_access_token(
            data={"sub": user.username, "user_id": user.id}
        )
        refresh_token = create_refresh_token(
            data={"sub": user.username, "user_id": user.id}
        )

        return access_token, refresh_token

    def update_user_username(self, user_id: int, new_username: str) -> User:
        """更新用户名"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("用户不存在")

            user.username = new_username
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            raise e

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return verify_password(plain_password, hashed_password)

    def update_user_password(self, user_id: int, new_password: str) -> User:
        """更新用户密码"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("用户不存在")

            # 哈希新密码
            hashed_password = get_password_hash(new_password)
            user.password_hash = hashed_password

            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            raise e
