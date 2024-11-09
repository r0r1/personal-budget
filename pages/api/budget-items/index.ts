import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  switch (req.method) {
    case 'GET':
      try {
        const items = await prisma.budgetItem.findMany({
          where: { userId: session.user.id },
        })
        res.status(200).json(items)
      } catch (error) {
        res.status(500).json({ message: 'Error fetching budget items' })
      }
      break

    case 'POST':
      try {
        const { name, amount, type, category, recurrence, recurrenceDate, note } = req.body
        const newItem = await prisma.budgetItem.create({
          data: {
            name,
            amount,
            type,
            category,
            recurrence,
            recurrenceDate,
            note,
            userId: session.user.id,
          },
        })
        res.status(201).json(newItem)
      } catch (error) {
        res.status(500).json({ message: 'Error creating budget item' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}