/**
 * 认证上下文
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User, LoginRequest, RegisterRequest } from '@/types/auth';
import { AuthAPI } from '@/lib/auth-api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 初始化时检查用户状态
  useEffect(() => {
    const initAuth = async () => {
      const token = AuthAPI.getStoredToken();
      
      if (token && !AuthAPI.isTokenExpired(token)) {
        try {
          const userData = await AuthAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          // 令牌无效，清除存储
          await AuthAPI.logout();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      console.log('Starting login process...');
      const tokenResponse = await AuthAPI.login(credentials);
      console.log('Login successful, getting user data...');
      const userData = await AuthAPI.getCurrentUser();
      console.log('User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      await AuthAPI.register(userData);
      // 注册成功后自动登录
      await login({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使登出失败，也清除本地状态
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      await AuthAPI.refreshToken();
      const userData = await AuthAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // 刷新失败，清除用户状态
      setUser(null);
      await AuthAPI.logout();
      throw error;
    }
  };

  // 自动刷新令牌
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const token = AuthAPI.getStoredToken();
      if (token && AuthAPI.isTokenExpired(token)) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};