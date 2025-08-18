import { Pool } from 'pg';
import { DocumentTools } from '../tools/documentTools';

interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class PostgreSQLMCPServer {
  private pool: Pool;
  private documentTools: DocumentTools;

  constructor(config: PostgreSQLConfig) {
    this.pool = new Pool(config);
    this.documentTools = new DocumentTools();
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Create tables if they don't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          doc_id VARCHAR(255) UNIQUE NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id SERIAL PRIMARY KEY,
          doc_id VARCHAR(255) NOT NULL,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB,
          embedding_vector REAL[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (doc_id) REFERENCES documents(doc_id) ON DELETE CASCADE
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS queries (
          id SERIAL PRIMARY KEY,
          query_text TEXT NOT NULL,
          results JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('Error initializing PostgreSQL database:', error);
    }
  }

  async processDocument(params: { file: any; instructions?: any }) {
    try {
      // Process document using existing tools
      const result = await this.documentTools.processDocument(params);
      
      if (result.success) {
        // Store in PostgreSQL
        await this.pool.query(
          'INSERT INTO documents (doc_id, content, metadata) VALUES ($1, $2, $3) ON CONFLICT (doc_id) DO UPDATE SET content = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP',
          [result.doc_id, result.content, JSON.stringify(result.metadata)]
        );

        // Store chunks if available
        if (result.query_results?.results?.documents) {
          for (let i = 0; i < result.query_results.results.documents.length; i++) {
            await this.pool.query(
              'INSERT INTO document_chunks (doc_id, chunk_index, content, metadata) VALUES ($1, $2, $3, $4)',
              [
                result.doc_id,
                i,
                result.query_results.results.documents[i],
                JSON.stringify(result.query_results.results.metadatas?.[i] || {})
              ]
            );
          }
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async queryDocuments(params: { query: string; limit?: number }) {
    try {
      // First try PostgreSQL search
      const pgResults = await this.pool.query(`
        SELECT d.doc_id, d.content, d.metadata, 
               similarity(d.content, $1) as relevance
        FROM documents d
        WHERE d.content ILIKE $2
        ORDER BY relevance DESC
        LIMIT $3
      `, [`%${params.query}%`, `%${params.query}%`, params.limit || 5]);

      if (pgResults.rows.length > 0) {
        return {
          success: true,
          documents: pgResults.rows.map(row => row.content),
          metadatas: pgResults.rows.map(row => row.metadata),
          distances: pgResults.rows.map(row => 1 - row.relevance)
        };
      }

      // Fallback to ChromaDB
      return await this.documentTools.queryDocuments({ query: params.query, limit: params.limit });
    } catch (error) {
      console.error('PostgreSQL query failed, falling back to ChromaDB:', error);
      return await this.documentTools.queryDocuments({ query: params.query, limit: params.limit });
    }
  }

  async addDocument(params: { content: string; metadata: any }) {
    try {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.pool.query(
        'INSERT INTO documents (doc_id, content, metadata) VALUES ($1, $2, $3)',
        [docId, params.content, JSON.stringify(params.metadata)]
      );

      return {
        success: true,
        doc_id: docId,
        message: 'Document added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async getDocumentHistory(limit: number = 10) {
    try {
      const result = await this.pool.query(`
        SELECT doc_id, content, metadata, created_at
        FROM documents
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);

      return {
        success: true,
        documents: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async searchQueries(query: string, limit: number = 5) {
    try {
      const result = await this.pool.query(`
        SELECT query_text, results, created_at
        FROM queries
        WHERE query_text ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [`%${query}%`, limit]);

      return {
        success: true,
        queries: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async close() {
    await this.pool.end();
  }
} 