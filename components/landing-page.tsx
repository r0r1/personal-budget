"use client"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { signIn } from "next-auth/react"
import { ChartBar, PiggyBank, Bell, ArrowRight, Calendar, Shield } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Take Control of Your <span className="text-blue-600">Finances</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Track your income and expenses, set budgets, and achieve your financial goals with our simple yet powerful budgeting tool.
        </p>
        <Button 
          size="lg" 
          className="text-lg px-8"
          onClick={() => signIn("google", { callbackUrl: "/" }).catch(error => {
            console.error("Sign in error:", error);
          })}
        >
          Get Started Free
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
              <h3 className="text-xl font-semibold mb-2">Easy Tracking</h3>
              <p className="text-gray-600">
                Effortlessly track your income and expenses with our intuitive interface.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                <PiggyBank className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Budgeting</h3>
              <p className="text-gray-600">
                Set and manage budgets by category to help you save more effectively.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Notifications</h3>
              <p className="text-gray-600">
                Get timely alerts about your recurring transactions and budget limits.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="rounded-full bg-blue-100 w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Recurring Transactions</h3>
                <p className="text-gray-600">
                  Automatically track your regular income and expenses with smart recurring transactions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="rounded-full bg-green-100 w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">
                  Your financial data is encrypted and protected with industry-standard security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Managing Your Money?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who are already taking control of their finances.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={() => signIn("google", { callbackUrl: "/" }).catch(error => {
              console.error("Sign in error:", error);
            })}
          >
            Start Budgeting Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Personal Budget. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
