#!/usr/bin/env node

/**
 * Agent Roles Testing Script
 * Tests the multi-agent orchestration system using defined agent roles
 */

const { AgentOrchestrator } = require('../src/services/agentOrchestrator.js');
const { AGENT_ROLES, AgentRoleManager, WORKFLOW_PATTERNS } = require('../src/services/agentRoles.js');

class AgentRolesTester {
  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Testing Multi-Agent Orchestration with Defined Roles');
    console.log('========================================================\n');

    await this.testIndividualAgents();
    await this.testWorkflowPatterns();
    await this.testAgentInteractions();
    await this.testErrorScenarios();
    await this.testPerformance();

    this.printTestSummary();
  }

  async testIndividualAgents() {
    console.log('📋 1. Testing Individual Agent Roles');
    console.log('=====================================\n');

    const agents = Object.values(AGENT_ROLES);
    
    for (const agent of agents) {
      await this.testAgentRole(agent);
    }
  }

  async testAgentRole(agent) {
    console.log(`🔧 Testing ${agent.name} (${agent.id})`);
    
    try {
      // Create a simple chain with this agent
      const chain = this.orchestrator.createChain({
        name: `Test Chain - ${agent.name}`,
        description: `Testing ${agent.name} functionality`,
        steps: [{
          id: agent.id,
          agentType: agent.agentType,
          config: {
            model: agent.agentType === 'llm' ? 'gpt-3.5-turbo' : undefined,
            temperature: agent.agentType === 'llm' ? 0.3 : undefined,
            prompt: agent.agentType === 'llm' ? `Test ${agent.name}: {input}` : undefined,
            tools: agent.agentType === 'tool' ? ['testTool'] : undefined,
            validationRules: agent.validationRules
          },
          dependencies: agent.dependencies,
          timeout: agent.timeout,
          retryPolicy: agent.retryPolicy,
          description: agent.description
        }],
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: agent.timeout * 2,
          maxConcurrency: 1
        }
      });

      // Test with sample input
      const testInput = this.generateTestInput(agent);
      const result = await this.orchestrator.executeChain(chain.id, testInput);

      const testResult = {
        agent: agent.name,
        success: result.success,
        executionTime: result.executionTime,
        errors: result.errors.size,
        auditEntries: result.auditTrail.length
      };

      this.testResults.push(testResult);

      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   ⏱️  Time: ${result.executionTime}ms`);
      console.log(`   ❌ Errors: ${result.errors.size}`);
      console.log(`   📊 Audit: ${result.auditTrail.length} entries`);

      // Validate outputs
      this.validateAgentOutputs(agent, result);

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      this.testResults.push({
        agent: agent.name,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  generateTestInput(agent) {
    // Generate appropriate test input based on agent type
    switch (agent.id) {
      case 'documentRetriever':
        return { filePath: '/test/document.txt', fileType: 'txt' };
      
      case 'documentAnalyzer':
        return 'This is a test document about artificial intelligence and machine learning.';
      
      case 'textProcessor':
        return 'Raw text with   extra   spaces   and\nline\nbreaks.';
      
      case 'vectorizer':
        return ['Text chunk 1', 'Text chunk 2', 'Text chunk 3'];
      
      case 'summarizer':
        return 'Long document content that needs to be summarized...';
      
      case 'contentOrganizer':
        return { structure: { sections: ['Intro', 'Body', 'Conclusion'] } };
      
      case 'retrievalAgent':
        return { query: 'What is machine learning?', vectorIds: ['vec_001', 'vec_002'] };
      
      case 'responseGenerator':
        return { query: 'Explain AI', chunks: ['AI is artificial intelligence...'] };
      
      case 'responseValidator':
        return { response: 'AI is artificial intelligence', query: 'What is AI?' };
      
      case 'qualityController':
        return { validationResult: { accuracy: 0.9 }, response: 'Good response' };
      
      case 'taskPlanner':
        return 'Analyze this document and answer questions about it';
      
      case 'workflowOrchestrator':
        return { executionPlan: { steps: ['step1', 'step2'] } };
      
      default:
        return 'Test input';
    }
  }

  validateAgentOutputs(agent, result) {
    if (!result.success) return;

    // Check if outputs match expected types
    const expectedOutputs = agent.outputs;
    const actualOutputs = result.results;

    console.log(`   📤 Outputs: ${actualOutputs.size}/${expectedOutputs.length} expected`);

    // Validate specific outputs based on agent type
    switch (agent.id) {
      case 'documentRetriever':
        if (actualOutputs.has('documentContent')) {
          const content = actualOutputs.get('documentContent');
          if (typeof content === 'string' && content.length > 0) {
            console.log('   ✅ Document content extracted');
          }
        }
        break;

      case 'documentAnalyzer':
        if (actualOutputs.has('keyTopics')) {
          const topics = actualOutputs.get('keyTopics');
          if (Array.isArray(topics) && topics.length > 0) {
            console.log('   ✅ Key topics identified');
          }
        }
        break;

      case 'summarizer':
        if (actualOutputs.has('summary')) {
          const summary = actualOutputs.get('summary');
          if (typeof summary === 'string' && summary.length > 50) {
            console.log('   ✅ Summary generated');
          }
        }
        break;

      case 'responseGenerator':
        if (actualOutputs.has('response')) {
          const response = actualOutputs.get('response');
          if (typeof response === 'string' && response.length > 10) {
            console.log('   ✅ Response generated');
          }
        }
        break;
    }
  }

  async testWorkflowPatterns() {
    console.log('🔄 2. Testing Workflow Patterns');
    console.log('================================\n');

    const patterns = Object.keys(WORKFLOW_PATTERNS);
    
    for (const patternName of patterns) {
      await this.testWorkflowPattern(patternName);
    }
  }

  async testWorkflowPattern(patternName) {
    console.log(`🔄 Testing ${patternName} Pattern`);
    
    try {
      const roleIds = WORKFLOW_PATTERNS[patternName];
      const roles = roleIds.map(id => AGENT_ROLES[id]).filter(Boolean);

      // Create chain with pattern roles
      const steps = roles.map(role => ({
        id: role.id,
        agentType: role.agentType,
        config: {
          model: role.agentType === 'llm' ? 'gpt-3.5-turbo' : undefined,
          temperature: role.agentType === 'llm' ? 0.3 : undefined,
          prompt: role.agentType === 'llm' ? `Process: {input}` : undefined,
          tools: role.agentType === 'tool' ? ['testTool'] : undefined,
          validationRules: role.validationRules
        },
        dependencies: role.dependencies,
        timeout: role.timeout,
        retryPolicy: role.retryPolicy,
        description: role.description
      }));

      const chain = this.orchestrator.createChain({
        name: `${patternName} Test Chain`,
        description: `Testing ${patternName} workflow pattern`,
        steps,
        workflow: {
          parallelExecution: patternName === 'queryResponse',
          errorHandling: 'continue',
          auditTrail: true,
          timeout: 120000,
          maxConcurrency: 3
        }
      });

      // Generate appropriate test input for the pattern
      const testInput = this.generatePatternTestInput(patternName);
      const result = await this.orchestrator.executeChain(chain.id, testInput);

      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   ⏱️  Time: ${result.executionTime}ms`);
      console.log(`   📊 Steps: ${result.results.size}/${roles.length}`);
      console.log(`   ❌ Errors: ${result.errors.size}`);

      // Validate pattern-specific outputs
      this.validatePatternOutputs(patternName, result);

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }

    console.log('');
  }

  generatePatternTestInput(patternName) {
    switch (patternName) {
      case 'documentAnalysis':
        return 'This is a test document about AI and machine learning that needs to be analyzed and summarized.';
      
      case 'queryResponse':
        return { query: 'What is artificial intelligence?', context: 'AI is a field of computer science.' };
      
      case 'fullPipeline':
        return { 
          request: 'Analyze this document and answer questions about it',
          document: 'Test document content about AI technology.'
        };
      
      default:
        return 'Test input';
    }
  }

  validatePatternOutputs(patternName, result) {
    if (!result.success) return;

    switch (patternName) {
      case 'documentAnalysis':
        if (result.results.has('summarizer')) {
          console.log('   ✅ Document analysis completed');
        }
        break;

      case 'queryResponse':
        if (result.results.has('responseGenerator')) {
          console.log('   ✅ Query response generated');
        }
        break;

      case 'fullPipeline':
        if (result.results.has('qualityController')) {
          console.log('   ✅ Full pipeline completed');
        }
        break;
    }
  }

  async testAgentInteractions() {
    console.log('🤝 3. Testing Agent Interactions');
    console.log('=================================\n');

    // Test handoffs between agents
    const handoffTests = [
      {
        name: 'Document Processing Handoff',
        agents: ['documentRetriever', 'documentAnalyzer'],
        input: 'Test document content'
      },
      {
        name: 'Content Processing Handoff',
        agents: ['textProcessor', 'vectorizer'],
        input: 'Raw text to process'
      },
      {
        name: 'Response Generation Handoff',
        agents: ['retrievalAgent', 'responseGenerator'],
        input: { query: 'Test query', chunks: ['Relevant content'] }
      }
    ];

    for (const test of handoffTests) {
      await this.testAgentHandoff(test);
    }
  }

  async testAgentHandoff(test) {
    console.log(`🤝 Testing ${test.name}`);
    
    try {
      const steps = test.agents.map(agentId => {
        const role = AGENT_ROLES[agentId];
        return {
          id: role.id,
          agentType: role.agentType,
          config: {
            model: role.agentType === 'llm' ? 'gpt-3.5-turbo' : undefined,
            temperature: role.agentType === 'llm' ? 0.3 : undefined,
            prompt: role.agentType === 'llm' ? `Process: {input}` : undefined,
            tools: role.agentType === 'tool' ? ['testTool'] : undefined
          },
          dependencies: role.dependencies,
          timeout: role.timeout,
          retryPolicy: role.retryPolicy,
          description: role.description
        };
      });

      const chain = this.orchestrator.createChain({
        name: `${test.name} Chain`,
        description: `Testing handoff between ${test.agents.join(' and ')}`,
        steps,
        workflow: {
          parallelExecution: false,
          errorHandling: 'stop',
          auditTrail: true,
          timeout: 60000,
          maxConcurrency: 2
        }
      });

      const result = await this.orchestrator.executeChain(chain.id, test.input);

      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📊 Steps Completed: ${result.results.size}/${test.agents.length}`);
      console.log(`   🔄 Handoffs: ${result.auditTrail.filter(e => e.action === 'handoff').length}`);

      // Check if data flowed between agents
      if (result.success && result.results.size === test.agents.length) {
        console.log('   ✅ Data handoff successful');
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }

    console.log('');
  }

  async testErrorScenarios() {
    console.log('⚠️  4. Testing Error Scenarios');
    console.log('==============================\n');

    const errorTests = [
      {
        name: 'Invalid Input',
        input: null,
        expectedError: 'Invalid input'
      },
      {
        name: 'Missing Dependency',
        agents: ['responseGenerator'], // Missing retrievalAgent dependency
        input: 'Test input',
        expectedError: 'Dependency not met'
      },
      {
        name: 'Timeout Scenario',
        input: 'Very long input that might cause timeout...'.repeat(1000),
        expectedError: 'Timeout'
      }
    ];

    for (const test of errorTests) {
      await this.testErrorScenario(test);
    }
  }

  async testErrorScenario(test) {
    console.log(`⚠️  Testing ${test.name}`);
    
    try {
      const steps = test.agents ? test.agents.map(agentId => {
        const role = AGENT_ROLES[agentId];
        return {
          id: role.id,
          agentType: role.agentType,
          config: {
            model: role.agentType === 'llm' ? 'gpt-3.5-turbo' : undefined,
            temperature: role.agentType === 'llm' ? 0.3 : undefined,
            prompt: role.agentType === 'llm' ? `Process: {input}` : undefined,
            tools: role.agentType === 'tool' ? ['testTool'] : undefined
          },
          dependencies: role.dependencies,
          timeout: 5000, // Short timeout for error testing
          retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
          description: role.description
        };
      }) : [{
        id: 'testStep',
        agentType: 'llm',
        config: { model: 'gpt-3.5-turbo', temperature: 0.3, prompt: 'Test: {input}' },
        dependencies: [],
        timeout: 5000,
        retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Test step'
      }];

      const chain = this.orchestrator.createChain({
        name: `${test.name} Error Test`,
        description: `Testing error handling for ${test.name}`,
        steps,
        workflow: {
          parallelExecution: false,
          errorHandling: 'continue',
          auditTrail: true,
          timeout: 30000,
          maxConcurrency: 1
        }
      });

      const result = await this.orchestrator.executeChain(chain.id, test.input);

      if (!result.success) {
        console.log(`   ✅ Error handled correctly`);
        console.log(`   ❌ Errors: ${result.errors.size}`);
      } else {
        console.log(`   ⚠️  Expected error but got success`);
      }

    } catch (error) {
      console.log(`   ✅ Error caught: ${error.message}`);
    }

    console.log('');
  }

  async testPerformance() {
    console.log('⚡ 5. Testing Performance');
    console.log('=========================\n');

    const performanceTests = [
      {
        name: 'Single Agent Performance',
        agents: ['documentAnalyzer'],
        iterations: 5
      },
      {
        name: 'Small Chain Performance',
        agents: ['documentRetriever', 'documentAnalyzer'],
        iterations: 3
      },
      {
        name: 'Parallel Execution Performance',
        agents: ['textProcessor', 'vectorizer'],
        iterations: 3,
        parallel: true
      }
    ];

    for (const test of performanceTests) {
      await this.testPerformanceScenario(test);
    }
  }

  async testPerformanceScenario(test) {
    console.log(`⚡ Testing ${test.name}`);
    
    const times = [];
    const errors = [];

    for (let i = 0; i < test.iterations; i++) {
      try {
        const startTime = Date.now();
        
        const steps = test.agents.map(agentId => {
          const role = AGENT_ROLES[agentId];
          return {
            id: role.id,
            agentType: role.agentType,
            config: {
              model: role.agentType === 'llm' ? 'gpt-3.5-turbo' : undefined,
              temperature: role.agentType === 'llm' ? 0.3 : undefined,
              prompt: role.agentType === 'llm' ? `Process: {input}` : undefined,
              tools: role.agentType === 'tool' ? ['testTool'] : undefined
            },
            dependencies: role.dependencies,
            timeout: role.timeout,
            retryPolicy: role.retryPolicy,
            description: role.description
          };
        });

        const chain = this.orchestrator.createChain({
          name: `${test.name} Performance Test ${i + 1}`,
          description: `Performance test iteration ${i + 1}`,
          steps,
          workflow: {
            parallelExecution: test.parallel || false,
            errorHandling: 'stop',
            auditTrail: true,
            timeout: 60000,
            maxConcurrency: test.parallel ? 2 : 1
          }
        });

        const result = await this.orchestrator.executeChain(chain.id, 'Test input');
        const executionTime = Date.now() - startTime;
        
        times.push(executionTime);
        
        if (!result.success) {
          errors.push(result.errors.size);
        }

      } catch (error) {
        errors.push(1);
      }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const avgErrors = errors.reduce((a, b) => a + b, 0) / errors.length;

    console.log(`   ⏱️  Average Time: ${avgTime.toFixed(2)}ms`);
    console.log(`   ❌ Average Errors: ${avgErrors.toFixed(2)}`);
    console.log(`   📊 Success Rate: ${((test.iterations - errors.length) / test.iterations * 100).toFixed(1)}%`);

    console.log('');
  }

  printTestSummary() {
    console.log('📊 Test Summary');
    console.log('===============\n');

    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${(successfulTests / totalTests * 100).toFixed(1)}%`);

    if (successfulTests > 0) {
      const avgTime = this.testResults
        .filter(r => r.success && r.executionTime)
        .reduce((sum, r) => sum + r.executionTime, 0) / successfulTests;
      
      console.log(`⏱️  Average Execution Time: ${avgTime.toFixed(2)}ms`);
    }

    console.log('\n🎉 Multi-Agent Orchestration Testing Complete!');
    console.log('===============================================');
  }
}

// Run the tests
const tester = new AgentRolesTester();
tester.runAllTests().catch(console.error); 