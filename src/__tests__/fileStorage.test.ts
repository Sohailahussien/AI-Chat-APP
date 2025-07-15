import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { FileStorage, UploadedFile } from '../services/fileStorage';

// Mock fs.promises methods
const mockAccess = jest.spyOn(fs.promises, 'access');
const mockWriteFile = jest.spyOn(fs.promises, 'writeFile');
const mockUnlink = jest.spyOn(fs.promises, 'unlink');

// Mock path module
jest.mock('path', () => ({
  basename: jest.fn((path: string) => path.split('/').pop() || ''),
  join: jest.fn((...args: string[]) => args.join('/')),
  parse: jest.fn((path: string) => ({
    name: path.split('.')[0],
    ext: '.' + path.split('.')[1],
  })),
}));

describe('FileStorage', () => {
  const mockUploadDir = '/uploads';
  let fileStorage: FileStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    fileStorage = new FileStorage(mockUploadDir);
  });

  describe('saveUploadedFile', () => {
    test('saves file successfully', async () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      const expectedPath = `${mockUploadDir}/test.pdf`;
      
      // Mock file doesn't exist and write succeeds
      mockAccess.mockRejectedValueOnce(new Error('ENOENT'));
      mockWriteFile.mockResolvedValueOnce(undefined);
      
      const result = await fileStorage.saveUploadedFile(mockFile);
      
      expect(result).toBe(expectedPath);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, mockFile.data);
    });

    test('generates unique filename for duplicate files', async () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      
      // First file exists, second doesn't
      mockAccess
        .mockResolvedValueOnce(undefined) // First file exists
        .mockRejectedValueOnce(new Error('ENOENT')); // Second file doesn't exist
      mockWriteFile.mockResolvedValueOnce(undefined);
      
      const result = await fileStorage.saveUploadedFile(mockFile);
      
      expect(result).toMatch(/\/test_\d+\.pdf$/);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    test('throws error on invalid file', async () => {
      const mockFile: UploadedFile = {
        name: '',
        data: Buffer.from(''),
      };
      
      await expect(fileStorage.saveUploadedFile(mockFile))
        .rejects
        .toThrow('Invalid file');
    });

    test('handles write errors', async () => {
      const mockFile: UploadedFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };
      
      mockAccess.mockRejectedValueOnce(new Error('ENOENT'));
      mockWriteFile.mockRejectedValueOnce(new Error('Write error'));
      
      await expect(fileStorage.saveUploadedFile(mockFile))
        .rejects
        .toThrow('Failed to save file');
    });
  });

  describe('deleteFile', () => {
    test('deletes existing file', async () => {
      const filePath = `${mockUploadDir}/test.pdf`;
      
      mockAccess.mockResolvedValueOnce(undefined);
      mockUnlink.mockResolvedValueOnce(undefined);
      
      await fileStorage.deleteFile(filePath);
      
      expect(mockUnlink).toHaveBeenCalledWith(filePath);
    });

    test('handles non-existent file', async () => {
      const filePath = `${mockUploadDir}/nonexistent.pdf`;
      
      mockAccess.mockRejectedValueOnce(new Error('ENOENT'));
      
      await expect(fileStorage.deleteFile(filePath))
        .rejects
        .toThrow('File not found');
    });

    test('handles delete errors', async () => {
      const filePath = `${mockUploadDir}/test.pdf`;
      
      mockAccess.mockResolvedValueOnce(undefined);
      mockUnlink.mockRejectedValueOnce(new Error('Delete error'));
      
      await expect(fileStorage.deleteFile(filePath))
        .rejects
        .toThrow('Failed to delete file');
    });
  });

  describe('getFilePath', () => {
    test('returns valid file path', () => {
      const filename = 'test.pdf';
      const expectedPath = `${mockUploadDir}/test.pdf`;
      
      const result = fileStorage.getFilePath(filename);
      
      expect(result).toBe(expectedPath);
    });

    test('sanitizes file path', () => {
      const filename = '../malicious/test.pdf';
      const expectedPath = `${mockUploadDir}/test.pdf`;
      
      const result = fileStorage.getFilePath(filename);
      
      expect(result).toBe(expectedPath);
      expect(result).not.toContain('..');
    });
  });
}); 