import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HistoryList from "@/components/HistoryList";

const C = {
  cherry: "#D20001",
  pink:   "#FEC6E9",
  cobalt: "#0212EE",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  white:  "#ffffff",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware already protects this route, but double-check here too —
  // defense in depth, and it satisfies TypeScript that user isn't null below.
  if (!user) {
    redirect("/");
  }

  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("id, transcript, hooks, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load history:", error);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/app" style={{ fontSize: "0.85rem", color: "#666", textDecoration: "none", fontWeight: 600 }}>
          ← Back to upload
        </Link>

        <header style={{ marginTop: "1.5rem", marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", color: C.black }}>
            Your hooks
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
            {uploads?.length ?? 0} upload{uploads?.length === 1 ? "" : "s"} so far
          </p>
        </header>

        {(!uploads || uploads.length === 0) ? (
          <div style={{ border: `2px solid ${C.black}`, background: C.white, padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.95rem", color: "#666" }}>No uploads yet. Go find your hook.</p>
            <Link
              href="/app"
              style={{ display: "inline-block", marginTop: "1.5rem", background: C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "0.75rem 1.75rem", fontSize: "0.85rem", fontWeight: 800, textDecoration: "none" }}
            >
              Upload a video
            </Link>
          </div>
        ) : (
          <HistoryList uploads={uploads} />
        )}
      </div>
    </div>
  );
}