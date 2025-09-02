'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setUser(data.user);
        
        // Auto-login the user
        if (data.token) {
          login(data.token, data.user);
        }
        
        // Redirect to main app after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Cubi AI
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Email Verification
              </div>
            </div>

            {status === 'loading' && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Verifying your email address...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-green-600 dark:text-green-400 text-6xl">✅</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Email Verified Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {message}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Redirecting you to the app in a few seconds...
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Go to App Now
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="text-red-600 dark:text-red-400 text-6xl">❌</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Verification Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {message}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/auth')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Back to Login
                  </button>
                  {user?.email && (
                    <button
                      onClick={handleResendEmail}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Resend Verification Email
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
