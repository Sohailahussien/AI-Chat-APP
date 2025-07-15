import { Pipeline, pipeline } from '@xenova/transformers';
import { Embeddings } from '@langchain/core/embeddings';

export class EmbeddingService extends Embeddings {
  private static instance: EmbeddingService;
  private model: Pipeline | null = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2';

  private constructor() {
    super();
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('EmbeddingService can only be instantiated on the server side');
    }
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  private async initializeModel() {
    if (!this.model) {
      try {
        this.model = await pipeline('feature-extraction', this.modelName, {
          revision: 'main',
        });
      } catch (error) {
        console.error('Error initializing embedding model:', error);
        throw new Error('Failed to initialize embedding model');
      }
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.generateEmbedding(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.generateEmbeddings(texts);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    await this.initializeModel();
    
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      const output = await this.model(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert to regular array and ensure it's numbers
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }
} 