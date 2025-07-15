process.env.CHROMA_SERVER_HOST = 'localhost';
process.env.CHROMA_SERVER_PORT = '8000';

// Mock the transformers library
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
  env: {
    localModelPath: jest.fn(),
  },
})); 