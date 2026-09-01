"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await logout();
    router.push("/login");
  }

  return <button onClick={handleClick}>Log out</button>;
}
