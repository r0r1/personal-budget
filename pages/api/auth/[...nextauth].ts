import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async session({ session, token }): Promise<Session> {
      return session
    },
    async jwt({ token, account, profile }): Promise<JWT> {
      if (account && profile) {
        token.id = profile.sub
      }
      return token
    },
  },
}

export default NextAuth(authOptions)
