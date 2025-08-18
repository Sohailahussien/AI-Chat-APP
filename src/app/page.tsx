'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ChatInterface from '../components/ChatInterface';
import UserProfile from '../components/UserProfile';
import ProtectedRoute from '../components/ProtectedRoute';
import ThemeToggle from '../components/ThemeToggle';
import MobileSidebar from '../components/MobileSidebar';
import Tooltip from '../components/Tooltip';
import CubiLogo from '../components/CubiLogo';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onToggleTheme: toggleTheme
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6">
            <CubiLogo size="lg" showText={false} variant="text-only" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
            Cubi AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
            Experience the future of AI-powered conversations
          </p>
          
          <div className="space-y-4">
            <a
              href="/auth"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Get Started
            </a>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account? 
              <a href="/auth" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold ml-1">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Toggle and Logo */}
              <div className="flex items-center">
                {/* Desktop Sidebar Toggle */}
                <Tooltip content={sidebarOpen ? "Hide sidebar (⌘+B)" : "Show sidebar (⌘+B)"}>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`hidden lg:flex p-2 rounded-lg transition-all duration-200 mr-3 ${
                      sidebarOpen 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {sidebarOpen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </Tooltip>

                {/* Mobile Menu Button */}
                <Tooltip content="Open menu">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 mr-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </Tooltip>

                {/* Logo */}
                <div className="flex items-center">
                  <CubiLogo size="md" variant="text-only" />
                </div>
              </div>
              
              {/* Right side - User info and controls */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  Welcome, <span className="font-semibold text-gray-900 dark:text-gray-100">{user.name || user.email}</span>
                </div>
                <a
                  href="/account"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hidden sm:block"
                >
                  Account
                </a>
                <ThemeToggle />
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <MobileSidebar 
          isOpen={mobileSidebarOpen} 
          onClose={() => setMobileSidebarOpen(false)} 
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`grid gap-8 transition-all duration-300 ${
            sidebarOpen 
              ? 'grid-cols-1 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {/* Desktop Sidebar */}
            {sidebarOpen && (
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <UserProfile />
                </div>
              </div>
            )}
            
            {/* Chat Interface */}
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:col-span-3' : 'lg:col-span-1'
            }`}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    AI Assistant
                  </h2>
                </div>
                <ChatInterface />
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="space-y-1">
            <div>⌘+B: Toggle sidebar</div>
            <div>⌘+T: Toggle theme</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
