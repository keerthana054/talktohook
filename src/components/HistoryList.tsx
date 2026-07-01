"use client";

import { useState } from "react";

const C = {
  cherry: "#D20001",
  pink:   "#FEC6E9",
  cobalt: "#0212EE",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  white:  "#ffffff",
};

interface HookResult {
  framework: string;
  hook: string;
  why_it_works: string;
  caption: string;
}

interface Upload {
  id: string;
  transcript: string;
  hooks: HookResult[];
  created_at: string;
}

export default function HistoryList({ uploads }: { uploads: Upload[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {uploads.map((upload) => (
        <UploadCard key={upload.id} upload={upload} />
      ))}
    </div>
  );
}

function UploadCard({ upload }: { upload: Upload }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(upload.created_at);
  const topHook = upload.hooks?.[0];

  return (
    <div style={{ border: `2px solid ${C.black}`, background: C.white }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%", textAlign: "left", padding: "1.5rem",
          background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.72rem", color: "#999", fontWeight: 600 }}>
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
            {topHook && (
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: "1.05rem", fontStyle: "italic", marginTop: "0.5rem", color: C.black, lineHeight: 1.4 }}>
                "{topHook.hook}"
              </p>
            )}
          </div>
          <span style={{ fontSize: "1.2rem", color: "#999", flexShrink: 0 }}>{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: `2px solid ${C.black}`, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {upload.hooks.map((h, i) => (
            <HookBlock key={i} hook={h} />
          ))}

          <details style={{ marginTop: "0.5rem" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "#888" }}>
              View raw transcript
            </summary>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#666", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {upload.transcript}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

function HookBlock({ hook }: { hook: HookResult }) {
  const [copied, setCopied] = useState(false);

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(hook.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail on non-HTTPS or without permission —
      // fail silently rather than throwing an error at the user.
    }
  }

  return (
    <div style={{ background: C.sand, border: `1px solid #ddd`, padding: "1.25rem" }}>
      <span style={{ background: C.cobalt, color: C.white, padding: "0.2rem 0.7rem", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {hook.framework}
      </span>
      <p style={{ marginTop: "0.75rem", fontFamily: "'Fraunces', serif", fontSize: "1rem", fontStyle: "italic", color: C.black, lineHeight: 1.5 }}>
        "{hook.hook}"
      </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#777" }}>{hook.why_it_works}</p>

      <div style={{ marginTop: "1rem", background: C.white, border: `1px solid #ddd`, padding: "0.9rem" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          Caption
        </p>
        <p style={{ fontSize: "0.85rem", color: C.black, lineHeight: 1.55 }}>{hook.caption}</p>
        <button
          onClick={copyCaption}
          style={{
            marginTop: "0.75rem", background: copied ? C.cobalt : C.cherry, color: C.white,
            border: `2px solid ${C.black}`, padding: "0.4rem 1rem", fontSize: "0.75rem",
            fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {copied ? "Copied ✓" : "Copy caption"}
        </button>
      </div>
    </div>
  );
}