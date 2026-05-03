import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get fresh session data
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes - must be authenticated
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const response = NextResponse.redirect(url);

      // Aggressively clear all auth cookies
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      response.cookies.delete("sb-auth-token");
      response.cookies.delete("sb-token-cache");

      // Clear any cookie with sb- prefix
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.includes("sb-") || cookie.name.includes("auth")) {
          response.cookies.delete(cookie.name);
        }
      });

      return response;
    }

    // Authenticated user on dashboard - no caching
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
  }

  // Auth pages - must NOT be authenticated
  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") {
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Not authenticated on auth page - allow access, no caching
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
  }

  return supabaseResponse;
}