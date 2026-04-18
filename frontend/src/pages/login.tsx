import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Logo size="xl" />
          </div>
          <p className="mt-2 text-[#646464]">
            您的智能文档问答助手
          </p>
        </div>

        {/* Authentication Forms */}
        <div className="p-6">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-[#8d8d8d]">
          <p>© 2024 DocPal. 保留所有权利.</p>
        </div>
      </div>
    </div>
  );
}
