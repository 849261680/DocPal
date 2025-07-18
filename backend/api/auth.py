"""
认证 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from schemas.auth import UserCreate, UserLogin, UserResponse, Token, RefreshTokenRequest
from pydantic import BaseModel, EmailStr
from services.auth_service import AuthService
from middleware.auth import get_current_user, get_current_active_user
from utils.auth import verify_token
from models.auth import User

router = APIRouter(prefix="/auth", tags=["认证"])

class EmailLoginRequest(BaseModel):
    """邮箱登录请求"""
    email: EmailStr
    password: str

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    auth_service = AuthService(db)
    
    try:
        user = auth_service.create_user(user_data)
        return UserResponse.model_validate(user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    print(f"[DEBUG] 接收到登录请求: {user_data}")
    auth_service = AuthService(db)
    
    # 认证用户（使用邮箱登录）
    user = auth_service.authenticate_user(user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 生成令牌
    access_token, refresh_token = auth_service.generate_tokens(user)
    
    # 创建会话
    auth_service.create_user_session(user, access_token, refresh_token)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/logout")
async def logout(
    refresh_token_data: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """用户登出"""
    auth_service = AuthService(db)
    
    # 撤销刷新令牌
    success = auth_service.revoke_user_session(refresh_token_data.refresh_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="登出失败"
        )
    
    return {"message": "已成功登出"}

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """刷新访问令牌"""
    auth_service = AuthService(db)
    
    # 验证刷新令牌
    try:
        payload = verify_token(refresh_token_data.refresh_token, "refresh")
        user_id = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌"
            )
        
        # 检查会话是否有效
        session = auth_service.get_user_session(refresh_token_data.refresh_token)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="刷新令牌已过期或无效"
            )
        
        # 获取用户
        user = auth_service.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或已被禁用"
            )
        
        # 生成新令牌
        access_token, new_refresh_token = auth_service.generate_tokens(user)
        
        # 撤销旧的刷新令牌
        auth_service.revoke_user_session(refresh_token_data.refresh_token)
        
        # 创建新会话
        auth_service.create_user_session(user, access_token, new_refresh_token)
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="刷新令牌失败"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return UserResponse.model_validate(current_user)

@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """登出所有设备"""
    auth_service = AuthService(db)
    
    # 撤销用户所有会话
    success = auth_service.revoke_all_user_sessions(current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="登出失败"
        )
    
    return {"message": "已成功登出所有设备"}