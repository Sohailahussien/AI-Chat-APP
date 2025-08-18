/**
 * Monitoring & Logging Demo
 * Demonstrates latency tracking, error handling, and feedback loops
 */

import { MonitoringService } from './monitoringService.js';

class MonitoringDemo {
  private monitoringService: MonitoringService;

  constructor() {
    this.monitoringService = new MonitoringService();
  }

  async demonstrateLatencyTracking() {
    console.log('\n📊 1. Latency Tracking Demo');
    console.log('=' .repeat(50));

    const requestIds = [
      'latency_demo_1',
      'latency_demo_2',
      'latency_demo_3',
    ];

    console.log('\n📈 Simulating Request Latency:');
    
    for (const requestId of requestIds) {
      const tracker = this.monitoringService.startLatencyTracking(requestId);
      
      // Simulate user input processing
      await this.simulateDelay(50);
      this.monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
      
      // Simulate RAG query
      await this.simulateDelay(200);
      this.monitoringService.recordLatency(requestId, 'ragQuery', tracker.startTime);
      
      // Simulate LLM completion
      await this.simulateDelay(300);
      this.monitoringService.recordLatency(requestId, 'llmCompletion', tracker.startTime);
      
      // Simulate frontend delivery
      await this.simulateDelay(100);
      this.monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);
      
      console.log(`   Request ${requestId}: Complete`);
    }

    const metrics = this.monitoringService.getPerformanceMetrics();
    const breakdown = this.monitoringService.getLatencyBreakdown();
    
