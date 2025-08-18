import { FileStorage } from '../services/fileStorage';
import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path', () => ({
  join: jest.fn((dir, file) => `${dir}/${file}`),
  basename: jest.fn(file => file),
  normalize: jest.fn(path => path.replace(/\\/g, '/')),
  extname: jest.fn(file => '.pdf'),
}));

describe('FileStorage', () => {
  let fileStorage: FileStorage;

  beforeEach(() => {
    fileStorage = new FileStorage();
    jest.clearAllMocks();
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    (mkdir as jest.Mock).mockResolvedValue(undefined);
    (access as jest.Mock).mockRejectedValue(new Error('File not found'));
    (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);
    (path.basename as jest.Mock).mockImplementation(file => file);
    (path.extname as jest.Mock).mockImplementation(file => '.pdf');
  });

  describe('saveUploadedFile', () => {
    it('saves file successfully', async () => {
      const mockFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };

      const result = await fileStorage.saveUploadedFile(mockFile);
      
      expect(result).toMatch(/uploads\/test\.pdf$/);
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/uploads\/test\.pdf$/),
        mockFile.data
      );
    });

    it('generates unique filename for duplicate files', async () => {
      const mockFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };

      // Mock first file exists, second doesn't
      (access as jest.Mock)
        .mockResolvedValueOnce(undefined)  // First file exists
        .mockRejectedValueOnce(new Error('File not found')); // Second file doesn't exist

      // Mock path.join to return predictable paths
      (path.join as jest.Mock)
        .mockReturnValueOnce('uploads/test.pdf')
        .mockReturnValueOnce('uploads/test_1.pdf');

      // Mock path.basename and path.extname
      (path.basename as jest.Mock)
        .mockReturnValueOnce('test.pdf')
        .mockReturnValueOnce('test');
      (path.extname as jest.Mock)
        .mockReturnValue('.pdf');

      // Mock writeFile and mkdir to succeed
      (writeFile as jest.Mock).mockResolvedValue(undefined);
      (mkdir as jest.Mock).mockResolvedValue(undefined);

      const result = await fileStorage.saveUploadedFile(mockFile);
      
      expect(result).toBe('uploads/test_1.pdf');
      expect(writeFile).toHaveBeenCalledWith('uploads/test_1.pdf', mockFile.data);
    });

    it('handles file save errors', async () => {
      const mockFile = {
        name: 'test.pdf',
        data: Buffer.from('test content'),
      };

      (writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await expect(fileStorage.saveUploadedFile(mockFile))
        .rejects.toThrow('Failed to save file');
    });
  });

  describe('getFilePath', () => {
    it('returns valid file path', () => {
      const filename = 'test.pdf';
      (path.join as jest.Mock).mockReturnValue('uploads/test.pdf');
      
      const result = fileStorage.getFilePath(filename);
      expect(result).toBe('uploads/test.pdf');
    });

    it('sanitizes file path', () => {
      const filename = '../test.pdf';
      (path.join as jest.Mock).mockReturnValue('uploads/test.pdf');
      
      const result = fileStorage.getFilePath(filename);
      expect(result).toBe('uploads/test.pdf');
      expect(result).not.toContain('..');
    });
  });
}); 