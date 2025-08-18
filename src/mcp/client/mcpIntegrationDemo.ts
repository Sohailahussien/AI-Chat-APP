#!/usr/bin/env ts-node
/**
 * MCP Client Integration Demo
 * Demonstrates efficient prompt structuring, streaming, and token budgeting
 */

import { UniversalMCPClient, TokenBudgetManager, PromptOptimizer } from './universalClient.js';

class MCPIntegrationDemo {
  private client: UniversalMCPClient;
  private tokenBudgetManager: TokenBudgetManager;
  private promptOptimizer: PromptOptimizer;

  constructor() {
    this.client = new UniversalMCPClient({
      type: 'chromadb',
      baseUrl: '/api/mcp'
    });
    this.tokenBudgetManager = new TokenBudgetManager();
    this.promptOptimizer = new PromptOptimizer();
  }

  async demonstrateEfficientPromptStructuring() {
    console.log('\n🚀 1. Efficient Prompt Structuring Demo');
    console.log('=' .repeat(50));

    const queries = [
      'What is RAG?',
      'Explain vector embeddings in detail with examples',
      'How does ChromaDB work with document processing and what are the benefits of using it for semantic search?'
    ];

    for (const query of queries) {
      console.log(`\n📝 Query: "${query}"`);
      
      // Create efficient prompt
      const optimizedPrompt = this.promptOptimizer.createEfficientPrompt(query, this.client['context'], {
        includeHistory: true,
        maxHistoryLength: 3,
        includeMetadata: true
      });

      console.log(`   Prompt length: ${optimizedPrompt.length} characters`);
      console.log(`   Estimated tokens: ${this.tokenBudgetManager.estimateTokens(optimizedPrompt)}`);
      console.log(`   Efficiency: ${this.calculateEfficiency(optimizedPrompt)}%`);
    }
  }

  async demonstrateStreamingSupport() {
    console.log('\n⚡ 2. Streaming Support Demo');
    console.log('=' .repeat(50));

    console.log('\n📊 Streaming Configuration:');
    console.log(`   Streaming enabled: ${this.client['streamingEnabled']}`);
    
    // Test streaming optimization
    const originalPrompt = 'Please provide a detailed response with comprehensive information about the topic.';
    const streamingPrompt = this.promptOptimizer.optimizeForStreaming(originalPrompt);
    
    console.log('\n📝 Prompt Optimization:');
    console.log(`   Original: "${originalPrompt}"`);
    console.log(`   Optimized: "${streamingPrompt}"`);
    console.log(`   Reduction: ${Math.round((1 - streamingPrompt.length / originalPrompt.length) * 100)}%`);
  }

  async demonstrateTokenBudgeting() {
    console.log('\n💰 3. Token Budgeting Demo');
    console.log('=' .repeat(50));

    // Simulate conversation history
    const conversationHistory = [
      'Hello, I need help with document processing.',
      'I can help you with document processing. What specific questions do you have?',
      'I want to understand how RAG works with ChromaDB.',
      'RAG (Retrieval-Augmented Generation) combines document retrieval with AI generation. ChromaDB stores vector embeddings for semantic search.',
      'Can you explain vector embeddings in more detail?',
      'Vector embeddings convert text into numerical representations that capture semantic meaning. They enable similarity search and semantic understanding.',
      'How do I implement this in my application?',
      'You can implement this by: 1) Processing documents into chunks, 2) Creating embeddings, 3) Storing in ChromaDB, 4) Querying with semantic search.',
      'What are the performance considerations?',
      'Performance considerations include: embedding model choice, chunk size optimization, indexing strategies, and caching mechanisms.'
    ];

    console.log('\n📊 Token Budget Analysis:');
    console.log(`   Max context tokens: ${this.tokenBudgetManager['maxContextTokens']}`);
    console.log(`   System prompt tokens: ${this.tokenBudgetManager['systemPromptTokens']}`);
    console.log(`   Reserved tokens: ${this.tokenBudgetManager['reservedTokens']}`);

    let currentTokens = 0;
    const context: any = {
      messages: [],
      maxTokens: 8000,
      currentTokens: 0,
      systemPrompt: 'You are a helpful AI assistant.'
    };

    console.log('\n📈 Conversation Token Usage:');
    for (let i = 0; i < conversationHistory.length; i++) {
      const message = conversationHistory[i];
      const tokens = this.tokenBudgetManager.estimateTokens(message);
      currentTokens += tokens;
      
      const role = i % 2 === 0 ? 'user' : 'assistant';
      const messageObj = {
        role: role as 'user' | 'assistant',
        content: message,
        timestamp: Date.now(),
        tokens
      };

      if (this.tokenBudgetManager.canAddMessage(messageObj, context)) {
        context.messages.push(messageObj);
        context.currentTokens = currentTokens;
        console.log(`   ${role}: ${tokens} tokens (${currentTokens}/${context.maxTokens})`);
      } else {
        console.log(`   ⚠️  ${role}: ${tokens} tokens - CONTEXT TRUNCATED`);
        // Simulate truncation
        const truncated = this.tokenBudgetManager.truncateContext(context);
        context.messages = truncated.messages;
        context.currentTokens = truncated.currentTokens;
        context.messages.push(messageObj);
        context.currentTokens += tokens;
        console.log(`   ✅ Context truncated, new total: ${context.currentTokens} tokens`);
      }
    }

    console.log(`\n📊 Final Context Stats:`);
    console.log(`   Messages: ${context.messages.length}`);
    console.log(`   Total tokens: ${context.currentTokens}`);
    console.log(`   Token usage: ${Math.round((context.currentTokens / context.maxTokens) * 100)}%`);
  }

