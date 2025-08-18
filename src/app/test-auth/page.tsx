'use client';

import { useAuth } from '../../contexts/AuthContext';
import AuthForm from '../../components/AuthForm';

export default function TestAuthPage() {
  const { user, logout } = useAuth();

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });
      
      const data = await response.json();
      console.log('Login test result:', data);
      alert(`Login test: ${response.ok ? 'Success' : 'Failed'}\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Login test error:', error);
      alert('Login test failed');
    }
  };

  const testRegister = async () => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        }),
      });
      
      const data = await response.json();
      console.log('Register test result:', data);
      alert(`Register test: ${response.ok ? 'Success' : 'Failed'}\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Register test error:', error);
      alert('Register test failed');
    }
  };

  const testProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('No auth token found. Please login first.');
        return;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      console.log('Profile test result:', data);
      alert(`Profile test: ${response.ok ? 'Success' : 'Failed'}\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Profile test error:', error);
      alert('Profile test failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
            Authentication Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test authentication functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Test Controls
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={testLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                Test Login
              </button>
              
              <button
                onClick={testRegister}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                Test Register
              </button>
              
              <button
                onClick={testProfile}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                Test Profile Access
              </button>
              
              {user && (
                <button
                  onClick={logout}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Auth Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Authentication Form
            </h2>
            
            <AuthForm mode="login" />
          </div>
        </div>

        {/* Current User Status */}
        {user && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Current User
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 