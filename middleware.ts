import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "./lib/prisma"

async function validateApiKey(apiKey: string) {
  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: { id: true }
  })
  return !!user
}

export async function middleware(request: NextRequest) {
  // Skip auth for non-API routes, auth endpoints, and docs
  if (!request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/api/auth/') ||
      request.nextUrl.pathname.startsWith('/api/docs')) {
    return NextResponse.next()
  }

  // Check for API key in header
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    const isValidApiKey = await validateApiKey(apiKey)
    if (isValidApiKey) {
      return NextResponse.next()
    }
  }

  // Check for session token
  const token = await getToken({ req: request })
  if (token) {
    return NextResponse.next()
  }

  // No valid authentication found
  return new NextResponse(
    JSON.stringify({ error: "Unauthorized" }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Configure which routes to protect
export const config = {
  matcher: [
    "/api/budget-items/:path*",
    "/api/recurring-budget-items/:path*",
    "/api/user/:path*",
  ]
}
