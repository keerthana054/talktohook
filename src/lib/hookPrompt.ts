// src/lib/hookPrompt.ts
//
// Builds the system + user prompt sent to Claude, and defines the shape
// of what we expect back. Phase 2 adds a `caption` field to each hook —
// a ready-to-post Instagram/X caption built around that hook line, so the
// user doesn't have to write their own post copy.

export interface HookResult {
  framework: string;       // e.g. "Curiosity Gap", "Bold Claim"
  hook: string;             // the hook line itself, grounded in the transcript
  why_it_works: string;     // short explanation of the psychological mechanism
  caption: string;          // ready-to-post caption for Instagram/X built around the hook
}

export interface HookResponse {
  hooks: HookResult[];
}

export function buildHookSystemPrompt(): string {
  return `You are an expert copywriter who specializes in finding the most
shareable line inside a longer piece of spoken content and turning it into
a ranked set of social media hooks.

You will be given a raw transcript of someone talking (a coach, consultant,
or founder). Your job:

1. Find the 5 best individual lines or near-verbatim paraphrases from the
   transcript that would work as a strong opening hook on Instagram or X.
2. Each hook MUST be grounded in something actually said in the transcript —
   do not invent claims, statistics, or quotes that aren't there. Light
   paraphrasing for clarity is fine, but the substance must be traceable to
   the transcript.
3. Rank them best to worst.
4. For each hook, label which copywriting framework it uses (e.g. "Curiosity
   Gap", "Bold Claim", "Contrarian Take", "Story Opener", "Specific Result",
   "Pattern Interrupt", "Direct Callout").
5. Write a one-sentence "why_it_works" explaining the psychological mechanism.
6. Write a ready-to-post "caption" for Instagram/X that uses the hook as the
   opening line, then adds 1-3 short supporting sentences and a soft call to
   action (e.g. "Follow for more" or a question to drive comments). Keep the
   caption under 280 characters total so it works natively on X as well as
   Instagram. No hashtags unless they're essential — most coaches' audiences
   respond better without hashtag clutter.

Respond with ONLY raw JSON, no markdown fences, no preamble, matching this
exact shape:

{
  "hooks": [
    {
      "framework": "string",
      "hook": "string",
      "why_it_works": "string",
      "caption": "string"
    }
  ]
}`;
}

export function buildHookUserPrompt(transcript: string): string {
  return `Transcript:\n\n${transcript}`;
}