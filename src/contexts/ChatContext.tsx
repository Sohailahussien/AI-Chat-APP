'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  createNewChat: () => void;
  loadChat: (chatId: string) => void;
  saveChat: (messages: any[]) => void;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chat history from API
  const loadChatHistory = async () => {
    if (!user || !token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
        
        // Set the most recent chat as current if no current chat
        if (data.chats && data.chats.length > 0 && !currentChat) {
          setCurrentChat(data.chats[0]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat history when user changes
  useEffect(() => {
    loadChatHistory();
  }, [user, token]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
  };

  const loadChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const saveChat = async (messages: any[]) => {
    if (!currentChat || !user || !token) return;

    const updatedChat = {
      ...currentChat,
      messages,
      updatedAt: new Date(),
      title: messages.length > 0 ? messages[0].content.substring(0, 50) + '...' : 'New Chat'
    };

    setCurrentChat(updatedChat);
    setChats(prev => prev.map(chat => 
      chat.id === currentChat.id ? updatedChat : chat
    ));

    // Save to API
    try {
      await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: currentChat.id,
          title: updatedChat.title,
          messages
        })
      });
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!token) return;

    try {
      await fetch(`/api/chat/history/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If we're deleting the current chat, switch to the first available chat
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const clearAllChats = async () => {
    if (!token) return;

    try {
      await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setChats([]);
      setCurrentChat(null);
    } catch (error) {
      console.error('Error clearing all chats:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      chats,
      currentChat,
      isLoading,
      createNewChat,
      loadChat,
      saveChat,
      deleteChat,
      clearAllChats
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
