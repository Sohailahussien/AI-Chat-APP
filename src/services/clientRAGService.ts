import { Document } from '@langchain/core/documents';

export class ClientRAGService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : `http://localhost:${process.env.PORT || 3005}`; // Updated port to 3005
  }

  async processQuery(
    query: string,
    conversationId?: string,
    context?: Record<string, any>
  ): Promise<any> {
    try {
      console.log('Processing query:', query);
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          context: context || {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response from API');
      }

      return {
        stream: response.body,
        conversationId: conversationId || `conv_${Date.now()}`
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  async addDocuments(documents: Document[]) {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }
} 