import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { convert } from 'html-to-text';

declare module 'pdf-parse';

export async function processDocument(filePath: string): Promise<string> {
  const fileExtension = path.extname(filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  switch (fileExtension) {
    case '.txt':
      return fileBuffer.toString();
    
    case '.pdf':
      try {
        const pdfData = await pdf(fileBuffer);
        return pdfData.text;
      } catch (error: unknown) {
        throw new Error(`Error processing PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    
    case '.docx':
      try {
        const { value } = await mammoth.convertToHtml({ buffer: fileBuffer });
        return convert(value, {
          wordwrap: 130,
          preserveNewlines: true,
        });
      } catch (error: unknown) {
        throw new Error(`Error processing DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    
    default:
      throw new Error('Unsupported file type');
  }
} 