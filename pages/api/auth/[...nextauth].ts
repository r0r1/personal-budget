import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"
import cors from '../../../lib/corsMiddleware'
import { runMiddleware } from '../../../lib/corsMiddleware'
import { PrismaClient } from "@prisma/client"
import { NextApiResponse } from "next"
import { NextApiRequest } from "next"

const prisma = new PrismaClient()

// Extend the built-in Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware
  await runMiddleware(req, res, cors)

  // Handle NextAuth
  return NextAuth(req, res, {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async signIn({ user, account, profile }) {
        return true
      },
      async session({ session, token }): Promise<Session> {
        if (session.user) {
          // Get or create user
          const user = await getUserOrCreate(session);
          
          // Update session with user ID
          session.user.id = user.id;

          // Create session if it doesn't exist
          await createSessionIfNotExists(session, token);

          console.log('Modified session:', session);
        }

        return session
      },
      async jwt({ token, account, profile }): Promise<JWT> {
        if (account && profile) {
          token.id = profile.sub
        }
        return token
      },
    },
  })
}

// Function to get existing user or create new one
async function getUserOrCreate(session: Session) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
  });

  if (!existingUser) {
    return await prisma.user.create({
      data: {
        name: session.user.name || '',
        email: session.user.email!,
      },
    });
  }

  return existingUser;
}

// Function to create a session if it doesn't already exist
async function createSessionIfNotExists(session: Session, token: JWT) {
  const sessionToken = token.id as string;

  const existingSession = await prisma.session.findUnique({
    where: {
      sessionToken: sessionToken,
    },
  });

  if (!existingSession && session.user.id) {
    await prisma.session.create({
      data: {
        userId: session.user.id,
        expires: session.expires,
        sessionToken: sessionToken,
      },
    });
  }
}
