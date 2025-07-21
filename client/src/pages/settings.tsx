/**
 * 设置页面
 */
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, User, Mail, Building, Key, Save, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [username, setUsername] = useState(user?.username || '');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  if (!user) {
    return null;
  }

  const handleBack = () => {
    setLocation('/');
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return '用户名不能为空';
    }
    if (username.length < 3) {
      return '用户名长度至少为3个字符';
    }
    if (username.length > 50) {
      return '用户名长度不能超过50个字符';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return '密码不能为空';
    }
    if (password.length < 8) {
      return '密码长度至少为8个字符';
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      return '密码必须包含字母和数字';
    }
    return null;
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // 验证表单
      if (!passwordForm.currentPassword) {
        setMessage({ type: 'error', text: '请输入当前密码' });
        return;
      }

      const newPasswordError = validatePassword(passwordForm.newPassword);
      if (newPasswordError) {
        setMessage({ type: 'error', text: newPasswordError });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({ type: 'error', text: '两次输入的新密码不一致' });
        return;
      }

      if (passwordForm.currentPassword === passwordForm.newPassword) {
        setMessage({ type: 'error', text: '新密码不能与当前密码相同' });
        return;
      }

      // 调用密码修改API
      await updateUserProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      // 重置表单
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setMessage({ type: 'success', text: '密码修改成功' });
    } catch (error) {
      console.error('密码修改失败:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '密码修改失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // 验证用户名
      const usernameError = validateUsername(username);
      if (usernameError) {
        setMessage({ type: 'error', text: usernameError });
        setIsLoading(false);
        return;
      }

      // 检查用户名是否有变化
      if (username !== user.username) {
        console.log('更新用户名:', { oldUsername: user.username, newUsername: username });
        await updateUserProfile({ username });
      }
      setMessage({ type: 'success', text: '设置已保存' });
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-xl border-none text-white px-6 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">设置</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <User className="inline h-4 w-4 mr-2" />
                    个人资料
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'security'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Key className="inline h-4 w-4 mr-2" />
                    安全设置
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {message && (
              <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>个人资料</CardTitle>
                  <CardDescription>
                    管理您的个人信息
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="输入用户名"
                        minLength={3}
                        maxLength={50}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                  <CardDescription>
                    管理您的账户安全
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">修改密码</h3>
                    <p className="text-sm text-gray-600">
                      定期更改密码有助于保护您的账户安全
                    </p>
                    
                    <div className="space-y-4 max-w-md">
                      {/* 当前密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">当前密码</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            placeholder="输入当前密码"
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* 新密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">新密码</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            placeholder="输入新密码"
                            value={passwordForm.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>密码必须包含：</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li className={passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                              至少8个字符
                            </li>
                            <li className={/[a-zA-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                              至少一个字母
                            </li>
                            <li className={/\d/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                              至少一个数字
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* 确认新密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">确认新密码</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            placeholder="再次输入新密码"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                          <p className="text-xs text-red-500">密码不一致</p>
                        )}
                      </div>

                      {/* 修改密码按钮 */}
                      <Button
                        onClick={handlePasswordSubmit}
                        disabled={
                          isLoading ||
                          !passwordForm.currentPassword ||
                          !passwordForm.newPassword ||
                          !passwordForm.confirmPassword ||
                          passwordForm.newPassword !== passwordForm.confirmPassword ||
                          validatePassword(passwordForm.newPassword) !== null
                        }
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            修改中...
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4 mr-2" />
                            修改密码
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button - 只在个人资料页面显示 */}
            {activeTab === 'profile' && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || username === user.username || validateUsername(username) !== null}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存设置
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}