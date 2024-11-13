import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface FormidableFile {
  filepath: string
  originalFilename?: string
  mimetype?: string
}

interface Attachment {
  filename: string
  fileType: string
  fileUrl: string
}

interface NoteWithAttachments {
  text: string
  attachments: Attachment[]
}

const saveFile = async (file: FormidableFile): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  
  try {
    await fs.mkdir(uploadDir, { recursive: true })
    
    const uniqueFilename = `${Date.now()}-${file.originalFilename || 'unnamed'}`
    const newPath = path.join(uploadDir, uniqueFilename)
    
    await fs.copyFile(file.filepath, newPath)
    await fs.unlink(file.filepath) // Clean up temp file
    
    return `/uploads/${uniqueFilename}` // Return the public URL
  } catch (error) {
    console.error('Error saving file:', error)
    throw new Error('Failed to save file')
  }
}

const parseNote = (note: string | null | undefined): NoteWithAttachments => {
  if (!note) return { text: '', attachments: [] }
  try {
    return JSON.parse(note) as NoteWithAttachments
  } catch {
    return { text: note, attachments: [] }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid item ID' })
    }

    switch (req.method) {
      case 'PUT':
        const form = new IncomingForm({
          multiples: true,
          keepExtensions: true,
        })

        const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) reject(err)
            resolve([fields, files])
          })
        })

        const data = JSON.parse(fields.data as string)
        const attachments: Attachment[] = []

        // Process each file
        for (let i = 0; files[`file${i}`]; i++) {
          const file = files[`file${i}`]
          if (file) {
            try {
              const fileUrl = await saveFile(file)
              attachments.push({
                filename: file.originalFilename || 'unnamed',
                fileType: file.mimetype || 'application/octet-stream',
                fileUrl,
              })
            } catch (error) {
              console.error(`Error processing file ${i}:`, error)
              // Continue with other files even if one fails
            }
          }
        }

        // Get existing note data and merge with new attachments
        const existingNote = parseNote(data.note)
        const updatedNote = {
          text: data.note || existingNote.text,
          attachments: [...(existingNote.attachments || []), ...attachments]
        }

        // Prepare update data
        const updateData = {
          name: data.name,
          amount: data.amount,
          type: data.type,
          category: data.category,
          recurrence: data.recurrence,
          note: JSON.stringify(updatedNote),
          recurrenceDate: data.recurrenceDate ? new Date(data.recurrenceDate) : null,
        }

        const updatedItem = await prisma.budgetItem.update({
          where: { id, userId: user.id },
          data: updateData,
        })

        return res.status(200).json({
          ...updatedItem,
          note: updatedNote,
        })

      case 'DELETE':
        // Get the item to find any attached files
        const item = await prisma.budgetItem.findUnique({
          where: { id, userId: user.id },
        })

        if (item) {
          try {
            // Parse the note to get file attachments
            const noteData = parseNote(item.note)
            if (noteData.attachments && noteData.attachments.length > 0) {
              // Delete each attachment file
              for (const attachment of noteData.attachments) {
                if (attachment.fileUrl.startsWith('/uploads/')) {
                  const filePath = path.join(process.cwd(), 'public', attachment.fileUrl)
                  try {
                    await fs.unlink(filePath)
                  } catch (error) {
                    console.error('Error deleting file:', error)
                    // Continue even if file deletion fails
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error parsing note data:', error)
            // Continue with item deletion even if file cleanup fails
          }
        }

        // Delete the budget item
        await prisma.budgetItem.delete({
          where: { id, userId: user.id },
        })
        
        return res.status(204).end()

      default:
        res.setHeader('Allow', ['PUT', 'DELETE'])
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Error handling budget items:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
