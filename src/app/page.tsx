"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthButton from "@/components/AuthButton";
import UpgradeButton from "@/components/UpgradeButton";

const FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=DM+Sans:wght@400;500;700;800&display=swap";

const C = {
  cherry: "#D20001",
  pink:   "#FEC6E9",
  cobalt: "#0212EE",
  sand:   "#F3F3E9",
  black:  "#0a0a0a",
  white:  "#ffffff",
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Typewriter({ words }: { words: string[] }) {
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    const word = words[wi];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && ci <= word.length) {
      setDisplayed(word.slice(0, ci));
      timeout = setTimeout(() => setCi(c => c + 1), ci === word.length ? 1800 : 55);
    } else if (deleting && ci >= 0) {
      setDisplayed(word.slice(0, ci));
      timeout = setTimeout(() => setCi(c => c - 1), 30);
    }
    if (!deleting && ci > word.length) { setDeleting(true); }
    if (deleting && ci < 0) { setDeleting(false); setWi(w => (w + 1) % words.length); setCi(0); }
    return () => clearTimeout(timeout);
  }, [ci, deleting, wi, words]);

  return (
    <span style={{ color: C.cherry }}>
      {displayed}
      <span style={{ display: "inline-block", width: "3px", height: "0.85em", background: C.cherry, marginLeft: "2px", verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
    </span>
  );
}

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      height: "100%",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function FlipCard({ front, back, bg, textColor }: { front: string; back: string; bg: string; textColor: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{ perspective: "800px", cursor: "default", height: "100%" }}
    >
      <div style={{
        position: "relative", height: "100%", minHeight: "160px", padding: "1.5rem",
        display: "flex", alignItems: "center",
        background: flipped ? C.black : bg,
        color: flipped ? C.sand : textColor,
        border: `2px solid ${C.black}`,
        transition: "background 0.2s, color 0.2s",
        transform: flipped ? "scale(1.02)" : "scale(1)",
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", lineHeight: 1.5, fontWeight: 500 }}>
          {flipped ? back : front}
        </p>
      </div>
    </div>
  );
}

function GridCard({ bg, textColor, isLast, border = C.black, children }: {
  bg: string; textColor: string; isLast?: boolean; border?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: bg, color: textColor,
      border: `2px solid ${border}`,
      borderRight: isLast ? `2px solid ${border}` : "none",
      padding: "2rem", height: "100%", display: "flex", flexDirection: "column",
    }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('${FONTS}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.sand}; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes stampIn { 0%{transform:scale(1.4) rotate(-3deg);opacity:0} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        .stamp { animation: stampIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .cta-btn { transition: background 0.15s, color 0.15s, transform 0.15s; }
        .cta-btn:hover { transform: translate(-3px, -3px); box-shadow: 3px 3px 0 ${C.black}; }
        .cta-btn:active { transform: translate(0,0); box-shadow: none; }
        .nav-link { position: relative; text-decoration: none; }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:${C.cherry}; transition:width 0.2s; }
        .nav-link:hover::after { width:100%; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.sand, color: C.black }}>

        {/* Nav */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: navScrolled ? C.sand : "transparent",
          borderBottom: navScrolled ? `2px solid ${C.black}` : "2px solid transparent",
          transition: "background 0.3s, border-color 0.3s",
        }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem" }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.03em" }}>TalkToHook</span>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <a href="#pain" className="nav-link" style={{ fontSize: "0.82rem", color: C.black, fontWeight: 600 }}>Problem</a>
              <a href="#how" className="nav-link" style={{ fontSize: "0.82rem", color: C.black, fontWeight: 600 }}>How it works</a>
              <a href="#pricing" className="nav-link" style={{ fontSize: "0.82rem", color: C.black, fontWeight: 600 }}>Pricing</a>
              <AuthButton />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <header style={{ background: C.sand, padding: "5rem 1.5rem 3rem", borderBottom: `2px solid ${C.black}` }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="stamp" style={{ display: "inline-block", background: C.cobalt, color: C.white, padding: "0.2rem 0.7rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
              for coaches &amp; consultants
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(3rem, 7vw, 6rem)", lineHeight: 0.95, letterSpacing: "-0.04em", fontWeight: 900, maxWidth: "12ch" }}>
              You already said the{" "}
              <Typewriter words={["good part.", "hook.", "money line.", "viral bit.", "best line."]} />
            </h1>
            <p style={{ marginTop: "2rem", maxWidth: "44ch", fontSize: "1.1rem", lineHeight: 1.65, color: "#333", fontWeight: 400 }}>
              Upload a talking video. TalkToHook finds the line worth posting and hands you 5 ranked hooks, each with a caption ready to paste - all grounded in your own words.
            </p>
            <div style={{ marginTop: "2.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/app" className="cta-btn" style={{ background: C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "1rem 2.25rem", fontSize: "1rem", fontWeight: 800, textDecoration: "none", display: "inline-block" }}>
                Find my hook - free
              </Link>
              <a href="#how" className="cta-btn" style={{ background: "transparent", color: C.black, border: `2px solid ${C.black}`, padding: "1rem 2.25rem", fontSize: "1rem", fontWeight: 800, textDecoration: "none", display: "inline-block" }}>
                See how it works ↓
              </a>
            </div>
            <p style={{ marginTop: "1.25rem", fontSize: "0.78rem", color: "#888", fontWeight: 500 }}>No card required · 3 uploads free · 90 seconds</p>
          </div>
        </header>

        {/* Marquee ticker */}
        <div style={{ background: C.cobalt, borderBottom: `2px solid ${C.black}`, overflow: "hidden", padding: "0.75rem 0" }}>
          <div style={{ display: "flex", width: "max-content", animation: "marquee 22s linear infinite" }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: "3rem", paddingRight: "3rem" }}>
                {["✦ Curiosity Gap", "✦ Bold Claim", "✦ Contrarian Take", "✦ Story Opener", "✦ Specific Result", "✦ Grounded in your words", "✦ 5 hooks + captions per upload", "✦ Framework labeled"].map(t => (
                  <span key={t} style={{ fontSize: "0.78rem", fontWeight: 800, color: C.white, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pain */}
        <section id="pain" style={{ background: C.cherry, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.pink }}>the problem</span>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", marginTop: "0.75rem", fontWeight: 900, color: C.white, maxWidth: "18ch" }}>
                You give a 45-minute talk. Your best line dies inside it.
              </h2>
            </RevealBlock>
            <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0" }}>
              <RevealBlock delay={100}>
                <GridCard bg={C.white} textColor={C.black}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: C.cherry, letterSpacing: "0.15em" }}>THEM</span>
                  <p style={{ marginTop: "1rem", fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontStyle: "italic", fontWeight: 400, color: "#999", lineHeight: 1.5, textDecoration: "line-through" }}>
                    "New episode! So much value in this one! 🙌"
                  </p>
                  <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#aaa", fontWeight: 600 }}>3 likes. One from your mum.</p>
                </GridCard>
              </RevealBlock>
              <RevealBlock delay={200}>
                <GridCard bg={C.pink} textColor={C.black} isLast>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: C.cobalt, letterSpacing: "0.15em" }}>YOU</span>
                  <p style={{ marginTop: "1rem", fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontStyle: "italic", fontWeight: 700, color: C.black, lineHeight: 1.5 }}>
                    "Most coaches charge for this next part. I'm giving it away because nobody talks about it."
                  </p>
                  <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: C.cobalt, fontWeight: 700 }}>847 views. 23 new follows.</p>
                </GridCard>
              </RevealBlock>
            </div>
            <RevealBlock delay={300}>
              <p style={{ marginTop: "2.5rem", maxWidth: "54ch", fontSize: "1rem", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
                The people getting followers aren't smarter than you. They just post the one sentence that makes people lean in. TalkToHook finds that sentence.
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* How it works */}
        <section id="how" style={{ background: C.sand, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.cobalt }}>how it works</span>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "0.75rem", fontWeight: 900, maxWidth: "18ch" }}>
                Three steps. One minute. Done posting.
              </h2>
            </RevealBlock>
            <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0" }}>
              {[
                { bg: C.pink, label: "Upload your video", body: "Drop in any talking video - a call recording, a Loom, a podcast, a reel. MP4 or MOV, up to 10 minutes.", accent: C.cherry },
                { bg: C.cobalt, label: "We find the gold", body: "We transcribe it, read every line, and identify the moments most likely to stop someone mid-scroll.", accent: C.white },
                { bg: C.cherry, label: "5 hooks, ready to post", body: "Each labeled with the copywriting framework - curiosity gap, bold claim, contrarian take - so you learn what works. A ready-to-post caption comes with every one.", accent: C.pink },
              ].map(({ bg, label, body, accent }, i, arr) => (
                <RevealBlock key={label} delay={i * 100}>
                  <GridCard bg={bg} textColor={i === 1 ? C.white : C.black} isLast={i === arr.length - 1}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: "3.5rem", fontWeight: 900, color: accent, opacity: 0.25, lineHeight: 1 }}>0{i + 1}</span>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem", fontWeight: 700, marginTop: "1rem", lineHeight: 1.2 }}>{label}</h3>
                    <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", lineHeight: 1.7, color: i === 1 ? "rgba(255,255,255,0.7)" : "#444", fontWeight: 400 }}>{body}</p>
                  </GridCard>
                </RevealBlock>
              ))}
            </div>
          </div>
        </section>

        {/* The Flex */}
        <section style={{ background: C.pink, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.cobalt }}>the flex</span>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "0.75rem", fontWeight: 900, maxWidth: "20ch" }}>
                Post the hook. Let your words do the work.
              </h2>
            </RevealBlock>
            <RevealBlock delay={150}>
              <div style={{ marginTop: "3rem", background: C.white, border: `2px solid ${C.black}`, maxWidth: "520px", padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 40, height: 40, background: C.cherry, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 900, fontSize: "1rem" }}>TH</div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>@sarahcoaches</div>
                    <div style={{ fontSize: "0.72rem", color: "#999" }}>via TalkToHook</div>
                  </div>
                </div>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", lineHeight: 1.6, color: C.black, fontStyle: "italic", fontWeight: 400 }}>
                  "Most coaches charge for what I'm about to say. I'm giving it away because nobody in this space is actually honest about it."
                </p>
                {/* Caption preview — styled as a clear secondary bonus below the hero hook */}
                <div style={{ marginTop: "1.25rem", background: C.sand, border: "1px solid #ddd", padding: "0.85rem 1rem" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#999", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                    + caption, included
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.55 }}>
                    Most coaches charge for what I'm about to say - I'm giving it away because nobody is honest about this. Stop guessing. Follow for more.
                  </p>
                </div>
                <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ background: C.cobalt, color: C.white, padding: "0.2rem 0.8rem", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Curiosity Gap
                  </span>
                  <button className="cta-btn" style={{ background: C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" }}>
                    Copy &amp; post →
                  </button>
                </div>
              </div>
            </RevealBlock>
            <RevealBlock delay={250}>
              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Curiosity Gap", "Bold Claim", "Contrarian Take", "Story Opener", "Specific Result"].map((f, i) => (
                  <span key={f} style={{ background: i % 2 === 0 ? C.cobalt : C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "0.3rem 0.9rem", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {f}
                  </span>
                ))}
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* Us vs them */}
        <section style={{ background: C.cobalt, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.pink }}>us vs. them</span>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "0.75rem", fontWeight: 900, color: C.white, maxWidth: "20ch" }}>
                What they post vs what you're about to post.
              </h2>
            </RevealBlock>
            <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0" }}>
              <RevealBlock delay={100}>
                <GridCard bg="rgba(0,0,0,0.25)" textColor={C.white} border="rgba(255,255,255,0.15)">
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>THEM</span>
                  {[`"Crushed it today 🚀" - nothing behind it`, "Generic AI captions that sound like everyone else", "Hoping something lands", "ChatGPT hooks that have never been said aloud"].map(t => (
                    <p key={t} style={{ marginTop: "0.85rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.45, fontWeight: 500, textDecoration: "line-through" }}>✕ {t}</p>
                  ))}
                </GridCard>
              </RevealBlock>
              <RevealBlock delay={200}>
                <GridCard bg={C.pink} textColor={C.black} isLast>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: C.cobalt, letterSpacing: "0.15em" }}>YOU</span>
                  {["Your best line, found automatically", "Hooks grounded in what you actually said", "Caption written and ready to paste", "One tap. Posted. Done."].map(t => (
                    <p key={t} style={{ marginTop: "0.85rem", fontSize: "0.9rem", color: C.black, lineHeight: 1.45, fontWeight: 700 }}>✓ {t}</p>
                  ))}
                </GridCard>
              </RevealBlock>
            </div>
          </div>
        </section>

        {/* Objection killer */}
        <section style={{ background: C.sand, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.cherry }}>no, really</span>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "0.75rem", fontWeight: 900, maxWidth: "18ch" }}>
                You're out of excuses.
              </h2>
              <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#888", fontWeight: 500 }}>Hover each one.</p>
            </RevealBlock>
            <div style={{ marginTop: "2.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0", alignItems: "stretch" }}>
              {[
                { front: `"AI hooks sound fake."`, back: "Every hook is traced to something you literally said. We quote your words back at you - not invented claims.", bg: C.pink, text: C.black },
                { front: `"I don't have time for content."`, back: "You already recorded the video. This takes 90 seconds. The hard part is done.", bg: C.cobalt, text: C.white },
                { front: `"I'm not consistent enough."`, back: "One great hook outperforms 30 bad ones. Consistency matters less than quality. Find the quality first.", bg: C.cherry, text: C.white },
                { front: `"My niche is too small."`, back: "Small niches respond harder to specific hooks. Vague content is for vague audiences. This makes you specific.", bg: C.sand, text: C.black },
              ].map(({ front, back, bg, text }, i) => (
                <RevealBlock key={front} delay={i * 80}>
                  <FlipCard front={front} back={back} bg={bg} textColor={text} />
                </RevealBlock>
              ))}
            </div>
          </div>
        </section>

        {/* Why I built this */}
        <section style={{ background: C.cherry, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "780px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.pink }}>why i built this</span>
              <blockquote style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", lineHeight: 1.6, marginTop: "1.5rem", color: C.white, fontStyle: "italic", fontWeight: 400 }}>
                "I kept watching coaches post the hardest-working content online - real calls, honest insights, genuine expertise - and get ignored. Then I'd see someone rephrase the same idea as a one-liner and get 10,000 impressions. The hook was always already there. It just needed finding."
              </blockquote>
              <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "rgba(254,198,233,0.7)", fontWeight: 500 }}>
                - Built by someone who got tired of watching good ideas go unheard.
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ background: C.sand, borderBottom: `2px solid ${C.black}`, padding: "5rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <RevealBlock>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.cobalt }}>pricing</span>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "0.75rem", fontWeight: 900 }}>
                Pick your plan and stop overthinking it.
              </h2>
            </RevealBlock>
            <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0" }}>
              {[
                { name: "Free", price: "$0", unit: "", detail: "3 uploads to try it", features: ["3 video uploads", "5 hooks + captions per upload", "Copy to clipboard"], cta: "Start free", bg: C.white, accent: C.black, ctaBg: C.black, ctaColor: C.white, href: "/app" as const, plan: null },
                { name: "Starter", price: "$19", unit: "/mo", detail: "~20 uploads a month", features: ["20 uploads/month", "5 hooks + captions per upload", "Framework labels", "Hook history"], cta: "Get Starter", bg: C.pink, accent: C.black, ctaBg: C.cobalt, ctaColor: C.white, href: null, plan: "starter" as const },
                { name: "Pro", price: "$49", unit: "/mo", detail: "Unlimited uploads", features: ["Unlimited uploads", "5 hooks + captions per upload", "Priority processing", "Hook history", "Early access features"], cta: "Get Pro", bg: C.cherry, accent: C.white, ctaBg: C.white, ctaColor: C.cherry, href: null, plan: "pro" as const },
                { name: "Early-bird", price: "$129", unit: "/yr", detail: "First 100 members only", features: ["Everything in Pro", "Price locked in for life", "Founding member badge"], cta: "Claim early-bird", bg: C.cobalt, accent: C.white, ctaBg: C.pink, ctaColor: C.black, badge: "Limited", href: null, plan: "early_bird" as const },
              ].map(({ name, price, unit, detail, features, cta, bg, accent, ctaBg, ctaColor, badge, href, plan }, i, arr) => (
                <RevealBlock key={name} delay={i * 100}>
                  <GridCard bg={bg} textColor={accent} isLast={i === arr.length - 1}>
                    {badge && (
                      <span style={{ alignSelf: "flex-start", background: C.pink, color: C.black, padding: "0.2rem 0.7rem", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
                        {badge}
                      </span>
                    )}
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: accent, opacity: 0.6 }}>{name}</span>
                    <p style={{ fontFamily: "'Fraunces', serif", fontSize: "2.5rem", marginTop: "0.5rem", color: accent, fontWeight: 900, lineHeight: 1 }}>
                      {price}<span style={{ fontSize: "1.1rem", opacity: 0.6 }}>{unit}</span>
                    </p>
                    <p style={{ fontSize: "0.82rem", color: accent, opacity: 0.6, marginTop: "0.25rem", marginBottom: "1.5rem", fontWeight: 500 }}>{detail}</p>
                    <div style={{ flex: 1 }}>
                      {features.map(f => (
                        <p key={f} style={{ fontSize: "0.875rem", color: accent, marginBottom: "0.6rem", fontWeight: 500, opacity: 0.8 }}>✓ {f}</p>
                      ))}
                    </div>
                    {href ? (
                      <Link href={href} className="cta-btn" style={{ display: "block", marginTop: "1.75rem", background: ctaBg, color: ctaColor, border: `2px solid ${C.black}`, padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.875rem", fontWeight: 800, textDecoration: "none" }}>
                        {cta}
                      </Link>
                    ) : (
                      <div style={{ marginTop: "1.75rem" }}>
                        <UpgradeButton plan={plan!} style={{ background: ctaBg, color: ctaColor, padding: "0.75rem 1.25rem" }}>
                          {cta}
                        </UpgradeButton>
                      </div>
                    )}
                  </GridCard>
                </RevealBlock>
              ))}
            </div>
            <RevealBlock delay={400}>
              <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: C.cobalt, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                ✦ Early-bird is the same Pro plan, billed yearly at a locked-in rate - first 100 members only
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* Closing CTA */}
        <section style={{ background: C.cobalt, padding: "6rem 1.5rem", textAlign: "center" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <RevealBlock>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.0, letterSpacing: "-0.03em", fontWeight: 900, color: C.white }}>
                You put in the work.
              </h2>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.0, letterSpacing: "-0.03em", fontWeight: 900, color: C.pink, fontStyle: "italic" }}>
                Now let people see it.
              </h2>
              <p style={{ marginTop: "1.5rem", fontSize: "1rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
                Upload a video. Get your hook and caption. Post tonight.
              </p>
              <Link href="/app" className="cta-btn" style={{ display: "inline-block", marginTop: "2.5rem", background: C.cherry, color: C.white, border: `2px solid ${C.black}`, padding: "1.1rem 2.75rem", fontSize: "1.1rem", fontWeight: 800, textDecoration: "none" }}>
                Find my hook - it's free
              </Link>
              <p style={{ marginTop: "1.25rem", fontSize: "0.78rem", color: "rgba(254,198,233,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                3 uploads free · no card required · 90 seconds
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: C.black, padding: "2rem 1.5rem" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ fontFamily: "'Fraunces', serif", color: C.cherry, fontSize: "1.1rem", fontWeight: 900 }}>TalkToHook</span>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Coming soon: hooks ranked by your own post performance.</span>
          </div>
        </footer>

      </div>
    </>
  );
}