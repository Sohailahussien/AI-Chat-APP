/**
 * MCP Guardian Architecture
 * Provides security layers for tool execution and access control
 */

import { securityManager } from '../middleware/security';

export interface GuardianConfig {
  enableToolValidation: boolean;
  enableAccessControl: boolean;
  enableAuditTrail: boolean;
  enableRateLimiting: boolean;
  maxConcurrentRequests: number;
  requestTimeout: number;
  allowedTools: string[];
  adminUsers: string[];
}

export interface GuardianRequest {
  id: string;
  userId: string;
  tool: string;
  input: any;
  timestamp: Date;
  ip: string;
  userAgent: string;
  sessionId: string;
}

export interface GuardianResponse {
  success: boolean;
  data?: any;
  error?: string;
  auditId: string;
  executionTime: number;
  securityChecks: SecurityCheck[];
}

export interface SecurityCheck {
  name: string;
  passed: boolean;
  details?: string;
  timestamp: Date;
}

export class MCPGuardian {
  private config: GuardianConfig;
  private activeRequests: Map<string, GuardianRequest> = new Map();
  private requestQueue: GuardianRequest[] = [];
  private securityChecks: SecurityCheck[] = [];

  constructor(config: GuardianConfig) {
    this.config = config;
  }

  // Main guardian method
  async processRequest(
    userId: string,
    tool: string,
    input: any,
    ip: string,
    userAgent: string,
    sessionId: string
  ): Promise<GuardianResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const request: GuardianRequest = {
      id: requestId,
      userId,
      tool,
      input,
      timestamp: new Date(),
      ip,
      userAgent,
      sessionId,
    };

    console.log(`🛡️ Guardian processing request: ${requestId} for tool: ${tool}`);

