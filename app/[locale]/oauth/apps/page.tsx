import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { OAuthApps } from "@/components/oauth-apps";
import { redirect } from "next/navigation";

export default async function OAuthAppsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <OAuthApps />;
}
