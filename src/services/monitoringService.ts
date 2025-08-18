/**
 * Monitoring & Logging Service
 * Tracks latency, handles errors, and manages feedback loops
 */

export interface LatencyMetrics {
  userInputTime: number;
  ragQueryTime: number;
  llmCompletionTime: number;
  frontendDeliveryTime: number;
  totalLatency: number;
  timestamp: number;
  requestId: string;
}

export interface ErrorLog {
  errorType: 'vector_store' | 'mcp' | 'llm' | 'frontend' | 'network';
  errorMessage: string;
  stackTrace?: string;
  timestamp: number;
  requestId: string;
  retryCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserFeedback {
  requestId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  timestamp: number;
  responseQuality: 'poor' | 'fair' | 'good' | 'excellent';
  improvementSuggestions?: string;
}

export interface PerformanceMetrics {
  averageLatency: number;
  errorRate: number;
  successRate: number;
  userSatisfaction: number;
  totalRequests: number;
  totalErrors: number;
  totalFeedback: number;
}

export class MonitoringService {
  private latencyLogs: LatencyMetrics[] = [];
  private errorLogs: ErrorLog[] = [];
  private userFeedback: UserFeedback[] = [];
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  // Latency Tracking
  startLatencyTracking(requestId: string): { startTime: number; requestId: string } {
    return {
      startTime: Date.now(),
      requestId,
    };
  }

  recordLatency(
    requestId: string,
    stage: 'userInput' | 'ragQuery' | 'llmCompletion' | 'frontendDelivery',
    startTime: number
  ): void {
    const endTime = Date.now();
    const duration = endTime - startTime;

    const existingLog = this.latencyLogs.find(log => log.requestId === requestId);
    
    if (existingLog) {
      switch (stage) {
        case 'userInput':
          existingLog.userInputTime = duration;
          break;
        case 'ragQuery':
          existingLog.ragQueryTime = duration;
          break;
        case 'llmCompletion':
          existingLog.llmCompletionTime = duration;
          break;
        case 'frontendDelivery':
          existingLog.frontendDeliveryTime = duration;
          existingLog.totalLatency = endTime - existingLog.timestamp;
          break;
      }
    } else {
      const newLog: LatencyMetrics = {
        requestId,
        userInputTime: stage === 'userInput' ? duration : 0,
        ragQueryTime: stage === 'ragQuery' ? duration : 0,
        llmCompletionTime: stage === 'llmCompletion' ? duration : 0,
        frontendDeliveryTime: stage === 'frontendDelivery' ? duration : 0,
        totalLatency: 0,
        timestamp: startTime,
      };
      this.latencyLogs.push(newLog);
    }

    console.log(`📊 Latency [${stage}]: ${duration}ms (Request: ${requestId})`);
  }

