import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import mime from 'mime-types';

export class LocalFileStorage {
  private uploadsDir: string;
  private publicDir: string;

  constructor() {
    // Create uploads directory in the project root
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.publicDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.publicDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'profiles'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'posts'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'slips'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'temp'), { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  async saveFile(buffer: Buffer, originalName: string, category: 'profiles' | 'posts' | 'slips' | 'temp' = 'temp'): Promise<string> {
    const fileExtension = path.extname(originalName).toLowerCase();
    const filename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, category, filename);
    
    await fs.writeFile(filePath, buffer);
    
    // Return the relative path that will be accessible via HTTP
    return `/uploads/${category}/${filename}`;
  }

  async moveFile(tempPath: string, category: 'profiles' | 'posts' | 'slips'): Promise<string> {
    const filename = path.basename(tempPath);
    const newPath = path.join(this.uploadsDir, category, filename);
    const oldPath = path.join(this.uploadsDir, 'temp', filename);
    
    await fs.rename(oldPath, newPath);
    
    return `/uploads/${category}/${filename}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Remove leading slash and convert to absolute path
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const absolutePath = path.join(process.cwd(), relativePath);
      await fs.unlink(absolutePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const absolutePath = path.join(process.cwd(), relativePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async serveFile(filePath: string, res: Response): Promise<void> {
    try {
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const absolutePath = path.join(process.cwd(), relativePath);
      
      // Check if file exists
      await fs.access(absolutePath);
      
      // Get file stats and mime type
      const stats = await fs.stat(absolutePath);
      const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';
      
      // Set appropriate headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      
      // Stream the file
      const fileBuffer = await fs.readFile(absolutePath);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(404).json({ error: 'File not found' });
    }
  }

  getFileUrl(filePath: string): string {
    // Return the public URL for the file
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }
}

export const localFileStorage = new LocalFileStorage();