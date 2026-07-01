"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const C = {
  cherry: "#D20001",
  cobalt: "#0212EE",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  white:  "#ffffff",
};

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for auth changes (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const next = new URLSearchParams(window.location.search).get("next") ?? "/app";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ddd", animation: "pulse 1.5s ease-in-out infinite" }} />
    );
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: C.white, color: C.black,
          border: `2px solid ${C.black}`,
          padding: "0.45rem 1.1rem",
          fontSize: "0.82rem", fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `2px 2px 0 ${C.black}`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = ""; }}
      >
        <GoogleIcon />
        Sign in
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "You";
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(o => !o)}
        style={{ background: "none", border: `2px solid ${C.black}`, padding: 0, cursor: "pointer", borderRadius: "50%", width: 36, height: 36, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
        aria-label="Account menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
        ) : (
          <span style={{ fontFamily: "inherit", fontSize: "0.72rem", fontWeight: 800, background: C.cherry, color: C.white, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {initials}
          </span>
        )}
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
          {/* Dropdown */}
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50, background: C.white, border: `2px solid ${C.black}`, minWidth: "200px", boxShadow: `4px 4px 0 ${C.black}` }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid #eee` }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: C.black }}>{name}</p>
              <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.1rem" }}>{user.email}</p>
            </div>
            <button
              onClick={signOut}
              style={{ width: "100%", padding: "0.75rem 1rem", background: "none", border: "none", textAlign: "left", fontSize: "0.82rem", fontWeight: 700, color: C.cherry, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}