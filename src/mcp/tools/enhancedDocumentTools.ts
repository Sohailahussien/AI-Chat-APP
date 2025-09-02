import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { CohereClient } from 'cohere-ai';
// Conditional imports to avoid build-time issues
let pdf: any = null;
let XLSX: any = null;
let Papa: any = null;

// Only import these modules at runtime, not during build
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  try {
    pdf = require('pdf-parse');
    XLSX = require('xlsx');
    Papa = require('papaparse');
  } catch (error) {
    console.error('Failed to import document processing libraries:', error);
  }
}

// Initialize Cohere client only if API key is available
let cohere: CohereClient | null = null;
if (process.env.COHERE_API_KEY && process.env.COHERE_API_KEY !== 'your-cohere-api-key-here') {
  try {
    cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
    console.log('✅ Cohere client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Cohere client:', error);
    cohere = null;
  }
} else {
  console.log('⚠️ Cohere API key not configured, using keyword similarity only');
}

// JSON persistence for development
const STORAGE_PATH = path.join(process.cwd(), 'uploads', 'documents.json');

async function loadStorage() {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME) {
    return { documents: [], userDocuments: {} };
  }
  
  try {
    const data = await readFile(STORAGE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { documents: [], userDocuments: {} };
  }
}

async function saveStorage(store: any) {
  try {
    await mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    await writeFile(STORAGE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save storage:', error);
  }
}

async function cohereEmbedding(text: string) {
  if (!cohere) {
    throw new Error('Cohere client not initialized - API key not configured');
  }
  
  const response = await cohere.embed({
    texts: [text],
    model: "embed-english-light-v3.0",
  });
  const embeddings = response.embeddings;
  if (Array.isArray(embeddings) && embeddings.length > 0) {
    return embeddings[0] as number[];
  }
  throw new Error('No embeddings returned from Cohere');
}

// Cosine similarity helper
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

// Simple keyword-based similarity fallback
function keywordSimilarity(query: string, text: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 1)); // Reduced to 1 character
  const textWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 1)); // Reduced to 1 character
  
  const commonWords = new Set([...queryWords].filter(x => textWords.has(x)));
  const similarity = commonWords.size / Math.max(queryWords.size, 1);
  
  // Give a minimum score if no common words but document exists
  const minScore = text.length > 0 ? 0.05 : 0;
  const finalScore = Math.max(similarity, minScore);
  
  console.log('🔍 Keyword similarity calculation:', {
    queryWords: Array.from(queryWords),
    textWords: Array.from(textWords).slice(0, 10),
    commonWords: Array.from(commonWords),
    similarity: similarity,
    finalScore: finalScore
  });
  
  return finalScore;
}

// Cohere embedding-based similarity with improved fallback
async function embeddingSimilarity(query: string, text: string): Promise<{score: number, source: string}> {
  const useFallback = process.env.USE_FALLBACK !== "false"; // Default to true
  
  // If Cohere is not available, use keyword similarity directly
  if (!cohere) {
    console.log('⚠️ Cohere not available, using keyword similarity');
    const keywordScore = keywordSimilarity(query, text);
    return { score: keywordScore, source: "keyword_only" };
  }
  
  try {
    console.log('🔍 Computing Cohere embedding similarity for query:', query.substring(0, 50) + '...');
    console.log('📄 Text length:', text.length, 'characters');
    
    const [queryVec, textVec] = await Promise.all([
      cohereEmbedding(query),
      cohereEmbedding(text)
    ]);

    console.log('✅ Cohere embeddings generated - Query vector length:', queryVec.length, 'Text vector length:', textVec.length);
    
    const similarity = cosineSimilarity(queryVec, textVec);
    console.log('📊 Cosine similarity score:', similarity);
    
    return { score: similarity, source: "embedding" };
  } catch (error) {
    if (useFallback) {
      console.warn("⚠️ Embedding provider failed, using keyword fallback...");
      const fallbackScore = keywordSimilarity(query, text);
      return { score: fallbackScore, source: "fallback" };
    } else {
      console.error("❌ Embedding provider failed and fallback is disabled:", error);
      throw error;
    }
  }
}

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    source_type: string;
    user_id: string;
    chunk_index: number;
    timestamp: Date;
  };
}

