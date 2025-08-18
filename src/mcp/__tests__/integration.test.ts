import { UniversalMCPClient } from '../client/universalClient';

// Mock fetch
global.fetch = jest.fn();

describe('MCP Integration Tests', () => {
  let client: UniversalMCPClient;

  beforeEach(() => {
    client = new UniversalMCPClient({
      type: 'chromadb',
      baseUrl: '/api/mcp'
    });
    jest.clearAllMocks();
  });

  describe('Error Recovery Flow', () => {
    it('should handle concurrent operations', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        success: true,
        fileName: 'test.txt',
        doc_id: 'test-id'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const results = await Promise.all([
        client.processDocument(mockFile),
        client.processDocument(mockFile),
        client.processDocument(mockFile),
      ]);

      results.forEach(result => {
        expect(result).toEqual(mockResponse);
      });
    });

    it('should handle errors gracefully', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockError = {
        success: false,
        error: 'Processing failed'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError)
      });

      await expect(client.processDocument(mockFile))
        .rejects.toThrow('Processing failed');
    });
  });
}); 