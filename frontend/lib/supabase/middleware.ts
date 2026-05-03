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

  // Redirect to login if accessing protected route without auth
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const response = NextResponse.redirect(url);

      // Clear all Supabase auth cookies explicitly
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      response.cookies.delete("sb-auth-token");
      response.cookies.delete("sb-token-cache");

      return response;
    }
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Disable caching for authenticated routes to prevent stale content
  if (session && request.nextUrl.pathname.startsWith("/dashboard")) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
  }

  return supabaseResponse;
}