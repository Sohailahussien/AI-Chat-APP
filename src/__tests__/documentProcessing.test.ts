/// <reference types="jest" />
import { processDocument } from '../utils/documentProcessing';
import fs from 'fs';
import path from 'path';
import type { Mock } from 'jest';

jest.mock('fs');
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('html-to-text');

describe('Document Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processes text files correctly', async () => {
    const mockContent = 'This is a test text file';
    (fs.readFileSync as unknown as Mock).mockReturnValue(mockContent);

    const result = await processDocument('test.txt');
    expect(result).toBe(mockContent);
  });

  test('processes PDF files correctly', async () => {
    const mockPdfText = 'This is a PDF document';
    require('pdf-parse').mockResolvedValue({ text: mockPdfText });

    const result = await processDocument('test.pdf');
    expect(result).toBe(mockPdfText);
  });

  test('processes DOCX files correctly', async () => {
    const mockDocxText = 'This is a Word document';
    require('mammoth').convertToHtml.mockResolvedValue({ value: mockDocxText });
    require('html-to-text').convert.mockReturnValue(mockDocxText);

    const result = await processDocument('test.docx');
    expect(result).toBe(mockDocxText);
  });

  test('throws error for unsupported file types', async () => {
    await expect(processDocument('test.xyz')).rejects.toThrow('Unsupported file type');
  });
}); 