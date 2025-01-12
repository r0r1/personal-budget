import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { IncomingForm } from 'formidable'
import { getFileAdapter } from '../../../lib/file-adapter'
import fs from 'fs/promises'

type Attachment = {
  filename: string;
  fileType: string;
  fileUrl: string;
}

type NoteWithAttachments = {
  text: string;
  attachments: Attachment[];
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
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

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
    const attachments: Attachment[] = []
    const fileAdapter = getFileAdapter()

    // Process files if any
    const filePromises = []
    for (let i = 0; files[`file${i}`]; i++) {
      const file = files[`file${i}`]
      if (file && file.filepath) {
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
      } else {
        console.error(`File ${i} is undefined or has no filepath`)
      }
    }

    // Wait for all file uploads to complete
    await Promise.all(filePromises)

    const budgetItem = await prisma.budgetItem.create({
      data: {
        name: data.name,
        amount: data.amount,
        type: data.type,
        category: data.category,
        recurrence: data.recurrence,
        note: data.note,
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
