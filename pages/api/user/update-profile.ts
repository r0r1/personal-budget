import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getSession({ req })

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { name } = req.body

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    })

    res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ message: 'Error updating user profile' })
  }
}