import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeRecoveryNext } from "@/lib/auth/recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeRecoveryNext(request.nextUrl.searchParams.get("next"));
  const destination = new URL(next, request.url);
  if (!tokenHash || type !== "recovery") return NextResponse.redirect(new URL("/reset-password?error=expired", request.url));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/reset-password?error=expired", request.url));
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return NextResponse.redirect(error ? new URL("/reset-password?error=expired", request.url) : destination);
}
