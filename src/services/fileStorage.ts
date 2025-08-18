import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';

export interface UploadedFile {
  name: string;
  data: Buffer;
}

export class FileStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async saveUploadedFile(file: UploadedFile): Promise<string> {
    try {
      await mkdir(this.uploadDir, { recursive: true });

      let targetPath = path.join(this.uploadDir, file.name);
      let counter = 1;

      // Handle duplicate filenames
      while (true) {
        try {
          await access(targetPath);
          const ext = path.extname(file.name);
          const base = path.basename(file.name, ext);
          targetPath = path.join(this.uploadDir, `${base}_${counter}${ext}`);
          counter++;
        } catch {
          break;
        }
      }

      await writeFile(targetPath, file.data);
      return targetPath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  getFilePath(filename: string): string {
    // Sanitize filename to prevent directory traversal
    const sanitizedName = path.basename(filename);
    return path.join(this.uploadDir, sanitizedName);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await access(filePath);
      await writeFile(filePath, ''); // Overwrite with empty content
      await writeFile(filePath, Buffer.alloc(0)); // Zero out
    } catch {
      // File doesn't exist or can't be accessed, ignore
    }
  }
} 