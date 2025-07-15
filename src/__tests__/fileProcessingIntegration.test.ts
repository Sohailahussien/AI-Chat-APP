import { jest } from '@jest/globals';
import path from 'path';
import { FileStorage, UploadedFile } from '../services/fileStorage';
import { processDocument } from '../utils/documentProcessing';
import { ChromaService } from '../services/chromaService';
import { Document } from '@langchain/core/documents';

// Mock dependencies
jest.mock('../utils/documentProcessing');
jest.mock('../services/chromaService', () => ({
  ChromaService: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      addDocuments: jest.fn(),
    })),
  },
}));

describe('File Processing Integration', () => {
  let fileStorage: FileStorage;
  let chromaService: ChromaService;
  const mockUploadDir = '/uploads';

  beforeEach(() => {
    jest.clearAllMocks();
    fileStorage = new FileStorage(mockUploadDir);
    chromaService = ChromaService.getInstance();
  });

  describe('processUploadedFile', () => {
    test('processes PDF file successfully', async () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      const mockFilePath = `${mockUploadDir}/test.pdf`;
      const mockProcessedContent = 'Processed PDF content';
      
      // Mock file storage
      jest.spyOn(fileStorage, 'saveUploadedFile').mockResolvedValue(mockFilePath);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue();
      
      // Mock document processing
      (processDocument as jest.Mock).mockResolvedValue(mockProcessedContent);
      
      // Mock Chroma service
      (chromaService.initialize as jest.Mock).mockResolvedValue();
      (chromaService.addDocuments as jest.Mock).mockResolvedValue();
      
      // Process the file
      await processUploadedFile(mockFile, fileStorage, chromaService);
      
      // Verify the flow
      expect(fileStorage.saveUploadedFile).toHaveBeenCalledWith(mockFile);
      expect(processDocument).toHaveBeenCalledWith(mockFilePath);
      expect(chromaService.addDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          pageContent: mockProcessedContent,
          metadata: {
            source: mockFile.name,
            type: 'pdf',
          },
        }),
      ]);
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });

    test('processes DOCX file successfully', async () => {
      const mockFile: UploadedFile = {
        name: 'test.docx',
        data: Buffer.from('test content'),
      };
      const mockFilePath = `${mockUploadDir}/test.docx`;
      const mockProcessedContent = 'Processed DOCX content';
      
      jest.spyOn(fileStorage, 'saveUploadedFile').mockResolvedValue(mockFilePath);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue();
      (processDocument as jest.Mock).mockResolvedValue(mockProcessedContent);
      (chromaService.initialize as jest.Mock).mockResolvedValue();
      (chromaService.addDocuments as jest.Mock).mockResolvedValue();
      
      await processUploadedFile(mockFile, fileStorage, chromaService);
      
      expect(fileStorage.saveUploadedFile).toHaveBeenCalledWith(mockFile);
      expect(processDocument).toHaveBeenCalledWith(mockFilePath);
      expect(chromaService.addDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          pageContent: mockProcessedContent,
          metadata: {
            source: mockFile.name,
            type: 'docx',
          },
        }),
      ]);
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });

    test('handles processing errors', async () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      const mockFilePath = `${mockUploadDir}/test.pdf`;
      
      jest.spyOn(fileStorage, 'saveUploadedFile').mockResolvedValue(mockFilePath);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue();
      (processDocument as jest.Mock).mockRejectedValue(new Error('Processing failed'));
      (chromaService.initialize as jest.Mock).mockResolvedValue();
      
      await expect(processUploadedFile(mockFile, fileStorage, chromaService))
        .rejects
        .toThrow('Processing failed');
      
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });

    test('handles unsupported file types', async () => {
      const mockFile: UploadedFile = {
        name: 'test.xyz',
        data: Buffer.from('test content'),
      };
      
      jest.spyOn(fileStorage, 'saveUploadedFile');
      
      await expect(processUploadedFile(mockFile, fileStorage, chromaService))
        .rejects
        .toThrow('Unsupported file type');
      
      expect(fileStorage.saveUploadedFile).not.toHaveBeenCalled();
    });

    test('cleans up files on error', async () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      const mockFilePath = `${mockUploadDir}/test.pdf`;
      
      jest.spyOn(fileStorage, 'saveUploadedFile').mockResolvedValue(mockFilePath);
      jest.spyOn(fileStorage, 'deleteFile').mockResolvedValue();
      (chromaService.initialize as jest.Mock).mockResolvedValue();
      (chromaService.addDocuments as jest.Mock).mockRejectedValue(new Error('Storage failed'));
      (processDocument as jest.Mock).mockResolvedValue('content');
      
      await expect(processUploadedFile(mockFile, fileStorage, chromaService))
        .rejects
        .toThrow('Storage failed');
      
      expect(fileStorage.deleteFile).toHaveBeenCalledWith(mockFilePath);
    });
  });
});

async function processUploadedFile(
  file: UploadedFile,
  fileStorage: FileStorage,
  chromaService: ChromaService
): Promise<void> {
  const supportedTypes = ['.pdf', '.docx', '.txt'];
  const fileExt = path.extname(file.name).toLowerCase();
  
  if (!supportedTypes.includes(fileExt)) {
    throw new Error('Unsupported file type');
  }
  
  let savedFilePath: string | null = null;
  
  try {
    await chromaService.initialize();
    savedFilePath = await fileStorage.saveUploadedFile(file);
    const content = await processDocument(savedFilePath);
    
    await chromaService.addDocuments([{
      pageContent: content,
      metadata: {
        source: file.name,
        type: fileExt.substring(1), // Remove the dot
      },
    }]);
  } catch (error) {
    if (savedFilePath) {
      await fileStorage.deleteFile(savedFilePath).catch(() => {}); // Best effort cleanup
    }
    throw error;
  }
  
  if (savedFilePath) {
    await fileStorage.deleteFile(savedFilePath);
  }
} 