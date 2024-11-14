import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'

type NoteWithAttachments = {
  text: string;
  attachments: Array<{
    filename: string;
    fileType: string;
    fileUrl: string;
  }>;
}

// Split routes for GET and POST
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET requests with normal body parser
  if (req.method === 'GET') {
    return handleGet(req, res)
  }
  
  // Handle POST requests with formidable
  if (req.method === 'POST') {
    return handlePost(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}

// Configure bodyParser only for POST requests
export const config = {
  api: {
    bodyParser: false,
  },
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    console.log('Session in GET:', session) // Debug log

    if (!session?.user?.id) {
      console.log('No session or user ID') // Debug log
      return res.status(401).json({ message: 'Unauthorized' })
    }

    console.log('Fetching items for user:', session.user.id) // Debug log
    
    // First, get the count of items
    const itemCount = await prisma.budgetItem.count({
      where: { userId: session.user.id },
    })
    console.log('Total items count:', itemCount) // Debug log

    // Then fetch the items with attachments
    const items = await prisma.budgetItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
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
      },
    })

    console.log('Found items:', items.length) // Debug log
    
    // Log first item as sample (with sensitive data removed)
    if (items.length > 0) {
      const sampleItem = { ...items[0], userId: '[REDACTED]' }
      console.log('Sample item:', JSON.stringify(sampleItem, null, 2))
    }

    // Transform items to include parsed note
    const transformedItems = items.map(item => {
      let parsedNote: string | NoteWithAttachments = item.note || ''
      try {
        const parsed = JSON.parse(item.note || '{}') as NoteWithAttachments
        parsedNote = parsed
      } catch (e) {
        // If note is not JSON, keep it as is
      }

      return {
        ...item,
        note: typeof parsedNote === 'string' ? parsedNote : parsedNote.text || '',
        attachments: item.attachments.map(attachment => ({
          ...attachment,
          createdAt: attachment.createdAt.toISOString(),
        })),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        recurrenceDate: item.recurrenceDate?.toISOString() || null,
      }
    })

    console.log('Transformed items count:', transformedItems.length) // Debug log
    if (transformedItems.length > 0) {
      console.log('Sample transformed item:', JSON.stringify({ 
        ...transformedItems[0],
        userId: '[REDACTED]' 
      }, null, 2))
    }

    return res.status(200).json(transformedItems)
  } catch (error) {
    console.error('Error in GET:', error)
    return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
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

    const noteWithAttachments: NoteWithAttachments = {
      text: data.note || '',
      attachments,
    }

    const budgetItem = await prisma.budgetItem.create({
      data: {
        name: data.name,
        amount: data.amount,
        type: data.type,
        category: data.category,
        recurrence: data.recurrence,
        note: JSON.stringify(noteWithAttachments),
        userId: session.user.id,
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
      },
    })

    // Transform dates to ISO strings
    const transformedItem = {
      ...budgetItem,
      note: data.note || '',
      attachments: budgetItem.attachments.map(attachment => ({
        ...attachment,
        createdAt: attachment.createdAt.toISOString(),
      })),
      createdAt: budgetItem.createdAt.toISOString(),
      updatedAt: budgetItem.updatedAt.toISOString(),
      recurrenceDate: budgetItem.recurrenceDate?.toISOString() || null,
    }

    return res.status(200).json(transformedItem)
  } catch (error) {
    console.error('Error in POST:', error)
    return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

// Helper function to save files
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
