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

async function saveFile(file: any): Promise<string> {
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
        }
      })

      if (!item) {
        return res.status(404).json({ message: 'Item not found' })
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
      const attachments = []

      // Process files if any
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
          }
        }
      }

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
          attachments: true
        }
      })

      return res.status(200).json(updatedItem)
    } catch (error) {
      console.error('Error updating budget item:', error)
      return res.status(500).json({ message: 'Failed to update item' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}
