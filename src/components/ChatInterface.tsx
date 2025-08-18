'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  documents?: any[];
  metadatas?: any[];
  responseType?: string;
  translation_type?: string;
  service?: string;
  confidence?: number;
  word_count?: number;
  userQuestion?: string;
  suggestions?: string[];
  hasLocalContext?: boolean;
  model?: string;
}

interface ChatInterfaceProps {
  mcpClient?: any;
}

export default function ChatInterface({ mcpClient }: ChatInterfaceProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to clean up AI responses by removing extra whitespace and normalizing text
  const cleanResponse = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove all types of whitespace characters (spaces, tabs, etc.)
      .replace(/[ \t]+/g, ' ')
      // Remove leading and trailing whitespace
      .trim()
      // Remove multiple consecutive newlines and normalize to max 2 newlines
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      // Remove spaces at the beginning of lines
      .replace(/^[ \t]+/gm, '')
      // Remove spaces at the end of lines
      .replace(/[ \t]+$/gm, '')
      // Remove any remaining multiple spaces
      .replace(/ +/g, ' ')
      // Ensure proper spacing around punctuation
      .replace(/\s+([.,!?;:])/g, '$1')
      // Remove empty lines at the beginning and end
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when user is authenticated
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user && token) {
        try {
          const response = await fetch('/api/chat/messages', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const historyMessages = data.messages.map((msg: any) => ({
              id: msg.id,
              content: cleanResponse(msg.content),
              role: msg.role,
              timestamp: new Date(msg.timestamp),
              responseType: msg.metadata?.responseType || 'conversational',
              documents: msg.metadata?.documents || [],
              metadatas: msg.metadata?.metadatas || []
            }));
            setMessages(historyMessages);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      }
    };

    loadChatHistory();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if user is authenticated
      if (user && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: input
        }),
      });

      const data = await response.json();

      if (data.responseType === 'ai_response') {
        // Handle enhanced AI responses
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanResponse(data.response),
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'ai_response',
          hasLocalContext: data.hasLocalContext,
          model: data.model
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.responseType === 'conversational') {
        // Handle conversational responses
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanResponse(data.response),
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'conversational'
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.responseType === 'translation') {
        // Handle translation responses
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanResponse(generateTranslationResponse(data)),
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'translation',
          translation_type: data.translation_type,
          service: data.service,
          confidence: data.confidence,
          word_count: data.word_count
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.responseType === 'document_query') {
        // Handle document query responses
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanResponse(generateDocumentResponse(data)),
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'document_query',
          documents: data.documents,
          metadatas: data.metadatas,
          userQuestion: data.userQuestion,
          suggestions: data.suggestions
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error or no results
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanResponse(data.response),
          role: 'assistant',
          timestamp: new Date(),
          responseType: data.responseType || 'error'
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: cleanResponse('Sorry, I encountered an error. Please try again.'),
        role: 'assistant',
        timestamp: new Date(),
        responseType: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTranslationResponse = (data: any): string => {
    let response = `🌐 **Translation Complete**\n\n`;
    response += `${data.response}\n\n`;
    response += `📊 **Translation Details:**\n`;
    response += `• Service: ${data.service}\n`;
    response += `• Confidence: ${Math.round((data.confidence || 0) * 100)}%\n`;
    response += `• Word Count: ${data.word_count || 0}\n\n`;
    response += `💡 **Pro Tip:** For more accurate translations, consider providing context about the document's subject matter.`;
    
    return response;
  };

  const generateDocumentResponse = (data: any): string => {
    let response = data.response + '\n\n';
    
    if (data.suggestions && data.suggestions.length > 0) {
      response += `💡 **Follow-up Questions:**\n`;
      data.suggestions.forEach((suggestion: string, index: number) => {
        response += `${index + 1}. ${suggestion}\n`;
      });
      response += '\n';
    }
    
    if (data.documents && data.documents.length > 0) {
      response += `📄 **Source:** ${data.metadatas?.[0]?.source ? getBasename(data.metadatas[0].source) : 'Document'}\n`;
    }
    
    return response;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress(0);
    setIsLoading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `✅ Successfully uploaded "${file.name}". You can now ask questions about this document.`,
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'upload_success'
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: '❌ Upload failed. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        responseType: 'upload_error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to Cubi AI</h3>
            <p className="text-sm">Upload a document or start chatting to get started!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          {/* File Upload Button */}
          <label className="cursor-pointer p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <input
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or upload a document..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get filename from path
function getBasename(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath;
} 