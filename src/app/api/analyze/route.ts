import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUploadLimit } from "@/lib/uploadLimit";

export const runtime = "edge";

const RAILWAY_URL = process.env.RAILWAY_ANALYZE_URL;
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
      return NextResponse.json({ error: "Analyze service not configured." }, { status: 500 });
    }

    // --- 1. Stream the request body directly to Railway ---
    // Using edge runtime + streaming means Vercel never buffers the full
    // body in memory, bypassing the 4.5MB serverless body size limit.
    const railwayRes = await fetch(`${RAILWAY_URL}/analyze`, {
      method: "POST",
      headers: {
        "content-type": req.headers.get("content-type") ?? "",
        "x-service-secret": SERVICE_SECRET ?? "",
      },
      body: req.body,
      // @ts-expect-error -- needed for streaming
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