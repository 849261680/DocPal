/**
 * 认证相关 API 函数
 */
import { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

export class AuthAPI {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: '网络错误，请稍后重试' 
      }));
      console.error('API Error:', error);
      
      // 处理 FastAPI 的验证错误格式
      if (error.detail && Array.isArray(error.detail)) {
        const errorMessages = error.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        throw new Error(errorMessages);
      }
      
      throw new Error(error.detail || JSON.stringify(error) || '请求失败');
    }
    return response.json();
  }

  static async login(credentials: LoginRequest): Promise<TokenResponse> {
    console.log('Sending login request with:', credentials);
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<TokenResponse>(response);
    
    // 保存令牌到 localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }

  static async register(userData: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return this.handleResponse<User>(response);
  }

  static async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    // 清除本地存储的令牌
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  static async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  static async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('无刷新令牌');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await this.handleResponse<TokenResponse>(response);
    
    // 更新令牌
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  static getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }
}