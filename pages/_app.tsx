import { SessionProvider } from "next-auth/react"
import type { AppProps } from "next/app"
import { Toaster } from "@/components/ui/toaster"
import "@/app/globals.css"

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">
            <Component {...pageProps} />
          </div>
          <Toaster />
        </div>
      </div>
    </SessionProvider>
  )
}
