import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export class DocumentProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async processText(text: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    const doc = new Document({ pageContent: text, metadata });
    return this.textSplitter.splitDocuments([doc]);
  }

  async processURL(url: string): Promise<Document[]> {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return this.processText(text, { source: url });
    } catch (error) {
      console.error('Error processing URL:', error);
      throw error;
    }
  }
} 