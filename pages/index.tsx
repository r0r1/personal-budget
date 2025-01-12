import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BudgetPlanner } from "@/components/components-budget-planner"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!session) {
    return <LandingPage />
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">SmallBudget</h1>
        <Link href="/profile">
          <Button variant="outline">View Profile</Button>
        </Link>
      </header>
      <BudgetPlanner />
    </div>
  )
}
