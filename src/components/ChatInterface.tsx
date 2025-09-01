'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import Tooltip from './Tooltip';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date | string;
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
  const { currentChat, saveChat, createNewChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to clean up AI responses - ChatGPT style (minimal processing)
  const cleanResponse = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
      .replace(/`(.*?)`/g, '$1') // Remove code markers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      // Normalize whitespace (keep natural formatting)
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n') // Normalize line endings
      .trim(); // Remove leading/trailing whitespace
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize composer textarea like ChatGPT
  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  }, [input]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleNewChat();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Delete') {
        event.preventDefault();
        handleClearHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages.length]);

  // Load messages from current chat
  useEffect(() => {
    if (currentChat) {
      console.log('📚 Loading messages from current chat:', currentChat.title);
      setMessages(currentChat.messages || []);
    } else {
      console.log('📚 No current chat, clearing messages');
      setMessages([]);
    }
  }, [currentChat]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to chat context
    if (currentChat) {
      console.log('💾 Saving user message to chat context');
      const updatedMessages = [...messages, userMessage];
      saveChat(updatedMessages);
    }
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
          message: textToSend
        }),
      });

      const data = await response.json();
      console.log('📥 Chat response data:', data);

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
        
        // Save assistant message to chat context
        if (currentChat) {
          console.log('💾 Saving assistant message to chat context');
          const updatedMessages = [...messages, userMessage, assistantMessage];
          saveChat(updatedMessages);
        }
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
        
        // Save assistant message to chat context
        if (currentChat) {
          console.log('💾 Saving conversational message to chat context');
          const updatedMessages = [...messages, userMessage, assistantMessage];
          saveChat(updatedMessages);
        }
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
        
        // Save assistant message to database
        if (user && token) {
          try {
            await fetch('/api/chat/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                content: cleanResponse(data.response),
                role: 'assistant',
                aiAgent: 'chat',
                metadata: {
                  responseType: data.responseType || 'error'
                }
              })
            });
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
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
      
      // Save error message to database
      if (user && token) {
        try {
          await fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content: cleanResponse('Sorry, I encountered an error. Please try again.'),
              role: 'assistant',
              aiAgent: 'chat',
              metadata: {
                responseType: 'error'
              }
            })
          });
        } catch (error) {
          console.error('Error saving error message:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const generateTranslationResponse = (data: any): string => {
    return data.response;
  };

  const generateDocumentResponse = (data: any): string => {
    return data.response;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📤 Starting file upload:', file.name, file.size, file.type);

    // Add current input text to the upload if it exists
    const currentMessage = input.trim();
    if (currentMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: currentMessage,
        role: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput(''); // Clear the input after adding the message
      
      // Save user message to database
      if (user && token) {
        try {
          await fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content: currentMessage,
              role: 'user',
              aiAgent: 'file_upload'
            })
          });
        } catch (error) {
          console.error('Error saving user message:', error);
        }
      }
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress(0);
    setIsLoading(true);

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using authentication token');
      }
      
      console.log('📡 Sending upload request...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('📥 Upload response status:', response.status);
        const data = await response.json();
      console.log('📥 Upload response data:', data);

      if (response.ok && data.success) {
        const successMessage: Message = {
          id: Date.now().toString(),
          content: currentMessage 
            ? `Successfully uploaded "${file.name}" and processed your request. I'll analyze the document and respond to your question.`
            : `Successfully uploaded "${file.name}". You can now ask questions about this document.`,
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'upload_success'
        };
        setMessages(prev => [...prev, successMessage]);
        console.log('✅ Upload successful, message added to chat');
        
        // Save upload success message to database
        if (user && token) {
          try {
            await fetch('/api/chat/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                content: currentMessage 
                  ? `Successfully uploaded "${file.name}" and processed your request. I'll analyze the document and respond to your question.`
                  : `Successfully uploaded "${file.name}". You can now ask questions about this document.`,
                role: 'assistant',
                aiAgent: 'file_upload',
                metadata: {
                  responseType: 'upload_success',
                  fileName: file.name
                }
              })
            });
          } catch (error) {
            console.error('Error saving upload success message:', error);
          }
        }
        
        // If there was a message with the file, automatically send it for processing
        if (currentMessage) {
          setTimeout(() => {
            sendMessage(currentMessage);
          }, 1000); // Small delay to ensure upload is complete
        }
      } else {
        const errorMsg = data.error || 'Upload failed';
        console.error('❌ Upload failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
              const errorMessage: Message = {
          id: Date.now().toString(),
          content: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          role: 'assistant',
          timestamp: new Date(),
          responseType: 'upload_error'
        };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      // Clear the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const formatTime = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }
    
    return dateObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Copy assistant message content to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Regenerate last answer by resubmitting the last user prompt
  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setInput(lastUser.content);
    // Submit via the existing form handler
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      const choice = window.confirm(
        'Start a new chat?\n\n' +
        'Click OK to start a new chat (current messages will be saved to history).\n' +
        'Click Cancel to keep the current chat.'
      );
      
      if (!choice) {
        return;
      }
    }
    
    // Create new chat through context
    createNewChat();
    setInput('');
  };

  const handleClearHistory = async () => {
    if (!user || !token) {
      alert('You must be logged in to clear chat history.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to clear ALL chat history?\n\n' +
      'This will permanently delete all your saved messages and cannot be undone.'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessages([]);
        setInput('');
        alert('Chat history cleared successfully!');
      } else {
        alert('Failed to clear chat history. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="py-8">
            <h3 className="text-lg font-semibold mb-2 text-center text-gray-800 dark:text-gray-100">Welcome</h3>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">Start with one of the prompts below</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                'Summarize the uploaded document',
                'Extract key points from my file',
                'Recommend resources related to my document',
                'Explain this section in simple terms'
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => formRef.current?.requestSubmit(), 0);
                  }}
                  className="text-left rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 p-4 transition-colors"
                >
                  <div className="text-sm text-gray-800 dark:text-gray-100">{q}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#d9d9e3] dark:bg-[#565869] flex items-center justify-center text-[#202123] dark:text-[#ececf1]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/></svg>
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                message.role === 'user'
                ? 'bg-white border border-[#ececf1] text-[#202123] dark:bg-[#343541] dark:border-[#565869] dark:text-[#ececf1] rounded-br-sm'
                : 'bg-[#f7f7f8] dark:bg-[#444654] text-[#202123] dark:text-[#ececf1] rounded-bl-sm'
            }`}>
              <div
                className="whitespace-pre-wrap text-base leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: cleanResponse(message.content).replace(/\n/g, '<br>')
                }}
              />
              <div className={`text-[10px] mt-1 text-[#6b7280] dark:text-[#8e8ea0]`}>
                {formatTime(message.timestamp)}
              </div>
              {message.role === 'assistant' && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(message.content)}
                    className="text-[11px] px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    title="Copy"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="text-[11px] px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    title="Regenerate response"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#d9d9e3] dark:bg-[#565869] flex items-center justify-center text-[#202123] dark:text-[#ececf1]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/></svg>
            </div>
            <div className="bg-[#f7f7f8] dark:bg-[#444654] text-[#202123] dark:text-[#ececf1] rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Composer - Fixed at bottom */}
      <div className="border-t border-[#ececf1] dark:border-[#2a2b32] bg-white dark:bg-[#343541] p-4 flex-shrink-0">
        <form ref={formRef} onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            {/* File Upload Button - Next to textbox */}
            <div className="flex-shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx,.doc,.md,.html,.htm,.csv,.xlsx,.xls,.json,.xml"
                className="hidden"
                multiple
              />
              <Tooltip content="Upload files">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-[#ececf1] dark:border-[#565869] transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </Tooltip>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textAreaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Cubi AI..."
                className="w-full resize-none rounded-xl border border-[#ececf1] dark:border-[#565869] bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-transparent transition-all duration-200"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '240px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    formRef.current?.requestSubmit();
                  }
                }}
                disabled={isLoading}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 text-[#10a37f] hover:text-[#0d8a6f] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-3 max-w-4xl mx-auto">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-[#10a37f] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              Uploading... {uploadProgress}%
            </div>
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