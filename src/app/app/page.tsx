"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HookResult } from "@/lib/hookPrompt";
import AuthButton from "@/components/AuthButton";
import UpgradeButton from "@/components/UpgradeButton";

const FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=DM+Sans:wght@400;500;700;800&display=swap";

const C = {
  cherry: "#D20001", pink: "#FEC6E9", cobalt: "#0212EE",
  sand: "#F3F3E9", black: "#0a0a0a", white: "#ffffff",
};

type RequestState = "idle" | "uploading" | "done" | "error" | "limit_reached";

// Three-step flow to bypass Vercel's 4.5MB body limit:
// 1. GET /api/analyze-token  -- auth check + quota, returns Railway URL
// 2. POST directly to Railway -- video never touches Vercel
// 3. POST /api/analyze-save  -- save result to Supabase (tiny JSON only)

export default function UploadTool() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [statusMsg, setStatusMsg] = useState("Analyzing - this can take a minute");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [hooks, setHooks] = useState<HookResult[] | null>(null);
  const [uploadsUsed, setUploadsUsed] = useState<number | null>(null);
  const [uploadsLimit, setUploadsLimit] = useState<number | null>(null);

  // Fetch current usage on mount so banner shows immediately
  useEffect(() => {
    fetch("/api/usage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setUploadsUsed(d.uploadsUsed); setUploadsLimit(d.uploadsLimit); } })
      .catch(() => {});
  }, []);

  async function handleAnalyze() {
    if (!file) return;
    setState("uploading");
    setStatusMsg("Checking your account...");
    setErrorMessage(null);
    setHooks(null);
    setTranscript(null);

    try {
      // Step 1: get auth token + Railway URL from Vercel
      const tokenRes = await fetch("/api/analyze-token");
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        if (tokenData.limitReached) {
          setUploadsUsed(tokenData.count);
          setUploadsLimit(tokenData.limit);
          setState("limit_reached");
          return;
        }
        throw new Error(tokenData.error || "Something went wrong.");
      }

      const { railwayUrl, serviceSecret, uploadsCount, uploadsLimit: limit } = tokenData;

      // Step 2: POST video directly to Railway (bypasses Vercel entirely)
      setStatusMsg("Uploading and transcribing your video...");
      const formData = new FormData();
      formData.append("video", file);

      const railwayRes = await fetch(`${railwayUrl}/analyze`, {
        method: "POST",
        headers: { "x-service-secret": serviceSecret },
        body: formData,
      });

      const railwayData = await railwayRes.json();
      if (!railwayRes.ok) {
        throw new Error(railwayData.error || "Analysis failed.");
      }

      // Step 3: save result to Supabase via Vercel (tiny JSON, no file)
      setStatusMsg("Saving your hooks...");
      const saveRes = await fetch("/api/analyze-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: railwayData.transcript,
          hooks: railwayData.hooks,
          uploadsCount,
          uploadsLimit: limit,
        }),
      });

      const saveData = await saveRes.json();

      setTranscript(railwayData.transcript);
      setHooks(railwayData.hooks);
      setUploadsUsed(saveData.uploadsUsed);
      setUploadsLimit(saveData.uploadsLimit);
      setState("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error occurred.");
      setState("error");
    }
  }

  const uploadsRemaining = uploadsLimit !== null && uploadsUsed !== null
    ? Math.max(uploadsLimit - uploadsUsed, 0)
    : null;

  return (
    <>
      <style>{`@import url('${FONTS}'); * { box-sizing: border-box; }`}</style>
      <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Nav */}
        <nav style={{ borderBottom: `2px solid ${C.black}`, background: C.sand }}>
          <div style={{ maxWidth: "780px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem" }}>
            <Link href="/" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem", fontWeight: 900, color: C.black, textDecoration: "none" }}>TalkToHook</Link>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <Link href="/history" style={{ fontSize: "0.82rem", fontWeight: 600, color: C.black, textDecoration: "none" }}>History</Link>
              <AuthButton />
            </div>
          </div>
        </nav>

        <main style={{ maxWidth: "780px", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", color: C.black }}>Find your hook</h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", color: "#555", lineHeight: 1.6 }}>
              Upload a talking video. We'll transcribe it and rank the best lines as ready-to-post hooks, with a caption for each.
            </p>
            {uploadsRemaining !== null && uploadsLimit !== null && (
              <p style={{ marginTop: "0.75rem", display: "inline-block", background: uploadsRemaining === 0 ? C.cherry : C.pink, color: uploadsRemaining === 0 ? C.white : C.black, padding: "0.25rem 0.8rem", fontSize: "0.75rem", fontWeight: 800, border: `2px solid ${C.black}` }}>
                {uploadsRemaining} upload{uploadsRemaining === 1 ? "" : "s"} left
              </p>
            )}
          </header>

          {state === "limit_reached" ? (
            <section style={{ border: `2px solid ${C.black}`, background: C.cherry, padding: "2.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: "1.5rem", fontWeight: 900, color: C.white }}>You've used all {uploadsLimit} uploads</p>
              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: C.pink }}>Upgrade to keep finding hooks in your videos.</p>
              <div style={{ marginTop: "1.5rem", maxWidth: "240px", marginLeft: "auto", marginRight: "auto" }}>
                <UpgradeButton plan="pro" style={{ background: C.white, color: C.cherry, padding: "0.85rem 2rem" }}>Upgrade to Pro</UpgradeButton>
              </div>
              <Link href="/#pricing" style={{ display: "inline-block", marginTop: "1rem", fontSize: "0.8rem", color: C.pink, textDecoration: "underline" }}>See all plans</Link>
            </section>
          ) : (
            <section style={{ border: `2px solid ${C.black}`, background: C.white, padding: "1.75rem" }}>
              <label htmlFor="video-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${C.black}`, padding: "3rem 1.5rem", textAlign: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: C.black }}>{file ? file.name : "Click to choose a video file"}</span>
                <span style={{ marginTop: "0.4rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>MP4 or MOV · under ~200mb</span>
                <input id="video-upload" type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>

              <button
                onClick={handleAnalyze}
                disabled={!file || state === "uploading"}
                style={{ marginTop: "1.25rem", width: "100%", background: !file || state === "uploading" ? "#ccc" : C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "1rem", fontSize: "0.95rem", fontWeight: 800, cursor: !file || state === "uploading" ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {state === "uploading" ? statusMsg : "Analyze video"}
              </button>

              {state === "error" && errorMessage && (
                <p style={{ marginTop: "1rem", background: "#fee", border: "1px solid #f99", padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#900" }}>{errorMessage}</p>
              )}
            </section>
          )}

          {hooks && (
            <section style={{ marginTop: "2.5rem" }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem", fontWeight: 800, marginBottom: "1.25rem", color: C.black }}>Your ranked hooks</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {hooks.map((h, i) => <HookCard key={i} hook={h} rank={i + 1} />)}
              </div>
            </section>
          )}

          {transcript && (
            <details style={{ marginTop: "2rem", border: `1px solid #ddd`, background: "rgba(255,255,255,0.5)", padding: "1rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", color: C.black }}>View raw transcript</summary>
              <p style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "#555", lineHeight: 1.6 }}>{transcript}</p>
            </details>
          )}
        </main>
      </div>
    </>
  );
}

function HookCard({ hook, rank }: { hook: HookResult; rank: number }) {
  const [copied, setCopied] = useState<"hook" | "caption" | null>(null);
  async function copy(text: string, which: "hook" | "caption") {
    try { await navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(null), 1800); } catch {}
  }
  return (
    <div style={{ border: `2px solid ${C.black}`, background: C.white, padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ background: C.cobalt, color: C.white, padding: "0.2rem 0.7rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>{hook.framework}</span>
        <span style={{ fontSize: "0.75rem", color: "#999", fontWeight: 700 }}>#{rank}</span>
      </div>
      <p style={{ marginTop: "1rem", fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontStyle: "italic", color: C.black, lineHeight: 1.5 }}>"{hook.hook}"</p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#777", lineHeight: 1.5 }}>{hook.why_it_works}</p>
      <button onClick={() => copy(hook.hook, "hook")} style={{ marginTop: "0.75rem", background: "none", color: C.black, border: `1px solid ${C.black}`, padding: "0.35rem 0.9rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        {copied === "hook" ? "Copied ✓" : "Copy hook"}
      </button>
      <div style={{ marginTop: "1.25rem", background: C.sand, border: `1px solid #ddd`, padding: "1rem" }}>
        <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#999", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Ready-to-post caption</p>
        <p style={{ fontSize: "0.85rem", color: C.black, lineHeight: 1.55 }}>{hook.caption}</p>
        <button onClick={() => copy(hook.caption, "caption")} style={{ marginTop: "0.75rem", background: copied === "caption" ? C.cobalt : C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "0.4rem 1rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          {copied === "caption" ? "Copied ✓" : "Copy & post →"}
        </button>
      </div>
    </div>
  );
}