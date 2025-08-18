import { ToolSchemas, ToolNames } from '../schemas/tools';

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/mcp') {
    this.baseUrl = baseUrl;
  }

  private async handleResponse(response: Response | undefined) {
    if (!response || !response.ok) {
      const data = await response?.json().catch(() => ({ error: 'Invalid response' }));
      throw new Error(data?.error || data?.message || 'Request failed');
    }

    const data = await response.json();
    return data;
  }

  private async callTool<T>(toolName: string, params: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool: toolName, params }),
    });

    return this.handleResponse(response);
  }

  async processDocument(file: File, instructions?: any) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (instructions) {
        formData.append('instructions', JSON.stringify(instructions));
      }

      const response = await fetch(`${this.baseUrl}/processDocument`, {
        method: 'POST',
        body: formData,
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('MCP processDocument failed, falling back to traditional API:', error);
      
      // Fallback to traditional API
      try {
        const formData = new FormData();
        formData.append('files', file);
        if (instructions) {
          formData.append('instructions', JSON.stringify(instructions));
        }

        const response = await fetch('/api/chat/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          fileName: file.name,
          ...data.results?.[0]
        };
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        return {
          success: false,
          fileName: file.name,
          error: 'Both MCP and fallback API failed'
        };
      }
    }
  }

  async addDocument(content: string, metadata: any) {
    return this.callTool('addDocument', { content, metadata });
  }

  async queryDocuments(query: string, limit?: number) {
    try {
      return await this.callTool('queryDocuments', { query, limit });
    } catch (error) {
      console.error('MCP queryDocuments failed, falling back to traditional API:', error);
      
      // Fallback to traditional API
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: query }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          documents: data.data?.documents || [],
          metadatas: data.data?.metadatas || [],
          distances: data.data?.distances || []
        };
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        return {
          success: false,
          documents: [],
          metadatas: [],
          distances: [],
          error: 'Both MCP and fallback API failed'
        };
      }
    }
  }

  // New method for handling chat queries
  async processQuery(query: string): Promise<{ stream: ReadableStream | null }> {
    try {
      // First get relevant documents using MCP queryDocuments tool
      const queryResult = await this.queryDocuments(query, 5) as {
        success: boolean;
        documents: string[];
        metadatas: any[];
        distances: number[];
        error?: string;
      };
      
      // Then create a streaming response using the documents
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let response = "";
            
            if (queryResult.documents && queryResult.documents.length > 0) {
              // Create a response using the relevant documents
              response = queryResult.documents.join("\n\n").trim();
              
              // Add a concluding question
              if (!response.toLowerCase().includes('error')) {
                response += "\n\nDoes this help answer your question?";
              }
            } else {
              response = "I don't have any relevant information to answer your question. Please try asking something else or upload more documents.";
            }

            // Stream the response chunk by chunk
            const chunks = response.split(' ');
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk + ' '));
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            controller.close();
          } catch (error) {
            console.error('Error in streaming response:', error);
            controller.enqueue(encoder.encode('Sorry, I encountered an error. Please try again.'));
            controller.close();
          }
        }
      });

      return { stream };
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Return a fallback stream with error message
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Sorry, I encountered an error. Please try again.'));
          controller.close();
        }
      });
      
      return { stream: errorStream };
    }
  }

  // Task management tools
  async addTask(params: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }) {
    return this.callTool('addTask', params);
  }

  async updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    return this.callTool('updateTaskStatus', { taskId, status });
  }

  // Database access
  async databaseAccess(
    operation: 'query' | 'add' | 'delete' | 'update',
    data: any,
    options?: {
      collection?: string;
      filter?: Record<string, any>;
    }
  ) {
    return this.callTool('databaseAccess', { operation, data, options });
  }
} 