import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Step 3 of the direct-upload flow.
// After the browser gets hooks back from Railway, it calls this route
// to save the result to Supabase. Vercel only handles tiny JSON here --
// no file ever touches Vercel.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { transcript, hooks, uploadsCount, uploadsLimit } = await req.json();

    if (!transcript || !hooks) {
      return NextResponse.json({ error: "Missing transcript or hooks." }, { status: 400 });
    }

    const { data: savedUpload, error: saveError } = await supabase
      .from("uploads")
      .insert({ user_id: user.id, transcript, hooks })
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("Failed to save upload:", saveError);
    }

    return NextResponse.json({
      uploadId: savedUpload?.id ?? null,
      uploadsUsed: (uploadsCount ?? 0) + 1,
      uploadsLimit: uploadsLimit ?? null,
    });
  } catch (err) {
    console.error("Error in /api/analyze-save:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}