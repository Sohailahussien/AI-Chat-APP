import { ChromaClient, Collection } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import { Document } from '@langchain/core/documents';

export class ChromaConnectionError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ChromaConnectionError.prototype);
    this.name = 'ChromaConnectionError';
  }
}

export class ChromaService {
  private static instance: ChromaService;
  private client: ChromaClient;
  private collection!: Collection;
  private embedder: any;
  private isInitialized: boolean = false;
  private connectionRetries: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    this.client = new ChromaClient({
      path: `http://${process.env.CHROMA_SERVER_HOST}:${process.env.CHROMA_SERVER_PORT}`,
    });
  }

  public static getInstance(): ChromaService {
    if (!ChromaService.instance) {
      ChromaService.instance = new ChromaService();
    }
    return ChromaService.instance;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionRetries < this.MAX_RETRIES) {
      try {
        await this.client.heartbeat();
        this.collection = await this.client.getOrCreateCollection({ name: 'documents' });
        this.connectionRetries = 0; // Reset counter on successful connection
        return;
      } catch (error: unknown) {
        this.connectionRetries++;
        if (this.connectionRetries >= this.MAX_RETRIES) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          throw new ChromaConnectionError(
            `Failed to connect to Chroma after ${this.MAX_RETRIES} attempts: ${message}`
          );
        }
        await this.sleep(this.RETRY_DELAY);
      }
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.connectWithRetry();
      const pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.embedder = async (text: string, options: any) => {
        const result = await pipelineInstance(text, options);
        return result;
      };
      this.isInitialized = true;
    } catch (error: unknown) {
      // Don't wrap ChromaConnectionError in another error
      if (error instanceof ChromaConnectionError) {
        throw error;
      }
      // For other errors, wrap them in a ChromaConnectionError
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ChromaConnectionError(`Failed to initialize ChromaService: ${message}`);
    }
  }

  public async addDocuments(documents: Document[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('ChromaService not initialized. Call initialize() first.');
    }

    try {
      const embeddings = await Promise.all(
        documents.map(async doc => {
          const result = await this.embedder(doc.pageContent, {
            pooling: 'mean',
            normalize: true,
          });
          return Array.from(result.data) as number[];
        })
      );

      await this.collection.add({
        ids: documents.map((_, i) => `doc_${Date.now()}_${i}`),
        embeddings,
        metadatas: documents.map(doc => doc.metadata || {}),
        documents: documents.map(doc => doc.pageContent),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add documents: ${message}`);
    }
  }

  public async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    if (!this.isInitialized) {
      throw new Error('ChromaService not initialized. Call initialize() first.');
    }

    try {
      const result = await this.embedder(query, {
        pooling: 'mean',
        normalize: true,
      });

      const results = await this.collection.query({
        queryEmbeddings: [Array.from(result.data) as number[]],
        nResults: k,
      });

      return results.documents[0].map((doc: string | null, i: number) => ({
        pageContent: doc || '',
        metadata: results.metadatas[0][i] || {},
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to perform similarity search: ${message}`);
    }
  }
} 