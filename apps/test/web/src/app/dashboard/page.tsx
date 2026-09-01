import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {user.displayName ?? user.email}.</p>
      <p>
        <a href="/profile">Edit profile</a>
      </p>
      <LogoutButton />
    </main>
  );
}
