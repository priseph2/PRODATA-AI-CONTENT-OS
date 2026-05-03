import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();

  // Create redirect response
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });

  // Explicitly clear auth cookies
  response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("sb-auth-token", "", { maxAge: 0, path: "/" });

  return response;
}
