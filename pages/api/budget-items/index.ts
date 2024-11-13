import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'

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
    const items = await prisma.budgetItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    console.log('Found items:', items.length) // Debug log
    return res.status(200).json(items)
  } catch (error) {
    console.error('Error in GET:', error)
    return res.status(500).json({ message: 'Internal server error' })
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

    const noteWithAttachments = {
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
      },
    })

    return res.status(200).json({
      ...budgetItem,
      note: noteWithAttachments,
    })
  } catch (error) {
    console.error('Error in POST:', error)
    return res.status(500).json({ message: 'Internal server error' })
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
