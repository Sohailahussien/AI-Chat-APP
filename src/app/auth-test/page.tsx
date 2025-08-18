'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function AuthTest() {
  const { user, token, isLoading } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // Get localStorage data
    const authToken = localStorage.getItem('authToken');
    const authUser = localStorage.getItem('authUser');
    const disableAuth = localStorage.getItem('NEXT_PUBLIC_DISABLE_AUTH');
    
    setLocalStorageData({
      authToken,
      authUser: authUser ? JSON.parse(authUser) : null,
      disableAuth,
      envDisableAuth: process.env.NEXT_PUBLIC_DISABLE_AUTH
    });
  }, []);

  const setDevUser = () => {
    localStorage.setItem('authToken', 'dev');
    localStorage.setItem('authUser', JSON.stringify({
      id: 'dev', 
      email: 'dev@example.com', 
      name: 'Dev User'
    }));
    localStorage.setItem('NEXT_PUBLIC_DISABLE_AUTH', 'true');
    window.location.reload();
  };

  const clearAllAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('NEXT_PUBLIC_DISABLE_AUTH');
    window.location.reload();
  };

  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('NEXT_PUBLIC_DISABLE_AUTH');
    window.location.reload();
  };

  const resetDatabase = async () => {
    try {
      const response = await fetch('/api/auth/reset', { method: 'POST' });
      if (response.ok) {
        alert('Database reset successfully!');
        window.location.reload();
      } else {
        alert('Failed to reset database');
      }
    } catch (error) {
      alert('Error resetting database');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Auth Context State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Context State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
              <p><strong>Token:</strong> {token || 'null'}</p>
            </div>
          </div>

          {/* LocalStorage Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LocalStorage Data</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={setDevUser}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Set Dev User
            </button>
            <button
              onClick={clearAuth}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Auth
            </button>
            <button
              onClick={clearAllAuth}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Clear All & Sign In
            </button>
            <button
              onClick={resetDatabase}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Reset Database
            </button>
            <a
              href="/"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
            >
              Go to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
