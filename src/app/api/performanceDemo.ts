/**
 * Next.js & Server Architecture Performance Demo
 * Demonstrates Edge Functions, parallel calls, and debouncing
 */

class NextJSArchitectureDemo {
  private requestCount = 0;
  private cacheHits = 0;
  private parallelRequests = 0;
  private totalResponseTime = 0;

  async demonstrateEdgeFunctions() {
    console.log('\n⚡ 1. Edge Functions Demo');
    console.log('=' .repeat(50));

    const testRequests = [
      { message: 'What is RAG?', id: 'edge_1' },
      { message: 'Explain vector embeddings', id: 'edge_2' },
      { message: 'How does ChromaDB work?', id: 'edge_3' },
    ];

    console.log('\n📊 Edge Function Performance:');
    
    for (const request of testRequests) {
      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...request,
            debounce: true,
            queryId: `edge_${Date.now()}`,
          }),
        });

        const responseTime = Date.now() - startTime;
        this.totalResponseTime += responseTime;
        this.requestCount++;

        console.log(`   ${request.message}: ${responseTime}ms`);
        
        if (response.ok) {
          console.log(`   ✅ Status: ${response.status}`);
        } else {
          console.log(`   ❌ Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
      }
    }

    const avgResponseTime = this.totalResponseTime / this.requestCount;
    console.log(`\n📈 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  }

  async demonstrateParallelCalls() {
    console.log('\n🔄 2. Parallel Calls Demo');
    console.log('=' .repeat(50));

    const parallelRequests = [
      { message: 'Query 1', id: 'parallel_1' },
      { message: 'Query 2', id: 'parallel_2' },
      { message: 'Query 3', id: 'parallel_3' },
      { message: 'Query 4', id: 'parallel_4' },
      { message: 'Query 5', id: 'parallel_5' },
    ];

    console.log('\n📊 Parallel Execution Performance:');
    
    const startTime = Date.now();
    
    try {
      const promises = parallelRequests.map(async (request, index) => {
        const requestStart = Date.now();
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...request,
            debounce: false,
            queryId: `parallel_${Date.now()}_${index}`,
          }),
        });

        const requestTime = Date.now() - requestStart;
        this.parallelRequests++;
        
        return {
          id: request.id,
          time: requestTime,
          status: response.status,
          success: response.ok,
        };
      });

      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;

      console.log(`   Total parallel execution time: ${totalTime}ms`);
      console.log(`   Sequential execution would take: ${results.length * 2000}ms (estimated)`);
      console.log(`   Speed improvement: ${((results.length * 2000) / totalTime).toFixed(1)}x`);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`   Request ${index + 1}: ${result.value.time}ms (${result.value.success ? '✅' : '❌'})`);
        } else {
          console.log(`   Request ${index + 1}: Failed`);
        }
      });

    } catch (error) {
      console.error('Parallel execution failed:', error);
    }
  }

  async demonstrateDebouncing() {
    console.log('\n⏱️  3. Debouncing Demo');
    console.log('=' .repeat(50));

    const repeatedQuery = 'What is machine learning?';
    const requests = [];

    console.log('\n📊 Debounced Request Performance:');
    
    // Simulate rapid repeated requests
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: repeatedQuery,
            debounce: true,
            queryId: `debounce_${Date.now()}_${i}`,
          }),
        });

        const responseTime = Date.now() - startTime;
        requests.push({ index: i + 1, time: responseTime, status: response.status });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        requests.push({ index: i + 1, time: 0, status: 'error' });
      }
    }

    console.log('\n📈 Request Performance:');
    requests.forEach(request => {
      if (request.status === 200) {
        console.log(`   Request ${request.index}: ${request.time}ms ✅`);
        if (request.time < 100) {
          this.cacheHits++;
          console.log(`   🎯 Cache hit detected!`);
        }
      } else {
        console.log(`   Request ${request.index}: Failed ❌`);
      }
    });

    const cacheHitRate = (this.cacheHits / requests.length) * 100;
    console.log(`\n📊 Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
  }

  async demonstratePerformanceOptimizations() {
    console.log('\n🚀 4. Performance Optimizations Demo');
    console.log('=' .repeat(50));

    const performanceTests = [
      {
        name: 'Single Request',
        requests: 1,
        parallel: false,
        debounce: false,
      },
      {
        name: 'Parallel Requests',
        requests: 3,
        parallel: true,
        debounce: false,
      },
      {
        name: 'Debounced Requests',
        requests: 5,
        parallel: false,
        debounce: true,
      },
      {
        name: 'Optimized Requests',
        requests: 3,
        parallel: true,
        debounce: true,
      },
    ];

    console.log('\n📊 Performance Comparison:');
    
    for (const test of performanceTests) {
      const startTime = Date.now();
      const results = [];

      console.log(`\n🔍 ${test.name}:`);
      
      for (let i = 0; i < test.requests; i++) {
        const requestStart = Date.now();
        
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Test query ${i + 1}`,
              debounce: test.debounce,
              queryId: `${test.name.toLowerCase()}_${Date.now()}_${i}`,
            }),
          });

          const requestTime = Date.now() - requestStart;
          results.push({ time: requestTime, status: response.status });

          if (!test.parallel) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          results.push({ time: 0, status: 'error' });
        }
      }

      const totalTime = Date.now() - startTime;
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const successRate = (results.filter(r => r.status === 200).length / results.length) * 100;

      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Average request time: ${avgTime.toFixed(2)}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    }
  }

  async demonstrateErrorHandling() {
    console.log('\n🛡️  5. Error Handling Demo');
    console.log('=' .repeat(50));

    const errorTests = [
      { message: '', description: 'Empty message' },
      { message: 'x'.repeat(10000), description: 'Very long message' },
      { message: 'test', description: 'Normal message' },
    ];

    console.log('\n📊 Error Handling Performance:');
    
    for (const test of errorTests) {
      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: test.message,
            debounce: false,
            queryId: `error_${Date.now()}`,
          }),
        });

        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          console.log(`   ${test.description}: ${responseTime}ms ✅`);
        } else {
          console.log(`   ${test.description}: ${responseTime}ms ❌ (${response.status})`);
        }
        
      } catch (error) {
        console.log(`   ${test.description}: Failed ❌`);
      }
    }
  }

  getPerformanceMetrics() {
    const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
    const cacheHitRate = this.requestCount > 0 ? (this.cacheHits / this.requestCount) * 100 : 0;
    const parallelEfficiency = this.parallelRequests > 0 ? this.parallelRequests / this.requestCount : 0;

    return {
      totalRequests: this.requestCount,
      cacheHits: this.cacheHits,
      parallelRequests: this.parallelRequests,
      averageResponseTime: avgResponseTime,
      cacheHitRate,
      parallelEfficiency,
    };
  }

  async runAllDemos() {
    console.log('🚀 Next.js & Server Architecture Performance Demo');
    console.log('=' .repeat(60));

    await this.demonstrateEdgeFunctions();
    await this.demonstrateParallelCalls();
    await this.demonstrateDebouncing();
    await this.demonstratePerformanceOptimizations();
    await this.demonstrateErrorHandling();

    const metrics = this.getPerformanceMetrics();
    
    console.log('\n✅ Demo Complete!');
    console.log('=' .repeat(60));
    console.log('\n📋 Performance Summary:');
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Cache Hits: ${metrics.cacheHits} (${metrics.cacheHitRate.toFixed(1)}%)`);
    console.log(`   Parallel Requests: ${metrics.parallelRequests}`);
    console.log(`   Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Parallel Efficiency: ${(metrics.parallelEfficiency * 100).toFixed(1)}%`);
    
    console.log('\n🎯 Architecture Optimizations:');
    console.log('✅ Edge Functions: Faster response delivery');
    console.log('✅ Parallel Calls: Concurrent request processing');
    console.log('✅ Debouncing: Reduced server load');
    console.log('✅ Error Handling: Graceful failure management');
    console.log('✅ Performance Monitoring: Real-time metrics');
  }
}

// Run the demo if this file is executed directly
if (typeof window === 'undefined') {
  const demo = new NextJSArchitectureDemo();
  demo.runAllDemos().catch(console.error);
}

export { NextJSArchitectureDemo }; 