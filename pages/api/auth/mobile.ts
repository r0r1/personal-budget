import { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "../../../lib/prisma"
import { runMiddleware } from "../../../lib/corsMiddleware"
import cors from "../../../lib/corsMiddleware"
import { getServerSession } from "next-auth"
import { authOptions } from "./[...nextauth]"
import crypto from "crypto"

// Generate API key
function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware
  await runMiddleware(req, res, cors)

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Generate new API key
    const apiKey = generateApiKey()

    // Save API key to database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKey: apiKey,
        apiKeyUpdatedAt: new Date(),
      },
    })

    // Return API key to client
    return res.status(200).json({
      apiKey: apiKey,
      userId: updatedUser.id,
    })
  } catch (error) {
    console.error("Mobile auth error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
