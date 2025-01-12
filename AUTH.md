# Google Authentication Setup Guide

## Prerequisites

1. Google Cloud Console Account
2. Next.js Application (already set up)

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" section
5. Click "Create Credentials" > "OAuth client ID"
6. Select "Web application"
7. Set up OAuth consent screen if not already done
8. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://your-production-domain.com` (for production)
9. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-domain.com/api/auth/callback/google` (for production)
10. Click "Create"
11. Save the generated Client ID and Client Secret

### 2. Environment Variables Setup

Create or update your `.env.local` file with the following variables:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000  # for development
# NEXTAUTH_URL=https://your-production-domain.com  # for production
```

Note: Generate a random string for NEXTAUTH_SECRET using:
```bash
openssl rand -base64 32
```

### 3. Authentication Flow

The authentication is implemented using NextAuth.js with the following flow:

1. User clicks "Sign in with Google"
2. User is redirected to Google consent screen
3. After consent, Google redirects back to your application
4. NextAuth.js handles the callback and creates/updates user session
5. User is redirected to the application

## Troubleshooting

### Common Issues

1. **"Sign in with Google" button not working:**
   - Check if environment variables are properly set
   - Verify that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
   - Ensure NEXTAUTH_URL matches your actual domain

2. **Redirect URI Mismatch:**
   - Verify that the redirect URI in Google Cloud Console exactly matches your application's callback URL
   - Check for trailing slashes
   - Ensure protocol (http/https) matches

3. **Invalid Client ID:**
   - Confirm GOOGLE_CLIENT_ID is correctly copied from Google Cloud Console
   - Check for any whitespace in the environment variables

4. **Session Not Persisting:**
   - Verify NEXTAUTH_SECRET is set
   - Check if cookies are being properly set
   - Ensure database connection is working for session storage

### Debug Steps

1. Check browser console for any JavaScript errors
2. Verify network requests in browser developer tools
3. Enable NextAuth.js debug mode by setting:
   ```env
   NEXTAUTH_DEBUG=true
   ```
4. Check server logs for authentication-related errors

## API Reference

### Sign In

```typescript
// Client-side sign in
import { signIn } from "next-auth/react"

// Redirect to Google sign in
signIn("google")

// Sign in with custom options
signIn("google", {
  callbackUrl: "/dashboard",
  redirect: true
})
```

### Sign Out

```typescript
// Client-side sign out
import { signOut } from "next-auth/react"

signOut()
```

### Get Session

```typescript
// Client-side
import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "authenticated") {
    return <div>Signed in as {session.user.email}</div>
  }

  return <div>Not signed in</div>
}

// Server-side
import { getSession } from "next-auth/react"

export async function getServerSideProps(context) {
  const session = await getSession(context)
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: { session }
  }
}
```

## Security Considerations

1. Always use HTTPS in production
2. Keep your NEXTAUTH_SECRET secure and unique per environment
3. Regularly rotate your Google OAuth credentials
4. Implement proper CORS policies
5. Use session strategy 'jwt' for better security
6. Implement rate limiting for auth endpoints
7. Monitor auth logs for suspicious activities

## Testing

The authentication system can be tested using Jest and React Testing Library. Example test cases are provided in `__tests__/auth.test.ts`.

For local testing:
1. Use test environment variables
2. Mock NextAuth.js session
3. Test both authenticated and unauthenticated states
4. Verify error handling
