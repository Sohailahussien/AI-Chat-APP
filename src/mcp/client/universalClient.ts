import { ToolSchemas, ToolNames } from '../schemas/tools';

export interface MCPServerConfig {
  type: 'postgresql' | 'chromadb' | 'hybrid';
  baseUrl?: string;
  postgresql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export interface MCPMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface MCPContext {
  messages: MCPMessage[];
  maxTokens: number;
  currentTokens: number;
  systemPrompt: string;
}

export class TokenBudgetManager {
  private maxContextTokens: number = 8000; // Conservative limit
  private systemPromptTokens: number = 500;
  private reservedTokens: number = 1000; // For response generation
  
  constructor(maxTokens: number = 8000) {
    this.maxContextTokens = maxTokens;
  }
  
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
  
  calculateContextUsage(messages: MCPMessage[]): number {
    return messages.reduce((total, msg) => total + (msg.tokens || this.estimateTokens(msg.content)), 0);
  }
  
  canAddMessage(message: MCPMessage, currentContext: MCPContext): boolean {
    const messageTokens = message.tokens || this.estimateTokens(message.content);
    const totalTokens = currentContext.currentTokens + messageTokens + this.reservedTokens;
    return totalTokens <= this.maxContextTokens;
  }
  
  truncateContext(context: MCPContext): MCPContext {
    const truncated = { ...context };
    truncated.messages = truncated.messages.slice(-2); // Keep only last 2 messages
    truncated.currentTokens = this.calculateContextUsage(truncated.messages);
    return truncated;
  }
}

export class PromptOptimizer {
  private tokenBudgetManager: TokenBudgetManager;
  
  constructor(maxTokens: number = 8000) {
    this.tokenBudgetManager = new TokenBudgetManager(maxTokens);
  }
  
  createEfficientPrompt(
    query: string,
    context: MCPContext,
    options: {
      includeHistory?: boolean;
      maxHistoryLength?: number;
      includeMetadata?: boolean;
    } = {}
  ): string {
    const {
      includeHistory = true,
      maxHistoryLength = 5,
      includeMetadata = false
    } = options;
    
    let prompt = context.systemPrompt;
    
    if (includeHistory && context.messages.length > 0) {
      const recentMessages = context.messages.slice(-maxHistoryLength);
      const historyText = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      prompt += `\n\nConversation History:\n${historyText}\n\nCurrent Query: ${query}`;
    } else {
      prompt += `\n\nQuery: ${query}`;
    }
    
    // Add metadata if requested and available
    if (includeMetadata && context.messages.length > 0) {
      const lastMessage = context.messages[context.messages.length - 1];
      if (lastMessage.content.includes('metadata')) {
        prompt += `\n\nContext: Use available document metadata for enhanced responses.`;
      }
    }
    
    return prompt;
  }
  
