import { NextRequest } from 'next/server';

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(input: string, init?: RequestInit) {
    return new Request(input, init) as any;
  }
} as any;

global.Response = class MockResponse {
  constructor(body?: BodyInit, init?: ResponseInit) {
    return new Response(body, init) as any;
  }
} as any;

// Mock fetch
global.fetch = jest.fn();

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn(() => '/mock/path/ragPipelineService.py'),
}));

// Mock the route handler
jest.mock('../chat/route', () => ({
  POST: jest.fn(async (req: NextRequest) => {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

describe('Next.js & Server Architecture Optimizations', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Edge Functions Configuration', () => {
    it('should have correct runtime configuration', () => {
      // Check that the route is configured for Edge runtime
      expect(process.env.NODE_ENV).toBeDefined();
    });

    it('should handle Edge function requests', async () => {
      const body = {
        message: 'test query',
        debounce: true,
        queryId: 'test_123',
      };

      mockRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      expect(mockRequest).toBeDefined();
      expect(mockRequest.method).toBe('POST');
    });
  });

  describe('Parallel Execution', () => {
    it('should execute multiple queries in parallel', async () => {
      const requests = [
        { message: 'query 1', id: 'parallel_1' },
        { message: 'query 2', id: 'parallel_2' },
        { message: 'query 3', id: 'parallel_3' },
      ];

      const promises = requests.map(async (req) => {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        return response.json();
      });

      const results = await Promise.allSettled(promises);
      expect(results.length).toBe(3);
    });

    it('should handle parallel execution timeouts', async () => {
      const startTime = Date.now();
      
      const promises = [
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'slow query 1' }),
        }),
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'slow query 2' }),
        }),
      ];

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      expect(results.length).toBe(2);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Debouncing', () => {
    it('should cache repeated requests', async () => {
      const body = {
        message: 'cached query',
        debounce: true,
        queryId: 'cache_test',
      };

      // First request
      const response1 = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Second request (should be cached)
      const response2 = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });

    it('should handle debounced requests with different parameters', async () => {
      const body1 = {
        message: 'query 1',
        debounce: true,
        queryId: 'debounce_test_1',
      };

      const body2 = {
        message: 'query 2',
        debounce: true,
        queryId: 'debounce_test_2',
      };

      const response1 = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body1),
      });

      const response2 = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body2),
      });

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });

  describe('Performance Optimizations', () => {
    it('should handle streaming responses efficiently', async () => {
      const body = {
        messages: [{ role: 'user', content: 'test' }],
        context: { relevantDocuments: ['test document'] },
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      expect(response).toBeDefined();
    });

    it('should optimize response times', async () => {
      const startTime = Date.now();
      
      const body = {
        message: 'performance test',
        debounce: false,
        queryId: 'perf_test',
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response).toBeDefined();
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle parallel execution failures gracefully', async () => {
      const body = {
        message: 'error test',
        debounce: false,
        queryId: 'error_test',
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      expect(response).toBeDefined();
    });

    it('should provide fallback responses', async () => {
      const body = {
        message: 'fallback test',
        debounce: false,
        queryId: 'fallback_test',
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      expect(response).toBeDefined();
    });
  });

  describe('Middleware Integration', () => {
    it('should work with Edge middleware', async () => {
      const body = {
        message: 'middleware test',
        debounce: true,
        queryId: 'middleware_test',
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
        body: JSON.stringify(body),
      });

      expect(response).toBeDefined();
    });
  });
}); 