import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// JSON persistence for development
const STORAGE_PATH = path.join(process.cwd(), 'uploads', 'documents.json');

async function loadStorage() {
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

// Simple keyword-based similarity
function keywordSimilarity(query: string, text: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  const textWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  
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

export class SimpleDocumentTools {
  private documents: DocumentChunk[] = global.__documentStorage!.documents;
  private userDocuments: Map<string, DocumentChunk[]> = global.__documentStorage!.userDocuments;

  private async saveTemporaryFile(file: Buffer, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, file);
    
    return filePath;
  }

  private async extractTextFromFile(filePath: string): Promise<string> {
    const fileExt = path.extname(filePath).toLowerCase();
    
    try {
      if (fileExt === '.txt') {
        return await readFile(filePath, 'utf8');
      } else if (fileExt === '.docx') {
        const buffer = await readFile(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else if (fileExt === '.pdf') {
        const buffer = await readFile(filePath);
        const data = await pdf(buffer);
        return data.text;
      } else if (fileExt === '.md' || fileExt === '.html' || fileExt === '.htm') {
        const content = await readFile(filePath, 'utf8');
        // Simple HTML tag removal for HTML files
        if (fileExt === '.html' || fileExt === '.htm') {
          return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return content;
      } else if (fileExt === '.csv') {
        const content = await readFile(filePath, 'utf8');
        const result = Papa.parse(content, { header: true });
        return result.data.map((row: any) => Object.values(row).join(' ')).join('\n');
      } else if (fileExt === '.xls' || fileExt === '.xlsx') {
        const buffer = await readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        return workbook.SheetNames.map(sheetName => 
          XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
        ).join('\n');
      } else if (fileExt === '.json') {
        const content = await readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        return JSON.stringify(data, null, 2);
      } else if (fileExt === '.xml') {
        const content = await readFile(filePath, 'utf8');
        // Simple XML tag removal
        return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        throw new Error(`Unsupported file type: ${fileExt}. Please use TXT, DOCX, PDF, MD, HTML, CSV, XLSX, JSON, or XML files.`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.substring(start, end);
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.7) {
          chunk = text.substring(start, breakPoint + 1);
          start = breakPoint + 1;
        } else {
          start = end - overlap;
        }
      } else {
        start = end;
      }
      
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  async processDocument(params: { file: Buffer; fileName: string; userId: string }): Promise<any> {
    try {
      console.log('📄 Processing document:', params.fileName, 'for user:', params.userId);
      
      // Save file temporarily
      const filePath = await this.saveTemporaryFile(params.file, params.fileName);
      
      // Extract text
      const text = await this.extractTextFromFile(filePath);
      console.log('📝 Extracted text length:', text.length, 'characters');
      
      // Clean up temporary file
      await unlink(filePath);
      
      // Chunk text
      const chunks = this.chunkText(text);
      console.log('📦 Created', chunks.length, 'chunks');
      
      // Store chunks
      const userChunks: DocumentChunk[] = [];
      chunks.forEach((chunk, index) => {
        const docChunk: DocumentChunk = {
          id: uuidv4(),
          content: chunk,
          metadata: {
            source: params.fileName,
            source_type: path.extname(params.fileName).toLowerCase(),
            user_id: params.userId,
            chunk_index: index,
            timestamp: new Date()
          }
        };
        
        this.documents.push(docChunk);
        userChunks.push(docChunk);
      });
      
      // Update user documents
      if (!this.userDocuments.has(params.userId)) {
        this.userDocuments.set(params.userId, []);
      }
      this.userDocuments.get(params.userId)!.push(...userChunks);
      
      // Save to persistent storage
      await saveStorage({
        documents: this.documents,
        userDocuments: Object.fromEntries(this.userDocuments)
      });
      
      console.log('✅ Document processed successfully');
      
      return {
        success: true,
        message: `Document "${params.fileName}" processed successfully`,
        chunks: userChunks.length,
        textLength: text.length
      };
    } catch (error) {
      console.error('❌ Error processing document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async queryDocuments(params: { query: string; userId: string; limit?: number }): Promise<any> {
    try {
      console.log('🔍 Querying documents for user:', params.userId);
      console.log('📝 Query:', params.query);
      
      const userDocs = this.userDocuments.get(params.userId) || [];
      console.log('📚 User has', userDocs.length, 'document chunks');
      
      if (userDocs.length === 0) {
        return {
          success: true,
          documents: [],
          distances: [],
          sources: [],
          metadatas: []
        };
      }
      
      // Calculate similarities
      const results = userDocs.map(doc => ({
        doc,
        score: keywordSimilarity(params.query, doc.content)
      }));
      
      // Sort by similarity score (higher is better)
      results.sort((a, b) => b.score - a.score);
      
      // Apply threshold and limit
      const threshold = 0.1;
      const limit = params.limit || 5;
      
      const filteredResults = results
        .filter(result => result.score >= threshold)
        .slice(0, limit);
      
      console.log('📊 Found', filteredResults.length, 'relevant documents');
      
      // If no results pass threshold, return top results anyway
      const finalResults = filteredResults.length > 0 ? filteredResults : results.slice(0, limit);
      
      return {
        success: true,
        documents: finalResults.map(r => r.doc.content),
        distances: finalResults.map(r => r.score),
        sources: finalResults.map(r => r.doc.metadata.source),
        metadatas: finalResults.map(r => r.doc.metadata)
      };
    } catch (error) {
      console.error('❌ Error querying documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getStats(userId: string): Promise<any> {
    try {
      const userDocs = this.userDocuments.get(userId) || [];
      const totalDocs = this.documents.length;
      
      return {
        success: true,
        stats: {
          documentCount: userDocs.length,
          userCount: this.userDocuments.size,
          totalDocuments: totalDocs
        }
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async clearUserDocuments(userId: string): Promise<any> {
    try {
      const userDocs = this.userDocuments.get(userId) || [];
      const docIds = new Set(userDocs.map(doc => doc.id));
      
      // Remove from global documents array
      this.documents = this.documents.filter(doc => !docIds.has(doc.id));
      
      // Remove from user documents
      this.userDocuments.delete(userId);
      
      // Save to persistent storage
      await saveStorage({
        documents: this.documents,
        userDocuments: Object.fromEntries(this.userDocuments)
      });
      
      console.log('🗑️ Cleared', userDocs.length, 'documents for user:', userId);
      
      return {
        success: true,
        message: `Cleared ${userDocs.length} documents for user ${userId}`
      };
    } catch (error) {
      console.error('❌ Error clearing user documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
