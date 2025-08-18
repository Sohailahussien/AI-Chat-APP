import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

describe('MCP API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET handler', () => {
    it('should handle GET requests', async () => {
      const mockRequest = new NextRequest(new Request('http://localhost/api/mcp'));
      
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('tools');
    });
  });

  describe('POST handler', () => {
    it('should handle POST requests with JSON body', async () => {
      const mockRequest = new NextRequest(
        new Request('http://localhost/api/mcp', {
          method: 'POST',
          body: JSON.stringify({ 
            toolName: 'queryDocuments',
            params: { query: 'test query', limit: 5 }
          }),
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const response = await POST(mockRequest);
      
      // The route should delegate to /api/mcp/tools
      expect(response.status).toBe(200);
    });

    it('should handle POST requests with form data', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test content']), 'test.pdf');
      
      const mockRequest = new NextRequest(
        new Request('http://localhost/api/mcp', {
          method: 'POST',
          body: formData
        })
      );

      const response = await POST(mockRequest);
      
      // The route should delegate to /api/mcp/tools
      expect(response.status).toBe(200);
    });

    it('should handle malformed JSON', async () => {
      const mockRequest = new NextRequest(
        new Request('http://localhost/api/mcp', {
          method: 'POST',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const response = await POST(mockRequest);
      
      // Should handle the error gracefully
      expect(response.status).toBe(200);
    });
  });
}); 