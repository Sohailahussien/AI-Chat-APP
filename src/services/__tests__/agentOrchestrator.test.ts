import { AgentOrchestrator, AgentChain, AgentStep, WorkflowConfig, ExecutionResult } from '../agentOrchestrator';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  describe('Chain Management', () => {
    it('should create a new agent chain', () => {
      const chainConfig: Omit<AgentChain, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Chain',
        description: 'A test chain for orchestration',
        steps: [],
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 3,
        },
      };

      const chain = orchestrator.createChain(chainConfig);

      expect(chain.id).toMatch(/^chain_\d+_[a-z0-9]+$/);
      expect(chain.name).toBe('Test Chain');
      expect(chain.description).toBe('A test chain for orchestration');
      expect(chain.createdAt).toBeInstanceOf(Date);
      expect(chain.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve a chain by ID', () => {
      const chainConfig: Omit<AgentChain, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Chain',
        description: 'A test chain',
        steps: [],
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 3,
        },
      };

      const createdChain = orchestrator.createChain(chainConfig);
      const retrievedChain = orchestrator.getChain(createdChain.id);

      expect(retrievedChain).toEqual(createdChain);
    });

    it('should list all chains', () => {
      const chain1 = orchestrator.createChain({
        name: 'Chain 1',
        description: 'First chain',
        steps: [],
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 3,
        },
      });

      const chain2 = orchestrator.createChain({
        name: 'Chain 2',
        description: 'Second chain',
        steps: [],
        workflow: {
          parallelExecution: true,
          errorHandling: 'continue',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 3,
        },
      });

      const chains = orchestrator.listChains();

      expect(chains).toHaveLength(2);
      expect(chains).toContain(chain1);
      expect(chains).toContain(chain2);
    });

    it('should update a chain', () => {
      const chain = orchestrator.createChain({
        name: 'Original Name',
        description: 'Original description',
        steps: [],
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 3,
        },
      });

      const success = orchestrator.updateChain(chain.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(success).toBe(true);

      const updatedChain = orchestrator.getChain(chain.id);
      expect(updatedChain?.name).toBe('Updated Name');
      expect(updatedChain?.description).toBe('Updated description');
      expect(updatedChain?.updatedAt.getTime()).toBeGreaterThan(chain.updatedAt.getTime());
    });

    it('should delete a chain', () => {
      const chain = orchestrator.createChain({
        name: 'Test Chain',
        description: 'A test chain',
        steps: [],
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 3,
        },
      });

      const success = orchestrator.deleteChain(chain.id);

      expect(success).toBe(true);
      expect(orchestrator.getChain(chain.id)).toBeUndefined();
      expect(orchestrator.listChains()).toHaveLength(0);
    });
  });

  describe('Chain Execution', () => {
    it('should execute a simple sequential chain', async () => {
      const step1: AgentStep = {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Process the input: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'First step',
      };

      const step2: AgentStep = {
        id: 'step2',
        agentType: 'tool',
        config: {
          tools: ['documentProcessor'],
          prompt: 'Use the result from step1: {step1}',
        },
        dependencies: ['step1'],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Second step',
      };

      const workflow: WorkflowConfig = {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 30000,
        maxConcurrency: 3,
      };

      const chain = orchestrator.createChain({
        name: 'Test Execution Chain',
        description: 'A chain for testing execution',
        steps: [step1, step2],
        workflow,
      });

      const result = await orchestrator.executeChain(chain.id, 'test input');

      expect(result.success).toBe(true);
      expect(result.executionId).toMatch(/^exec_\d+_[a-z0-9]+$/);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.results.size).toBe(2);
      expect(result.errors.size).toBe(0);
    });

    it('should execute a parallel chain', async () => {
      const step1: AgentStep = {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Process input: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Independent step 1',
      };

      const step2: AgentStep = {
        id: 'step2',
        agentType: 'tool',
        config: {
          tools: ['documentProcessor'],
          prompt: 'Process input: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Independent step 2',
      };

      const step3: AgentStep = {
        id: 'step3',
        agentType: 'decision',
        config: {
          prompt: 'Combine results from {step1} and {step2}',
        },
        dependencies: ['step1', 'step2'],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Combining step',
      };

      const workflow: WorkflowConfig = {
        parallelExecution: true,
        errorHandling: 'continue',
        auditTrail: true,
        timeout: 30000,
        maxConcurrency: 3,
      };

      const chain = orchestrator.createChain({
        name: 'Parallel Test Chain',
        description: 'A chain for testing parallel execution',
        steps: [step1, step2, step3],
        workflow,
      });

      const result = await orchestrator.executeChain(chain.id, 'test input');

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(3);
      expect(result.errors.size).toBe(0);
    });

    it('should handle execution errors gracefully', async () => {
      const step1: AgentStep = {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'This will fail: {input}',
        },
        dependencies: [],
        timeout: 1000, // Short timeout to force failure
        retryPolicy: { maxRetries: 0, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Failing step',
      };

      const workflow: WorkflowConfig = {
        parallelExecution: false,
        errorHandling: 'continue',
        auditTrail: true,
        timeout: 30000,
        maxConcurrency: 3,
      };

      const chain = orchestrator.createChain({
        name: 'Error Test Chain',
        description: 'A chain for testing error handling',
        steps: [step1],
        workflow,
      });

      const result = await orchestrator.executeChain(chain.id, 'test input');

      expect(result.success).toBe(false);
      expect(result.errors.size).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should validate step dependencies', async () => {
      const step1: AgentStep = {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Process input: {input}',
        },
        dependencies: ['nonexistent'],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Step with invalid dependency',
      };

      const workflow: WorkflowConfig = {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 30000,
        maxConcurrency: 3,
      };

      const chain = orchestrator.createChain({
        name: 'Dependency Test Chain',
        description: 'A chain for testing dependency validation',
        steps: [step1],
        workflow,
      });

      await expect(orchestrator.executeChain(chain.id, 'test input'))
        .rejects.toThrow('Step step1 depends on non-existent step: nonexistent');
    });
  });

  describe('Audit Trail', () => {
    it('should maintain audit trail for executions', async () => {
      const step1: AgentStep = {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Process input: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Audit test step',
      };

      const workflow: WorkflowConfig = {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 30000,
        maxConcurrency: 3,
      };

      const chain = orchestrator.createChain({
        name: 'Audit Test Chain',
        description: 'A chain for testing audit trail',
        steps: [step1],
        workflow,
      });

      const result = await orchestrator.executeChain(chain.id, 'test input');
      const auditTrail = orchestrator.getAuditTrail(result.executionId);

      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].executionId).toBe(result.executionId);
      expect(auditTrail[0].stepId).toBe('step1');
      expect(auditTrail[0].action).toBe('execute');
      expect(auditTrail[0].timestamp).toBeInstanceOf(Date);
      expect(auditTrail[0].duration).toBeGreaterThan(0);
    });

    it('should clear audit log', () => {
      const initialAuditTrail = orchestrator.getAuditTrail();
      orchestrator.clearAuditLog();
      const clearedAuditTrail = orchestrator.getAuditTrail();

      expect(clearedAuditTrail).toHaveLength(0);
    });
  });

  describe('Execution Status', () => {
    it('should track execution status', async () => {
      const step1: AgentStep = {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Process input: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Status test step',
      };

      const workflow: WorkflowConfig = {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 30000,
        maxConcurrency: 3,
      };

      const chain = orchestrator.createChain({
        name: 'Status Test Chain',
        description: 'A chain for testing execution status',
        steps: [step1],
        workflow,
      });

      const result = await orchestrator.executeChain(chain.id, 'test input');
      const status = orchestrator.getExecutionStatus(result.executionId);

      expect(status).toBeDefined();
      expect(status?.executionId).toBe(result.executionId);
      expect(status?.chainId).toBe(chain.id);
      expect(status?.startTime).toBeInstanceOf(Date);
      expect(status?.endTime).toBeInstanceOf(Date);
    });
  });
}); 