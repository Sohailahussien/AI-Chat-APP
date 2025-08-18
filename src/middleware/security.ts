/**
 * Security Middleware
 * Protects against tool poisoning, enforces permissions, and implements audit trails
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export interface SecurityConfig {
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
  enablePermissionGating: boolean;
  enableToolValidation: boolean;
  maxRequestsPerMinute: number;
  allowedOrigins: string[];
  allowedTools: string[];
  adminUsers: string[];
}

export interface AuditLog {
  timestamp: Date;
  requestId: string;
  userId: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

export interface Permission {
  userId: string;
  resource: string;
  action: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export class SecurityManager {
  private config: SecurityConfig;
  private auditLogs: AuditLog[] = [];
  private permissions: Permission[] = [];
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private toolValidationCache: Map<string, { valid: boolean; timestamp: number }> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // Rate Limiting
  async checkRateLimit(ip: string): Promise<boolean> {
    if (!this.config.enableRateLimiting) return true;

    const now = Date.now();
    const key = `rate_limit_${ip}`;
    const current = this.rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      });
      return true;
    }

    if (current.count >= this.config.maxRequestsPerMinute) {
      return false;
    }

    current.count++;
    return true;
  }

  // CORS Validation
  validateCORS(origin: string): boolean {
    return this.config.allowedOrigins.includes(origin) || 
           this.config.allowedOrigins.includes('*');
  }

  // Tool Validation (Anti-Poisoning)
  async validateTool(toolName: string, input: any): Promise<{
    valid: boolean;
    reason?: string;
    sanitizedInput?: any;
  }> {
    if (!this.config.enableToolValidation) {
      return { valid: true, sanitizedInput: input };
    }

    // Check cache first
    const cacheKey = `${toolName}_${JSON.stringify(input)}`;
    const cached = this.toolValidationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return { valid: cached.valid };
    }

    // Validate tool name
    if (!this.config.allowedTools.includes(toolName)) {
      this.logAudit('tool_validation_failed', {
        toolName,
        reason: 'Tool not in allowed list',
        input: JSON.stringify(input),
      });
      return { valid: false, reason: 'Tool not allowed' };
    }

    // Sanitize input
    const sanitizedInput = this.sanitizeInput(input);
    
    // Check for malicious patterns
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
    ];

    const inputStr = JSON.stringify(sanitizedInput);
    for (const pattern of maliciousPatterns) {
      if (pattern.test(inputStr)) {
        this.logAudit('tool_validation_failed', {
          toolName,
          reason: 'Malicious pattern detected',
          pattern: pattern.source,
          input: inputStr,
        });
        return { valid: false, reason: 'Malicious input detected' };
      }
    }

    // Validate input schema for specific tools
    const schemaValidation = this.validateToolSchema(toolName, sanitizedInput);
    if (!schemaValidation.valid) {
      this.logAudit('tool_validation_failed', {
        toolName,
        reason: 'Schema validation failed',
        details: schemaValidation.reason,
      });
      return schemaValidation;
    }

    // Cache result
    this.toolValidationCache.set(cacheKey, {
      valid: true,
      timestamp: Date.now(),
    });

    return { valid: true, sanitizedInput };
  }

  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .trim();
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = Array.isArray(input) ? [] : {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  private validateToolSchema(toolName: string, input: any): {
    valid: boolean;
    reason?: string;
  } {
    // Define schemas for different tools
    const schemas: Record<string, (input: any) => { valid: boolean; reason?: string }> = {
      'document_processor': (input) => {
        if (!input.content && !input.file) {
          return { valid: false, reason: 'Missing content or file' };
        }
        return { valid: true };
      },
      'vector_search': (input) => {
        if (!input.query || typeof input.query !== 'string') {
          return { valid: false, reason: 'Invalid query parameter' };
        }
        return { valid: true };
      },
      'llm_generator': (input) => {
        if (!input.prompt || typeof input.prompt !== 'string') {
          return { valid: false, reason: 'Invalid prompt parameter' };
        }
        return { valid: true };
      },
    };

    const validator = schemas[toolName];
    if (!validator) {
      return { valid: true }; // No schema defined, assume valid
    }

    return validator(input);
  }

  // Permission Gating
  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    if (!this.config.enablePermissionGating) return true;

    // Check if user is admin
    if (this.config.adminUsers.includes(userId)) {
      return true;
    }

    // Check explicit permissions
    const permission = this.permissions.find(p => 
      p.userId === userId &&
      p.resource === resource &&
      p.action === action &&
      (!p.expiresAt || p.expiresAt > new Date())
    );

    return !!permission;
  }

  async grantPermission(
    userId: string,
    resource: string,
    action: string,
    expiresAt?: Date
  ): Promise<void> {
    const permission: Permission = {
      userId,
      resource,
      action,
      grantedAt: new Date(),
      expiresAt,
    };

    this.permissions.push(permission);
    this.logAudit('permission_granted', { userId, resource, action, expiresAt });
  }

  async revokePermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<void> {
    this.permissions = this.permissions.filter(p => 
      !(p.userId === userId && p.resource === resource && p.action === action)
    );
    this.logAudit('permission_revoked', { userId, resource, action });
  }

  // Audit Logging
  logAudit(
    action: string,
    metadata: Record<string, any> = {},
    userId?: string,
    requestId?: string,
    ip?: string,
    userAgent?: string,
    success: boolean = true,
    error?: string
  ): void {
    if (!this.config.enableAuditLogging) return;

    const auditLog: AuditLog = {
      timestamp: new Date(),
      requestId: requestId || this.generateRequestId(),
      userId: userId || 'anonymous',
      action,
      resource: metadata.resource || 'unknown',
      ip: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      success,
      error,
      metadata,
    };

    this.auditLogs.push(auditLog);
    console.log(`🔒 AUDIT: ${action} - ${userId || 'anonymous'} - ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  getAuditLogs(
    filters?: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return logs;
  }

  // Request ID Generation
  private generateRequestId(): string {
    return `req_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  // Security Headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  // Input Validation
  validateInput(input: any, schema: any): {
    valid: boolean;
    errors?: string[];
    sanitized?: any;
  } {
    const errors: string[] = [];
    const sanitized = this.sanitizeInput(input);

    // Basic type validation
    if (schema.type && typeof sanitized !== schema.type) {
      errors.push(`Expected ${schema.type}, got ${typeof sanitized}`);
    }

    // Required field validation
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in sanitized)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Pattern validation
    if (schema.pattern && typeof sanitized === 'string') {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(sanitized)) {
        errors.push(`Input does not match pattern: ${schema.pattern}`);
      }
    }

    // Length validation
    if (schema.minLength && typeof sanitized === 'string' && sanitized.length < schema.minLength) {
      errors.push(`Input too short, minimum ${schema.minLength} characters`);
    }

    if (schema.maxLength && typeof sanitized === 'string' && sanitized.length > schema.maxLength) {
      errors.push(`Input too long, maximum ${schema.maxLength} characters`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      sanitized: errors.length === 0 ? sanitized : undefined,
    };
  }

  // Configuration Management
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  enableRateLimiting: true,
  enableAuditLogging: true,
  enablePermissionGating: true,
  enableToolValidation: true,
  maxRequestsPerMinute: 100,
  allowedOrigins: ['http://localhost:3000', 'https://your-domain.vercel.app'],
  allowedTools: [
    'document_processor',
    'vector_search',
    'llm_generator',
    'data_analyzer',
    'content_generator',
  ],
  adminUsers: ['admin@cubi.ai'],
};

// Global security manager instance
export const securityManager = new SecurityManager(defaultSecurityConfig); 