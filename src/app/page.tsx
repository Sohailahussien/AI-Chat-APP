'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { useRouter } from 'next/navigation';
import ChatInterface from '../components/ChatInterface';
import ProtectedRoute from '../components/ProtectedRoute';
import ThemeToggle from '../components/ThemeToggle';
import Tooltip from '../components/Tooltip';
import CubiLogo from '../components/CubiLogo';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { chats, currentChat, createNewChat, loadChat, deleteChat, clearAllChats, isLoading } = useChat();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatInterfaceRef = useRef<any>(null);

  const handleNewChat = () => {
    createNewChat();
  };

  const handleSearchChats = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAccountClick = () => {
    router.push('/account');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleTheme: toggleTheme,
    onToggleSidebar: toggleSidebar
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center max-w-md">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent mb-4">
            Cubi AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
            Experience the future of AI-powered conversations
          </p>
          
          <div className="space-y-4">
            <a
              href="/auth"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold rounded-xl shadow-lg hover:from-gray-800 hover:to-gray-950 transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Get Started
            </a>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account? 
              <a href="/auth" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-semibold ml-1">
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
      <div className="h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}>
          {sidebarOpen ? (
            <>
              {/* Expanded Sidebar */}
              {/* Logo Toggle Button */}
              <div className="pt-0 pb-0 px-2">
                <button
                  onClick={toggleSidebar}
                  className="w-full flex items-center justify-center px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <CubiLogo size="button" showText={false} />
                  </div>
                </button>
              </div>

              {/* Top section - New Chat */}
              <div className="p-2">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm">New Chat</span>
                </button>
              </div>

              {/* Search Chats */}
              <div className="px-2">
                  <button
                  onClick={handleSearchChats}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                    isSearchOpen 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                  </div>
                  <span className="text-sm">Search Chats</span>
                  </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No chat history
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer ${
                        currentChat?.id === chat.id
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => loadChat(chat.id)}
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{chat.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity duration-200"
                        title="Delete chat"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Clear All Chats Button */}
              {chats.length > 0 && (
                <div className="px-2">
                  <button
                    onClick={clearAllChats}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    </div>
                    <span className="text-sm">Clear All Chats</span>
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2 mx-2"></div>
              
              {/* Bottom section - Account */}
              <div className="p-2">
                <button
                  onClick={handleAccountClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <div className="w-6 h-6 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm">Account</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Minimized Sidebar - ChatGPT Style */}
              {/* Logo Toggle Button */}
              <div className="pt-0 pb-0 px-2">
                <button
                  onClick={toggleSidebar}
                  className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Toggle Sidebar"
                >
                  <CubiLogo size="button" showText={false} />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-2">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="New Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Search Button */}
              <div className="px-2">
                <button
                  onClick={handleSearchChats}
                  className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Search Chats"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                </div>

              {/* Chat History Button */}
              <div className="px-2">
                <button
                  className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Chat History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700 my-2 mx-2"></div>
              
              {/* Account Button */}
              <div className="p-2">
                <button
                  onClick={handleAccountClick}
                  className="w-full flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="Account"
                >
                  <div className="w-6 h-6 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Header - Chat Header */}
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-transparent sticky top-0 z-50 transition-colors duration-300 flex-shrink-0">
            <div className="flex items-center justify-between px-0 py-0">
              <div className="flex items-center">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mt-1 mb-0 px-2 py-2">Cubi AI</div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
            </div>
          </div>
        </header>

          {/* Chat Interface - Full height, no scroll */}
          <div className="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
                <ChatInterface />
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="space-y-1">
            <div>⌘+T: Toggle theme</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
