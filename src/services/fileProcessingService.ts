import { FileStorage } from './fileStorage';
import { VectorStore } from './vectorStore';
import { processDocument } from '../utils/documentProcessing';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  name: string;
  data: Buffer;
}

export async function processUploadedFile(
  file: UploadedFile,
  fileStorage: FileStorage,
  vectorStore: VectorStore
): Promise<{ success: boolean; fileName: string; doc_id: string }> {
  let filePath: string | null = null;

  try {
    // Save file temporarily
    filePath = await fileStorage.saveUploadedFile(file);

    // Process document
    const content = await processDocument(filePath);

    // Add to VectorStore
    const doc_id = uuidv4();
    await vectorStore.addDocuments([{
      pageContent: content,
      metadata: { source: file.name, doc_id }
    }]);

    return {
      success: true,
      fileName: file.name,
      doc_id,
    };
  } catch (error) {
    // Clean up temporary file if it exists
    if (filePath) {
      await fileStorage.deleteFile(filePath).catch(() => {});
    }
    throw error;
  } finally {
    // Always clean up temporary file
    if (filePath) {
      await fileStorage.deleteFile(filePath).catch(() => {});
    }
  }
} 