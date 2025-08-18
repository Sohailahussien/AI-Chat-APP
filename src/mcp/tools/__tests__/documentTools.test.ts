import { DocumentTools } from '../documentTools';
import { exec } from 'child_process';
import { writeFile, mkdir, unlink } from 'fs/promises';

// Mock the dependencies
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('DocumentTools', () => {
  let documentTools: DocumentTools;

  beforeEach(() => {
    documentTools = new DocumentTools();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('processDocument', () => {
    it('should process a document successfully', async () => {
      // Mock successful Python script execution
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, {
            stdout: JSON.stringify({
              success: true,
              message: 'Document processed successfully',
            }),
            stderr: '',
          });
        }
        return {} as any; // Return a mock ChildProcess
      });

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = await documentTools.processDocument({
        file: {
          buffer: Buffer.from('test content'),
          name: 'test.txt',
        },
      });

      expect(result.success).toBe(true);
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(unlink).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      // Mock Python script error
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(new Error('Processing failed'), {
            stdout: '',
            stderr: 'Error processing document',
          });
        }
        return {} as any; // Return a mock ChildProcess
      });

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = await documentTools.processDocument({
        file: {
          buffer: Buffer.from('test content'),
          name: 'test.txt',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('addDocument', () => {
    it('should add a document successfully', async () => {
      // Mock successful Python script execution
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, {
            stdout: JSON.stringify({
              success: true,
              message: 'Document added successfully',
              ids: ['doc-1'],
            }),
            stderr: '',
          });
        }
        return {} as any; // Return a mock ChildProcess
      });

      const result = await documentTools.addDocument({
        content: 'test content',
        metadata: { source: 'test' },
      });

      expect(result.success).toBe(true);
      expect(result.ids).toEqual(['doc-1']);
    });

    it('should handle addition errors', async () => {
      // Mock Python script error
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(new Error('Addition failed'), {
            stdout: '',
            stderr: 'Error adding document',
          });
        }
        return {} as any; // Return a mock ChildProcess
      });

      const result = await documentTools.addDocument({
        content: 'test content',
        metadata: { source: 'test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('queryDocuments', () => {
    it('should query documents successfully', async () => {
      // Mock successful Python script execution
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, {
            stdout: JSON.stringify({
              documents: ['doc1', 'doc2'],
              metadatas: [{ source: 'test1' }, { source: 'test2' }],
              distances: [0.1, 0.2],
            }),
            stderr: '',
          });
        }
        return {} as any; // Return a mock ChildProcess
      });

      const result = await documentTools.queryDocuments({
        query: 'test query',
        limit: 2,
      });

      expect(result.success).toBe(true);
      expect(result.documents).toHaveLength(2);
      expect(result.metadatas).toHaveLength(2);
      expect(result.distances).toHaveLength(2);
    });

    it('should handle query errors', async () => {
      // Mock Python script error
      const mockExec = exec as jest.MockedFunction<typeof exec>;
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(new Error('Query failed'), {
            stdout: '',
            stderr: 'Error querying documents',
          });
        }
        return {} as any; // Return a mock ChildProcess
      });

      const result = await documentTools.queryDocuments({
        query: 'test query',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.documents).toEqual([]);
    });
  });
}); 