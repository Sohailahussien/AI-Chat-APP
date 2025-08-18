import { FileStorage } from '../services/fileStorage';
import { VectorStore } from '../services/vectorStore';
import { processDocument } from '../utils/documentProcessing';
import { processUploadedFile } from '../services/fileProcessingService';

jest.mock('../services/fileStorage');
jest.mock('../services/vectorStore');
jest.mock('../utils/documentProcessing');

describe('File Processing Integration', () => {
  let fileStorage: jest.Mocked<FileStorage>;
  let vectorStore: jest.Mocked<VectorStore>;

  beforeEach(() => {
    fileStorage = new FileStorage() as jest.Mocked<FileStorage>;
    vectorStore = new VectorStore() as jest.Mocked<VectorStore>;
    jest.clearAllMocks();
  });

  describe('processUploadedFile', () => {
    it('processes PDF file successfully', async () => {
      const mockFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      const mockFilePath = '/uploads/test.pdf';
      const mockProcessedContent = 'Processed PDF content';

      // Setup mocks
      fileStorage.saveUploadedFile.mockResolvedValue(mockFilePath);
      fileStorage.deleteFile.mockResolvedValue();
      (processDocument as jest.Mock).mockResolvedValue(mockProcessedContent);
      vectorStore.addDocuments.mockResolvedValue();

      const result = await processUploadedFile(mockFile, fileStorage, vectorStore);

      expect(result).toEqual({
        success: true,
        fileName: mockFile.name,
        doc_id: expect.any(String),
      });

      expect(fileStorage.saveUploadedFile).toHaveBeenCalledWith(mockFile);
      expect(processDocument).toHaveBeenCalledWith(mockFilePath);
      expect(vectorStore.addDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          pageContent: mockProcessedContent,
          metadata: expect.objectContaining({ source: mockFile.name })
        })
      ]);
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });

    it('processes DOCX file successfully', async () => {
      const mockFile = {
        name: 'test.docx',
        data: Buffer.from('test content'),
      };
      const mockFilePath = '/uploads/test.docx';
      const mockProcessedContent = 'Processed DOCX content';

      // Setup mocks
      fileStorage.saveUploadedFile.mockResolvedValue(mockFilePath);
      fileStorage.deleteFile.mockResolvedValue();
      (processDocument as jest.Mock).mockResolvedValue(mockProcessedContent);
      vectorStore.addDocuments.mockResolvedValue();

      const result = await processUploadedFile(mockFile, fileStorage, vectorStore);

      expect(result).toEqual({
        success: true,
        fileName: mockFile.name,
        doc_id: expect.any(String),
      });

      expect(fileStorage.saveUploadedFile).toHaveBeenCalledWith(mockFile);
      expect(processDocument).toHaveBeenCalledWith(mockFilePath);
      expect(vectorStore.addDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          pageContent: mockProcessedContent,
          metadata: expect.objectContaining({ source: mockFile.name })
        })
      ]);
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });

    it('handles processing errors', async () => {
      const mockFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      const mockFilePath = '/uploads/test.pdf';

      // Setup mocks
      fileStorage.saveUploadedFile.mockResolvedValue(mockFilePath);
      fileStorage.deleteFile.mockResolvedValue();
      (processDocument as jest.Mock).mockRejectedValue(new Error('Processing failed'));

      await expect(processUploadedFile(mockFile, fileStorage, vectorStore))
        .rejects.toThrow('Processing failed');

      expect(fileStorage.saveUploadedFile).toHaveBeenCalledWith(mockFile);
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });

    it('handles file storage errors', async () => {
      const mockFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };

      // Setup mocks
      fileStorage.saveUploadedFile.mockRejectedValue(new Error('Storage failed'));

      await expect(processUploadedFile(mockFile, fileStorage, vectorStore))
        .rejects.toThrow('Storage failed');

      expect(fileStorage.saveUploadedFile).toHaveBeenCalledWith(mockFile);
    });
  });
}); 