    console.log('\n📊 Latency Performance Metrics:');
    console.log(`   Average Total Latency: ${metrics.averageLatency.toFixed(2)}ms`);
    console.log(`   User Input: ${breakdown.userInput.toFixed(2)}ms`);
    console.log(`   RAG Query: ${breakdown.ragQuery.toFixed(2)}ms`);
    console.log(`   LLM Completion: ${breakdown.llmCompletion.toFixed(2)}ms`);
    console.log(`   Frontend Delivery: ${breakdown.frontendDelivery.toFixed(2)}ms`);
  }

  async demonstrateErrorHandling() {
    console.log('\n🛡️  2. Error Handling Demo');
    console.log('=' .repeat(50));

    const errorScenarios = [
      {
        type: 'vector_store' as const,
        message: 'ChromaDB connection timeout',
        severity: 'high' as const,
        retry: true,
      },
      {
        type: 'mcp' as const,
        message: 'MCP server unavailable',
        severity: 'medium' as const,
        retry: true,
      },
      {
        type: 'llm' as const,
        message: 'OpenAI API rate limit exceeded',
        severity: 'critical' as const,
        retry: false,
      },
      {
        type: 'frontend' as const,
        message: 'React component rendering error',
        severity: 'low' as const,
        retry: false,
      },
      {
        type: 'network' as const,
        message: 'DNS resolution failed',
        severity: 'medium' as const,
        retry: true,
      },
    ];

    console.log('\n📊 Simulating Error Scenarios:');
    
    for (const scenario of errorScenarios) {
      const requestId = `error_${scenario.type}_${Date.now()}`;
      
      console.log(`   ${scenario.type.toUpperCase()}: ${scenario.message} (${scenario.severity})`);
      
      this.monitoringService.logError(
        scenario.type,
        scenario.message,
        requestId,
        `Stack trace for ${scenario.type} error`,
        scenario.severity
      );

      if (scenario.retry) {
        try {
          await this.monitoringService.retryOperation(
            async () => {
              await this.simulateDelay(100);
              if (Math.random() > 0.5) {
                throw new Error(scenario.message);
              }
              return 'success';
            },
            requestId,
            scenario.type
          );
          console.log(`   ✅ Retry successful for ${scenario.type}`);
        } catch (error) {
          console.log(`   ❌ Retry failed for ${scenario.type}`);
        }
      }
    }

    const errorBreakdown = this.monitoringService.getErrorBreakdown();
    const metrics = this.monitoringService.getPerformanceMetrics();
    
    console.log('\n📊 Error Statistics:');
    console.log(`   Total Errors: ${metrics.totalErrors}`);
    console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    console.log(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
    
    console.log('\n📊 Error Breakdown:');
    Object.entries(errorBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} errors`);
    });
  }

  async demonstrateFeedbackLoops() {
    console.log('\n⭐ 3. Feedback Loop Demo');
    console.log('=' .repeat(50));

    const feedbackScenarios = [
      {
        rating: 5 as const,
        feedback: 'Excellent response! Very comprehensive and helpful.',
        quality: 'excellent' as const,
        suggestions: 'Keep up the great work!',
      },
      {
        rating: 4 as const,
        feedback: 'Good response, but could be more specific.',
        quality: 'good' as const,
        suggestions: 'Provide more concrete examples',
      },
      {
        rating: 3 as const,
        feedback: 'The response was okay but could be better.',
        quality: 'fair' as const,
        suggestions: 'Improve accuracy and relevance',
      },
      {
        rating: 2 as const,
        feedback: 'Not very helpful, needs improvement.',
        quality: 'poor' as const,
        suggestions: 'Focus on user intent better',
      },
      {
        rating: 1 as const,
        feedback: 'Completely wrong answer.',
        quality: 'poor' as const,
        suggestions: 'Review training data quality',
      },
    ];

    console.log('\n📊 Simulating User Feedback:');
    
    for (const scenario of feedbackScenarios) {
      const requestId = `feedback_${scenario.rating}_${Date.now()}`;
      
      console.log(`   Rating ${scenario.rating}/5: ${scenario.feedback}`);
      
      this.monitoringService.recordUserFeedback(
        requestId,
        scenario.rating,
        scenario.feedback,
        scenario.quality,
        scenario.suggestions
      );
    }

    const feedbackBreakdown = this.monitoringService.getFeedbackBreakdown();
    const metrics = this.monitoringService.getPerformanceMetrics();
    
    console.log('\n📊 Feedback Statistics:');
    console.log(`   Total Feedback: ${metrics.totalFeedback}`);
    console.log(`   User Satisfaction: ${metrics.userSatisfaction.toFixed(1)}/5`);
    
    console.log('\n📊 Feedback Breakdown:');
    Object.entries(feedbackBreakdown).forEach(([quality, count]) => {
      console.log(`   ${quality}: ${count} responses`);
    });
  }

  async demonstratePerformanceMonitoring() {
    console.log('\n📈 4. Performance Monitoring Demo');
    console.log('=' .repeat(50));

    // Simulate a realistic workload
    console.log('\n📊 Simulating Realistic Workload:');
    
    const workload = [
      { requests: 10, successRate: 0.9, avgLatency: 150 },
      { requests: 15, successRate: 0.8, avgLatency: 200 },
      { requests: 20, successRate: 0.95, avgLatency: 120 },
      { requests: 5, successRate: 0.6, avgLatency: 500 },
    ];

    for (const batch of workload) {
      console.log(`   Processing ${batch.requests} requests (${(batch.successRate * 100).toFixed(0)}% success rate)`);
      
      for (let i = 0; i < batch.requests; i++) {
        const requestId = `workload_${Date.now()}_${i}`;
        const tracker = this.monitoringService.startLatencyTracking(requestId);
        
        // Simulate request processing
        await this.simulateDelay(batch.avgLatency);
        
        // Record latency
        this.monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
        this.monitoringService.recordLatency(requestId, 'ragQuery', tracker.startTime);
        this.monitoringService.recordLatency(requestId, 'llmCompletion', tracker.startTime);
        this.monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);
        
        // Simulate errors based on success rate
        if (Math.random() > batch.successRate) {
          this.monitoringService.logError(
            'vector_store',
            'Simulated error for performance testing',
            requestId,
            undefined,
            'medium'
          );
        }
        
        // Simulate feedback
        if (Math.random() > 0.7) { // 30% feedback rate
          const rating = Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5;
          const qualities: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['poor', 'fair', 'good', 'excellent'];
          const quality = qualities[Math.floor(rating / 2)] as 'poor' | 'fair' | 'good' | 'excellent';
          
          this.monitoringService.recordUserFeedback(
            requestId,
            rating,
            `Simulated feedback for rating ${rating}`,
            quality
          );
        }
      }
    }

    const metrics = this.monitoringService.getPerformanceMetrics();
    const latencyBreakdown = this.monitoringService.getLatencyBreakdown();
    const errorBreakdown = this.monitoringService.getErrorBreakdown();
    const feedbackBreakdown = this.monitoringService.getFeedbackBreakdown();
    
    console.log('\n📊 Performance Summary:');
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Total Errors: ${metrics.totalErrors}`);
    console.log(`   Total Feedback: ${metrics.totalFeedback}`);
    console.log(`   Average Latency: ${metrics.averageLatency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    console.log(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
    console.log(`   User Satisfaction: ${metrics.userSatisfaction.toFixed(1)}/5`);
    
    console.log('\n📊 Latency Breakdown:');
    console.log(`   User Input: ${latencyBreakdown.userInput.toFixed(2)}ms`);
    console.log(`   RAG Query: ${latencyBreakdown.ragQuery.toFixed(2)}ms`);
    console.log(`   LLM Completion: ${latencyBreakdown.llmCompletion.toFixed(2)}ms`);
    console.log(`   Frontend Delivery: ${latencyBreakdown.frontendDelivery.toFixed(2)}ms`);
    
    console.log('\n📊 Error Distribution:');
    Object.entries(errorBreakdown).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`   ${type}: ${count} errors`);
      }
    });
    
    console.log('\n📊 Feedback Distribution:');
    Object.entries(feedbackBreakdown).forEach(([quality, count]) => {
      if (count > 0) {
        console.log(`   ${quality}: ${count} responses`);
      }
    });
  }

  async demonstrateDataExport() {
    console.log('\n📤 5. Data Export Demo');
    console.log('=' .repeat(50));

    const exportedData = this.monitoringService.exportLogs();
    
    console.log('\n📊 Exported Data Summary:');
    console.log(`   Latency Logs: ${exportedData.latencyLogs.length} entries`);
    console.log(`   Error Logs: ${exportedData.errorLogs.length} entries`);
    console.log(`   User Feedback: ${exportedData.userFeedback.length} entries`);
    
    console.log('\n📊 Performance Metrics:');
    console.log(`   Average Latency: ${exportedData.performanceMetrics.averageLatency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${exportedData.performanceMetrics.errorRate.toFixed(1)}%`);
    console.log(`   Success Rate: ${exportedData.performanceMetrics.successRate.toFixed(1)}%`);
    console.log(`   User Satisfaction: ${exportedData.performanceMetrics.userSatisfaction.toFixed(1)}/5`);
    
    // Simulate data cleanup
    console.log('\n🧹 Simulating Data Cleanup:');
    const beforeCleanup = exportedData.latencyLogs.length;
    this.monitoringService.cleanupOldLogs(1 * 60 * 60 * 1000); // 1 hour
    const afterCleanup = this.monitoringService.exportLogs().latencyLogs.length;
    
    console.log(`   Logs before cleanup: ${beforeCleanup}`);
    console.log(`   Logs after cleanup: ${afterCleanup}`);
    console.log(`   Cleaned: ${beforeCleanup - afterCleanup} old entries`);
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllDemos() {
    console.log('📊 Monitoring & Logging Demo');
    console.log('=' .repeat(60));

    await this.demonstrateLatencyTracking();
    await this.demonstrateErrorHandling();
    await this.demonstrateFeedbackLoops();
    await this.demonstratePerformanceMonitoring();
    await this.demonstrateDataExport();

    console.log('\n✅ Demo Complete!');
    console.log('=' .repeat(60));
    console.log('\n📋 Summary of Monitoring & Logging Features:');
    console.log('✅ Latency Tracking: End-to-end performance monitoring');
    console.log('✅ Error Handling: Graceful failure management with retries');
    console.log('✅ Feedback Loops: User-driven quality improvement');
    console.log('✅ Performance Monitoring: Real-time metrics and analytics');
    console.log('✅ Data Export: Comprehensive logging and analysis');
    
    const finalMetrics = this.monitoringService.getPerformanceMetrics();
    console.log('\n🎯 Final Performance Metrics:');
    console.log(`   Total Requests: ${finalMetrics.totalRequests}`);
    console.log(`   Average Latency: ${finalMetrics.averageLatency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${finalMetrics.errorRate.toFixed(1)}%`);
    console.log(`   User Satisfaction: ${finalMetrics.userSatisfaction.toFixed(1)}/5`);
  }
}

// Run the demo if this file is executed directly
if (typeof window === 'undefined') {
  const demo = new MonitoringDemo();
  demo.runAllDemos().catch(console.error);
}

export { MonitoringDemo }; 