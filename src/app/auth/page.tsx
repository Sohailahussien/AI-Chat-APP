'use client';

import { useState } from 'react';
import AuthForm from '../../components/AuthForm';
import CubiLogo from '../../components/CubiLogo';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-sm">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
            <CubiLogo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Enter your details to get started'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
          <AuthForm mode={mode} onModeChange={setMode} />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
} 