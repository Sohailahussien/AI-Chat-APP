import { type Message } from 'ai';

export class MCPClientService {
  constructor() {}

  async initialize(): Promise<void> {
    // Any additional initialization if needed
  }

  async streamText(
    input: string,
    context?: Record<string, any>
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const messages: Message[] = [
        ...(context?.conversationHistory || []),
        { role: 'user', content: input }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context: {
            documents: context?.documents || [],
            metadatas: context?.metadatas || [],
            availableTools: context?.availableTools || []
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error('Error streaming text:', error);
      throw error;
    }
  }
} 