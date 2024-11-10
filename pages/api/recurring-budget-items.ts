import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const now = new Date()
    const itemsToRecur = await prisma.budgetItem.findMany({
      where: {
        recurrenceDate: {
          lte: now,
        },
        recurrence: {
          not: 'once',
        },
      },
    })

    const newItems = await Promise.all(
      itemsToRecur.map(async (item: { id: string; name: string; amount: number; type: string; category: string; recurrence: string; recurrenceDate: Date | null; userId: string; }) => {
        let nextRecurrenceDate: Date

        switch (item.recurrence) {
          case 'daily':
            nextRecurrenceDate = addDays(new Date(item.recurrenceDate || new Date()), 1)
            break
          case 'weekly':
            nextRecurrenceDate = addWeeks(new Date(item.recurrenceDate || new Date()), 1)
            break
          case 'monthly':
            nextRecurrenceDate = addMonths(new Date(item.recurrenceDate || new Date()), 1)
            break
          case 'yearly':
            nextRecurrenceDate = addYears(new Date(item.recurrenceDate || new Date()), 1)
            break
          default:
            return null
        }

        if (nextRecurrenceDate) {
          const newItem = await prisma.budgetItem.create({
            data: {
              name: item.name,
              amount: item.amount,
              type: item.type,
              category: item.category,
              recurrence: item.recurrence,
              recurrenceDate: nextRecurrenceDate || new Date(),
              user: { connect: { id: item.userId } }, // Assuming userId is available in the item
            },
          })

          await prisma.budgetItem.update({
            where: { id: item.id },
            data: { recurrenceDate: nextRecurrenceDate },
          })

          return newItem
        }
        return null
      })
    )

    const createdItems = newItems.filter(Boolean)

    res.status(200).json({ message: 'Recurring items processed', createdItems })
  } catch (error) {
    console.error('Error processing recurring items:', error)
    res.status(500).json({ message: 'Error processing recurring items' })
  }
}