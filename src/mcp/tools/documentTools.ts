import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export class DocumentTools {
  private async saveTemporaryFile(file: Buffer, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    try {
      console.log('DocumentTools: Creating upload directory:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
      console.log('DocumentTools: Directory created successfully');
      
      console.log('DocumentTools: Writing file to:', filePath);
      console.log('DocumentTools: File buffer type:', typeof file);
      console.log('DocumentTools: File buffer length:', file.length);
      
      await writeFile(filePath, file);
      console.log('DocumentTools: File written successfully');
      
      return filePath;
    } catch (error) {
      console.log('DocumentTools: Error in saveTemporaryFile:', error);
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

  async processDocument({ file, instructions = {} }: { 
    file: { name: string; buffer: Buffer | { data: number[] } }; 
    instructions?: any; 
  }) {
    try {
      console.log('DocumentTools: Starting processDocument');
      console.log('DocumentTools: File name:', file.name);
      console.log('DocumentTools: File object:', JSON.stringify(file, null, 2));
      
      // Fix: Extract buffer data properly
      let fileBuffer;
      if (file.buffer && typeof file.buffer === 'object' && 'data' in file.buffer) {
        // If buffer is an object with data array, convert it to Buffer
        fileBuffer = Buffer.from((file.buffer as { data: number[] }).data);
      } else if (file.buffer instanceof Buffer) {
        // If buffer is already a Buffer
        fileBuffer = file.buffer;
      } else {
        throw new Error('Invalid file buffer format');
      }
      
      console.log('DocumentTools: File buffer length:', fileBuffer.length);
      console.log('DocumentTools: Instructions:', instructions);
      
      const filePath = await this.saveTemporaryFile(fileBuffer, file.name);
      console.log('DocumentTools: Saved file to:', filePath);

      try {
        const command = `"./venv/Scripts/python.exe" src/services/ragPipelineService.py "${filePath}" '${JSON.stringify(instructions)}'`;
        console.log('DocumentTools: Executing command:', command);
        
        const { stdout, stderr } = await execAsync(command);

        console.log('DocumentTools: Python stdout:', stdout);
        console.log('DocumentTools: Python stderr:', stderr);

        if (stderr) {
          console.log('DocumentTools: Python stderr detected:', stderr);
          throw new Error(stderr);
        }

        const result = JSON.parse(stdout.trim());
        console.log('DocumentTools: Parsed result:', result);
        
        // Check if the result contains an error
        if (result.error) {
          console.log('DocumentTools: Result contains error:', result.error);
          return {
            success: false,
            fileName: file.name,
            error: result.error
          };
        }
        
        console.log('DocumentTools: Processing successful');
        return {
          success: true,
          fileName: file.name,
          ...result
        };
      } finally {
        await this.cleanupFile(filePath);
        console.log('DocumentTools: Cleaned up file:', filePath);
      }
    } catch (error) {
      console.log('DocumentTools: Error in processDocument:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async addDocument({ content, metadata }: { content: string; metadata: any }) {
    try {
      const { stdout, stderr } = await execAsync(
        `"./venv/Scripts/python.exe" -c "
from src.services.ragPipelineService import RAGPipelineService;
import json, sys;
pipeline = RAGPipelineService();
documents = [${JSON.stringify(content)}];
metadatas = [${JSON.stringify(metadata)}];
doc_ids = pipeline.process_documents(documents, metadatas);
print(json.dumps({'success': True, 'message': 'Document added successfully', 'ids': doc_ids}))
"`
      );

      if (stderr) {
        throw new Error(stderr);
      }

      return JSON.parse(stdout);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async queryDocuments({ query, limit = 5 }: { query: string; limit?: number }) {
    try {
      const { stdout, stderr } = await execAsync(
        `"./venv/Scripts/python.exe" src/services/ragPipelineService.py --query "${query.replace(/"/g, '\\"')}" ${limit}`
      );

      if (stderr) {
        throw new Error(stderr);
      }

      const results = JSON.parse(stdout);
      return {
        success: true,
        documents: results.documents || [],
        metadatas: results.metadatas || [],
        distances: results.distances || []
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
} 