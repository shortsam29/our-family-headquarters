import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/",
    "/onboarding/:path*",
    "/schedule/:path*",
    "/family-hub/:path*",
    "/my-day/:path*",
    "/my-headquarters/:path*",
    "/moms-planner/:path*",
    "/tasks/:path*",
    "/kenzie/:path*",
    "/more/:path*",
    "/meals/:path*",
    "/shopping/:path*",
    "/grocery/:path*",
    "/household/:path*",
    "/pets/:path*",
    "/contacts/:path*",
    "/vehicles/:path*",
    "/documents/:path*",
    "/finance/:path*",
    "/settings/:path*",
    "/help/:path*",
    "/weather/:path*",
    "/api/vault/:path*",
  ],
};
