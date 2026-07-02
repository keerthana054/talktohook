"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const C = {
  cherry: "#D20001",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  white:  "#ffffff",
  cobalt: "#0212EE",
};

export default function SignInPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-trigger Google OAuth as soon as this page loads -- the user
    // clicked "Find my hook" and got redirected here, so we should just
    // get them into the sign-in flow immediately rather than making them
    // click another button.
    async function signIn() {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // On success, browser is redirected to Google -- no further action needed.
    }

    signIn();
  }, [next]);

  return (
    <div style={{
      minHeight: "100vh", background: C.sand,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        {error ? (
          <>
            <p style={{ color: C.cherry, fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "0.75rem 1.5rem", fontSize: "0.875rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.95rem", color: "#555", fontWeight: 500 }}>
              Taking you to Google sign-in...
            </p>
            <div style={{ marginTop: "1rem", width: 24, height: 24, border: `3px solid ${C.cherry}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "1rem auto 0" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}