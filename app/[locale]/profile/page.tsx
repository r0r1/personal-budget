import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile-view";

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <ProfileView user={session.user} />;
}