  optimizeForStreaming(prompt: string): string {
    // Remove verbose instructions for streaming responses
    return prompt.replace(/Please provide a detailed response\./g, 'Provide a concise response.');
  }
}

export class UniversalMCPClient {
  private config: MCPServerConfig;
  private baseUrl: string;
  private context: MCPContext;
  private tokenBudgetManager: TokenBudgetManager;
  private promptOptimizer: PromptOptimizer;
  private streamingEnabled: boolean = true;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || '/api/mcp';
    this.tokenBudgetManager = new TokenBudgetManager();
    this.promptOptimizer = new PromptOptimizer();
    this.context = {
      messages: [],
      maxTokens: 8000,
      currentTokens: 0,
      systemPrompt: 'You are a helpful AI assistant with access to document knowledge. Provide accurate, concise responses based on the available information.'
    };
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
      body: JSON.stringify({ 
        tool: toolName, 
        params,
        serverType: this.config.type 
      }),
    });

    return this.handleResponse(response);
  }

  private addMessageToContext(role: 'user' | 'assistant', content: string) {
    const message: MCPMessage = {
      role,
      content,
      timestamp: Date.now(),
      tokens: this.tokenBudgetManager.estimateTokens(content)
    };
    
    // Check if we can add this message to context
    if (this.tokenBudgetManager.canAddMessage(message, this.context)) {
      this.context.messages.push(message);
      this.context.currentTokens += message.tokens || 0;
    } else {
      // Truncate context to make room
      this.context = this.tokenBudgetManager.truncateContext(this.context);
      this.context.messages.push(message);
      this.context.currentTokens += message.tokens || 0;
    }
  }

  async processDocument(file: File, instructions?: any) {
    try {
      console.log('UniversalMCPClient: Starting processDocument');
      console.log('UniversalMCPClient: File name:', file.name);
      console.log('UniversalMCPClient: File size:', file.size);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('serverType', this.config.type);
      if (instructions) {
        formData.append('instructions', JSON.stringify(instructions));
      }

      console.log('UniversalMCPClient: Calling MCP endpoint:', `${this.baseUrl}`);
      
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        body: formData,
      });

      console.log('UniversalMCPClient: Response status:', response.status);
      console.log('UniversalMCPClient: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('UniversalMCPClient: Error response:', errorText);
        throw new Error(`MCP request failed with status ${response.status}: ${errorText}`);
      }

      const result = await this.handleResponse(response);
      console.log('UniversalMCPClient: Success result:', result);
      
      // Add to context
      this.addMessageToContext('user', `Uploaded document: ${file.name}`);
      this.addMessageToContext('assistant', `Document processed successfully. ${(result as any).doc_id ? `Document ID: ${(result as any).doc_id}` : ''}`);
      
      return result;
    } catch (error) {
      console.error('UniversalMCPClient: processDocument failed:', error);
      console.log('UniversalMCPClient: Falling back to traditional API');
      return this.fallbackToTraditionalAPI('processDocument', { file, instructions });
    }
  }

  async addDocument(content: string, metadata: any) {
    try {
      const result = await this.callTool('addDocument', { content, metadata });
      
      // Add to context
      this.addMessageToContext('user', `Added document with content: ${content.substring(0, 100)}...`);
      this.addMessageToContext('assistant', 'Document added successfully.');
      
      return result;
    } catch (error) {
      console.error('Universal client addDocument failed:', error);
      return this.fallbackToTraditionalAPI('addDocument', { content, metadata });
    }
  }

  async queryDocuments(query: string, limit?: number) {
    try {
      const result = await this.callTool('queryDocuments', { query, limit });
      
      // Add to context
      this.addMessageToContext('user', `Query: ${query}`);
      this.addMessageToContext('assistant', `Found ${(result as any).documents?.length || 0} relevant documents.`);
      
      return result;
    } catch (error) {
      console.error('Universal client queryDocuments failed:', error);
      return this.fallbackToTraditionalAPI('queryDocuments', { query, limit });
    }
  }

  async processQuery(query: string): Promise<{ stream: ReadableStream | null }> {
    try {
      // Create efficient prompt
      const optimizedPrompt = this.promptOptimizer.createEfficientPrompt(query, this.context, {
        includeHistory: true,
        maxHistoryLength: 3,
        includeMetadata: true
      });

      // Optimize for streaming if enabled
      const finalPrompt = this.streamingEnabled 
        ? this.promptOptimizer.optimizeForStreaming(optimizedPrompt)
        : optimizedPrompt;

      console.log('UniversalMCPClient: Processing query with optimized prompt');
      console.log('UniversalMCPClient: Context tokens used:', this.context.currentTokens);
      console.log('UniversalMCPClient: Streaming enabled:', this.streamingEnabled);

      if (this.streamingEnabled) {
        // Create streaming response
        const stream = new ReadableStream({
          start: async (controller) => {
            try {
              // Enhanced streaming response with external AI
              const response = await fetch('/api/chat/enhanced', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: query,
                  streaming: true,
                  useExternalAI: true
                }),
              });

              if (!response.ok) {
                throw new Error(`Streaming request failed: ${response.status}`);
              }

              const reader = response.body?.getReader();
              if (!reader) {
                throw new Error('No response body available for streaming');
              }

              const decoder = new TextDecoder();
              let buffer = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      controller.close();
                      return;
                    }
                    try {
                      const parsed = JSON.parse(data);
                      controller.enqueue(new TextEncoder().encode(parsed.content || ''));
                    } catch (e) {
                      console.warn('Failed to parse streaming data:', data);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          }
        });

        // Add to context
        this.addMessageToContext('user', query);

        return { stream };
      } else {
        // Non-streaming fallback
        const response = await fetch('/api/chat/enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
            streaming: false,
            useExternalAI: true
          }),
        });

        const result = await response.json();
        
        // Add to context
        this.addMessageToContext('user', query);
        this.addMessageToContext('assistant', result.response || 'No response received');

        return { stream: null };
      }
    } catch (error) {
      console.error('UniversalMCPClient: processQuery failed:', error);
      return { stream: null };
    }
  }

  async processQueryWithBudget(query: string, maxTokens: number = 1000): Promise<string> {
    try {
      // Check token budget
      const queryTokens = this.tokenBudgetManager.estimateTokens(query);
      const availableTokens = this.context.maxTokens - this.context.currentTokens - 1000; // Hardcoded reserved tokens

      if (queryTokens > availableTokens) {
        // Truncate context to make room
        this.context = this.tokenBudgetManager.truncateContext(this.context);
        console.log('UniversalMCPClient: Context truncated due to token budget constraints');
      }

      // Create efficient prompt with token awareness
      const optimizedPrompt = this.promptOptimizer.createEfficientPrompt(query, this.context, {
        includeHistory: availableTokens > 2000, // Only include history if we have enough tokens
        maxHistoryLength: Math.min(3, Math.floor(availableTokens / 500)), // Adjust history length based on available tokens
        includeMetadata: false // Disable metadata for token efficiency
      });

      console.log('UniversalMCPClient: Processing query with token budget');
      console.log('UniversalMCPClient: Query tokens:', queryTokens);
      console.log('UniversalMCPClient: Available tokens:', availableTokens);
      console.log('UniversalMCPClient: Context tokens:', this.context.currentTokens);

      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          streaming: false,
          useExternalAI: true,
          maxTokens
        }),
      });

      const result = await response.json();
      
      // Add to context with token tracking
      this.addMessageToContext('user', query);
      this.addMessageToContext('assistant', result.response || 'No response received');

      return result.response || 'No response received';
    } catch (error) {
      console.error('UniversalMCPClient: processQueryWithBudget failed:', error);
      return 'Error processing query';
    }
  }

  getContextStats(): {
    messageCount: number;
    currentTokens: number;
    maxTokens: number;
    tokenUsage: number;
    contextEfficiency: number;
  } {
    const tokenUsage = (this.context.currentTokens / this.context.maxTokens) * 100;
    const contextEfficiency = this.context.messages.length > 0 
      ? (this.context.currentTokens / this.context.messages.length) 
      : 0;

    return {
      messageCount: this.context.messages.length,
      currentTokens: this.context.currentTokens,
      maxTokens: this.context.maxTokens,
      tokenUsage,
      contextEfficiency
    };
  }

  clearContext(): void {
    this.context.messages = [];
    this.context.currentTokens = 0;
    console.log('UniversalMCPClient: Context cleared');
  }

  setStreamingEnabled(enabled: boolean): void {
    this.streamingEnabled = enabled;
    console.log('UniversalMCPClient: Streaming', enabled ? 'enabled' : 'disabled');
  }

  setMaxTokens(maxTokens: number): void {
    this.context.maxTokens = maxTokens;
    this.tokenBudgetManager = new TokenBudgetManager(maxTokens);
    this.promptOptimizer = new PromptOptimizer(maxTokens);
    console.log('UniversalMCPClient: Max tokens set to', maxTokens);
  }

  // PostgreSQL-specific methods
  async getDocumentHistory(limit?: number) {
    if (this.config.type === 'postgresql' || this.config.type === 'hybrid') {
      return await this.callTool('getDocumentHistory', { limit });
    }
    throw new Error('Document history only available with PostgreSQL server');
  }

  async searchQueries(query: string, limit?: number) {
    if (this.config.type === 'postgresql' || this.config.type === 'hybrid') {
      return await this.callTool('searchQueries', { query, limit });
    }
    throw new Error('Query search only available with PostgreSQL server');
  }

  // Fallback to traditional API
  private async fallbackToTraditionalAPI(operation: string, params: any) {
    console.log(`UniversalMCPClient: Falling back to traditional API for ${operation}`);
    
    try {
      let response;
      
      if (operation === 'processDocument') {
        console.log('UniversalMCPClient: Using traditional process API');
        const formData = new FormData();
        formData.append('files', params.file);
        if (params.instructions) {
          formData.append('instructions', JSON.stringify(params.instructions));
        }
        
        response = await fetch('/api/chat/process', {
          method: 'POST',
          body: formData,
        });
      } else if (operation === 'queryDocuments') {
        console.log('UniversalMCPClient: Using traditional query API');
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: params.query }),
        });
      } else {
        throw new Error(`Unknown fallback operation: ${operation}`);
      }

      console.log('UniversalMCPClient: Traditional API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('UniversalMCPClient: Traditional API response data:', data);
      
      if (operation === 'queryDocuments') {
        return {
          success: true,
          documents: data.data?.documents || [],
          metadatas: data.data?.metadatas || [],
          distances: data.data?.distances || []
        };
      } else {
        return {
          success: true,
          fileName: params.file.name,
          ...data.results?.[0]
        };
      }
    } catch (error) {
      console.error('UniversalMCPClient: Fallback API also failed:', error);
      return {
        success: false,
        error: 'Both universal client and fallback API failed'
      };
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