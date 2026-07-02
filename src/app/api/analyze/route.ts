import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUploadLimit } from "@/lib/uploadLimit";

// The heavy lifting (ffmpeg + OpenAI) runs on Railway where there's no
// body size limit. This Vercel route handles auth + quota enforcement only,
// then streams the request straight to Railway.
const RAILWAY_URL = process.env.RAILWAY_ANALYZE_URL; // e.g. https://your-service.railway.app
const SERVICE_SECRET = process.env.SERVICE_SECRET;

export async function POST(req: NextRequest) {
  try {
    // --- 0. Auth + upload limit check ---
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

    if (!RAILWAY_URL) {
      return NextResponse.json(
        { error: "Analyze service not configured." },
        { status: 500 }
      );
    }

    // --- 1. Forward the request to Railway ---
    // We pass the raw body straight through -- no buffering, no parsing.
    // This avoids hitting Vercel's body size limit since we're just
    // streaming bytes to another server.
    const railwayRes = await fetch(`${RAILWAY_URL}/analyze`, {
      method: "POST",
      headers: {
        // Forward the content-type so Railway's multer knows it's multipart
        "content-type": req.headers.get("content-type") ?? "",
        "x-service-secret": SERVICE_SECRET ?? "",
      },
      body: req.body,
      // @ts-expect-error -- Next.js fetch needs duplex for streaming
      duplex: "half",
    });

    if (!railwayRes.ok) {
      const err = await railwayRes.json().catch(() => ({ error: "Railway service error." }));
      return NextResponse.json(err, { status: railwayRes.status });
    }

    const data = await railwayRes.json();

    // --- 2. Save result to Supabase ---
    const { data: savedUpload, error: saveError } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        transcript: data.transcript,
        hooks: data.hooks,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("Failed to save upload:", saveError);
    }

    return NextResponse.json({
      transcript: data.transcript,
      hooks: data.hooks,
      uploadId: savedUpload?.id ?? null,
      uploadsUsed: limitCheck.count + 1,
      uploadsLimit: limitCheck.limit,
    });
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Something went wrong: ${message}` }, { status: 500 });
  }
}