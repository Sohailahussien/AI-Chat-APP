import fs from 'fs';
import path from 'path';

export interface UploadedFile {
  name: string;
  data: Buffer;
}

export class FileStorage {
  private uploadDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
  }

  public async saveUploadedFile(file: UploadedFile): Promise<string> {
    if (!file.name || !file.data) {
      throw new Error('Invalid file');
    }

    const sanitizedFilename = path.basename(file.name);
    let targetPath = this.getFilePath(sanitizedFilename);
    let counter = 1;

    // Handle duplicate filenames
    while (await this.fileExists(targetPath)) {
      const { name, ext } = path.parse(sanitizedFilename);
      targetPath = this.getFilePath(`${name}_${counter}${ext}`);
      counter++;
    }

    try {
      await fs.promises.writeFile(targetPath, file.data);
      return targetPath;
    } catch (error) {
      throw new Error('Failed to save file');
    }
  }

  public async deleteFile(filePath: string): Promise<void> {
    let fileExists = false;
    try {
      await fs.promises.access(filePath);
      fileExists = true;
    } catch (error) {
      throw new Error('File not found');
    }

    if (fileExists) {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        throw new Error('Failed to delete file');
      }
    }
  }

  public getFilePath(filename: string): string {
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    return path.join(this.uploadDir, sanitizedFilename);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
} 