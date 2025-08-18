'use client';

import { useState, useEffect } from 'react';

export default function TemplateDemoPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTemplates, setActiveTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadActiveTemplates();
  }, []);

  const loadActiveTemplates = async () => {
    try {
      const response = await fetch('/api/templates?active=true');
      const data = await response.json();
      if (data.success) {
        setActiveTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setResponse('');

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

  const activateTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', templateId })
      });
      
      if (response.ok) {
        await loadActiveTemplates();
      }
    } catch (error) {
      console.error('Error activating template:', error);
    }
  };

  const deactivateTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', templateId })
      });
      
      if (response.ok) {
        await loadActiveTemplates();
      }
    } catch (error) {
      console.error('Error deactivating template:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          🎯 Chat Template Demo
        </h1>

        {/* Template Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Template Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => activateTemplate('technical-support')}
              className="btn-primary"
            >
              Activate Technical Support
            </button>
            <button
              onClick={() => activateTemplate('customer-service')}
              className="btn-primary"
            >
              Activate Customer Service
            </button>
            <button
              onClick={() => activateTemplate('project-manager')}
              className="btn-primary"
            >
              Activate Project Manager
            </button>
          </div>
          
          {activeTemplates.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Active Templates:</h3>
              <div className="flex flex-wrap gap-2">
                {activeTemplates.map(template => (
                  <div key={template.id} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <span>{template.name}</span>
                    <button
                      onClick={() => deactivateTemplate(template.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Chat with Templates</h2>
          <p className="text-gray-600 mb-6">
            Try different types of questions to see how the active templates affect the AI's responses.
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question..."
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

          {response && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI Response:</h3>
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>

        {/* Example Questions */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Example Questions to Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-blue-600">Technical Support</h3>
              <ul className="space-y-2 text-sm">
                <li>• "My computer is running slowly"</li>
                <li>• "How do I install a new hard drive?"</li>
                <li>• "I'm getting a blue screen error"</li>
                <li>• "My internet connection is unstable"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-green-600">Customer Service</h3>
              <ul className="space-y-2 text-sm">
                <li>• "I'm very frustrated with your service"</li>
                <li>• "I want to cancel my subscription"</li>
                <li>• "Your product doesn't work as advertised"</li>
                <li>• "I need a refund"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-purple-600">Project Management</h3>
              <ul className="space-y-2 text-sm">
                <li>• "How do I create a project timeline?"</li>
                <li>• "My team is falling behind schedule"</li>
                <li>• "How do I manage project risks?"</li>
                <li>• "What's the best way to delegate tasks?"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
