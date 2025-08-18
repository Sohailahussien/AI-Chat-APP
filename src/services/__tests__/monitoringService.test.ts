import { MonitoringService } from '../monitoringService';

describe('Monitoring & Logging Service', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    monitoringService = new MonitoringService();
  });

  describe('Latency Tracking', () => {
    it('should track user input latency', () => {
      const requestId = 'test_request_1';
      const tracker = monitoringService.startLatencyTracking(requestId);
      
      // Simulate user input processing
      monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);

      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);
    });

    it('should track RAG query latency', () => {
      const requestId = 'test_request_2';
      const tracker = monitoringService.startLatencyTracking(requestId);
      
      // Simulate RAG query
      setTimeout(() => {
        monitoringService.recordLatency(requestId, 'ragQuery', tracker.startTime);
      }, 200);

      const breakdown = monitoringService.getLatencyBreakdown();
      expect(breakdown.ragQuery).toBeGreaterThanOrEqual(0);
    });

    it('should track LLM completion latency', () => {
      const requestId = 'test_request_3';
      const tracker = monitoringService.startLatencyTracking(requestId);
      
      // Simulate LLM completion
      setTimeout(() => {
        monitoringService.recordLatency(requestId, 'llmCompletion', tracker.startTime);
      }, 300);

      const breakdown = monitoringService.getLatencyBreakdown();
      expect(breakdown.llmCompletion).toBeGreaterThanOrEqual(0);
    });

    it('should track frontend delivery latency', () => {
      const requestId = 'test_request_4';
      const tracker = monitoringService.startLatencyTracking(requestId);
      
      // Simulate frontend delivery
      setTimeout(() => {
        monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);
      }, 150);

      const breakdown = monitoringService.getLatencyBreakdown();
      expect(breakdown.frontendDelivery).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total latency correctly', () => {
      const requestId = 'test_request_5';
      const tracker = monitoringService.startLatencyTracking(requestId);
      
      // Record all stages
      monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
      monitoringService.recordLatency(requestId, 'ragQuery', tracker.startTime);
      monitoringService.recordLatency(requestId, 'llmCompletion', tracker.startTime);
      monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);

      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should log vector store errors', () => {
      const requestId = 'error_test_1';
      const errorLog = monitoringService.logError(
        'vector_store',
        'ChromaDB connection failed',
        requestId,
        'Error stack trace',
        'high'
      );

      expect(errorLog.errorType).toBe('vector_store');
      expect(errorLog.errorMessage).toBe('ChromaDB connection failed');
      expect(errorLog.severity).toBe('high');
      expect(errorLog.requestId).toBe(requestId);
    });

    it('should log MCP errors', () => {
      const requestId = 'error_test_2';
      const errorLog = monitoringService.logError(
        'mcp',
        'MCP server timeout',
        requestId,
        undefined,
        'medium'
      );

      expect(errorLog.errorType).toBe('mcp');
      expect(errorLog.severity).toBe('medium');
    });

    it('should log LLM errors', () => {
      const requestId = 'error_test_3';
      const errorLog = monitoringService.logError(
        'llm',
        'OpenAI API rate limit exceeded',
        requestId,
        'Rate limit error',
        'critical'
      );

      expect(errorLog.errorType).toBe('llm');
      expect(errorLog.severity).toBe('critical');
    });

    it('should log frontend errors', () => {
      const requestId = 'error_test_4';
      const errorLog = monitoringService.logError(
        'frontend',
        'React component error',
        requestId,
        'Component stack trace',
        'low'
      );

      expect(errorLog.errorType).toBe('frontend');
      expect(errorLog.severity).toBe('low');
    });

    it('should log network errors', () => {
      const requestId = 'error_test_5';
      const errorLog = monitoringService.logError(
        'network',
        'Connection timeout',
        requestId,
        'Network error details',
        'medium'
      );

      expect(errorLog.errorType).toBe('network');
      expect(errorLog.severity).toBe('medium');
    });

    it('should provide error breakdown', () => {
      // Log different types of errors
      monitoringService.logError('vector_store', 'Error 1', 'req1');
      monitoringService.logError('mcp', 'Error 2', 'req2');
      monitoringService.logError('llm', 'Error 3', 'req3');
      monitoringService.logError('frontend', 'Error 4', 'req4');
      monitoringService.logError('network', 'Error 5', 'req5');

      const breakdown = monitoringService.getErrorBreakdown();
      expect(breakdown.vector_store).toBe(1);
      expect(breakdown.mcp).toBe(1);
      expect(breakdown.llm).toBe(1);
      expect(breakdown.frontend).toBe(1);
      expect(breakdown.network).toBe(1);
    });
  });

  describe('Retry Operations', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      const failingOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await monitoringService.retryOperation(
        failingOperation,
        'retry_test',
        'vector_store',
        3
      );

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      const alwaysFailingOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        monitoringService.retryOperation(
          alwaysFailingOperation,
          'retry_fail_test',
          'vector_store',
          2
        )
      ).rejects.toThrow('Persistent failure');
    });

    it('should succeed on first attempt', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('immediate success');

      const result = await monitoringService.retryOperation(
        successfulOperation,
        'retry_success_test',
        'vector_store'
      );

      expect(result).toBe('immediate success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Feedback', () => {
    it('should record positive feedback', () => {
      const requestId = 'feedback_test_1';
      const feedback = monitoringService.recordUserFeedback(
        requestId,
        5,
        'Excellent response! Very helpful.',
        'excellent',
        'Keep up the good work'
      );

      expect(feedback.rating).toBe(5);
      expect(feedback.responseQuality).toBe('excellent');
      expect(feedback.feedback).toBe('Excellent response! Very helpful.');
    });

    it('should record negative feedback', () => {
      const requestId = 'feedback_test_2';
      const feedback = monitoringService.recordUserFeedback(
        requestId,
        1,
        'This response was not helpful at all.',
        'poor',
        'Please provide more specific answers'
      );

      expect(feedback.rating).toBe(1);
      expect(feedback.responseQuality).toBe('poor');
      expect(feedback.improvementSuggestions).toBe('Please provide more specific answers');
    });

    it('should record neutral feedback', () => {
      const requestId = 'feedback_test_3';
      const feedback = monitoringService.recordUserFeedback(
        requestId,
        3,
        'The response was okay but could be better.',
        'fair'
      );

      expect(feedback.rating).toBe(3);
      expect(feedback.responseQuality).toBe('fair');
    });

    it('should provide feedback breakdown', () => {
      // Record different types of feedback
      monitoringService.recordUserFeedback('req1', 1, 'Poor', 'poor');
      monitoringService.recordUserFeedback('req2', 2, 'Fair', 'fair');
      monitoringService.recordUserFeedback('req3', 4, 'Good', 'good');
      monitoringService.recordUserFeedback('req4', 5, 'Excellent', 'excellent');

      const breakdown = monitoringService.getFeedbackBreakdown();
      expect(breakdown.poor).toBe(1);
      expect(breakdown.fair).toBe(1);
      expect(breakdown.good).toBe(1);
      expect(breakdown.excellent).toBe(1);
    });

    it('should calculate user satisfaction', () => {
      monitoringService.recordUserFeedback('req1', 5, 'Great', 'excellent');
      monitoringService.recordUserFeedback('req2', 4, 'Good', 'good');
      monitoringService.recordUserFeedback('req3', 3, 'Okay', 'fair');

      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.userSatisfaction).toBe(4); // Average of 5, 4, 3
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate average latency', () => {
      const requestId = 'metrics_test';
      const tracker = monitoringService.startLatencyTracking(requestId);
      
      // Simulate some latency
      monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
      monitoringService.recordLatency(requestId, 'ragQuery', tracker.startTime);
      monitoringService.recordLatency(requestId, 'llmCompletion', tracker.startTime);
      monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);

      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should calculate error rate', () => {
      // Log some errors
      monitoringService.logError('vector_store', 'Error 1', 'req1');
      monitoringService.logError('mcp', 'Error 2', 'req2');

      // Add some successful requests
      const requestId = 'success_test';
      const tracker = monitoringService.startLatencyTracking(requestId);
      monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
      monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);

      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0); // Should have some error rate
      expect(metrics.successRate).toBeLessThan(100); // Should have some success rate
    });

    it('should calculate success rate', () => {
      // Add successful requests
      for (let i = 0; i < 5; i++) {
        const requestId = `success_${i}`;
        const tracker = monitoringService.startLatencyTracking(requestId);
        monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
        monitoringService.recordLatency(requestId, 'frontendDelivery', tracker.startTime);
      }

      // Add one error
      monitoringService.logError('vector_store', 'Error', 'error_req');

      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.successRate).toBe(80); // 4 out of 5 successful
    });
  });

  describe('Data Export and Cleanup', () => {
    it('should export logs correctly', () => {
      // Add some test data
      const requestId = 'export_test';
      const tracker = monitoringService.startLatencyTracking(requestId);
      monitoringService.recordLatency(requestId, 'userInput', tracker.startTime);
      monitoringService.logError('vector_store', 'Test error', requestId);
      monitoringService.recordUserFeedback(requestId, 4, 'Test feedback', 'good');

      const exportedData = monitoringService.exportLogs();
      
      expect(exportedData.latencyLogs.length).toBeGreaterThan(0);
      expect(exportedData.errorLogs.length).toBeGreaterThan(0);
      expect(exportedData.userFeedback.length).toBeGreaterThan(0);
      expect(exportedData.performanceMetrics).toBeDefined();
    });

    it('should cleanup old logs', () => {
      // Add some old logs (simulate by setting old timestamps)
      const oldRequestId = 'old_test';
      const oldTracker = monitoringService.startLatencyTracking(oldRequestId);
      oldTracker.startTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      monitoringService.recordLatency(oldRequestId, 'userInput', oldTracker.startTime);

      // Add some recent logs
      const newRequestId = 'new_test';
      const newTracker = monitoringService.startLatencyTracking(newRequestId);
      monitoringService.recordLatency(newRequestId, 'userInput', newTracker.startTime);

      const beforeCleanup = monitoringService.exportLogs();
      expect(beforeCleanup.latencyLogs.length).toBe(2);

      // Cleanup logs older than 24 hours
      monitoringService.cleanupOldLogs(24 * 60 * 60 * 1000);

      const afterCleanup = monitoringService.exportLogs();
      expect(afterCleanup.latencyLogs.length).toBe(1); // Only recent log remains
    });
  });
}); 