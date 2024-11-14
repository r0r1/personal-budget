import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

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
      const data = req.body

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
