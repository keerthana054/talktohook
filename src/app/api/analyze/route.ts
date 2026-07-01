import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { extractAudioFromVideo, cleanupTempFile } from "@/lib/extractAudio";
import { buildHookSystemPrompt, buildHookUserPrompt, HookResponse } from "@/lib/hookPrompt";
import { checkUploadLimit } from "@/lib/uploadLimit";
import { createClient } from "@/lib/supabase/server";
import { promises as fs } from "fs";

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB
const MAX_VIDEO_MINUTES_NOTE = 10;

export async function POST(req: NextRequest) {
  let extractedAudioPath: string | null = null;

  try {
    // --- 0. Require auth, then enforce the free upload limit ---
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You need to be signed in to analyze a video." }, { status: 401 });
    }

    const limitCheck = await checkUploadLimit(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've used all ${limitCheck.limit} free uploads. Upgrade to keep generating hooks.`,
          limitReached: true,
          count: limitCheck.count,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    // --- 1. Receive the uploaded file ---
    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video file was uploaded." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Please keep uploads under ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB (roughly under ${MAX_VIDEO_MINUTES_NOTE} minutes of video).` },
        { status: 400 }
      );
    }

    const videoBuffer = Buffer.from(await file.arrayBuffer());

    // --- 2. Extract audio from the video using ffmpeg ---
    extractedAudioPath = await extractAudioFromVideo(videoBuffer, file.name);

    // --- 3. Transcribe the audio with OpenAI's transcription API ---
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const audioFileForUpload = await fs.readFile(extractedAudioPath);
    const transcriptionResponse = await openai.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: new File([audioFileForUpload], "audio.mp3", { type: "audio/mpeg" }),
    });

    const transcript = transcriptionResponse.text?.trim();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcription came back empty. Make sure the video actually contains spoken audio." },
        { status: 422 }
      );
    }

    // --- 4. Generate ranked hooks + captions with GPT-4o-mini ---
    // Swapped from Claude to GPT-4o-mini here — same OpenAI client and
    // billing as transcription, so there's only one provider to fund.
    // We use the chat completions API with response_format json_object
    // to force valid JSON back, which removes the need for the markdown-
    // fence-stripping logic the Claude version needed.
    const hookCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildHookSystemPrompt() },
        { role: "user", content: buildHookUserPrompt(transcript) },
      ],
    });

    const rawText = hookCompletion.choices[0]?.message?.content ?? "";

    let parsed: HookResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Got a response from the AI but couldn't parse it as JSON.", raw: rawText },
        { status: 500 }
      );
    }

    // --- 5. Save the result to Supabase, tied to this user ---
    const { data: savedUpload, error: saveError } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        transcript,
        hooks: parsed.hooks,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("Failed to save upload:", saveError);
    }

    return NextResponse.json({
      transcript,
      hooks: parsed.hooks,
      uploadId: savedUpload?.id ?? null,
      uploadsUsed: limitCheck.count + 1,
      uploadsLimit: limitCheck.limit,
    });
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Something went wrong: ${message}` }, { status: 500 });
  } finally {
    if (extractedAudioPath) {
      await cleanupTempFile(extractedAudioPath);
    }
  }
}

// Phase 2: auth required, 3-upload free limit enforced, results saved to
// Supabase. Both transcription AND hook generation now run on OpenAI
// (gpt-4o-mini-transcribe + gpt-4o-mini) so there's a single API key and
// a single bill to manage. ANTHROPIC_API_KEY is no longer required for
// this route -- you can remove the @anthropic-ai/sdk import/dependency
// if you're not using Claude anywhere else in the project.