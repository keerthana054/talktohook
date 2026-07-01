import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" lets us send the user to wherever they originally tried to go
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to /app (or wherever they came from) after successful login
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send to the error page
  return NextResponse.redirect(`${origin}/auth/error`);
}