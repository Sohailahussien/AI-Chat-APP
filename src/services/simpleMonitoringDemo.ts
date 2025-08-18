/**
 * Simple Monitoring & Logging Demo
 * Demonstrates key monitoring features without complex dependencies
 */

class SimpleMonitoringDemo {
  private latencyLogs: any[] = [];
  private errorLogs: any[] = [];
  private userFeedback: any[] = [];

  simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async demonstrateLatencyTracking() {
    console.log('\n📊 1. Latency Tracking Demo');
    console.log('=' .repeat(50));

    const stages = ['userInput', 'ragQuery', 'llmCompletion', 'frontendDelivery'];
    const requestIds = ['req_1', 'req_2', 'req_3'];

    console.log('\n📈 Simulating Request Latency:');
    
    for (const requestId of requestIds) {
      const startTime = Date.now();
      console.log(`   Processing ${requestId}...`);
      
      for (const stage of stages) {
        const stageStart = Date.now();
        await this.simulateDelay(Math.random() * 200 + 50); // 50-250ms
        const duration = Date.now() - stageStart;
        
        this.latencyLogs.push({
          requestId,
          stage,
          duration,
          timestamp: Date.now(),
        });
        
        console.log(`     ${stage}: ${duration}ms`);
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`   ✅ ${requestId} completed in ${totalTime}ms`);
    }

    const avgLatency = this.latencyLogs.reduce((sum, log) => sum + log.duration, 0) / this.latencyLogs.length;
    console.log(`\n📊 Average Latency: ${avgLatency.toFixed(2)}ms`);
  }

