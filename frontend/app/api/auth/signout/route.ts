import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Redirect to home page
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });

  return response;
}
