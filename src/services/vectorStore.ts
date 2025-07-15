import { Document } from '@langchain/core/documents';
import { ChromaService } from './chromaService';

export interface QueryResult {
  documents: string[][];
  metadatas: Record<string, any>[][];
  similarities: number[][];
}

export class VectorStore {
  private store: ChromaService;

  constructor() {
    // Get the singleton instance
    this.store = ChromaService.getInstance();
  }

  async initialize(): Promise<void> {
    // Initialize is a no-op since ChromaService handles initialization internally
    return Promise.resolve();
  }

  async addDocuments(documents: Document[]): Promise<void> {
    // Convert Documents to File objects for ChromaService
    const files = documents.map(doc => {
      const blob = new Blob([doc.pageContent], { type: 'text/plain' });
      return new File([blob], `doc_${Date.now()}.txt`, { type: 'text/plain' });
    });
    
    await this.store.addDocuments(files);
  }

  async queryDocuments(query: string, limit: number = 5): Promise<QueryResult> {
    const results = await this.store.similaritySearch(query, limit);
    
    return {
      documents: [results.map(doc => doc.pageContent)],
      metadatas: [results.map(doc => doc.metadata)],
      similarities: [results.map(() => 1)] // ChromaService doesn't expose similarities directly
    };
  }

  async clear(): Promise<void> {
    // Get a fresh instance
    this.store = ChromaService.getInstance();
  }
}