// Global storage to ensure persistence across all API route instances
declare global {
  var __documentStorage: {
    documents: DocumentChunk[];
    userDocuments: Map<string, DocumentChunk[]>;
  } | undefined;
}

// Initialize global storage synchronously, then hydrate asynchronously
if (!global.__documentStorage) {
  global.__documentStorage = {
    documents: [],
    userDocuments: new Map()
  };
  
  // Only load storage if we're in a runtime environment (not during build)
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' && process.env.NEXT_RUNTIME) {
    loadStorage()
      .then(stored => {
        try {
          const store = global.__documentStorage!;
          // Replace array contents in-place to preserve references
          if (Array.isArray(stored.documents)) {
            store.documents.splice(0, store.documents.length, ...stored.documents);
          }
          // Rebuild map in-place
          store.userDocuments.clear();
          if (stored.userDocuments && typeof stored.userDocuments === 'object') {
            for (const [uid, docs] of Object.entries(stored.userDocuments)) {
              store.userDocuments.set(uid, (docs as unknown) as any);
            }
          }
          console.log('📁 Loaded persistent storage:', {
            documents: store.documents.length,
            users: Array.from(store.userDocuments.keys())
          });
        } catch (e) {
          console.error('Failed hydrating persistent storage:', e);
        }
      })
      .catch(err => {
        console.warn('No persistent storage found, starting empty:', err?.message || err);
      });
  }
}

export class EnhancedDocumentTools {
  private documents: DocumentChunk[] = global.__documentStorage!.documents;
  private userDocuments: Map<string, DocumentChunk[]> = global.__documentStorage!.userDocuments;

