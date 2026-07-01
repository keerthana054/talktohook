import Link from "next/link";

const C = {
  cherry: "#D20001",
  pink:   "#FEC6E9",
  cobalt: "#0212EE",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  white:  "#ffffff",
};

export default function BillingSuccessPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.sand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "1.5rem" }}>
      <div style={{ maxWidth: "440px", textAlign: "center" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.cherry }}>
          you're in
        </span>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "2.2rem", fontWeight: 900, lineHeight: 1.05, marginTop: "0.75rem", color: C.black }}>
          Upgrade complete.
        </h1>
        <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.65, color: "#555" }}>
          Your plan is active. It can take a few seconds for everything to sync up -- if your upload limit doesn't look right yet, refresh in a moment.
        </p>
        <Link
          href="/app"
          style={{ display: "inline-block", marginTop: "2rem", background: C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "0.85rem 2rem", fontSize: "0.9rem", fontWeight: 800, textDecoration: "none" }}
        >
          Go upload a video
        </Link>
      </div>
    </div>
  );
}