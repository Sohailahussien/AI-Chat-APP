/// <reference types="jest" />
import { ChromaService, ChromaConnectionError } from '../services/chromaService';
import { Document } from '@langchain/core/documents';
import { jest } from '@jest/globals';

jest.mock('chromadb');
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockImplementation(() => async (text: string) => ({
    data: [0.1, 0.2, 0.3],
  })),
}));

describe('ChromaService', () => {
  let chromaService: ChromaService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the instance to force reinitialization
    (ChromaService as any).instance = undefined;
    chromaService = ChromaService.getInstance();
  });

  describe('initialization', () => {
    test('initializes successfully', async () => {
      const mockHeartbeat = jest.fn().mockResolvedValue(true);
      const mockGetOrCreateCollection = jest.fn().mockResolvedValue({});
      
      (chromaService as any).client.heartbeat = mockHeartbeat;
      (chromaService as any).client.getOrCreateCollection = mockGetOrCreateCollection;

      await chromaService.initialize();
      
      expect(mockHeartbeat).toHaveBeenCalled();
      expect(mockGetOrCreateCollection).toHaveBeenCalledWith({ name: 'documents' });
    });

    test('retries on connection failure', async () => {
      const mockHeartbeat = jest.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(true);
      const mockGetOrCreateCollection = jest.fn().mockResolvedValue({});
      
      (chromaService as any).client.heartbeat = mockHeartbeat;
      (chromaService as any).client.getOrCreateCollection = mockGetOrCreateCollection;

      await chromaService.initialize();
      
      expect(mockHeartbeat).toHaveBeenCalledTimes(2);
    });

    test('throws ChromaConnectionError after max retries', async () => {
      const mockHeartbeat = jest.fn().mockRejectedValue(new Error('Connection failed'));
      (chromaService as any).client.heartbeat = mockHeartbeat;
      (chromaService as any).client.getOrCreateCollection = jest.fn();

      await expect(chromaService.initialize()).rejects.toThrow(ChromaConnectionError);
      expect(mockHeartbeat).toHaveBeenCalledTimes(3); // MAX_RETRIES
    });
  });

  describe('document operations', () => {
    beforeEach(async () => {
      const mockHeartbeat = jest.fn().mockResolvedValue(true);
      const mockGetOrCreateCollection = jest.fn().mockResolvedValue({});
      
      (chromaService as any).client.heartbeat = mockHeartbeat;
      (chromaService as any).client.getOrCreateCollection = mockGetOrCreateCollection;
      
      await chromaService.initialize();
      
      (chromaService as any).collection = {
        add: jest.fn().mockResolvedValue({}),
        query: jest.fn().mockResolvedValue({
          documents: [['doc1', 'doc2']],
          metadatas: [[{ source: 'test1' }, { source: 'test2' }]],
        }),
      };
    });

    test('adds documents successfully', async () => {
      const documents: Document[] = [
        { pageContent: 'test doc 1', metadata: { source: 'test1' } },
        { pageContent: 'test doc 2', metadata: { source: 'test2' } },
      ];

      await chromaService.addDocuments(documents);
      
      expect((chromaService as any).collection.add).toHaveBeenCalled();
    });

    test('performs similarity search successfully', async () => {
      const query = 'test query';
      const results = await chromaService.similaritySearch(query);

      expect(results).toHaveLength(2);
      expect(results[0].pageContent).toBe('doc1');
      expect(results[0].metadata).toEqual({ source: 'test1' });
    });

    test('throws error when not initialized', async () => {
      (chromaService as any).isInitialized = false;
      
      await expect(chromaService.addDocuments([])).rejects.toThrow('not initialized');
      await expect(chromaService.similaritySearch('')).rejects.toThrow('not initialized');
    });
  });
}); 