import { MCPClient } from '../index';

describe('MCPClient', () => {
  let client: MCPClient;
  
  beforeEach(() => {
    client = new MCPClient();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('processDocument', () => {
    it('should process a document successfully', async () => {
      const mockResponse = {
        success: true,
        fileName: 'test.txt',
        message: 'Document processed successfully',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = await client.processDocument(file);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/mcp/processDocument', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });

    it('should handle processing errors', async () => {
      const errorResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'Processing failed' })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse);

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      await expect(async () => {
        await client.processDocument(file);
      }).rejects.toThrow('Processing failed');
    });
  });

  describe('addDocument', () => {
    it('should add a document successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Document added successfully',
        ids: ['doc-1'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.addDocument('test content', { source: 'test' });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/mcp/addDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'test content',
          metadata: { source: 'test' },
        }),
      });
    });

    it('should handle addition errors', async () => {
      const errorResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'Addition failed' })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse);

      await expect(async () => {
        await client.addDocument('test content', { source: 'test' });
      }).rejects.toThrow('Addition failed');
    });
  });

  describe('queryDocuments', () => {
    it('should query documents successfully', async () => {
      const mockResponse = {
        success: true,
        documents: ['doc1', 'doc2'],
        metadatas: [{ source: 'test1' }, { source: 'test2' }],
        distances: [0.1, 0.2],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.queryDocuments('test query', 2);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/mcp/queryDocuments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test query',
          limit: 2,
        }),
      });
    });

    it('should handle query errors', async () => {
      const errorResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'Query failed' })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse);

      await expect(async () => {
        await client.queryDocuments('test query');
      }).rejects.toThrow('Query failed');
    });
  });
}); 