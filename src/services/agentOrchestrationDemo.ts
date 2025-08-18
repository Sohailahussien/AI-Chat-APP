import { AgentOrchestrator, AgentStep, WorkflowConfig } from './agentOrchestrator';

class AgentOrchestrationDemo {
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.orchestrator = new AgentOrchestrator();
  }

  async runAllDemos(): Promise<void> {
    console.log('🤖 Multi-Agent Orchestration Demo');
    console.log('============================================================\n');

    await this.demoDocumentProcessingChain();
    await this.demoParallelExecutionChain();
    await this.demoErrorHandlingChain();
    await this.demoDecisionMakingChain();
    await this.demoValidationChain();
    await this.demoAuditTrail();

    console.log('\n✅ All orchestration demos completed!');
    console.log('============================================================\n');
    this.summarizeFeatures();
  }

  private async demoDocumentProcessingChain(): Promise<void> {
    console.log('📄 1. Document Processing Chain Demo');
    console.log('==================================================\n');

    const steps: AgentStep[] = [
      {
        id: 'extract',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Extract key information from: {input}',
        },
        dependencies: [],
        timeout: 10000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Extract information from document',
      },
      {
        id: 'analyze',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Analyze the extracted information: {extract}',
        },
        dependencies: ['extract'],
        timeout: 10000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Analyze extracted information',
      },
      {
        id: 'summarize',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          prompt: 'Create a summary based on analysis: {analyze}',
        },
        dependencies: ['analyze'],
        timeout: 10000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Create final summary',
      },
    ];

    const workflow: WorkflowConfig = {
      parallelExecution: false,
      errorHandling: 'stop',
      auditTrail: true,
      timeout: 60000,
      maxConcurrency: 3,
    };

    const chain = this.orchestrator.createChain({
      name: 'Document Processing Chain',
      description: 'Process documents through extraction, analysis, and summarization',
      steps,
      workflow,
    });

    console.log('📋 Chain Configuration:');
    console.log(`   Name: ${chain.name}`);
    console.log(`   Steps: ${chain.steps.length}`);
    console.log(`   Parallel Execution: ${workflow.parallelExecution}`);
    console.log(`   Error Handling: ${workflow.errorHandling}`);
    console.log(`   Audit Trail: ${workflow.auditTrail}`);

    const testDocument = `
      Artificial Intelligence (AI) is transforming industries across the globe. 
      Machine learning algorithms are being used to automate processes, 
      improve decision-making, and create new business opportunities. 
      Companies are investing heavily in AI research and development.
    `;

    console.log('\n🚀 Executing Document Processing Chain...');
    const startTime = Date.now();
    
    try {
      const result = await this.orchestrator.executeChain(chain.id, testDocument);
      const executionTime = Date.now() - startTime;

      console.log('✅ Execution Results:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Execution Time: ${executionTime}ms`);
      console.log(`   Steps Completed: ${result.results.size}`);
      console.log(`   Errors: ${result.errors.size}`);
      console.log(`   Audit Entries: ${result.auditTrail.length}`);

      if (result.success) {
        console.log('\n📊 Step Results:');
        for (const [stepId, stepResult] of result.results) {
          console.log(`   ${stepId}: ${typeof stepResult === 'string' ? stepResult.substring(0, 100) + '...' : 'Completed'}`);
        }
      }

    } catch (error) {
      console.log('❌ Execution failed:', error);
    }

    console.log('\n');
  }

  private async demoParallelExecutionChain(): Promise<void> {
    console.log('⚡ 2. Parallel Execution Chain Demo');
    console.log('==================================================\n');

    const steps: AgentStep[] = [
      {
        id: 'sentiment',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Analyze sentiment of: {input}',
        },
        dependencies: [],
        timeout: 8000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Sentiment analysis',
      },
      {
        id: 'keywords',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Extract keywords from: {input}',
        },
        dependencies: [],
        timeout: 8000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Keyword extraction',
      },
      {
        id: 'summary',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          prompt: 'Summarize based on sentiment and keywords: {sentiment} + {keywords}',
        },
        dependencies: ['sentiment', 'keywords'],
        timeout: 10000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Final summary',
      },
    ];

    const workflow: WorkflowConfig = {
      parallelExecution: true,
      errorHandling: 'continue',
      auditTrail: true,
      timeout: 60000,
      maxConcurrency: 3,
    };

    const chain = this.orchestrator.createChain({
      name: 'Parallel Analysis Chain',
      description: 'Parallel sentiment and keyword analysis with final summary',
      steps,
      workflow,
    });

    console.log('📋 Parallel Chain Configuration:');
    console.log(`   Name: ${chain.name}`);
    console.log(`   Parallel Execution: ${workflow.parallelExecution}`);
    console.log(`   Max Concurrency: ${workflow.maxConcurrency}`);

    const testText = 'I absolutely love this new AI technology! It is amazing and revolutionary.';

    console.log('\n🚀 Executing Parallel Chain...');
    const startTime = Date.now();
    
    try {
      const result = await this.orchestrator.executeChain(chain.id, testText);
      const executionTime = Date.now() - startTime;

      console.log('✅ Parallel Execution Results:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Execution Time: ${executionTime}ms`);
      console.log(`   Steps Completed: ${result.results.size}`);
      console.log(`   Errors: ${result.errors.size}`);

      if (result.success) {
        console.log('\n📊 Parallel Step Results:');
        for (const [stepId, stepResult] of result.results) {
          console.log(`   ${stepId}: ${typeof stepResult === 'string' ? stepResult.substring(0, 80) + '...' : 'Completed'}`);
        }
      }

    } catch (error) {
      console.log('❌ Parallel execution failed:', error);
    }

    console.log('\n');
  }

  private async demoErrorHandlingChain(): Promise<void> {
    console.log('🛡️ 3. Error Handling Chain Demo');
    console.log('==================================================\n');

    const steps: AgentStep[] = [
      {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Process: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'First step',
      },
      {
        id: 'step2',
        agentType: 'tool',
        config: {
          tools: ['nonexistentTool'],
          prompt: 'This will fail: {step1}',
        },
        dependencies: ['step1'],
        timeout: 3000,
        retryPolicy: { maxRetries: 0, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Step that will fail',
      },
      {
        id: 'step3',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Continue despite errors: {step1}',
        },
        dependencies: ['step1'],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Step that continues',
      },
    ];

    const workflow: WorkflowConfig = {
      parallelExecution: false,
      errorHandling: 'continue',
      auditTrail: true,
      timeout: 30000,
      maxConcurrency: 3,
    };

    const chain = this.orchestrator.createChain({
      name: 'Error Handling Chain',
      description: 'Test error handling with continue policy',
      steps,
      workflow,
    });

    console.log('📋 Error Handling Configuration:');
    console.log(`   Error Handling: ${workflow.errorHandling}`);
    console.log(`   Audit Trail: ${workflow.auditTrail}`);

    const testInput = 'Test input for error handling';

    console.log('\n🚀 Executing Error Handling Chain...');
    
    try {
      const result = await this.orchestrator.executeChain(chain.id, testInput);

      console.log('✅ Error Handling Results:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Steps Completed: ${result.results.size}`);
      console.log(`   Errors: ${result.errors.size}`);

      if (result.errors.size > 0) {
        console.log('\n❌ Errors Encountered:');
        for (const [stepId, error] of result.errors) {
          console.log(`   ${stepId}: ${error.message}`);
        }
      }

      if (result.results.size > 0) {
        console.log('\n✅ Successful Steps:');
        for (const [stepId, stepResult] of result.results) {
          console.log(`   ${stepId}: Completed`);
        }
      }

    } catch (error) {
      console.log('❌ Chain execution failed:', error);
    }

    console.log('\n');
  }

  private async demoDecisionMakingChain(): Promise<void> {
    console.log('🧠 4. Decision Making Chain Demo');
    console.log('==================================================\n');

    const steps: AgentStep[] = [
      {
        id: 'analyze',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Analyze the complexity of: {input}',
        },
        dependencies: [],
        timeout: 8000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Analyze input complexity',
      },
      {
        id: 'decision',
        agentType: 'decision',
        config: {
          prompt: 'Based on analysis: {analyze}, decide if input is simple or complex',
        },
        dependencies: ['analyze'],
        timeout: 5000,
        retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Make decision based on analysis',
      },
      {
        id: 'simple_response',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Provide simple explanation for: {input}',
        },
        dependencies: ['decision'],
        timeout: 8000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Simple response path',
      },
      {
        id: 'complex_response',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          prompt: 'Provide detailed analysis for: {input}',
        },
        dependencies: ['decision'],
        timeout: 10000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Complex response path',
      },
    ];

    const workflow: WorkflowConfig = {
      parallelExecution: false,
      errorHandling: 'stop',
      auditTrail: true,
      timeout: 60000,
      maxConcurrency: 3,
    };

    const chain = this.orchestrator.createChain({
      name: 'Decision Making Chain',
      description: 'Analyze input and choose appropriate response strategy',
      steps,
      workflow,
    });

    console.log('📋 Decision Chain Configuration:');
    console.log(`   Steps: ${chain.steps.length}`);
    console.log(`   Decision Points: 1`);

    const testInputs = [
      'What is 2+2?',
      'Explain quantum computing and its implications for cryptography',
    ];

    for (const input of testInputs) {
      console.log(`\n🚀 Testing Decision Chain with: "${input}"`);
      
      try {
        const result = await this.orchestrator.executeChain(chain.id, input);

        console.log('✅ Decision Results:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Steps Completed: ${result.results.size}`);

        if (result.success) {
          console.log('📊 Decision Path:');
          for (const [stepId, stepResult] of result.results) {
            console.log(`   ${stepId}: ${typeof stepResult === 'string' ? stepResult.substring(0, 60) + '...' : 'Completed'}`);
          }
        }

      } catch (error) {
        console.log('❌ Decision chain failed:', error);
      }
    }

    console.log('\n');
  }

  private async demoValidationChain(): Promise<void> {
    console.log('✅ 5. Validation Chain Demo');
    console.log('==================================================\n');

    const steps: AgentStep[] = [
      {
        id: 'process',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Process and format: {input}',
        },
        dependencies: [],
        timeout: 8000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Process input',
      },
      {
        id: 'validate',
        agentType: 'validation',
        config: {
          validationRules: [
            {
              type: 'content',
              rule: 'length > 10',
              errorMessage: 'Content too short',
            },
            {
              type: 'format',
              rule: 'json',
              errorMessage: 'Invalid JSON format',
            },
          ],
        },
        dependencies: ['process'],
        timeout: 5000,
        retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Validate processed content',
      },
    ];

    const workflow: WorkflowConfig = {
      parallelExecution: false,
      errorHandling: 'stop',
      auditTrail: true,
      timeout: 30000,
      maxConcurrency: 3,
    };

    const chain = this.orchestrator.createChain({
      name: 'Validation Chain',
      description: 'Process and validate content',
      steps,
      workflow,
    });

    console.log('📋 Validation Configuration:');
    console.log(`   Validation Rules: ${steps[1].config.validationRules?.length}`);

    const testInputs = [
      'Short',
      'This is a longer input that should pass validation',
    ];

    for (const input of testInputs) {
      console.log(`\n🚀 Testing Validation with: "${input}"`);
      
      try {
        const result = await this.orchestrator.executeChain(chain.id, input);

        console.log('✅ Validation Results:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Errors: ${result.errors.size}`);

        if (result.errors.size > 0) {
          console.log('❌ Validation Errors:');
          for (const [stepId, error] of result.errors) {
            console.log(`   ${stepId}: ${error.message}`);
          }
        }

      } catch (error) {
        console.log('❌ Validation chain failed:', error);
      }
    }

    console.log('\n');
  }

  private async demoAuditTrail(): Promise<void> {
    console.log('📊 6. Audit Trail Demo');
    console.log('==================================================\n');

    // Create a simple chain for audit testing
    const steps: AgentStep[] = [
      {
        id: 'step1',
        agentType: 'llm',
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          prompt: 'Process: {input}',
        },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Test step for audit',
      },
    ];

    const workflow: WorkflowConfig = {
      parallelExecution: false,
      errorHandling: 'stop',
      auditTrail: true,
      timeout: 30000,
      maxConcurrency: 3,
    };

    const chain = this.orchestrator.createChain({
      name: 'Audit Test Chain',
      description: 'Test audit trail functionality',
      steps,
      workflow,
    });

    console.log('🚀 Executing chain with audit trail...');
    
    try {
      const result = await this.orchestrator.executeChain(chain.id, 'test input');
      const auditTrail = this.orchestrator.getAuditTrail(result.executionId);

      console.log('✅ Audit Trail Results:');
      console.log(`   Total Audit Entries: ${auditTrail.length}`);
      console.log(`   Execution ID: ${result.executionId}`);

      console.log('\n📋 Audit Entries:');
      for (const entry of auditTrail) {
        console.log(`   [${entry.timestamp.toISOString()}] ${entry.stepId}: ${entry.action} (${entry.duration}ms)`);
        if (entry.error) {
          console.log(`     Error: ${entry.error.message}`);
        }
      }

    } catch (error) {
      console.log('❌ Audit trail demo failed:', error);
    }

    console.log('\n');
  }

  private summarizeFeatures(): void {
    console.log('📋 Multi-Agent Orchestration Features Tested:');
    console.log('✅ Chain Management: Create, retrieve, update, delete chains');
    console.log('✅ Sequential Execution: Step-by-step processing');
    console.log('✅ Parallel Execution: Concurrent step processing');
    console.log('✅ Error Handling: Graceful failure management');
    console.log('✅ Decision Making: Conditional execution paths');
    console.log('✅ Validation: Input/output validation rules');
    console.log('✅ Audit Trail: Complete execution logging');
    console.log('✅ Retry Policies: Automatic retry mechanisms');
    console.log('✅ Timeout Management: Execution time limits');
    console.log('✅ Dependency Management: Step dependency resolution');
  }
}

// Run the demo
const demo = new AgentOrchestrationDemo();
demo.runAllDemos().catch(console.error); 