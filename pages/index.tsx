import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BudgetPlanner } from "@/components/components-budget-planner"
import { LandingPage } from "@/components/landing-page"
import Logo from "@/components/Logo"

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
        <Logo />
        <Link href="/profile">
          <Button variant="secondary">View Profile</Button>
        </Link>
      </header>
      <BudgetPlanner />
    </div>
  )
}
