import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // get session
  const session = await getSession({ req })
  console.log('session', session)

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
        console.error('Error fetching budget items:', error)
        res.status(500).json({ message: 'Error fetching budget items', error: error instanceof Error ? error.message : 'Unknown error' })
      }
      break

    case 'POST':
      try {
        const { name, amount, type, category, recurrence, recurrenceDate, note } = req.body
        
        if (!name || amount === undefined || !type || !category || !recurrence || !recurrenceDate) {
          return res.status(400).json({ message: 'Missing required fields' })
        }

        const newItem = await prisma.budgetItem.create({
          data: {
            name,
            amount: parseFloat(amount.toString()),
            type,
            category,
            recurrence,
            recurrenceDate: new Date(recurrenceDate),
            note: note || '',
            userId: session.user.id,
          },
        })
        res.status(201).json(newItem)
      } catch (error) {
        console.error('Error creating budget item:', error)
        res.status(500).json({ message: 'Error creating budget item', error: error instanceof Error ? error.message : 'Unknown error' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
