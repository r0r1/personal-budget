import { PrismaClient } from '@prisma/client'
import { CronJob } from 'cron'
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

const prisma = new PrismaClient()

export const startCronJob = () => {
  const job = new CronJob('0 0 * * *', async function() {
    console.log('Running daily cron job for recurring transactions')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const items = await prisma.budgetItem.findMany({
      where: {
        recurrence: { not: 'once' },
        recurrenceDate: { lte: today }
      }
    })

    for (const item of items) {
      // Create a new transaction
      await prisma.budgetItem.create({
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
      await prisma.budgetItem.update({
        where: { id: item.id },
        data: { recurrenceDate: calculateNextRecurrence(item.recurrenceDate || new Date(), item.recurrence) }
      })
    }
  })

  job.start()
}

function calculateNextRecurrence(date: Date, recurrence: string): Date {
  switch (recurrence) {
    case 'daily':
      return addDays(date, 1)
    case 'weekly':
      return addWeeks(date, 1)
    case 'monthly':
      return addMonths(date, 1)
    case 'yearly':
      return addYears(date, 1)
    default:
      return date
  }
}