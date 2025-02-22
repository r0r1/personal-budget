import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from 'next-intl';
import { getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { SessionProvider } from "../components/session-provider";
import { Toaster } from "../components/ui/toaster";
import { Navigation } from "../components/navigation";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aplikasi Anggaran Pribadi",
  description: "Kelola keuangan pribadi Anda dengan efektif",
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const session = await getServerSession(authOptions);
  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error('Failed to load messages:', error);
    messages = {};
  }

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider session={session}>
          <NextIntlClientProvider locale={locale} messages={messages}>
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
