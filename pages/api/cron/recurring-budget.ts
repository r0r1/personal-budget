import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'
import { sendRecurringBudgetEmail } from '../../../lib/email'

const prisma = new PrismaClient()

// Vercel cron authentication
const CRON_SECRET = process.env.CRON_SECRET

type BudgetItemWithUser = {
  id: string
  name: string
  amount: number
  type: 'income' | 'expense'
  category: string
  recurrence: string
  recurrenceDate: Date | null
  note: string
  userId: string
  user: {
    email: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify the request is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all recurring items due today or earlier
    const items = await prisma.budgetItem.findMany({
      where: {
        recurrence: { not: 'once' },
        recurrenceDate: { lte: today }
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    }) as BudgetItemWithUser[]

    // Group items by user
    const itemsByUser = items.reduce<Record<string, BudgetItemWithUser[]>>((acc, item) => {
      if (!item.user.email) return acc
      if (!acc[item.user.email]) {
        acc[item.user.email] = []
      }
      acc[item.user.email].push(item)
      return acc
    }, {})

    const results = []
    const emailResults = []

    // Process items for each user
    for (const [userEmail, userItems] of Object.entries(itemsByUser)) {
      const newItems = []

      // Create new items for this user
      for (const item of userItems) {
        // Create a new transaction
        const newItem = await prisma.budgetItem.create({
          data: {
            name: item.name,
            amount: item.amount,
            type: item.type,
            category: item.category,
            recurrence: item.recurrence,
            recurrenceDate: calculateNextRecurrence(item.recurrenceDate || new Date(), item.recurrence),
            note: item.note,
            userId: item.userId
          }
        })

        // Update the recurrence date of the original item
        const updatedItem = await prisma.budgetItem.update({
          where: { id: item.id },
          data: { 
            recurrenceDate: calculateNextRecurrence(item.recurrenceDate || new Date(), item.recurrence)
          }
        })

        results.push({ newItem, updatedItem })
        newItems.push(newItem)
      }

      // Send email notification for this user's new items
      if (newItems.length > 0) {
        const emailResult = await sendRecurringBudgetEmail(
          userEmail,
          newItems.map(item => ({
            name: item.name,
            amount: item.amount,
            type: item.type as 'income' | 'expense',
            category: item.category,
            recurrence: item.recurrence
          }))
        )
        emailResults.push({ userEmail, success: emailResult.success })
      }
    }

    return res.status(200).json({
      message: 'Recurring budget items processed successfully',
      processed: results.length,
      items: results,
      emailNotifications: emailResults
    })
  } catch (error) {
    console.error('Error processing recurring budget items:', error)
    return res.status(500).json({ error: 'Failed to process recurring budget items' })
  }
}

function calculateNextRecurrence(date: Date, recurrence: string): Date {
  const today = new Date()
  let nextDate = new Date(date)

  // If the date is in the past, start from today
  if (nextDate < today) {
    nextDate = today
  }

  switch (recurrence) {
    case 'daily':
      return addDays(nextDate, 1)
    case 'weekly':
      return addWeeks(nextDate, 1)
    case 'biweekly':
      return addWeeks(nextDate, 2)
    case 'monthly':
      return addMonths(nextDate, 1)
    case 'yearly':
      return addYears(nextDate, 1)
    default:
      return nextDate
  }
}
