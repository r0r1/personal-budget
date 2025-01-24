"use client"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { signIn } from "next-auth/react"
import { ChartBar, PiggyBank, Bell, ArrowRight, Calendar, Shield } from "lucide-react"
import { useTranslations } from 'next-intl'

export function LandingPage() {
  const t = useTranslations('landing');

  const heroTitle = t.raw('heroTitle').replace(
    '{highlight}',
    `<span class="text-blue-600">${t('heroTitleHighlight')}</span>`
  );

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 
          className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6"
          dangerouslySetInnerHTML={{ __html: heroTitle }}
        />
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {t('heroSubtitle')}
        </p>
        <Button 
          size="lg" 
          className="text-lg px-8"
          onClick={() => signIn("google", { callbackUrl: "/" }).catch(error => {
            console.error("Sign in error:", error);
          })}
        >
          {t('getStarted')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                <ChartBar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('features.tracking.title')}</h3>
              <p className="text-gray-600">
                {t('features.tracking.description')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                <PiggyBank className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('features.budgeting.title')}</h3>
              <p className="text-gray-600">
                {t('features.budgeting.description')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('features.notifications.title')}</h3>
              <p className="text-gray-600">
                {t('features.notifications.description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('benefits.title')}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="rounded-full bg-blue-100 w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('benefits.recurring.title')}</h3>
                <p className="text-gray-600">
                  {t('benefits.recurring.description')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="rounded-full bg-green-100 w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('benefits.security.title')}</h3>
                <p className="text-gray-600">
                  {t('benefits.security.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('cta.subtitle')}
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={() => signIn("google", { callbackUrl: "/" }).catch(error => {
              console.error("Sign in error:", error);
            })}
          >
            {t('cta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  )
}
