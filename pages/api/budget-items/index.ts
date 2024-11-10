import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Disable SSL certificate validation for this request
  if (process.env.NODE_ENV === "development") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  // Get session using getServerSession
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const items = await prisma.budgetItem.findMany({
          where: { userId: session.user.id },
        });
        res.status(200).json(items);
      } catch (error) {
        console.error('Error fetching budget items:', error);
        res.status(500).json({ message: 'Error fetching budget items', error: error instanceof Error ? error.message : 'Unknown error' });
      }
      break;

    case 'POST':
      try {
        const { name, amount, type, category, recurrence, recurrenceDate, note } = req.body;
        
        // Validate required fields
        if (!name || amount === undefined || !type || !category || !recurrence) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate recurrenceDate is provided when recurrence is not "once"
        if (recurrence !== 'once' && !recurrenceDate) {
          return res.status(400).json({ message: 'Recurrence date is required for recurring items' });
        }

        const newItem = await prisma.budgetItem.create({
          data: {
            name,
            amount: parseFloat(amount.toString()),
            type,
            category,
            recurrence,
            // Only set recurrenceDate if recurrence is not "once"
            recurrenceDate: recurrence === 'once' ? null : new Date(recurrenceDate),
            note: note || '',
            userId: session.user.id,
          },
        });
        res.status(201).json(newItem);
      } catch (error) {
        console.error('Error creating budget item:', error);
        res.status(500).json({ message: 'Error creating budget item', error: error instanceof Error ? error.message : 'Unknown error' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