  async demonstrateErrorHandling() {
    console.log('\n🛡️  2. Error Handling Demo');
    console.log('=' .repeat(50));

    const errorTypes = ['vector_store', 'mcp', 'llm', 'frontend', 'network'];
    const severities = ['low', 'medium', 'high', 'critical'];

    console.log('\n📊 Simulating Error Scenarios:');
    
    for (let i = 0; i < 8; i++) {
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const requestId = `error_${i}`;
      
      const errorLog = {
        errorType,
        errorMessage: `Simulated ${errorType} error`,
        severity,
        requestId,
        timestamp: Date.now(),
        retryCount: Math.floor(Math.random() * 3),
      };
      
      this.errorLogs.push(errorLog);
      console.log(`   ${errorType.toUpperCase()}: ${severity} severity (${errorLog.retryCount} retries)`);
      
      // Simulate retry logic
      if (errorLog.retryCount > 0) {
        await this.simulateDelay(100);
        console.log(`     🔄 Retry successful`);
      }
    }

    const errorBreakdown = this.errorLogs.reduce((acc, log) => {
      acc[log.errorType] = (acc[log.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Error Statistics:');
    console.log(`   Total Errors: ${this.errorLogs.length}`);
    Object.entries(errorBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} errors`);
    });
  }

  async demonstrateFeedbackLoops() {
    console.log('\n⭐ 3. Feedback Loop Demo');
    console.log('=' .repeat(50));

    const feedbackScenarios = [
      { rating: 5, feedback: 'Excellent response!', quality: 'excellent' },
      { rating: 4, feedback: 'Good response, very helpful.', quality: 'good' },
      { rating: 3, feedback: 'Okay, but could be better.', quality: 'fair' },
      { rating: 2, feedback: 'Not very helpful.', quality: 'poor' },
      { rating: 1, feedback: 'Completely wrong answer.', quality: 'poor' },
      { rating: 5, feedback: 'Perfect! Exactly what I needed.', quality: 'excellent' },
      { rating: 4, feedback: 'Good, but needs more detail.', quality: 'good' },
      { rating: 3, feedback: 'Average response.', quality: 'fair' },
    ];

    console.log('\n📊 Simulating User Feedback:');
    
    for (const scenario of feedbackScenarios) {
      const feedback = {
        requestId: `feedback_${Date.now()}`,
        rating: scenario.rating,
        feedback: scenario.feedback,
        quality: scenario.quality,
        timestamp: Date.now(),
      };
      
      this.userFeedback.push(feedback);
      console.log(`   ${scenario.rating}/5: ${scenario.feedback}`);
      
      // Process feedback for improvement
      if (scenario.rating <= 2) {
        console.log(`     ⚠️ Poor response detected - needs improvement`);
      } else if (scenario.rating >= 4) {
        console.log(`     ✅ Excellent response - reinforce positive patterns`);
      }
    }

    const avgRating = this.userFeedback.reduce((sum, f) => sum + f.rating, 0) / this.userFeedback.length;
    const qualityBreakdown = this.userFeedback.reduce((acc, f) => {
      acc[f.quality] = (acc[f.quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Feedback Statistics:');
    console.log(`   Total Feedback: ${this.userFeedback.length}`);
    console.log(`   Average Rating: ${avgRating.toFixed(1)}/5`);
    Object.entries(qualityBreakdown).forEach(([quality, count]) => {
      console.log(`   ${quality}: ${count} responses`);
    });
  }

  async demonstratePerformanceMonitoring() {
    console.log('\n📈 4. Performance Monitoring Demo');
    console.log('=' .repeat(50));

    console.log('\n📊 Simulating Performance Monitoring:');
    
    // Simulate performance metrics
    const metrics = {
      totalRequests: this.latencyLogs.length / 4, // 4 stages per request
      totalErrors: this.errorLogs.length,
      totalFeedback: this.userFeedback.length,
      averageLatency: this.latencyLogs.reduce((sum, log) => sum + log.duration, 0) / this.latencyLogs.length,
      errorRate: (this.errorLogs.length / (this.latencyLogs.length / 4)) * 100,
      userSatisfaction: this.userFeedback.reduce((sum, f) => sum + f.rating, 0) / this.userFeedback.length,
    };

    console.log('\n📊 Performance Summary:');
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Total Errors: ${metrics.totalErrors}`);
    console.log(`   Total Feedback: ${metrics.totalFeedback}`);
    console.log(`   Average Latency: ${metrics.averageLatency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    console.log(`   User Satisfaction: ${metrics.userSatisfaction.toFixed(1)}/5`);

    // Performance alerts
    if (metrics.errorRate > 10) {
      console.log(`   🚨 High error rate detected: ${metrics.errorRate.toFixed(1)}%`);
    }
    
    if (metrics.averageLatency > 500) {
      console.log(`   🚨 High latency detected: ${metrics.averageLatency.toFixed(2)}ms`);
    }
    
    if (metrics.userSatisfaction < 3) {
      console.log(`   🚨 Low user satisfaction: ${metrics.userSatisfaction.toFixed(1)}/5`);
    }

    // Performance recommendations
    console.log('\n📊 Performance Recommendations:');
    if (metrics.errorRate > 5) {
      console.log('   🔧 Consider implementing circuit breakers');
    }
    
    if (metrics.averageLatency > 300) {
      console.log('   🔧 Consider caching frequently requested data');
    }
    
    if (metrics.userSatisfaction < 4) {
      console.log('   🔧 Review response quality and relevance');
    }
  }

  async demonstrateDataExport() {
    console.log('\n📤 5. Data Export Demo');
    console.log('=' .repeat(50));

    const exportedData = {
      latencyLogs: this.latencyLogs,
      errorLogs: this.errorLogs,
      userFeedback: this.userFeedback,
      summary: {
        totalRequests: this.latencyLogs.length / 4,
        totalErrors: this.errorLogs.length,
        totalFeedback: this.userFeedback.length,
        averageLatency: this.latencyLogs.reduce((sum, log) => sum + log.duration, 0) / this.latencyLogs.length,
        errorRate: (this.errorLogs.length / (this.latencyLogs.length / 4)) * 100,
        userSatisfaction: this.userFeedback.reduce((sum, f) => sum + f.rating, 0) / this.userFeedback.length,
      }
    };

    console.log('\n📊 Exported Data Summary:');
    console.log(`   Latency Logs: ${exportedData.latencyLogs.length} entries`);
    console.log(`   Error Logs: ${exportedData.errorLogs.length} entries`);
    console.log(`   User Feedback: ${exportedData.userFeedback.length} entries`);
    
    console.log('\n📊 Performance Metrics:');
    console.log(`   Average Latency: ${exportedData.summary.averageLatency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${exportedData.summary.errorRate.toFixed(1)}%`);
    console.log(`   User Satisfaction: ${exportedData.summary.userSatisfaction.toFixed(1)}/5`);

    // Simulate data cleanup
    console.log('\n🧹 Simulating Data Cleanup:');
    const beforeCleanup = this.latencyLogs.length;
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.latencyLogs = this.latencyLogs.filter(log => log.timestamp > cutoffTime);
    const afterCleanup = this.latencyLogs.length;
    
    console.log(`   Logs before cleanup: ${beforeCleanup}`);
    console.log(`   Logs after cleanup: ${afterCleanup}`);
    console.log(`   Cleaned: ${beforeCleanup - afterCleanup} old entries`);
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
    
    const finalMetrics = {
      totalRequests: this.latencyLogs.length / 4,
      totalErrors: this.errorLogs.length,
      totalFeedback: this.userFeedback.length,
      averageLatency: this.latencyLogs.reduce((sum, log) => sum + log.duration, 0) / this.latencyLogs.length,
      errorRate: (this.errorLogs.length / (this.latencyLogs.length / 4)) * 100,
      userSatisfaction: this.userFeedback.reduce((sum, f) => sum + f.rating, 0) / this.userFeedback.length,
    };
    
    console.log('\n🎯 Final Performance Metrics:');
    console.log(`   Total Requests: ${finalMetrics.totalRequests}`);
    console.log(`   Average Latency: ${finalMetrics.averageLatency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${finalMetrics.errorRate.toFixed(1)}%`);
    console.log(`   User Satisfaction: ${finalMetrics.userSatisfaction.toFixed(1)}/5`);
  }
}

// Run the demo
const monitoringDemo = new SimpleMonitoringDemo();
monitoringDemo.runAllDemos().catch(console.error); 