  private async saveTemporaryFile(file: Buffer, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    try {
      console.log('EnhancedDocumentTools: Creating upload directory:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
      console.log('EnhancedDocumentTools: Directory created successfully');
      
      console.log('EnhancedDocumentTools: Writing file to:', filePath);
      await writeFile(filePath, file);
      console.log('EnhancedDocumentTools: File written successfully');
      
      return filePath;
    } catch (error) {
      console.log('EnhancedDocumentTools: Error in saveTemporaryFile:', error);
      throw new Error(`Failed to save temporary file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  private async extractTextFromFile(filePath: string, fileName: string): Promise<string> {
    // Skip file processing during build time
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME) {
      throw new Error('File processing not available during build time');
    }
    
    const fileExt = path.extname(fileName).toLowerCase();
    
    try {
      console.log(`🔍 Extracting text from ${fileName} (${fileExt})`);
      
      // Text files (TXT, MD, etc.)
      if (fileExt === '.txt' || fileExt === '.md' || fileExt === '.rtf') {
        return await readFile(filePath, 'utf8');
      }
      
      // Microsoft Word documents
      else if (fileExt === '.docx' || fileExt === '.doc') {
        const buffer = await readFile(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }
      
      // PDF files
      else if (fileExt === '.pdf') {
        const buffer = await readFile(filePath);
        const data = await pdf(buffer);
        return data.text;
      }
      
      // HTML files
      else if (fileExt === '.html' || fileExt === '.htm') {
        const html = await readFile(filePath, 'utf8');
        // Simple HTML tag removal using regex
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove style tags
          .replace(/<[^>]*>/g, '')                          // Remove all HTML tags
          .replace(/&nbsp;/g, ' ')                          // Replace &nbsp; with space
          .replace(/&amp;/g, '&')                           // Replace &amp; with &
          .replace(/&lt;/g, '<')                            // Replace &lt; with <
          .replace(/&gt;/g, '>')                            // Replace &gt; with >
          .replace(/&quot;/g, '"')                          // Replace &quot; with "
          .replace(/&#39;/g, "'")                           // Replace &#39; with '
          .replace(/\s+/g, ' ')                             // Normalize whitespace
          .trim();
        return textContent;
      }
      
      // CSV files
      else if (fileExt === '.csv') {
        const csvContent = await readFile(filePath, 'utf8');
        return new Promise((resolve, reject) => {
          Papa.parse(csvContent, {
            header: true,
            complete: (results: any) => {
              if (results.errors.length > 0) {
                console.warn('CSV parsing warnings:', results.errors);
              }
              // Convert to readable text format
              const textContent = results.data
                .map((row: any) => Object.values(row).join(' | '))
                .join('\n');
              resolve(textContent);
            },
            error: (error: any) => {
              reject(new Error(`CSV parsing failed: ${error.message}`));
            }
          });
        });
      }
      
      // Excel files
      else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const buffer = await readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        const sheets: string[] = [];
        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(worksheet);
          if (csvData.trim()) {
            sheets.push(`Sheet: ${sheetName}\n${csvData}`);
          }
        });
        
        return sheets.join('\n\n');
      }
      
      // JSON files
      else if (fileExt === '.json') {
        const jsonContent = await readFile(filePath, 'utf8');
        const parsed = JSON.parse(jsonContent);
        return JSON.stringify(parsed, null, 2);
      }
      
      // XML files
      else if (fileExt === '.xml') {
        const xmlContent = await readFile(filePath, 'utf8');
        // Simple XML tag removal using regex
        const textContent = xmlContent
          .replace(/<[^>]*>/g, '')                          // Remove all XML tags
          .replace(/&nbsp;/g, ' ')                          // Replace &nbsp; with space
          .replace(/&amp;/g, '&')                           // Replace &amp; with &
          .replace(/&lt;/g, '<')                            // Replace &lt; with <
          .replace(/&gt;/g, '>')                            // Replace &gt; with >
          .replace(/&quot;/g, '"')                          // Replace &quot; with "
          .replace(/&#39;/g, "'")                           // Replace &#39; with '
          .replace(/\s+/g, ' ')                             // Normalize whitespace
          .trim();
        return textContent;
      }
      
      // Unsupported file type
      else {
        throw new Error(`Unsupported file type: ${fileExt}. Supported formats: TXT, MD, DOCX, PDF, HTML, CSV, XLSX, JSON, XML`);
      }
    } catch (error) {
      console.error(`❌ Error extracting text from ${fileName}:`, error);
      throw new Error(`Failed to extract text from ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private splitIntoChunks(text: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async processDocument({ 
    file, 
    instructions = {},
    userId = 'default'
  }: { 
    file: { name: string; buffer: Buffer | { data: number[] } }; 
    instructions?: any;
    userId?: string;
  }) {
    try {
      console.log('EnhancedDocumentTools: Starting processDocument');
      console.log('EnhancedDocumentTools: File name:', file.name);
      console.log('EnhancedDocumentTools: User ID:', userId);
      
      // Extract buffer data properly
      let fileBuffer: Buffer;
      if (file.buffer && typeof file.buffer === 'object' && 'data' in file.buffer) {
        fileBuffer = Buffer.from((file.buffer as { data: number[] }).data);
      } else if (file.buffer instanceof Buffer) {
        fileBuffer = file.buffer;
      } else {
        throw new Error('Invalid file buffer format');
      }
      
      console.log('EnhancedDocumentTools: File buffer length:', fileBuffer.length);
      
      const filePath = await this.saveTemporaryFile(fileBuffer, file.name);
      console.log('EnhancedDocumentTools: Saved file to:', filePath);

      try {
        // Extract text from file
        const text = await this.extractTextFromFile(filePath, file.name);
        console.log('EnhancedDocumentTools: Extracted text length:', text.length);
        
        if (!text || text.trim().length === 0) {
          throw new Error('No readable text found in the document');
        }

        // Split text into chunks
        const chunks = this.splitIntoChunks(text);
        console.log('EnhancedDocumentTools: Created', chunks.length, 'chunks');

        // Create document chunks with metadata
        const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
          id: `${userId}_${Date.now()}_${index}`,
          content: chunk,
          metadata: {
            source: file.name,
            source_type: path.extname(file.name).toLowerCase(),
            user_id: userId,
            chunk_index: index,
            timestamp: new Date()
          }
        }));

        // Add to user-specific storage
        if (!this.userDocuments.has(userId)) {
          this.userDocuments.set(userId, []);
        }
        this.userDocuments.get(userId)!.push(...documentChunks);

        // Add to global storage (for backward compatibility)
        this.documents.push(...documentChunks);

        // Persist to JSON file
        await saveStorage({
          documents: this.documents,
          userDocuments: Object.fromEntries(this.userDocuments)
        });

        console.log('EnhancedDocumentTools: Successfully processed document');
        console.log('EnhancedDocumentTools: Total documents in global storage:', this.documents.length);
        console.log('EnhancedDocumentTools: Documents for user', userId, ':', this.userDocuments.get(userId)?.length || 0);
        console.log('EnhancedDocumentTools: Available users:', Array.from(this.userDocuments.keys()));
        
        return {
          success: true,
          fileName: file.name,
          chunksProcessed: chunks.length,
          totalCharacters: text.length,
          message: `Successfully processed ${file.name} with ${chunks.length} chunks`
        };

      } finally {
        await this.cleanupFile(filePath);
        console.log('EnhancedDocumentTools: Cleaned up file:', filePath);
      }
    } catch (error) {
      console.log('EnhancedDocumentTools: Error in processDocument:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async addDocument({ 
    content, 
    metadata,
    userId = 'default'
  }: { 
    content: string; 
    metadata: any;
    userId?: string;
  }) {
    try {
      const chunks = this.splitIntoChunks(content);
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: `${userId}_${Date.now()}_${index}`,
        content: chunk,
        metadata: {
          ...metadata,
          user_id: userId,
          chunk_index: index,
          timestamp: new Date()
        }
      }));

      // Add to user-specific storage
      if (!this.userDocuments.has(userId)) {
        this.userDocuments.set(userId, []);
      }
      this.userDocuments.get(userId)!.push(...documentChunks);

      // Add to global storage
      this.documents.push(...documentChunks);

      // Persist to JSON file
      await saveStorage({
        documents: this.documents,
        userDocuments: Object.fromEntries(this.userDocuments)
      });

      return {
        success: true,
        message: 'Document added successfully',
        chunksAdded: chunks.length,
        ids: documentChunks.map(chunk => chunk.id)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async queryDocuments({ 
    query, 
    limit = 5,
    userId = 'default'
  }: { 
    query: string; 
    limit?: number;
    userId?: string;
  }) {
    try {
      console.log('EnhancedDocumentTools: Querying documents for user:', userId);
      console.log('EnhancedDocumentTools: Available users:', Array.from(this.userDocuments.keys()));
      console.log('EnhancedDocumentTools: Total documents in global storage:', this.documents.length);
      
      // Get user-specific documents
      const userDocs = this.userDocuments.get(userId) || [];
      console.log('EnhancedDocumentTools: Documents for user', userId, ':', userDocs.length);
      
      if (userDocs.length === 0) {
        return {
          success: true,
          documents: [],
          metadatas: [],
          distances: [],
          message: 'No documents found for this user'
        };
      }

      // Calculate similarities
      const results = await Promise.all(userDocs.map(async (doc, index) => {
        const similarityResult = await embeddingSimilarity(query, doc.content);
        return {
          score: similarityResult.score,
          index,
          document: doc,
          source: similarityResult.source
        };
      }));

      // Sort by score (highest first) and get top results
      let topResults = results
        .filter(r => r.score >= 0)   // ✅ Accept ALL results including 0 for testing
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // If no results pass threshold, return all documents for testing
      if (topResults.length === 0) {
        console.log('EnhancedDocumentTools: No relevant results found, returning all documents for testing.');
        topResults = results
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      }

      console.log('EnhancedDocumentTools: Found', topResults.length, 'relevant documents');
      console.log('EnhancedDocumentTools: Top results scores:', topResults.map(r => `${r.score} (${r.source})`));

      return {
        success: true,
        documents: topResults.map(r => r.document.content),
        metadatas: topResults.map(r => r.document.metadata),
        distances: topResults.map(r => r.score),
        sources: topResults.map(r => r.source), // Add source information
        totalDocuments: userDocs.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        documents: [],
        metadatas: [],
        distances: []
      };
    }
  }

  async clearUserDocuments(userId: string = 'default') {
    try {
      this.userDocuments.delete(userId);
      // Remove user documents from global storage
      this.documents = this.documents.filter(doc => doc.metadata.user_id !== userId);
      
      return {
        success: true,
        message: `Cleared all documents for user: ${userId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async getStats(userId?: string) {
    try {
      if (userId) {
        const userDocs = this.userDocuments.get(userId) || [];
        return {
          success: true,
          totalDocuments: userDocs.length,
          userDocuments: userDocs.length,
          globalDocuments: this.documents.length
        };
      } else {
        return {
          success: true,
          totalDocuments: this.documents.length,
          users: Array.from(this.userDocuments.keys()),
          userCounts: Object.fromEntries(
            Array.from(this.userDocuments.entries()).map(([userId, docs]) => [userId, docs.length])
          )
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
