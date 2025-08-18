export class ClientRAGService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : `http://localhost:${process.env.PORT || 3000}`;
  }

  async processQuery(
    query: string,
    conversationId?: string,
    context?: Record<string, any>
  ): Promise<{ stream: ReadableStream | null; conversationId: string }> {
    try {
      console.log('Processing query:', query);
      
      // First get relevant documents from ChromaDB
      const chromaResponse = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query })
      });

      if (!chromaResponse.ok) {
        throw new Error('Failed to get relevant documents');
      }

      const chromaData = await chromaResponse.json();
      
      // Then get AI response with context from ChromaDB
      const aiResponse = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          context: {
            ...context,
            relevantDocuments: chromaData.data?.documents || []
          }
        })
      });

      if (!aiResponse.ok) {
        const error = await aiResponse.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(error.error || 'Failed to get response from API');
      }

      if (!aiResponse.body) {
        throw new Error('No response stream received');
      }

      // Create a TransformStream to decode the text chunks
      const textDecoder = new TextDecoderStream();
      const decodedStream = aiResponse.body.pipeThrough(textDecoder);

      return {
        stream: decodedStream,
        conversationId: conversationId || `conv_${Date.now()}`
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  async addDocuments(documents: string[], metadatas?: Record<string, any>[]) {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents, metadatas })
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