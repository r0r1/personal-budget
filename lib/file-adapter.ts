import fs from 'fs/promises'
import path from 'path'
import { supabase } from './supabase'

interface FileInput {
  filepath?: string
  originalFilename?: string
  mimetype?: string
  buffer?: Buffer
}

export interface FileAdapter {
  saveFile(file: FileInput): Promise<string>
  deleteFile(fileUrl: string): Promise<void>
}

export class LocalFileAdapter implements FileAdapter {
  async saveFile(file: FileInput): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      
      const uniqueFilename = `${Date.now()}-${file.originalFilename || 'unnamed'}`
      const newPath = path.join(uploadDir, uniqueFilename)
      
      if (file.filepath) {
        await fs.copyFile(file.filepath, newPath)
        await fs.unlink(file.filepath)
      } else if (file.buffer) {
        await fs.writeFile(newPath, file.buffer)
      } else {
        throw new Error('No file content available')
      }
      
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

export class SupabaseFileAdapter implements FileAdapter {
  private bucketName: string

  constructor() {
    this.bucketName = process.env.SUPABASE_BUCKET_NAME || 'small-budget-development'
    console.log('Using Supabase bucket:', this.bucketName)
  }

  async saveFile(file: FileInput): Promise<string> {
    try {
      console.log('Starting Supabase file upload:', {
        filename: file.originalFilename,
        mimetype: file.mimetype,
        size: file.buffer?.length || 'unknown',
        bucketName: this.bucketName
      })

      // Read file content if it's not already a buffer
      let fileBuffer = file.buffer
      if (!fileBuffer && file.filepath) {
        fileBuffer = await fs.readFile(file.filepath)
      }

      if (!fileBuffer) {
        throw new Error('No file content available')
      }

      const uniqueFilename = `${Date.now()}-${file.originalFilename || 'unnamed'}`
      console.log('Generated unique filename:', uniqueFilename)

      const { data, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(`attachments/${uniqueFilename}`, fileBuffer, {
          contentType: file.mimetype || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Supabase upload successful:', data)

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(`attachments/${uniqueFilename}`)

      console.log('Generated public URL:', urlData.publicUrl)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error saving file to Supabase:', error)
      throw new Error(`Failed to save file to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      console.log('Attempting to delete file:', fileUrl)
      
      // Extract filename from the URL, including the attachments prefix
      const urlParts = fileUrl.split('/')
      const filename = urlParts.slice(-2).join('/') // Get 'attachments/filename'
      
      if (!filename) {
        throw new Error('Invalid file URL')
      }

      console.log('Extracted filename:', filename)

      const { error: deleteError } = await supabase.storage
        .from(this.bucketName)
        .remove([filename])

      if (deleteError) {
        console.error('Supabase delete error:', deleteError)
        throw new Error(`Delete failed: ${deleteError.message}`)
      }

      console.log('File deleted successfully')
    } catch (error) {
      console.error('Error deleting file from Supabase:', error)
      throw new Error(`Failed to delete file from Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export class S3FileAdapter implements FileAdapter {
  async saveFile(file: FileInput): Promise<string> {
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
  const storageType = process.env.STORAGE_TYPE || 'local'
  console.log('Using storage adapter:', storageType)
  
  switch (storageType) {
    case 'supabase':
      return new SupabaseFileAdapter()
    case 's3':
      return new S3FileAdapter()
    case 'local':
    default:
      return new LocalFileAdapter()
  }
}
