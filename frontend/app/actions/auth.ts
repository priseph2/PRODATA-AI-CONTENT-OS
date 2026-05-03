"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signOut() {
  const cookieStore = await cookies();

  try {
    const supabase = await createClient();

    // Call signOut on Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }

  // Explicitly clear all Supabase cookies
  const allCookies = cookieStore.getAll();

  // Delete any Supabase-related cookies
  allCookies.forEach((cookie) => {
    if (
      cookie.name.includes("sb-") ||
      cookie.name.includes("auth") ||
      cookie.name.includes("session")
    ) {
      cookieStore.delete(cookie.name);
    }
  });

  // Always redirect to home
  redirect("/");
}
