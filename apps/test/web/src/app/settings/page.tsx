import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ChangePasswordForm } from "./change-password-form";
import { SessionList } from "./session-list";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Security settings</h1>
      <h2>Change password</h2>
      <ChangePasswordForm />
      <h2>Active sessions</h2>
      <SessionList />
      <p>
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </main>
  );
}
