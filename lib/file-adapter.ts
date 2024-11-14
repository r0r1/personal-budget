import fs from 'fs/promises'
import path from 'path'

export interface FileAdapter {
  saveFile(file: any): Promise<string>
  deleteFile(fileUrl: string): Promise<void>
}

export class LocalFileAdapter implements FileAdapter {
  async saveFile(file: any): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      
      const uniqueFilename = `${Date.now()}-${file.originalFilename || 'unnamed'}`
      const newPath = path.join(uploadDir, uniqueFilename)
      
      await fs.copyFile(file.filepath, newPath)
      await fs.unlink(file.filepath)
      
      return `/uploads/${uniqueFilename}`
    } catch (error) {
      console.error('Error saving file:', error)
      throw new Error('Failed to save file')
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'public', fileUrl)
      await fs.unlink(filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Failed to delete file')
    }
  }
}

export class S3FileAdapter implements FileAdapter {
  async saveFile(file: any): Promise<string> {
    // Implement S3 file upload logic here
    throw new Error('S3 adapter not implemented')
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Implement S3 file deletion logic here
    throw new Error('S3 adapter not implemented')
  }
}

// Factory function to get the appropriate adapter
export function getFileAdapter(): FileAdapter {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment ? new LocalFileAdapter() : new S3FileAdapter()
}
