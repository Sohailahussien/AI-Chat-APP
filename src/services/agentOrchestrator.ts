/**
 * Agent Chain Orchestrator
 * Manages multi-step agent workflows with MCP integration
 */

import { translationAgent, TranslationRequest, TranslationResponse } from './translationAgent';

export interface AgentStep {
  id: string;
  agentType: 'llm' | 'tool' | 'decision' | 'validation' | 'translation';
  config: AgentConfig;
  dependencies: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
  description: string;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  prompt?: string;
  validationRules?: ValidationRule[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface ValidationRule {
  type: 'format' | 'content' | 'schema' | 'custom';
  rule: string;
  errorMessage: string;
}

export interface AgentChain {
  id: string;
  name: string;
  description: string;
  steps: AgentStep[];
  workflow: WorkflowConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowConfig {
  parallelExecution: boolean;
  errorHandling: 'stop' | 'continue' | 'rollback';
  auditTrail: boolean;
  timeout: number;
  maxConcurrency: number;
}

export interface ExecutionContext {
  chainId: string;
  executionId: string;
  input: any;
  variables: Map<string, any>;
  results: Map<string, any>;
  errors: Map<string, Error>;
  startTime: Date;
  endTime?: Date;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  results: Map<string, any>;
  errors: Map<string, Error>;
  executionTime: number;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: Date;
  executionId: string;
  stepId: string;
  action: string;
  input?: any;
  output?: any;
  error?: Error;
  duration: number;
}

export class AgentOrchestrator {
  private chains: Map<string, AgentChain> = new Map();
  private executions: Map<string, ExecutionContext> = new Map();
  private auditLog: AuditEntry[] = [];

  // Chain Management
  createChain(chain: Omit<AgentChain, 'id' | 'createdAt' | 'updatedAt'>): AgentChain {
    const newChain: AgentChain = {
      ...chain,
      id: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.chains.set(newChain.id, newChain);
    console.log(`🔗 Created agent chain: ${newChain.name} (${newChain.id})`);
    return newChain;
  }

  getChain(chainId: string): AgentChain | undefined {
    return this.chains.get(chainId);
  }

  updateChain(chainId: string, updates: Partial<AgentChain>): boolean {
    const chain = this.chains.get(chainId);
    if (!chain) return false;

    const updatedChain: AgentChain = {
      ...chain,
      ...updates,
      updatedAt: new Date(),
    };

    this.chains.set(chainId, updatedChain);
    console.log(`🔄 Updated agent chain: ${updatedChain.name}`);
    return true;
  }

  deleteChain(chainId: string): boolean {
    const deleted = this.chains.delete(chainId);
    if (deleted) {
      console.log(`🗑️ Deleted agent chain: ${chainId}`);
    }
    return deleted;
  }

  listChains(): AgentChain[] {
    return Array.from(this.chains.values());
  }

  // Execution Management
  async executeChain(
    chainId: string,
    input: any,
    options?: {
      timeout?: number;
      variables?: Map<string, any>;
    }
  ): Promise<ExecutionResult> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context: ExecutionContext = {
      chainId,
      executionId,
      input,
      variables: options?.variables || new Map(),
      results: new Map(),
      errors: new Map(),
      startTime: new Date(),
    };

    this.executions.set(executionId, context);
    console.log(`🚀 Starting execution: ${executionId} for chain: ${chain.name}`);

    try {
      const result = await this.executeSteps(chain, context);
      context.endTime = new Date();
      
      const executionResult: ExecutionResult = {
        success: result.success,
        executionId,
        results: context.results,
        errors: context.errors,
        executionTime: context.endTime.getTime() - context.startTime.getTime(),
        auditTrail: this.auditLog.filter(entry => entry.executionId === executionId),
      };

      console.log(`✅ Execution completed: ${executionId} (${executionResult.executionTime}ms)`);
      return executionResult;
    } catch (error) {
      context.endTime = new Date();
      console.error(`❌ Execution failed: ${executionId}`, error);
      
      return {
        success: false,
        executionId,
        results: context.results,
        errors: context.errors,
        executionTime: context.endTime.getTime() - context.startTime.getTime(),
        auditTrail: this.auditLog.filter(entry => entry.executionId === executionId),
      };
    } finally {
      this.executions.delete(executionId);
    }
  }

  private async executeSteps(chain: AgentChain, context: ExecutionContext): Promise<{ success: boolean }> {
    const { steps, workflow } = chain;
    const executedSteps = new Set<string>();
    const stepResults = new Map<string, any>();

    // Validate step dependencies
    for (const step of steps) {
      for (const dep of step.dependencies) {
        if (!steps.find(s => s.id === dep)) {
          throw new Error(`Step ${step.id} depends on non-existent step: ${dep}`);
        }
      }
    }

    // Execute steps in dependency order
    while (executedSteps.size < steps.length) {
      const readySteps = steps.filter(step => 
        !executedSteps.has(step.id) &&
        step.dependencies.every(dep => executedSteps.has(dep))
      );

      if (readySteps.length === 0) {
        throw new Error('Circular dependency detected in agent chain');
      }

      if (workflow.parallelExecution) {
        // Execute ready steps in parallel
        const promises = readySteps.map(step => this.executeStep(step, context));
        const results = await Promise.allSettled(promises);
        
        for (let i = 0; i < readySteps.length; i++) {
          const step = readySteps[i];
          const result = results[i];
          
          if (result.status === 'fulfilled') {
            executedSteps.add(step.id);
            stepResults.set(step.id, result.value);
            context.results.set(step.id, result.value);
          } else {
            context.errors.set(step.id, result.reason);
            if (workflow.errorHandling === 'stop') {
              throw new Error(`Step ${step.id} failed: ${result.reason}`);
            }
          }
        }
      } else {
        // Execute steps sequentially
        for (const step of readySteps) {
          try {
            const result = await this.executeStep(step, context);
            executedSteps.add(step.id);
            stepResults.set(step.id, result);
            context.results.set(step.id, result);
          } catch (error) {
            context.errors.set(step.id, error as Error);
            if (workflow.errorHandling === 'stop') {
              throw error;
            }
          }
        }
      }
    }

    return { success: context.errors.size === 0 };
  }

  private async executeStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    const startTime = Date.now();
    console.log(`🔧 Executing step: ${step.id} (${step.agentType})`);

    try {
      let result: any;

      switch (step.agentType) {
        case 'llm':
          result = await this.executeLLMStep(step, context);
          break;
        case 'tool':
          result = await this.executeToolStep(step, context);
          break;
        case 'decision':
          result = await this.executeDecisionStep(step, context);
          break;
        case 'validation':
          result = await this.executeValidationStep(step, context);
          break;
        case 'translation':
          result = await this.executeTranslationStep(step, context);
          break;
        default:
          throw new Error(`Unknown agent type: ${step.agentType}`);
      }

      const duration = Date.now() - startTime;
      this.auditLog.push({
        timestamp: new Date(),
        executionId: context.executionId,
        stepId: step.id,
        action: 'execute',
        input: context.input,
        output: result,
        duration,
      });

      console.log(`✅ Step completed: ${step.id} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.auditLog.push({
        timestamp: new Date(),
        executionId: context.executionId,
        stepId: step.id,
        action: 'error',
        input: context.input,
        error: error as Error,
        duration,
      });

      console.error(`❌ Step failed: ${step.id}`, error);
      throw error;
    }
  }

  private async executeLLMStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    // Simulate LLM execution with MCP integration
    const prompt = this.interpolatePrompt(step.config.prompt || '', context);
    
    // Call MCP server for LLM processing
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'llm',
        prompt,
        config: step.config,
        context: context.variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM step failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeToolStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    // Execute MCP tool
    const toolName = step.config.tools?.[0];
    if (!toolName) {
      throw new Error('No tool specified for tool step');
    }

    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tool',
        tool: toolName,
        input: context.input,
        config: step.config,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tool step failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeDecisionStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    // Implement decision logic based on previous results
    const decisionRules = step.config.validationRules || [];
    const input = context.results.get(step.dependencies[0]) || context.input;

    for (const rule of decisionRules) {
      if (rule.type === 'custom') {
        // Execute custom decision logic
        const decision = this.evaluateDecisionRule(rule.rule, input, context);
        if (!decision) {
          throw new Error(rule.errorMessage);
        }
      }
    }

    return { decision: 'approved', input };
  }

  private async executeValidationStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Executing validation step: ${step.id}`);
      
      const input = context.results.get(step.dependencies[0]) || context.input;
      
      // Apply validation rules
      for (const rule of step.config.validationRules || []) {
        if (!this.validateInput(rule, input)) {
          throw new Error(`Validation failed: ${rule.errorMessage}`);
        }
      }
      
      const duration = Date.now() - startTime;
      this.auditLog.push({
        timestamp: new Date(),
        executionId: context.executionId,
        stepId: step.id,
        action: 'validation',
        input,
        duration
      });
      
      return { validated: true, input };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.auditLog.push({
        timestamp: new Date(),
        executionId: context.executionId,
        stepId: step.id,
        action: 'validation',
        error: error as Error,
        duration
      });
      throw error;
    }
  }

  private async executeTranslationStep(step: AgentStep, context: ExecutionContext): Promise<any> {
    const startTime = Date.now();
    
    try {
      console.log(`🌐 Executing translation step: ${step.id}`);
      
      // Get input content from dependencies or context
      const input = context.results.get(step.dependencies[0]) || context.input;
      
      // Extract translation parameters from step config
      const targetLanguage = step.config.prompt?.match(/translate.*?to\s+(\w+)/i)?.[1] || 'spanish';
      const preserveFormatting = step.config.tools?.includes('preserve_formatting') || false;
      
      // Create translation request
      const translationRequest: TranslationRequest = {
        content: typeof input === 'string' ? input : JSON.stringify(input),
        targetLanguage,
        preserveFormatting,
        context: step.config.prompt
      };
      
      // Execute translation
      const translationResult = await translationAgent.translate(translationRequest);
      
      const duration = Date.now() - startTime;
      this.auditLog.push({
        timestamp: new Date(),
        executionId: context.executionId,
        stepId: step.id,
        action: 'translation',
        input: translationRequest,
        output: translationResult,
        duration
      });
      
      return translationResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.auditLog.push({
        timestamp: new Date(),
        executionId: context.executionId,
        stepId: step.id,
        action: 'translation',
        error: error as Error,
        duration
      });
      throw error;
    }
  }

  private interpolatePrompt(prompt: string, context: ExecutionContext): string {
    let interpolated = prompt;
    
    // Replace variables in prompt
    for (const [key, value] of context.variables) {
      interpolated = interpolated.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }

    // Replace previous step results
    for (const [stepId, result] of context.results) {
      interpolated = interpolated.replace(new RegExp(`\\{${stepId}\\}`, 'g'), JSON.stringify(result));
    }

    return interpolated;
  }

  private evaluateDecisionRule(rule: string, input: any, context: ExecutionContext): boolean {
    // Simple rule evaluation - in production, use a proper rule engine
    try {
      // Example: "input.length > 10"
      return eval(rule.replace(/input/g, JSON.stringify(input)));
    } catch (error) {
      console.error('Error evaluating decision rule:', error);
      return false;
    }
  }

  private validateInput(rule: ValidationRule, input: any): boolean {
    switch (rule.type) {
      case 'format':
        return this.validateFormat(rule.rule, input);
      case 'content':
        return this.validateContent(rule.rule, input);
      case 'schema':
        return this.validateSchema(rule.rule, input);
      case 'custom':
        return this.evaluateDecisionRule(rule.rule, input, {} as ExecutionContext);
      default:
        return true;
    }
  }

  private validateFormat(format: string, input: any): boolean {
    // Implement format validation (email, URL, etc.)
    return true;
  }

  private validateContent(content: string, input: any): boolean {
    // Implement content validation
    return true;
  }

  private validateSchema(schema: string, input: any): boolean {
    // Implement schema validation
    return true;
  }

  // Audit and Monitoring
  getAuditTrail(executionId?: string): AuditEntry[] {
    if (executionId) {
      return this.auditLog.filter(entry => entry.executionId === executionId);
    }
    return [...this.auditLog];
  }

  getExecutionStatus(executionId: string): ExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }
}

// Global orchestrator instance
export const agentOrchestrator = new AgentOrchestrator(); 