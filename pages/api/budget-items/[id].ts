import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  switch (req.method) {
    case 'PUT':
      try {
        const { name, amount, type, category, recurrence, recurrenceDate, note } = req.body
        const updatedItem = await prisma.budgetItem.update({
          where: { id: id as string, userId: session.user.id },
          data: {
            name,
            amount,
            type,
            category,
            recurrence,
            recurrenceDate,
            note,
          },
        })
        res.status(200).json(updatedItem)
      } catch (error) {
        res.status(500).json({ message: 'Error updating budget item' })
      }
      break

    case 'DELETE':
      try {
        await prisma.budgetItem.delete({
          where: { id: id as string, userId: session.user.id },
        })
        res.status(204).end()
      } catch (error) {
        res.status(500).json({ message: 'Error deleting budget item' })
      }
      break

    default:
      res.setHeader('Allow', ['PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}