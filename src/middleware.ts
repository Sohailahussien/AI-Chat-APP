import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge function configuration
export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/mcp/:path*',
  ],
};

// Cache for debounced requests
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Performance monitoring
const performanceMetrics = {
  totalRequests: 0,
  cachedRequests: 0,
  rateLimitedRequests: 0,
  averageResponseTime: 0,
};

export function middleware(request: NextRequest) {
  // Dev bypass to ensure chat access while debugging
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return NextResponse.next();
  }
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  // Only process POST requests
  if (method !== 'POST') {
    return NextResponse.next();
  }

  // Extract client IP for rate limiting
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting check
  const now = Date.now();
  const clientRateLimit = rateLimitMap.get(clientIP);
  
  if (clientRateLimit && now < clientRateLimit.resetTime) {
    if (clientRateLimit.count >= RATE_LIMIT) {
      performanceMetrics.rateLimitedRequests++;
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    clientRateLimit.count++;
  } else {
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
  }

  // Update performance metrics
  performanceMetrics.totalRequests++;

  // Add performance headers
  const response = NextResponse.next();
  response.headers.set('X-Edge-Cache', 'enabled');
  response.headers.set('X-Rate-Limit-Remaining', String(RATE_LIMIT - (clientRateLimit?.count || 0)));
  response.headers.set('X-Request-Start', startTime.toString());

  // Add CORS headers for Edge Functions
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

// Export performance metrics for monitoring
export function getPerformanceMetrics() {
  return {
    ...performanceMetrics,
    cacheHitRate: performanceMetrics.totalRequests > 0 
      ? (performanceMetrics.cachedRequests / performanceMetrics.totalRequests) * 100 
      : 0,
    rateLimitRate: performanceMetrics.totalRequests > 0 
      ? (performanceMetrics.rateLimitedRequests / performanceMetrics.totalRequests) * 100 
      : 0,
  };
} 