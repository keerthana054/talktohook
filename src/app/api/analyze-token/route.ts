import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUploadLimit } from "@/lib/uploadLimit";

// Step 1 of the direct-upload flow.
// Browser calls this first -- it checks auth + quota, then returns the
// Railway URL and service secret so the browser can POST the video
// directly to Railway, bypassing Vercel's 4.5MB body limit entirely.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You need to be signed in to analyze a video." },
        { status: 401 }
      );
    }

    const limitCheck = await checkUploadLimit(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've used all ${limitCheck.limit} uploads. Upgrade to keep generating hooks.`,
          limitReached: true,
          count: limitCheck.count,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    // Return the Railway endpoint and secret so the browser can call
    // Railway directly. The service secret is a shared secret -- not
    // a per-user token, but it prevents random public access to Railway.
    return NextResponse.json({
      railwayUrl: process.env.RAILWAY_ANALYZE_URL,
      serviceSecret: process.env.SERVICE_SECRET,
      userId: user.id,
      uploadsCount: limitCheck.count,
      uploadsLimit: limitCheck.limit,
    });
  } catch (err) {
    console.error("Error in /api/analyze-token:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}