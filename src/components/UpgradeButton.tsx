"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/polar";

const C = { black: "#0a0a0a" };

export default function UpgradeButton({
  plan,
  children,
  style,
}: {
  plan: PlanId;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Couldn't start checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="cta-btn"
        style={{
          display: "block", width: "100%", border: `2px solid ${C.black}`,
          textAlign: "center", fontSize: "0.875rem", fontWeight: 800,
          cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
          opacity: loading ? 0.7 : 1,
          ...style,
        }}
      >
        {loading ? "Redirecting..." : children}
      </button>
      {error && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#c00" }}>{error}</p>
      )}
    </div>
  );
}