  // Error Handling
  logError(
    errorType: ErrorLog['errorType'],
    errorMessage: string,
    requestId: string,
    stackTrace?: string,
    severity: ErrorLog['severity'] = 'medium'
  ): ErrorLog {
    const errorLog: ErrorLog = {
      errorType,
      errorMessage,
      stackTrace,
      timestamp: Date.now(),
      requestId,
      retryCount: 0,
      severity,
    };

    this.errorLogs.push(errorLog);
    console.error(`❌ Error [${errorType}]: ${errorMessage} (Request: ${requestId}, Severity: ${severity})`);

    // Alert for critical errors
    if (severity === 'critical') {
      this.sendAlert(errorLog);
    }

    return errorLog;
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    requestId: string,
    errorType: ErrorLog['errorType'],
    maxRetries: number = this.retryConfig.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`✅ Retry successful on attempt ${attempt + 1} (Request: ${requestId})`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log the error
        this.logError(
          errorType,
          lastError.message,
          requestId,
          lastError.stack,
          attempt === maxRetries ? 'critical' : 'medium'
        );

        if (attempt < maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          );
          
          console.log(`🔄 Retrying in ${delay}ms (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private sendAlert(errorLog: ErrorLog): void {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.error(`🚨 CRITICAL ALERT: ${errorLog.errorType} error - ${errorLog.errorMessage}`);
    console.error(`Request ID: ${errorLog.requestId}`);
    console.error(`Timestamp: ${new Date(errorLog.timestamp).toISOString()}`);
  }

  // User Feedback
  recordUserFeedback(
    requestId: string,
    rating: UserFeedback['rating'],
    feedback: string,
    responseQuality: UserFeedback['responseQuality'],
    improvementSuggestions?: string
  ): UserFeedback {
    const userFeedback: UserFeedback = {
      requestId,
      rating,
      feedback,
      timestamp: Date.now(),
      responseQuality,
      improvementSuggestions,
    };

    this.userFeedback.push(userFeedback);
    console.log(`⭐ User Feedback [${rating}/5]: ${feedback} (Request: ${requestId})`);

    // Use feedback to improve future responses
    this.processFeedbackForImprovement(userFeedback);

    return userFeedback;
  }

  private processFeedbackForImprovement(feedback: UserFeedback): void {
    if (feedback.rating <= 2) {
      // Poor rating - flag for review
      console.log(`⚠️ Poor response detected (Rating: ${feedback.rating}/5)`);
      console.log(`Feedback: ${feedback.feedback}`);
      
      if (feedback.improvementSuggestions) {
        console.log(`Suggestions: ${feedback.improvementSuggestions}`);
      }
    } else if (feedback.rating >= 4) {
      // Good rating - reinforce positive patterns
      console.log(`✅ Excellent response (Rating: ${feedback.rating}/5)`);
      console.log(`Feedback: ${feedback.feedback}`);
    }
  }

  // Performance Analytics
  getPerformanceMetrics(): PerformanceMetrics {
    const totalRequests = this.latencyLogs.length;
    const totalErrors = this.errorLogs.length;
    const totalFeedback = this.userFeedback.length;

    const averageLatency = totalRequests > 0 
      ? this.latencyLogs.reduce((sum, log) => sum + log.totalLatency, 0) / totalRequests 
      : 0;

    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const successRate = 100 - errorRate;

    const userSatisfaction = totalFeedback > 0 
      ? this.userFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedback 
      : 0;

    return {
      averageLatency,
      errorRate,
      successRate,
      userSatisfaction,
      totalRequests,
      totalErrors,
      totalFeedback,
    };
  }

  getLatencyBreakdown(): {
    userInput: number;
    ragQuery: number;
    llmCompletion: number;
    frontendDelivery: number;
  } {
    const logs = this.latencyLogs.filter(log => log.totalLatency > 0);
    
    if (logs.length === 0) {
      return { userInput: 0, ragQuery: 0, llmCompletion: 0, frontendDelivery: 0 };
    }

    return {
      userInput: logs.reduce((sum, log) => sum + log.userInputTime, 0) / logs.length,
      ragQuery: logs.reduce((sum, log) => sum + log.ragQueryTime, 0) / logs.length,
      llmCompletion: logs.reduce((sum, log) => sum + log.llmCompletionTime, 0) / logs.length,
      frontendDelivery: logs.reduce((sum, log) => sum + log.frontendDeliveryTime, 0) / logs.length,
    };
  }

  getErrorBreakdown(): Record<ErrorLog['errorType'], number> {
    const breakdown: Record<ErrorLog['errorType'], number> = {
      vector_store: 0,
      mcp: 0,
      llm: 0,
      frontend: 0,
      network: 0,
    };

    this.errorLogs.forEach(error => {
      breakdown[error.errorType]++;
    });

    return breakdown;
  }

  getFeedbackBreakdown(): Record<UserFeedback['responseQuality'], number> {
    const breakdown: Record<UserFeedback['responseQuality'], number> = {
      poor: 0,
      fair: 0,
      good: 0,
      excellent: 0,
    };

    this.userFeedback.forEach(feedback => {
      breakdown[feedback.responseQuality]++;
    });

    return breakdown;
  }

  // Cleanup old logs
  cleanupOldLogs(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const cutoffTime = Date.now() - maxAge;

    this.latencyLogs = this.latencyLogs.filter(log => log.timestamp > cutoffTime);
    this.errorLogs = this.errorLogs.filter(log => log.timestamp > cutoffTime);
    this.userFeedback = this.userFeedback.filter(feedback => feedback.timestamp > cutoffTime);

    console.log(`🧹 Cleaned up old logs (cutoff: ${new Date(cutoffTime).toISOString()})`);
  }

  // Export logs for analysis
  exportLogs(): {
    latencyLogs: LatencyMetrics[];
    errorLogs: ErrorLog[];
    userFeedback: UserFeedback[];
    performanceMetrics: PerformanceMetrics;
  } {
    return {
      latencyLogs: [...this.latencyLogs],
      errorLogs: [...this.errorLogs],
      userFeedback: [...this.userFeedback],
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }
}

// Global monitoring instance
export const monitoringService = new MonitoringService(); 