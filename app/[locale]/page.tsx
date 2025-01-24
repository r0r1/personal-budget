import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { BudgetPlanner } from "@/components/components-budget-planner";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className="container mx-auto p-4">
      <BudgetPlanner />
    </div>
  );
}
