/**
 * 登录表单组件
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // 监听认证状态变化，登录成功后自动跳转
  useEffect(() => {
    if (loginSuccess && isAuthenticated) {
      console.log('认证状态已更新，执行跳转...');
      setLocation('/app');
    }
  }, [isAuthenticated, loginSuccess, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 使用 ref 进行更强的防抖保护
    if (submittingRef.current || isSubmitting) {
      console.log('防止重复提交，当前状态:', { submittingRef: submittingRef.current, isSubmitting });
      return;
    }
    
    // 基础表单验证
    if (!formData.email || !formData.password) {
      setError('请填写完整的登录信息');
      return;
    }
    
    console.log('开始登录流程...');
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await login(formData);
      console.log('登录成功，等待认证状态更新...');
      setLoginSuccess(true);
    } catch (err) {
      console.error('登录失败:', err);
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      console.log('登录流程结束');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">登录</CardTitle>
        <CardDescription>
          登录您的账户以访问 DocPal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="输入您的邮箱地址"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="输入您的密码"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formData.email || !formData.password}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                登录中...
              </>
            ) : (
              <>
                <LogIn size={20} className="mr-2" />
                登录
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          还没有账户？{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            注册
          </button>
        </div>
      </CardContent>
    </Card>
  );
};