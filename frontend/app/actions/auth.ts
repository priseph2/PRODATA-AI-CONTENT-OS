"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  try {
    const supabase = await createClient();

    // Call signOut - this should clear the session on the server
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("SignOut error:", error);
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  // Always redirect to home, regardless of signOut result
  // The middleware will validate on next request
  redirect("/");
}
