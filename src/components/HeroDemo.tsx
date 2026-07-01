"use client";

import { useEffect, useState } from "react";

const DEMO_TRANSCRIPT =
  "...and that's the thing nobody tells new coaches: your first ten clients don't come from your website, they come from one good conversation you're willing to have in public.";

const DEMO_HOOK = {
  framework: "CONTRARIAN_TAKE",
  hook: "Nobody tells new coaches this: your website won't bring your first 10 clients.",
};

export function HeroDemo() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => setStage(2), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="w-full rounded-2xl border border-[var(--color-hairline)] bg-white/60 p-5 sm:p-7">
      {/* Transcript fragment */}
      <div
        className={`rounded-lg bg-[var(--color-paper)] px-4 py-3 font-mono text-[13px] leading-relaxed text-[var(--color-stone)] transition-opacity duration-500 ${
          stage >= 0 ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="mr-2 text-[var(--color-hook)]">TRANSCRIPT</span>
        {DEMO_TRANSCRIPT}
      </div>

      {/* Arrow / transition indicator */}
      <div
        className={`my-3 flex items-center gap-2 pl-1 text-[var(--color-stone)] transition-opacity duration-500 ${
          stage >= 1 ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 10h13M11 5l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-[11px] uppercase tracking-wide">
          ranked by framework
        </span>
      </div>

      {/* Resulting hook card */}
      <div
        className={`rounded-lg border border-[var(--color-hairline)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-500 ${
          stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="inline-block rounded-full bg-[var(--color-hook)]/10 px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--color-hook)]">
          {DEMO_HOOK.framework}
        </span>
        <p className="mt-3 font-serif text-lg leading-snug text-[var(--color-ink)]">
          &ldquo;{DEMO_HOOK.hook}&rdquo;
        </p>
      </div>
    </div>
  );
}
