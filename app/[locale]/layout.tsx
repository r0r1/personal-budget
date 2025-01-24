import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from 'next-intl';
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import { locales, defaultLocale } from "@/i18n/config";
import "../globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal Budget App",
  description: "Manage your personal finances effectively",
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const session = await getServerSession(authOptions);

  // Validate locale and fallback to default if invalid
  const validLocale = locales.includes(locale as any) ? locale : defaultLocale;
  
  let messages;
  try {
    messages = (await import(`../../messages/${validLocale}.json`)).default;
  } catch (error) {
    console.error('Failed to load messages:', error);
    messages = (await import('../../messages/id.json')).default;
  }

  return (
    <html lang={validLocale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider session={session}>
          <NextIntlClientProvider locale={validLocale} messages={messages}>
            <div className="relative flex min-h-screen flex-col">
              <Navigation />
              <div className="flex-1 flex-col">
                {children}
              </div>
              <Toaster />
            </div>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
