import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getBackendConfiguration, isDevelopmentAuthBypassEnabled } from "@/lib/environment";

export async function updateSupabaseSession(request: NextRequest) {
  if (isDevelopmentAuthBypassEnabled()) return NextResponse.next();
  const configuration = getBackendConfiguration();
  if (!configuration.configured) {
    return NextResponse.redirect(new URL("/sign-in?status=configuration", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(configuration.url, configuration.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  return response;
}
