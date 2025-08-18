'use client';

import { useState, useEffect } from 'react';
import { ChatTemplate } from '@/services/chatTemplates';

export default function TemplateManagerPage() {
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [activeTemplates, setActiveTemplates] = useState<ChatTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ChatTemplate | null>(null);
  const [trainingConversation, setTrainingConversation] = useState<{ user: string; assistant: string }[]>([]);
  const [newUserInput, setNewUserInput] = useState('');
  const [newAssistantInput, setNewAssistantInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const [allResponse, activeResponse] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/templates?active=true')
      ]);
      
      const allData = await allResponse.json();
      const activeData = await activeResponse.json();
      
      if (allData.success) setTemplates(allData.templates);
      if (activeData.success) setActiveTemplates(activeData.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const activateTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', templateId })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTemplates();
      }
    } catch (error) {
      console.error('Error activating template:', error);
    } finally {
      setLoading(false);
    }
  };

  const deactivateTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', templateId })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTemplates();
      }
    } catch (error) {
      console.error('Error deactivating template:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTrainingExample = () => {
    if (newUserInput.trim() && newAssistantInput.trim()) {
      setTrainingConversation(prev => [...prev, {
        user: newUserInput,
        assistant: newAssistantInput
      }]);
      setNewUserInput('');
      setNewAssistantInput('');
    }
  };

  const trainTemplate = async () => {
    if (!selectedTemplate || trainingConversation.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'train',
          templateId: selectedTemplate.id,
          conversation: trainingConversation
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTrainingConversation([]);
        await loadTemplates();
        alert('Template trained successfully!');
      }
    } catch (error) {
      console.error('Error training template:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', templateId })
      });
      
      const data = await response.json();
      if (data.success) {
        const blob = new Blob([data.template], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${templateId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting template:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          🎯 Chat Template Manager
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Templates */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Available Templates</h2>
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {template.category}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {template.metadata.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => activateTemplate(template.id)}
                        disabled={loading}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => exportTemplate(template.id)}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {template.examples.length} examples • {template.metadata.tags.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Templates */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Active Templates</h2>
            <div className="space-y-4">
              {activeTemplates.map(template => (
                <div key={template.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Active
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deactivateTemplate(template.id)}
                      disabled={loading}
                      className="btn-danger text-sm px-3 py-1"
                    >
                      Deactivate
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {template.examples.length} examples • {template.metadata.tags.join(', ')}
                  </div>
                </div>
              ))}
              {activeTemplates.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No active templates. Activate a template to customize the AI's behavior.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Template Training */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Train Templates</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Template to Train
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              className="input-field w-full"
            >
              <option value="">Choose a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Input
                  </label>
                  <textarea
                    value={newUserInput}
                    onChange={(e) => setNewUserInput(e.target.value)}
                    placeholder="Enter user message..."
                    className="input-field w-full h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assistant Response
                  </label>
                  <textarea
                    value={newAssistantInput}
                    onChange={(e) => setNewAssistantInput(e.target.value)}
                    placeholder="Enter desired assistant response..."
                    className="input-field w-full h-24"
                  />
                </div>
              </div>
              
              <button
                onClick={addTrainingExample}
                className="btn-primary"
              >
                Add Training Example
              </button>

              {trainingConversation.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Training Examples ({trainingConversation.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {trainingConversation.map((example, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="text-sm">
                          <strong>User:</strong> {example.user}
                        </div>
                        <div className="text-sm mt-1">
                          <strong>Assistant:</strong> {example.assistant}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={trainTemplate}
                    disabled={loading}
                    className="btn-success mt-4"
                  >
                    {loading ? 'Training...' : 'Train Template'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Information */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">How to Use Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Activate Templates</h3>
              <p className="text-gray-600 text-sm">
                Choose templates that match your use case. Multiple templates can be active at once.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Train with Examples</h3>
              <p className="text-gray-600 text-sm">
                Add conversation examples to improve the AI's responses for specific scenarios.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Test & Refine</h3>
              <p className="text-gray-600 text-sm">
                Test the AI with your templates and continue training to improve performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