    try {
      // Step 1: Rate Limiting
      const rateLimitCheck = await this.checkRateLimit(userId, ip);
      if (!rateLimitCheck.passed) {
        return this.createErrorResponse(
          requestId,
          'Rate limit exceeded',
          [rateLimitCheck],
          startTime
        );
      }

      // Step 2: Access Control
      const accessControlCheck = await this.checkAccessControl(userId, tool);
      if (!accessControlCheck.passed) {
        return this.createErrorResponse(
          requestId,
          'Access denied',
          [accessControlCheck],
          startTime
        );
      }

      // Step 3: Tool Validation
      const toolValidationCheck = await this.validateTool(tool, input);
      if (!toolValidationCheck.passed) {
        return this.createErrorResponse(
          requestId,
          'Tool validation failed',
          [toolValidationCheck],
          startTime
        );
      }

      // Step 4: Concurrency Control
      const concurrencyCheck = await this.checkConcurrency(userId);
      if (!concurrencyCheck.passed) {
        return this.createErrorResponse(
          requestId,
          'Too many concurrent requests',
          [concurrencyCheck],
          startTime
        );
      }

      // Step 5: Execute Tool
      const executionResult = await this.executeTool(request);
      
      // Step 6: Audit Logging
      await this.logAudit(request, executionResult, [
        rateLimitCheck,
        accessControlCheck,
        toolValidationCheck,
        concurrencyCheck,
      ]);

      return {
        success: executionResult.success,
        data: executionResult.data,
        error: executionResult.error,
        auditId: requestId,
        executionTime: Date.now() - startTime,
        securityChecks: [
          rateLimitCheck,
          accessControlCheck,
          toolValidationCheck,
          concurrencyCheck,
        ],
      };
    } catch (error) {
      console.error(`❌ Guardian error for request ${requestId}:`, error);
      
      const errorCheck: SecurityCheck = {
        name: 'execution_error',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };

      return this.createErrorResponse(
        requestId,
        'Guardian execution error',
        [errorCheck],
        startTime
      );
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  // Rate Limiting
  private async checkRateLimit(userId: string, ip: string): Promise<SecurityCheck> {
    const key = `rate_limit_${userId}_${ip}`;
    const now = Date.now();
    const current = this.getRateLimitData(key);

    if (!current || now > current.resetTime) {
      this.setRateLimitData(key, { count: 1, resetTime: now + 60000 });
      return {
        name: 'rate_limit',
        passed: true,
        timestamp: new Date(),
      };
    }

    if (current.count >= this.config.maxConcurrentRequests) {
      return {
        name: 'rate_limit',
        passed: false,
        details: 'Rate limit exceeded',
        timestamp: new Date(),
      };
    }

    current.count++;
    this.setRateLimitData(key, current);

    return {
      name: 'rate_limit',
      passed: true,
      timestamp: new Date(),
    };
  }

  // Access Control
  private async checkAccessControl(userId: string, tool: string): Promise<SecurityCheck> {
    // Check if user is admin
    if (this.config.adminUsers.includes(userId)) {
      return {
        name: 'access_control',
        passed: true,
        details: 'Admin user',
        timestamp: new Date(),
      };
    }

    // Check if tool is allowed
    if (!this.config.allowedTools.includes(tool)) {
      return {
        name: 'access_control',
        passed: false,
        details: `Tool '${tool}' not allowed`,
        timestamp: new Date(),
      };
    }

    // Check user permissions
    const hasPermission = await securityManager.checkPermission(userId, tool, 'execute');
    
    return {
      name: 'access_control',
      passed: hasPermission,
      details: hasPermission ? 'Permission granted' : 'Permission denied',
      timestamp: new Date(),
    };
  }

  // Tool Validation
  private async validateTool(tool: string, input: any): Promise<SecurityCheck> {
    const validation = await securityManager.validateTool(tool, input);
    
    return {
      name: 'tool_validation',
      passed: validation.valid,
      details: validation.reason,
      timestamp: new Date(),
    };
  }

  // Concurrency Control
  private async checkConcurrency(userId: string): Promise<SecurityCheck> {
    const userRequests = Array.from(this.activeRequests.values())
      .filter(req => req.userId === userId);

    if (userRequests.length >= this.config.maxConcurrentRequests) {
      return {
        name: 'concurrency_control',
        passed: false,
        details: `User has ${userRequests.length} active requests`,
        timestamp: new Date(),
      };
    }

    return {
      name: 'concurrency_control',
      passed: true,
      details: `User has ${userRequests.length} active requests`,
      timestamp: new Date(),
    };
  }

  // Tool Execution
  private async executeTool(request: GuardianRequest): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Add request to active requests
      this.activeRequests.set(request.id, request);

      // Execute the tool via MCP
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': request.id,
          'X-User-ID': request.userId,
        },
        body: JSON.stringify({
          type: 'tool',
          tool: request.tool,
          input: request.input,
          guardian: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Audit Logging
  private async logAudit(
    request: GuardianRequest,
    result: { success: boolean; data?: any; error?: string },
    securityChecks: SecurityCheck[]
  ): Promise<void> {
    const auditData = {
      requestId: request.id,
      userId: request.userId,
      tool: request.tool,
      input: JSON.stringify(request.input),
      ip: request.ip,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
      success: result.success,
      error: result.error,
      securityChecks: securityChecks.map(check => ({
        name: check.name,
        passed: check.passed,
        details: check.details,
      })),
    };

    securityManager.logAudit(
      'guardian_request',
      auditData,
      request.userId,
      request.id,
      request.ip,
      request.userAgent,
      result.success,
      result.error
    );
  }

  // Error Response Helper
  private createErrorResponse(
    requestId: string,
    error: string,
    securityChecks: SecurityCheck[],
    startTime: number
  ): GuardianResponse {
    return {
      success: false,
      error,
      auditId: requestId,
      executionTime: Date.now() - startTime,
      securityChecks,
    };
  }

  // Utility Methods
  private generateRequestId(): string {
    return `guardian_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRateLimitData(key: string): { count: number; resetTime: number } | undefined {
    // In production, use Redis or similar for distributed rate limiting
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : undefined;
  }

  private setRateLimitData(key: string, data: { count: number; resetTime: number }): void {
    // In production, use Redis or similar for distributed rate limiting
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Configuration Management
  updateConfig(newConfig: Partial<GuardianConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): GuardianConfig {
    return { ...this.config };
  }

  // Monitoring
  getActiveRequests(): GuardianRequest[] {
    return Array.from(this.activeRequests.values());
  }

  getSecurityChecks(): SecurityCheck[] {
    return [...this.securityChecks];
  }

  clearSecurityChecks(): void {
    this.securityChecks = [];
  }
}

// Default guardian configuration
export const defaultGuardianConfig: GuardianConfig = {
  enableToolValidation: true,
  enableAccessControl: true,
  enableAuditTrail: true,
  enableRateLimiting: true,
  maxConcurrentRequests: 5,
  requestTimeout: 30000,
  allowedTools: [
    'document_processor',
    'vector_search',
    'llm_generator',
    'data_analyzer',
    'content_generator',
  ],
  adminUsers: ['admin@cubi.ai'],
};

// Global guardian instance
export const mcpGuardian = new MCPGuardian(defaultGuardianConfig); 