  async demonstrateContextEfficiency() {
    console.log('\n🎯 4. Context Efficiency Demo');
    console.log('=' .repeat(50));

    // Test different context scenarios
    const scenarios = [
      {
        name: 'Short queries',
        queries: ['Hi', 'Help', 'Thanks'],
        expectedEfficiency: 'High'
      },
      {
        name: 'Medium queries',
        queries: ['What is RAG?', 'Explain embeddings', 'How does ChromaDB work?'],
        expectedEfficiency: 'Medium'
      },
      {
        name: 'Long queries',
        queries: [
          'Please provide a comprehensive explanation of how Retrieval-Augmented Generation works with vector databases, including implementation details and performance considerations.',
          'I need detailed information about document processing, text chunking strategies, embedding generation, and semantic search optimization techniques.'
        ],
        expectedEfficiency: 'Low'
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n📋 ${scenario.name}:`);
      console.log(`   Expected efficiency: ${scenario.expectedEfficiency}`);
      
      let totalTokens = 0;
      let totalLength = 0;
      
      for (const query of scenario.queries) {
        const tokens = this.tokenBudgetManager.estimateTokens(query);
        totalTokens += tokens;
        totalLength += query.length;
        
        console.log(`   Query: "${query}"`);
        console.log(`     Length: ${query.length} chars, Tokens: ${tokens}`);
      }
      
      const avgTokensPerChar = totalTokens / totalLength;
      const efficiency = this.calculateEfficiencyFromTokens(avgTokensPerChar);
      
      console.log(`   Average tokens/char: ${avgTokensPerChar.toFixed(3)}`);
      console.log(`   Efficiency score: ${efficiency}%`);
    }
  }

  async demonstratePerformanceOptimizations() {
    console.log('\n⚡ 5. Performance Optimizations Demo');
    console.log('=' .repeat(50));

    console.log('\n📊 Configuration Settings:');
    console.log(`   Max tokens: ${this.client['context'].maxTokens}`);
    console.log(`   Streaming: ${this.client['streamingEnabled']}`);
    console.log(`   Context messages: ${this.client['context'].messages.length}`);

    // Test different token limits
    const tokenLimits = [1000, 4000, 8000, 16000];
    
    console.log('\n📈 Token Limit Impact:');
    for (const limit of tokenLimits) {
      const testBudgetManager = new TokenBudgetManager(limit);
      const availableTokens = limit - testBudgetManager['systemPromptTokens'] - testBudgetManager['reservedTokens'];
      
      console.log(`   ${limit} tokens: ${availableTokens} available (${Math.round((availableTokens / limit) * 100)}% usable)`);
    }

    // Test prompt optimization
    console.log('\n🔧 Prompt Optimization Results:');
    const testPrompts = [
      'Please provide a detailed response with comprehensive information.',
      'Explain the concept thoroughly with examples and implementation details.',
      'Give me a complete overview including background, methodology, and practical applications.'
    ];

    for (const prompt of testPrompts) {
      const original = prompt;
      const optimized = this.promptOptimizer.optimizeForStreaming(prompt);
      const reduction = Math.round((1 - optimized.length / original.length) * 100);
      
      console.log(`   "${original}" → "${optimized}" (${reduction}% reduction)`);
    }
  }

  private calculateEfficiency(prompt: string): number {
    const tokens = this.tokenBudgetManager.estimateTokens(prompt);
    const chars = prompt.length;
    const tokensPerChar = tokens / chars;
    
    // Lower tokens per character = higher efficiency
    const efficiency = Math.max(0, 100 - (tokensPerChar * 100));
    return Math.round(efficiency);
  }

  private calculateEfficiencyFromTokens(tokensPerChar: number): number {
    // Lower tokens per character = higher efficiency
    const efficiency = Math.max(0, 100 - (tokensPerChar * 400));
    return Math.round(efficiency);
  }

  async runAllDemos() {
    console.log('🎯 MCP Client Integration Optimizations Demo');
    console.log('=' .repeat(60));

    await this.demonstrateEfficientPromptStructuring();
    await this.demonstrateStreamingSupport();
    await this.demonstrateTokenBudgeting();
    await this.demonstrateContextEfficiency();
    await this.demonstratePerformanceOptimizations();

    console.log('\n✅ Demo Complete!');
    console.log('=' .repeat(60));
    console.log('\n📋 Summary of MCP Client Integration Features:');
    console.log('✅ Efficient Prompt Structuring: Optimized prompts for minimal token usage');
    console.log('✅ Streaming Support: Real-time response streaming with prompt optimization');
    console.log('✅ Token Budgeting: Smart context management with automatic truncation');
    console.log('✅ Context Efficiency: Dynamic adjustment based on query characteristics');
    console.log('✅ Performance Tracking: Comprehensive monitoring and optimization metrics');
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new MCPIntegrationDemo();
  demo.runAllDemos().catch(console.error);
}

export { MCPIntegrationDemo }; 