import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/",
    "/schedule/:path*",
    "/family-hub/:path*",
    "/my-day/:path*",
    "/more/:path*",
    "/meals/:path*",
    "/shopping/:path*",
    "/household/:path*",
    "/pets/:path*",
    "/contacts/:path*",
    "/vehicles/:path*",
    "/documents/:path*",
    "/finance/:path*",
    "/settings/:path*",
  ],
};
