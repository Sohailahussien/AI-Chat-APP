/// <reference types="jest" />
import { processDocument } from '../utils/documentProcessing';
import fs from 'fs';

jest.mock('fs');
jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn()
}));
jest.mock('html-to-text', () => ({
  convert: jest.fn()
}));

const pdfParse = require('pdf-parse').default;
const mammoth = require('mammoth');
const { convert } = require('html-to-text');

describe('Document Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test content'));
  });

  test('processes PDF files correctly', async () => {
    const mockPdfText = 'This is a PDF document';
    pdfParse.mockResolvedValue({ text: mockPdfText });

    const result = await processDocument('test.pdf');
    expect(result).toBe(mockPdfText);
    expect(pdfParse).toHaveBeenCalled();
  });

  test('processes DOCX files correctly', async () => {
    const mockDocxText = 'This is a Word document';
    mammoth.convertToHtml.mockResolvedValue({ value: `<p>${mockDocxText}</p>` });
    convert.mockReturnValue(mockDocxText);

    const result = await processDocument('test.docx');
    expect(result).toBe(mockDocxText);
    expect(mammoth.convertToHtml).toHaveBeenCalled();
    expect(convert).toHaveBeenCalled();
  });

  test('processes TXT files correctly', async () => {
    const mockTxtContent = 'This is a text file';
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from(mockTxtContent));

    const result = await processDocument('test.txt');
    expect(result).toBe(mockTxtContent);
  });

  test('handles unsupported file types', async () => {
    await expect(processDocument('test.xyz'))
      .rejects.toThrow('Unsupported file type');
  });

  test('handles PDF processing errors', async () => {
    pdfParse.mockRejectedValue(new Error('PDF processing failed'));

    await expect(processDocument('test.pdf'))
      .rejects.toThrow('Error processing PDF file');
  });

  test('handles DOCX processing errors', async () => {
    mammoth.convertToHtml.mockRejectedValue(new Error('DOCX processing failed'));

    await expect(processDocument('test.docx'))
      .rejects.toThrow('Error processing DOCX file');
  });

  test('handles file read errors', async () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Error reading file');
    });

    await expect(processDocument('test.txt'))
      .rejects.toThrow('Error reading file');
  });
}); 