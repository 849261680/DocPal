/**
 * 登录页面
 */
import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Brain } from 'lucide-react';

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            DocPal
          </h1>
          <p className="mt-2 text-gray-600">
            您的智能文档问答助手
          </p>
        </div>

        {/* Authentication Forms */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 DocPal. 保留所有权利.</p>
        </div>
      </div>
    </div>
  );
}