# TalkToHook — Phase 1

Upload a talking video → get back ranked, ready-to-post hooks, grounded in your own transcript.

This is the **Phase 1 core loop only**: no auth, no payments, no deployment. The goal is to prove the magic moment works before adding any SaaS plumbing.

## What's inside

- `src/app/page.tsx` — the upload UI (single page: file input, button, results)
- `src/app/api/analyze/route.ts` — the backend pipeline: receive video → extract audio → transcribe → generate hooks
- `src/lib/extractAudio.ts` — shells out to ffmpeg directly to pull audio out of the uploaded video
- `src/lib/hookPrompt.ts` — the Claude prompt that turns a transcript into ranked, framework-labeled hooks (tweak this file to change tone, frameworks, or hook count)

## Setup

### 1. Install ffmpeg (required — this is NOT an npm package)

- **Mac:** `brew install ffmpeg`
- **Windows:** download from https://ffmpeg.org/download.html and add it to your PATH
- **Linux:** `sudo apt install ffmpeg`

Confirm it worked by running `ffmpeg -version` in your terminal — you should see version info, not "command not found."

### 2. Install dependencies

```bash
cd TalkToHook
npm install
```

### 3. Add your API keys

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in:
- `OPENAI_API_KEY` — from https://platform.openai.com/api-keys (used for transcription)
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com/settings/keys (used for hook generation)

Never commit `.env.local` to git — it's already in `.gitignore`, but double-check before pushing anywhere public.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, upload a short talking video (under ~10 minutes), and click "Analyze video."

## What happens when you upload a video

1. The video is sent to `/api/analyze`
2. ffmpeg strips out just the audio (mono, 16kHz, low bitrate — small and cheap)
3. The audio is sent to OpenAI's `gpt-4o-mini-transcribe` to get a text transcript
4. The transcript is sent to Claude (Sonnet) with a prompt asking for 5 ranked hooks, each using a different copywriting framework (curiosity gap, bold claim, contrarian take, story opener, etc.)
5. Claude returns structured JSON, which gets rendered as cards in the UI

## Known limits (intentional for Phase 1)

- **No auth** — anyone with access to the running app can use it
- **No usage limits** — nothing stops repeated uploads from racking up API costs
- **No persistence** — results aren't saved anywhere; refreshing the page loses them
- **200MB file size cap** — set in both `next.config.ts` and `route.ts`; raise both if you need bigger files
- **Local-only** — ffmpeg isn't pre-installed on most serverless hosts (like Vercel's default functions), so deployment will need extra setup later. Don't worry about this yet.

## Cost per upload (roughly)

For a ~5 minute video: ~$0.015 transcription + ~$0.02 Claude generation ≈ **$0.03–0.05 per upload**. Cheap enough to test freely.

## Next steps (later phases, not built yet)

- Phase 2: auth + saving past results (Supabase)
- Phase 3: Stripe subscriptions + usage limits per tier
- Phase 4: polish, landing page, deploy to a real domain (TalkToHook.com)
