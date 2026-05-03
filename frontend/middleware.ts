import { type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // TODO: Add auth middleware after resolving Supabase SSR Edge Function compatibility
  return null;
}

export const config = {
  matcher: [],
};