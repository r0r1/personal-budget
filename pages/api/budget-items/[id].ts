import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { IncomingForm } from 'formidable'
import { getFileAdapter } from '../../../lib/file-adapter'
import fs from 'fs/promises'

export const config = {
  api: {
    bodyParser: false,
  },
}

type Attachment = {
  filename: string;
  fileType: string;
  fileUrl: string;
}

const fileAdapter = getFileAdapter()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' })
  }

  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      // First verify the item belongs to the user
      const item = await prisma.budgetItem.findFirst({
        where: {
          id: id,
          userId: session.user.id
        },
        include: {
          attachments: true
        }
      })

      if (!item) {
        return res.status(404).json({ message: 'Item not found' })
      }

      // Delete all associated files
      for (const attachment of item.attachments) {
        try {
          await fileAdapter.deleteFile(attachment.fileUrl)
        } catch (error) {
          console.error('Error deleting file:', error)
          // Continue with deletion even if file deletion fails
        }
      }

      // Delete the item and its attachments
      await prisma.budgetItem.delete({
        where: { id: id }
      })

      return res.status(200).json({ message: 'Item deleted successfully' })
    } catch (error) {
      console.error('Error deleting budget item:', error)
      return res.status(500).json({ message: 'Failed to delete item' })
    }
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      const item = await prisma.budgetItem.findFirst({
        where: {
          id: id,
          userId: session.user.id
        },
        include: {
          attachments: true
        }
      })

      if (!item) {
        return res.status(404).json({ message: 'Item not found' })
      }

      return res.status(200).json(item)
    } catch (error) {
      console.error('Error fetching budget item:', error)
      return res.status(500).json({ message: 'Failed to fetch item' })
    }
  }

  // Handle PUT request
  if (req.method === 'PUT') {
    try {
      // First verify the item belongs to the user
      const existingItem = await prisma.budgetItem.findFirst({
        where: {
          id: id,
          userId: session.user.id
        }
      })

      if (!existingItem) {
        return res.status(404).json({ message: 'Item not found' })
      }

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

      // Process files if any
      const filePromises = []
      for (let i = 0; files[`file${i}`]; i++) {
        const file = files[`file${i}`]
        if (file) {
          try {
            // Read the file content
            const fileContent = await fs.readFile(file.filepath)
            
            // Create a File object from the buffer
            const fileObject = {
              filepath: file.filepath,
              originalFilename: file.originalFilename,
              mimetype: file.mimetype,
              buffer: fileContent
            }

            // Add to promises array
            filePromises.push(
              fileAdapter.saveFile(fileObject)
                .then(fileUrl => {
                  attachments.push({
                    filename: file.originalFilename || 'unnamed',
                    fileType: file.mimetype || 'application/octet-stream',
                    fileUrl,
                  })
                })
                .finally(async () => {
                  // Clean up temp file
                  try {
                    await fs.unlink(file.filepath)
                  } catch (error) {
                    console.error('Error cleaning up temp file:', error)
                  }
                })
            )
          } catch (error) {
            console.error(`Error processing file ${i}:`, error)
          }
        }
      }

      // Wait for all file uploads to complete
      await Promise.all(filePromises)

      const updatedItem = await prisma.budgetItem.update({
        where: { id: id },
        data: {
          name: data.name,
          amount: data.amount,
          type: data.type,
          category: data.category,
          recurrence: data.recurrence,
          note: data.note,
          recurrenceDate: data.recurrenceDate ? new Date(data.recurrenceDate) : null,
          attachments: {
            create: attachments.map(attachment => ({
              filename: attachment.filename,
              fileType: attachment.fileType,
              fileUrl: attachment.fileUrl,
            })),
          },
        },
        include: {
          attachments: {
            select: {
              id: true,
              filename: true,
              fileType: true,
              fileUrl: true,
              createdAt: true,
            }
          }
        }
      })

      // Transform dates to ISO strings
      const transformedItem = {
        ...updatedItem,
        attachments: updatedItem.attachments.map(attachment => ({
          ...attachment,
          createdAt: attachment.createdAt.toISOString(),
        })),
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString(),
        recurrenceDate: updatedItem.recurrenceDate?.toISOString() || null,
      }

      return res.status(200).json(transformedItem)
    } catch (error) {
      console.error('Error updating budget item:', error)
      return res.status(500).json({ message: 'Failed to update item' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}
