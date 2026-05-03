"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signOut() {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Clear all auth-related cookies
  const cookieStore = await cookies();

  // Remove Supabase auth cookies
  const authCookies = [
    "sb-access-token",
    "sb-refresh-token",
    "sb-auth-token",
    "sb-token-cache",
  ];

  authCookies.forEach((cookie) => {
    cookieStore.delete(cookie);
  });

  redirect("/");
}
