import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export class DocumentLoader {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async processText(text: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    try {
      // Split text into chunks
      const textChunks = await this.textSplitter.splitText(text);

      // Convert chunks to documents
      const documents = textChunks.map((chunk: string) => new Document({
        pageContent: chunk,
        metadata: {
          ...metadata,
          chunk_length: chunk.length,
        },
      }));

      return documents;
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  }

  async processFile(file: File): Promise<Document[]> {
    try {
      const text = await file.text();
      return this.processText(text, {
        filename: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  async processURL(url: string): Promise<Document[]> {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return this.processText(text, {
        source_url: url,
        fetch_time: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing URL:', error);
      throw error;
    }
  }
} 