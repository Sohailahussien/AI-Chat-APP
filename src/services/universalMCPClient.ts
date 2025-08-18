/**
 * Universal MCP Client
 * Provides a unified interface for MCP (Model Context Protocol) operations
 */

export interface MCPRequest {
  type: 'llm' | 'tool' | 'translation' | 'analysis';
  prompt?: string;
  tool?: string;
  input?: any;
  config?: any;
  context?: Map<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    service: string;
    confidence?: number;
  };
}

export class UniversalMCPClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = '/api/mcp', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Send a request to the MCP server
   */
  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      console.log('🔄 MCP Client: Sending request:', request.type);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ MCP Client: Request successful');
      return {
        success: true,
        data,
        metadata: {
          processingTime: Date.now(),
          service: 'mcp_server'
        }
      };

    } catch (error) {
      console.error('❌ MCP Client: Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now(),
          service: 'mcp_client'
        }
      };
    }
  }

  /**
   * Execute LLM operation
   */
  async executeLLM(prompt: string, config?: any): Promise<MCPResponse> {
    return this.sendRequest({
      type: 'llm',
      prompt,
      config
    });
  }

  /**
   * Execute tool operation
   */
  async executeTool(tool: string, input?: any, config?: any): Promise<MCPResponse> {
    return this.sendRequest({
      type: 'tool',
      tool,
      input,
      config
    });
  }

  /**
   * Execute translation operation
   */
  async executeTranslation(content: string, targetLanguage: string, config?: any): Promise<MCPResponse> {
    return this.sendRequest({
      type: 'translation',
      input: { content, targetLanguage },
      config
    });
  }

  /**
   * Execute analysis operation
   */
  async executeAnalysis(input: any, config?: any): Promise<MCPResponse> {
    return this.sendRequest({
      type: 'analysis',
      input,
      config
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.warn('MCP health check failed:', error);
      return false;
    }
  }

  /**
   * Get available tools
   */
  async getAvailableTools(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tools`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.tools || [];
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to get available tools:', error);
      return [];
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    healthy: boolean;
    availableTools: string[];
    uptime: number;
  }> {
    const healthy = await this.healthCheck();
    const availableTools = await this.getAvailableTools();
    
    return {
      healthy,
      availableTools,
      uptime: Date.now()
    };
  }
}

// Export singleton instance
export const universalMCPClient = new UniversalMCPClient(); 