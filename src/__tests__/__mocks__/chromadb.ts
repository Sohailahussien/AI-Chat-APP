const mockChromaClient = {
  createCollection: jest.fn().mockResolvedValue({
    add: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue({
      documents: ['test doc'],
      metadatas: [{ source: 'test' }],
      distances: [0.1],
    }),
    delete: jest.fn().mockResolvedValue(true),
  }),
  reset: jest.fn().mockResolvedValue(true),
};

export const ChromaClient = jest.fn().mockImplementation(() => mockChromaClient); 