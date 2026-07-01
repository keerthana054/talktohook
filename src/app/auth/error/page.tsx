import Link from "next/link";

const C = {
  cherry: "#D20001",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  cobalt: "#0212EE",
};

export default function AuthErrorPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.sand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "420px", padding: "2rem", textAlign: "center" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.cherry }}>
          auth error
        </span>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.05, marginTop: "0.75rem", color: C.black }}>
          Something went wrong.
        </h1>
        <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.65, color: "#555" }}>
          We couldn't sign you in. This sometimes happens if you took too long or the link expired. Try again and it should work.
        </p>
        <Link
          href="/"
          style={{ display: "inline-block", marginTop: "2rem", background: C.cherry, color: "#fff", border: `2px solid ${C.black}`, padding: "0.85rem 2rem", fontSize: "0.9rem", fontWeight: 800, textDecoration: "none" }}
        >
          Back to TalkToHook
        </Link>
      </div>
    </div>
  );
}