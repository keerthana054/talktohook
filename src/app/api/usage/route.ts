import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUploadLimit } from "@/lib/uploadLimit";

// Lets the upload page show "X uploads left" on page load, before the
// user has uploaded anything this session -- without this, the banner
// only ever populated from the response of an actual /api/analyze call,
// so a fresh page load (e.g. right after upgrading) showed nothing.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limitCheck = await checkUploadLimit(user.id);

  return NextResponse.json({
    uploadsUsed: limitCheck.count,
    uploadsLimit: limitCheck.limit,
    plan: limitCheck.plan,
  });
}