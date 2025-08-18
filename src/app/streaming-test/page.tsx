'use client';

import { useState } from 'react';

export default function StreamingTestPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setResponse('');
    setStreamingText('');

    try {
      const res = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          streaming: false,
          useExternalAI: true
        }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsStreaming(true);
    setStreamingText('');
    setResponse('');

    try {
      const res = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          streaming: true,
          useExternalAI: true
        }),
      });

      if (!res.body) {
        throw new Error('No response body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setStreamingText(prev => prev + chunk);
      }
    } catch (error) {
      setStreamingText('Error: ' + error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          🚀 Enhanced Streaming Test
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Enhanced AI Capabilities</h2>
          <p className="text-gray-600 mb-6">
            This enhanced system combines your uploaded documents with external AI knowledge.
            Try asking questions about your documents or general knowledge!
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything - about your documents or general knowledge..."
                className="flex-1 input-field"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Send'}
              </button>
            </div>
          </form>

          <form onSubmit={handleStreamingSubmit} className="mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything for streaming response..."
                className="flex-1 input-field"
              />
              <button
                type="submit"
                disabled={isStreaming}
                className="btn-secondary disabled:opacity-50"
              >
                {isStreaming ? 'Streaming...' : 'Stream Response'}
              </button>
            </div>
          </form>
        </div>

        {/* Regular Response */}
        {response && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-green-600">
              ✅ Regular Response
            </h3>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          </div>
        )}

        {/* Streaming Response */}
        {streamingText && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">
              ⚡ Streaming Response {isStreaming && '(Live...)'}
            </h3>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{streamingText}</p>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
              )}
            </div>
          </div>
        )}

        {/* Test Examples */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-semibold mb-4">💡 Test Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Document Questions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "What are dragons?"</li>
                <li>• "Tell me about the document I uploaded"</li>
                <li>• "What information is in my files?"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">General Knowledge:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "What is machine learning?"</li>
                <li>• "How do I make a cake?"</li>
                <li>• "Explain quantum physics"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
