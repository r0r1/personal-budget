import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import prisma from '../../../../../lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id, attachmentId } = req.query

  if (typeof id !== 'string' || typeof attachmentId !== 'string') {
    return res.status(400).json({ message: 'Invalid ID or attachment ID' })
  }

  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      // First verify the budget item belongs to the user
      const budgetItem = await prisma.budgetItem.findFirst({
        where: {
          id: id,
          userId: session.user.id
        },
        include: {
          attachments: {
            where: {
              id: attachmentId
            }
          }
        }
      })

      if (!budgetItem) {
        return res.status(404).json({ message: 'Budget item not found' })
      }

      if (budgetItem.attachments.length === 0) {
        return res.status(404).json({ message: 'Attachment not found' })
      }

      const attachment = budgetItem.attachments[0]

      // Delete the file from the filesystem
      try {
        const filePath = path.join(process.cwd(), 'public', attachment.fileUrl)
        await fs.unlink(filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
        // Continue with database deletion even if file deletion fails
      }

      // Delete the attachment from the database
      await prisma.fileAttachment.delete({
        where: {
          id: attachmentId
        }
      })

      return res.status(200).json({ message: 'Attachment deleted successfully' })
    } catch (error) {
      console.error('Error deleting attachment:', error)
      return res.status(500).json({ message: 'Failed to delete attachment' })
    }
  }

  res.setHeader('Allow', ['DELETE'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}
