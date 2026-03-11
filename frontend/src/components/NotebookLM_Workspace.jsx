import { useState, useRef, useEffect, useCallback } from "react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ─── SVG Icon primitive ───────────────────────────────────────────────────
const I = ({ d, size = 16, sw = 1.75, fill = "none", stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IC = {
  logo:      'd="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"',
  book:      "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  plus:      "M12 5v14M5 12h14",
  share:     "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  upload:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  search:    "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  pdf:       "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h3",
  link:      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  file:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  trash:     "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2",
  send:      "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  mic:       "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8",
  audio:     "M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z",
  slides:    "M1 3h22v15H1zM8 21h8M12 18v3",
  video:     "M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1V5z",
  mindmap:   "M1 6l7-3 8 4 7-3v14l-7 3-8-4-7 3z",
  report:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  cards:     "M2 3h20v14H2zM5 21h14M8 17v4M16 17v4",
  quiz:      "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  chart:     "M18 20V10M12 20V4M6 20v-6",
  table:     "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  note:      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  sparkle:   "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 1l.9 2.1L8 4l-2.1.9L5 7l-.9-2.1L2 4l2.1-.9L5 1z",
  bot:       "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  user:      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  globe:     "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  x:         "M18 6L6 18M6 6l12 12",
  check:     "M20 6L9 17l-5-5",
  download:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
  eye:       "M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  copy:      "M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z",
  pin:       "M12 17v5M9 3h6l1 8H8zM5 11h14",
  save:      "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  mail:      "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock:      "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  chevR:     "M9 18l6-6-6-6",
  chevD:     "M6 9l6 6 6-6",
  alert:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  info:      "M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  tag:       "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  star:      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  export:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  drive:     "M12 2L2 19h20L12 2zM12 9v6M12 17h.01",
  expand:    "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  collapse:  "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3",
  text:      "M4 6h16M4 12h8M4 18h16",
};
const Ic = ({ n, size = 16, sw = 1.75, fill = "none", stroke = "currentColor", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>
    <path d={IC[n] || ""} />
  </svg>
);

// ─── Donut Chart ──────────────────────────────────────────────────────────
const Donut = ({ segs, size = 72 }) => {
  const r = 28, cx = 36, cy = 36, circ = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A1D35" strokeWidth="10" />
      {segs.map((s, i) => {
        const dash = (s.p / 100) * circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off} strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />;
        off += dash; return el;
      })}
    </svg>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────
const Toast = ({ toasts, dismiss }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
    {toasts.map(t => (
      <div key={t.id} onClick={() => dismiss(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: t.type === "error" ? "#FEE2E2" : t.type === "warn" ? "#FEF3C7" : "#DCFCE7", border: `1px solid ${t.type === "error" ? "#FCA5A5" : t.type === "warn" ? "#FCD34D" : "#86EFAC"}`, color: t.type === "error" ? "#DC2626" : t.type === "warn" ? "#D97706" : "#16A34A", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", cursor: "pointer", animation: "slideUp 0.25s ease", minWidth: 240, maxWidth: 360 }}>
        <Ic n={t.type === "error" ? "alert" : t.type === "warn" ? "info" : "check"} size={15} />
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────
const Confirm = ({ msg, onYes, onNo }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
    <div style={{ background: "white", borderRadius: 20, padding: 28, width: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1F36", marginBottom: 20 }}>{msg}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onNo} style={{ padding: "8px 20px", borderRadius: 9, background: "#F4F6FB", color: "#6B7285", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Cancel</button>
        <button onClick={onYes} style={{ padding: "8px 20px", borderRadius: 9, background: "#EF4444", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Delete</button>
      </div>
    </div>
  </div>
);

// ─── AI Response Generator ────────────────────────────────────────────────
const genAIResponse = (q, sources) => {
  const src = sources.filter(s => s.status === "indexed");
  const cite = src.slice(0, 2).map(s => `${s.title} · §${Math.floor(Math.random() * 8 + 1)}.${Math.floor(Math.random() * 5 + 1)}`);
  const responses = [
    `Based on your indexed sources, here's what I found:\n\n**Key Insight**: The materials in your notebook provide substantial coverage of this topic. ${src[0] ? `"${src[0].title}"` : "Your sources"} contains particularly relevant information.\n\n**Analysis**: The content spans multiple dimensions of the question you raised. Cross-referencing across ${src.length} source${src.length !== 1 ? "s" : ""} reveals consistent patterns and some interesting contradictions worth exploring.\n\n**Summary**: The evidence points toward a nuanced answer that depends on context. I've highlighted the most relevant passages below via citation tags.`,
    `Drawing from ${src.length} indexed source${src.length !== 1 ? "s" : ""} in your notebook:\n\n**Direct Answer**: Your question touches on concepts well-documented in the uploaded materials. The core argument across sources suggests a multi-faceted answer.\n\n**Supporting Evidence**: ${src[0] ? `"${src[0].title}"` : "Source 1"} provides foundational context, while ${src[1] ? `"${src[1].title}"` : "additional sources"} offer complementary perspectives.\n\n**Recommendation**: For deeper exploration, consider following up on the citations provided — they link directly to the relevant passages.`,
    `Synthesizing across your knowledge base:\n\n**Overview**: This is a well-documented topic within your notebook. Multiple sources converge on similar conclusions with minor variations in framing.\n\n**Key Points**:\n• The primary sources establish the theoretical foundation\n• Empirical data from your indexed materials supports the main thesis\n• Edge cases and exceptions are covered in secondary sources\n\n**Confidence**: High — ${src.length} source${src.length !== 1 ? "s" : ""} corroborate this answer.`,
  ];
  return { content: responses[Math.floor(Math.random() * responses.length)], citations: cite };
};

const genStudioContent = (type, title, sources) => {
  const src = sources.filter(s => s.status === "indexed");
  const topics = ["Core Concepts", "Key Findings", "Methodology", "Analysis", "Conclusions", "Future Directions"];
  const contentMap = {
    audio: `🎙️ AI PODCAST SCRIPT — "${title}"\n\nHOST A: Welcome back to InsightOS Audio! Today we're diving deep into the knowledge base titled "${title}".\n\nHOST B: That's right. We've processed ${src.length} sources and extracted the key themes.\n\nHOST A: Let's start with the fundamentals. The sources reveal three major themes...\n\nHOST B: What really stood out to me was the tension between different perspectives in the indexed materials.\n\nHOST A: Exactly. ${src[0] ? `"${src[0].title}"` : "The primary source"} makes a compelling case that...\n\n[Duration: ~12 minutes | Generated from ${src.length} sources]`,
    slides: `📊 SLIDE DECK — "${title}"\n\nSlide 1: Title & Overview\n━━━━━━━━━━━━━━━━━━━\n"${title}" — Research Summary\nGenerated from ${src.length} indexed sources\n\nSlide 2: Executive Summary\n━━━━━━━━━━━━━━━━━━━\n• 3 key themes identified\n• ${src.length} sources analyzed\n• Critical insights highlighted\n\nSlide 3-8: Core Content\n━━━━━━━━━━━━━━━━━━━\n${topics.slice(0, 4).map((t, i) => `Slide ${i + 3}: ${t}`).join("\n")}\n\nSlide 9: Conclusions & Next Steps\nSlide 10: References & Citations\n\n[${src.length * 2 + 4} slides total]`,
    mindmap: `🗺️ MIND MAP — "${title}"\n\nCentral Node: ${title}\n\n├── Theme 1: Core Concepts\n│   ├── Definition & Scope\n│   ├── Historical Context\n│   └── Key Terminology\n│\n├── Theme 2: Key Findings\n│   ├── Primary Evidence\n│   ├── Supporting Data\n│   └── Contradictions\n│\n├── Theme 3: Methodology\n│   ├── Research Approach\n│   └── Data Sources\n│\n└── Theme 4: Implications\n    ├── Short-term Impact\n    └── Long-term Outlook\n\n[${src.length * 8 + 12} nodes | Generated from ${src.length} sources]`,
    report: `📄 RESEARCH REPORT\n\nTitle: ${title}\nGenerated: ${new Date().toLocaleDateString()}\nSources: ${src.length} documents\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n1. EXECUTIVE SUMMARY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis report synthesizes findings from ${src.length} indexed sources. The analysis reveals consistent patterns across materials with notable insights for practitioners and researchers alike.\n\n2. INTRODUCTION\nThe scope of this analysis encompasses the full breadth of uploaded materials, cross-referenced for thematic consistency.\n\n3. KEY FINDINGS\n• Finding 1: Primary theme identified across majority of sources\n• Finding 2: Secondary patterns emerge in supporting materials\n• Finding 3: Contradictions noted between ${src[0]?.title || "Source A"} and ${src[1]?.title || "Source B"}\n\n4. ANALYSIS & INSIGHTS\nDetailed examination of the source materials reveals...\n\n5. CONCLUSIONS\nBased on the evidence, the most defensible conclusion is...\n\n6. REFERENCES\n${src.map((s, i) => `[${i + 1}] ${s.title}`).join("\n")}\n\n[Word count: ~2,400]`,
    flashcards: `🃏 FLASHCARD SET — "${title}"\n\n━━━━━━━━━━━━━━━━━━━\nCard 1 of ${src.length * 3 + 5}\n━━━━━━━━━━━━━━━━━━━\nQ: What is the central thesis of the primary source material?\nA: The materials collectively argue for a nuanced, evidence-based approach that considers multiple stakeholder perspectives.\n\n━━━━━━━━━━━━━━━━━━━\nCard 2\n━━━━━━━━━━━━━━━━━━━\nQ: What methodology is employed across the sources?\nA: Mixed-methods approach combining quantitative analysis with qualitative case studies.\n\n━━━━━━━━━━━━━━━━━━━\nCard 3\n━━━━━━━━━━━━━━━━━━━\nQ: What are the key limitations identified in the literature?\nA: Sample size constraints, temporal scope, and geographic specificity are the primary limitations noted.\n\n[${src.length * 3 + 5} cards total | Auto-generated from ${src.length} sources]`,
    quiz: `📝 QUIZ — "${title}"\n\nGenerated from ${src.length} sources | ${src.length * 2 + 3} questions\n\n━━━━━━━━━━━━━━━━━━━\nQuestion 1 (Multiple Choice)\n━━━━━━━━━━━━━━━━━━━\nAccording to the source materials, which approach is most strongly supported?\n\nA) Theoretical framework without empirical validation\nB) ✓ Evidence-based approach with cross-source verification\nC) Single-source dependency\nD) Anecdotal reasoning\n\n━━━━━━━━━━━━━━━━━━━\nQuestion 2 (True/False)\n━━━━━━━━━━━━━━━━━━━\nThe sources unanimously agree on all presented conclusions.\n→ FALSE — notable contradictions exist between sources.\n\n━━━━━━━━━━━━━━━━━━━\nQuestion 3 (Short Answer)\n━━━━━━━━━━━━━━━━━━━\nDescribe the primary methodology used across the indexed sources.\n→ Sample answer: Mixed quantitative/qualitative with systematic review...\n\n[${src.length * 2 + 3} questions total]`,
    infographic: `📊 INFOGRAPHIC DATA — "${title}"\n\n╔══════════════════════════════╗\n║   KEY METRICS AT A GLANCE   ║\n╠══════════════════════════════╣\n║  📚 ${src.length} Sources Analyzed       ║\n║  🔍 ${src.reduce((a, s) => a + (s.chunks || 0), 0)} Total Chunks Indexed   ║\n║  🏷️  6 Topic Tags Identified  ║\n║  💡 12 Key Insights Found    ║\n╚══════════════════════════════╝\n\nSOURCE DISTRIBUTION\n████████████ 60% PDFs\n██████ 30% URLs  \n██ 10% Other\n\nTOP 3 THEMES\n1. ████████████ Primary Topic (42%)\n2. ████████ Secondary Topic (31%)\n3. █████ Supporting Context (27%)\n\n[Visual infographic data — export for rendering]`,
    datatable: `📋 EXTRACTED DATA TABLE — "${title}"\n\n┌─────────────────────┬──────────┬──────────┬────────────┐\n│ Source              │ Type     │ Chunks   │ Key Topics │\n├─────────────────────┼──────────┼──────────┼────────────┤\n${src.map(s => `│ ${s.title.substring(0, 19).padEnd(19)} │ ${s.type.padEnd(8)} │ ${String(s.chunks || 0).padEnd(8)} │ AI, ML     │`).join("\n")}\n└─────────────────────┴──────────┴──────────┴────────────┘\n\nSUMMARY STATISTICS\n• Total Sources: ${src.length}\n• Total Chunks: ${src.reduce((a, s) => a + (s.chunks || 0), 0)}\n• Avg Chunks/Source: ${src.length ? Math.round(src.reduce((a, s) => a + (s.chunks || 0), 0) / src.length) : 0}\n• Source Types: ${[...new Set(src.map(s => s.type))].join(", ")}\n\n[CSV export available]`,
    video: `🎬 VIDEO SCRIPT — "${title}"\n\nDuration: ~8 minutes\nFormat: Explainer / Documentary\n\nSCENE 1 — INTRO (0:00 - 0:45)\n[Fade in with ambient music]\nNARRATOR: "In today's exploration, we examine the findings from ${src.length} carefully curated sources on the topic of ${title}."\n\nSCENE 2 — CONTEXT (0:45 - 2:00)\n[B-roll: Abstract visualization of knowledge graph]\nNARRATOR: "The landscape of this subject has evolved significantly, as evidenced by the materials we've analyzed..."\n\nSCENE 3 — KEY FINDINGS (2:00 - 5:30)\n[Split screen: source highlights]\nFor each of the ${src.length} sources, we surface the most salient points...\n\nSCENE 4 — SYNTHESIS (5:30 - 7:15)\n[Animated timeline]\nBringing it all together...\n\nSCENE 5 — OUTRO (7:15 - 8:00)\n[Logo animation]\n"Powered by InsightOS"\n\n[Script ready for narration recording]`,
  };
  return contentMap[type] || "Content generated.";
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────
const INIT_SOURCES = [
  { id: 1, title: "LLM Architectures: A Comprehensive Survey 2024", type: "pdf", date: "Mar 8, 2026", chunks: 142, size: "2.4 MB", status: "indexed", content: "This survey provides a comprehensive overview of large language model architectures, covering transformer variants, attention mechanisms, and scaling strategies. Key topics include GPT series architecture, LLaMA family models, Mixtral MoE designs, and emerging state-space models." },
  { id: 2, title: "Stanford AI Index Report 2025", type: "url", date: "Mar 9, 2026", chunks: 89, size: "—", status: "indexed", url: "https://aiindex.stanford.edu", content: "Annual report tracking AI progress across research, industry, and society. Covers benchmarks, investment trends, policy developments, and societal impacts of AI deployment globally." },
  { id: 3, title: "Transformer Deep Dive: Attention Is All You Need", type: "pdf", date: "Mar 10, 2026", chunks: 210, size: "1.1 MB", status: "indexed", content: "The seminal paper introducing the Transformer architecture. Details multi-head self-attention, positional encodings, encoder-decoder structure, and training methodology for sequence-to-sequence tasks." },
  { id: 4, title: "Neural Scaling Laws for Language Models", type: "pdf", date: "Mar 11, 2026", chunks: 67, size: "890 KB", status: "processing", content: "Empirical study of scaling laws governing neural language model performance. Demonstrates power-law relationships between model size, dataset size, compute budget, and resulting model quality." },
];
const INIT_CHAT = [
  { id: 1, role: "user", content: "What are the main architectural differences between GPT-4 and Llama 3.1?", time: "2:14 PM", pinned: false },
  { id: 2, role: "ai", content: "Based on your sources, GPT-4 and Llama 3.1 differ in several key architectural dimensions:\n\n**Training Scale**: GPT-4 uses an undisclosed architecture trained on proprietary data, while Llama 3.1 is open-weight with 405B parameters in its largest variant.\n\n**Attention Mechanism**: Llama 3.1 employs Grouped Query Attention (GQA) for improved inference efficiency, reducing memory bandwidth requirements significantly.\n\n**Context Window**: Llama 3.1 supports up to 128K tokens natively, matching GPT-4 Turbo's extended context.\n\n**Training Data**: Llama 3.1 was trained on 15T+ tokens from public sources with multilingual coverage across 30+ languages.", citations: ["LLM Architectures Survey 2024 · §3.2", "Transformer Deep Dive · §7"], time: "2:14 PM", pinned: false },
  { id: 3, role: "user", content: "How do scaling laws affect model performance at the 70B scale?", time: "2:18 PM", pinned: false },
  { id: 4, role: "ai", content: "According to the Neural Scaling Laws source in your notebook, the relationship between compute, parameters, and performance follows predictable power-law curves.\n\nAt 70B scale, models typically achieve:\n• Emergent capabilities in multi-step reasoning\n• Strong few-shot generalization\n• Competitive benchmark performance when instruction-tuned\n\nThe Chinchilla optimal compute budget suggests 70B models should train on ~1.4T tokens for maximum efficiency.", citations: ["Neural Scaling Laws · §2.1", "Stanford AI Index · §4.1"], time: "2:19 PM", pinned: false },
];
const INIT_OUTPUTS = [
  { id: 1, type: "report", title: "LLM Architecture Comparison Report", created: "Mar 10", size: "4.2 KB", notebookId: "nb1", content: `📄 RESEARCH REPORT

Title: LLM Architecture Comparison Report
Generated: Mar 10, 2026
Sources: 3 documents

═══════════════════════════════════════
1. EXECUTIVE SUMMARY
═══════════════════════════════════════
This report synthesizes findings from 3 indexed sources comparing major LLM architectures. The analysis reveals consistent patterns across materials with notable insights for practitioners and researchers alike.

2. KEY FINDINGS
• GPT-4 uses proprietary architecture with undisclosed parameter count
• Llama 3.1 employs Grouped Query Attention (GQA) for efficiency  
• Context window capabilities have expanded to 128K+ tokens
• Training data quality matters more than quantity per Chinchilla scaling laws

3. ARCHITECTURE COMPARISON
┌──────────────────┬─────────────┬─────────────┬─────────────┐
│ Feature          │ GPT-4       │ Llama 3.1   │ Claude 3    │
├──────────────────┼─────────────┼─────────────┼─────────────┤
│ Parameters       │ Undisclosed │ 405B        │ Undisclosed │
│ Context Window   │ 128K        │ 128K        │ 200K        │
│ Architecture     │ MoE         │ Dense       │ Dense       │
│ Open Weights     │ No          │ Yes         │ No          │
└──────────────────┴─────────────┴─────────────┴─────────────┘

4. CONCLUSIONS
Based on the evidence, transformer architectures with attention mechanisms remain the dominant paradigm, with efficiency optimizations like GQA becoming standard.

[Word count: ~2,400]` },
  { id: 2, type: "audio", title: "AI Research Overview Podcast", created: "Mar 9", size: "8.1 MB", notebookId: "nb1", content: `🎙️ AI PODCAST SCRIPT — "AI Research Overview"

HOST A: Welcome back to InsightOS Audio! Today we're diving deep into the knowledge base covering AI research trends.

HOST B: That's right. We've processed 3 sources and extracted the key themes around LLM architectures.

HOST A: Let's start with the fundamentals. The sources reveal three major themes: scaling laws, attention mechanisms, and efficiency optimizations.

HOST B: What really stood out to me was the tension between open and closed source models. The Llama papers make a compelling case for open research...

HOST A: Exactly. "LLM Architectures Survey 2024" makes a compelling case that open models are rapidly catching up to proprietary systems.

HOST B: And the scaling laws paper fundamentally changed how we think about training efficiency. It's not just about making models bigger anymore.

HOST A: The Chinchilla findings suggest that many models were undertrained relative to their size. This insight has influenced every major training run since.

HOST B: Looking at transformer architectures specifically, the attention mechanism remains the key innovation, but we're seeing interesting variants emerge.

HOST A: Grouped Query Attention, Multi-Query Attention, Sliding Window Attention - there's a lot of experimentation happening.

HOST B: To wrap up, the field is moving incredibly fast, but the fundamentals from "Attention Is All You Need" still form the backbone of modern LLMs.

[Duration: ~12 minutes | Generated from 3 sources]` },
  { id: 3, type: "mindmap", title: "Neural Architecture Knowledge Map", created: "Mar 8", size: "156 KB", notebookId: "nb1", content: `🗺️ MIND MAP — "Neural Architecture Knowledge Map"

Central Node: LLM Architectures

├── Theme 1: Transformer Fundamentals
│   ├── Self-Attention Mechanism
│   ├── Positional Encodings
│   ├── Multi-Head Attention
│   └── Feed-Forward Networks
│
├── Theme 2: Scaling Strategies
│   ├── Parameter Scaling
│   ├── Data Scaling (Chinchilla)
│   ├── Compute-Optimal Training
│   └── Emergent Capabilities
│
├── Theme 3: Efficiency Optimizations
│   ├── Grouped Query Attention (GQA)
│   ├── Multi-Query Attention (MQA)
│   ├── Flash Attention
│   └── Mixture of Experts (MoE)
│
├── Theme 4: Model Families
│   ├── GPT Series (OpenAI)
│   ├── Llama Family (Meta)
│   ├── Claude (Anthropic)
│   └── Gemini (Google)
│
└── Theme 5: Applications
    ├── Text Generation
    ├── Code Completion
    ├── Reasoning Tasks
    └── Multi-Modal Understanding

[36 nodes | Generated from 3 sources]` },
];
const INIT_NOTES = [
  { id: 1, title: "Key Takeaways on Scaling", content: "The Chinchilla paper fundamentally shifted how we think about compute-optimal training. Key insight: model size and dataset size should scale equally, not model size alone.", created: "Mar 9", pinned: true },
];
const STUDIO_TOOLS = [
  { id: "audio",      label: "Audio Overview",  icon: "audio",   desc: "AI podcast from sources",   color: "#6D5EF7", ext: "mp3" },
  { id: "slides",     label: "Slide Deck",       icon: "slides",  desc: "Auto-generate slides",      color: "#5DA9FF", ext: "pptx" },
  { id: "video",      label: "Video Script",     icon: "video",   desc: "Explainer video script",    color: "#A855F7", ext: "txt" },
  { id: "mindmap",    label: "Mind Map",         icon: "mindmap", desc: "Visual knowledge graph",    color: "#22C55E", ext: "svg" },
  { id: "report",     label: "Research Report",  icon: "report",  desc: "Structured full report",    color: "#F59E0B", ext: "pdf" },
  { id: "flashcards", label: "Flashcards",       icon: "cards",   desc: "Study Q&A cards",           color: "#EF4444", ext: "json" },
  { id: "quiz",       label: "Quiz",             icon: "quiz",    desc: "MCQ, T/F, short answer",    color: "#5DA9FF", ext: "json" },
  { id: "infographic",label: "Infographic",      icon: "chart",   desc: "Visual data summary",       color: "#C026D3", ext: "svg" },
  { id: "datatable",  label: "Data Table",       icon: "table",   desc: "Structured extraction",     color: "#22C55E", ext: "csv" },
];
const ACTIVITY_LOG_INIT = [
  { id: 1, action: "Source indexed",    detail: "Transformer Deep Dive",          time: "2h ago",  color: "#22C55E" },
  { id: 2, action: "Report generated",  detail: "LLM Architecture Comparison",    time: "5h ago",  color: "#6D5EF7" },
  { id: 3, action: "Source added",      detail: "Stanford AI Index Report",       time: "1d ago",  color: "#5DA9FF" },
  { id: 4, action: "Note created",      detail: "Key Takeaways on Scaling",       time: "2d ago",  color: "#F59E0B" },
  { id: 5, action: "Mind map created",  detail: "Neural Architecture Map",        time: "3d ago",  color: "#A855F7" },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────
export default function InsightOS() {
  // Core state
  const [view, setView] = useState("overview");
  const [notebookTitle, setNotebookTitle] = useState("AI Research Notebook");
  const [editTitle, setEditTitle] = useState(false);
  const [sources, setSources] = useState(INIT_SOURCES);
  const [messages, setMessages] = useState(INIT_CHAT);
  const [outputs, setOutputs] = useState(INIT_OUTPUTS);
  const [notes, setNotes] = useState(INIT_NOTES);
  const [activityLog, setActivityLog] = useState(ACTIVITY_LOG_INIT);
  // UI state
  const [studioOpen, setStudioOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genTool, setGenTool] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [srcFilter, setSrcFilter] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  // Modal state
  const [modal, setModal] = useState(null); // null | 'upload'|'share'|'note'|'settings'|'output'|'source'|'profile'|'chatExport'|'webSearch'
  const [modalData, setModalData] = useState(null);
  // Upload
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadTab, setUploadTab] = useState("file");
  const [webSearchInput, setWebSearchInput] = useState("");
  const [webResults, setWebResults] = useState([]);
  const [webSearching, setWebSearching] = useState(false);
  // Note editor
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [editNoteId, setEditNoteId] = useState(null);
  // Share
  const [shareEmail, setShareEmail] = useState("");
  const [shareLink] = useState("https://insightos.app/nb/ai-research-2026");
  const [linkCopied, setLinkCopied] = useState(false);
  const [collaborators, setCollaborators] = useState([{ email: "alice@lab.ai", role: "Editor", avatar: "A" }]);
  // Settings
  const [settingsTab, setSettingsTab] = useState("general");
  const [nbDescription, setNbDescription] = useState("AI & machine learning research notebook covering LLM architectures, scaling laws, and transformer models.");
  const [nbVisibility, setNbVisibility] = useState("private");
  // Chat
  const [chatDepth, setChatDepth] = useState("balanced");
  const [showChatSettings, setShowChatSettings] = useState(false);
  // Tags
  const [activeTags, setActiveTags] = useState([]);
  // Refs
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, generating]);

  // Toast helper
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  const dismissToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  // Log activity
  const logActivity = useCallback((action, detail, color = "#6D5EF7") => {
    setActivityLog(p => [{ id: Date.now(), action, detail, time: "just now", color }, ...p.slice(0, 14)]);
  }, []);

  // ── Source processing ───────────────────────────────────────────────────
  const processSource = useCallback((src) => {
    setSources(p => [...p, src]);
    logActivity("Source added", src.title, "#5DA9FF");
  }, [logActivity]);

  const handleFileUpload = useCallback(async (files) => {
    if (!files || !files.length) return;
    setModal(null);
    toast(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`, "warn");
    
    for (const file of Array.from(files)) {
      const isValid = /\.(pdf|txt|doc|docx)$/i.test(file.name);
      if (!isValid) { toast(`"${file.name}" — unsupported file type`, "error"); continue; }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('notebook_id', 'default');
        
        // Add temporary source to show processing state
        const tempId = Date.now() + Math.random();
        const tempSrc = {
          id: tempId,
          title: file.name.replace(/\.[^.]+$/, ""),
          type: file.name.split('.').pop().toLowerCase() === 'pdf' ? 'pdf' : 'txt',
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          chunks: 0,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: "processing"
        };
        setSources(p => [...p, tempSrc]);
        
        const response = await fetch(`${API_URL}/api/sources/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        
        // Update source with real data
        setSources(p => p.map(s => s.id === tempId ? {
          ...s,
          id: data.id,
          title: data.title,
          chunks: data.chunks,
          status: data.status
        } : s));
        
        logActivity("Source indexed", data.title, "#22C55E");
        toast(`"${data.title}" indexed successfully`);
      } catch (e) {
        console.error('Upload error:', e);
        toast(`Failed to upload ${file.name}`, "error");
        setSources(p => p.filter(s => s.title !== file.name.replace(/\.[^.]+$/, "")));
      }
    }
  }, [logActivity, toast]);

  const handleURLAdd = useCallback(async () => {
    if (!urlInput.trim()) { toast("Please enter a URL", "error"); return; }
    try { new URL(urlInput.trim()); } catch { toast("Invalid URL format", "error"); return; }
    
    const domain = new URL(urlInput.trim()).hostname.replace("www.", "");
    const tempId = Date.now();
    const tempSrc = {
      id: tempId,
      title: `Web: ${domain}`,
      type: "url",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      chunks: 0,
      size: "—",
      status: "processing",
      url: urlInput.trim()
    };
    
    setSources(p => [...p, tempSrc]);
    setUrlInput("");
    setModal(null);
    toast("Fetching URL content...", "warn");
    
    try {
      const response = await fetch(`${API_URL}/api/sources/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Web: ${domain}`,
          type: 'url',
          url: urlInput.trim(),
          notebook_id: 'default'
        })
      });
      
      if (!response.ok) throw new Error('URL fetch failed');
      const data = await response.json();
      
      setSources(p => p.map(s => s.id === tempId ? {
        ...s,
        id: data.id,
        title: data.title,
        chunks: data.chunks,
        status: data.status
      } : s));
      
      logActivity("Source indexed", data.title, "#22C55E");
      toast(`URL indexed successfully`);
    } catch (e) {
      console.error('URL add error:', e);
      toast("Failed to fetch URL content", "error");
      setSources(p => p.filter(s => s.id !== tempId));
    }
  }, [urlInput, logActivity, toast]);

  const handleWebSearch = useCallback(async () => {
    if (!webSearchInput.trim()) return;
    setWebSearching(true);
    await new Promise(r => setTimeout(r, 1500));
    const fakeResults = [
      { title: `${webSearchInput} — Wikipedia`, url: `https://en.wikipedia.org/wiki/${webSearchInput.replace(/ /g, "_")}`, snippet: `Comprehensive overview of ${webSearchInput} with historical context and technical details...` },
      { title: `Understanding ${webSearchInput} — ArXiv`, url: `https://arxiv.org/search/?query=${webSearchInput}`, snippet: `Latest research papers on ${webSearchInput} from the academic community...` },
      { title: `${webSearchInput} Guide — Towards Data Science`, url: `https://towardsdatascience.com`, snippet: `Practical guide to ${webSearchInput} with code examples and real-world applications...` },
      { title: `${webSearchInput} Survey 2025 — GitHub`, url: `https://github.com/search?q=${webSearchInput}`, snippet: `Curated list of resources, tools, and implementations related to ${webSearchInput}...` },
    ];
    setWebResults(fakeResults);
    setWebSearching(false);
  }, [webSearchInput]);

  const addWebResult = useCallback(async (result) => {
    const tempId = Date.now();
    const tempSrc = {
      id: tempId,
      title: result.title,
      type: "url",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      chunks: 0,
      size: "—",
      status: "processing",
      url: result.url
    };
    
    setSources(p => [...p, tempSrc]);
    toast(`Adding "${result.title.substring(0, 30)}..."`, "warn");
    
    try {
      const response = await fetch(`${API_URL}/api/sources/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title,
          type: 'url',
          url: result.url,
          notebook_id: 'default'
        })
      });
      
      if (!response.ok) throw new Error('Failed to add web result');
      const data = await response.json();
      
      setSources(p => p.map(s => s.id === tempId ? {
        ...s,
        id: data.id,
        chunks: data.chunks,
        status: data.status
      } : s));
      
      logActivity("Source indexed", result.title, "#22C55E");
      toast(`Added successfully`);
    } catch (e) {
      console.error('Web result add error:', e);
      toast("Failed to add source", "error");
      setSources(p => p.filter(s => s.id !== tempId));
    }
  }, [logActivity, toast]);

  const deleteSource = useCallback(async (id, confirmed = false) => {
    if (!confirmed) {
      setConfirm({ msg: "Delete this source? This cannot be undone.", onYes: () => { deleteSource(id, true); setConfirm(null); }, onNo: () => setConfirm(null) });
      return;
    }
    const src = sources.find(s => s.id === id);
    setSources(p => p.filter(s => s.id !== id));
    logActivity("Source deleted", src?.title || "Source", "#EF4444");
    toast("Source deleted", "warn");
    
    // Also delete from backend
    try {
      await fetch(`${API_URL}/api/sources/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Delete error:', e);
    }
  }, [sources, logActivity, toast]);

  // ── Chat ────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (override) => {
    const text = override || chatInput;
    if (!text.trim()) return;
    const indexed = sources.filter(s => s.status === "indexed");
    if (!indexed.length) { toast("Add and index at least one source first", "warn"); return; }
    
    const userMsg = { id: Date.now(), role: "user", content: text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), pinned: false };
    setMessages(p => [...p, userMsg]);
    setChatInput("");
    setGenerating(true);
    
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          notebook_id: 'default'
        })
      });
      
      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();
      
      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: data.response,
        citations: data.citations || [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pinned: false
      };
      setMessages(p => [...p, aiMsg]);
      logActivity("AI query answered", text.substring(0, 40), "#6D5EF7");
    } catch (e) {
      console.error('Chat error:', e);
      // Fallback to local response
      const { content, citations } = genAIResponse(text, sources);
      const aiMsg = { id: Date.now() + 1, role: "ai", content, citations, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), pinned: false };
      setMessages(p => [...p, aiMsg]);
    }
    
    setGenerating(false);
  }, [chatInput, sources, logActivity, toast]);

  const clearChat = useCallback(() => {
    setConfirm({ msg: "Clear all chat history? This cannot be undone.", onYes: () => { setMessages([]); setConfirm(null); toast("Chat cleared", "warn"); }, onNo: () => setConfirm(null) });
  }, [toast]);

  const regenerateLast = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    setMessages(p => p.filter(m => !(m.role === "ai" && m.id === Math.max(...p.filter(x => x.role === "ai").map(x => x.id)))));
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    const { content, citations } = genAIResponse(lastUser.content, sources);
    const aiMsg = { id: Date.now(), role: "ai", content, citations, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), pinned: false };
    setMessages(p => [...p, aiMsg]);
    setGenerating(false);
    toast("Response regenerated");
  }, [messages, sources, toast]);

  const pinMessage = useCallback((id) => {
    setMessages(p => p.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
    toast("Message pinned");
  }, [toast]);

  const saveToNotes = useCallback((msg) => {
    const newNote = { id: Date.now(), title: `AI Response — ${new Date().toLocaleDateString()}`, content: msg.content, created: "just now", pinned: false };
    setNotes(p => [newNote, ...p]);
    logActivity("Saved to notes", "From AI response", "#F59E0B");
    toast("Saved to notes");
  }, [logActivity, toast]);

  const exportChat = useCallback(() => {
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${m.time}\n${m.content}${m.citations ? "\nCitations: " + m.citations.join(", ") : ""}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${notebookTitle}-chat.txt`; a.click();
    toast("Chat exported");
  }, [messages, notebookTitle, toast]);

  // ── Studio ───────────────────────────────────────────────────────────────
  const generateOutput = useCallback(async (tool) => {
    const indexed = sources.filter(s => s.status === "indexed");
    if (!indexed.length) { toast("Index at least one source first", "warn"); return; }
    
    setGenTool(tool.id);
    toast(`Generating ${tool.label} with AI... This may take a moment.`, "warn");
    
    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_type: tool.id,
          notebook_id: 'default',
          title: `${tool.label} — ${notebookTitle}`
        })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      
      const newOut = {
        id: data.id,
        type: data.type,
        title: data.title,
        content: data.content,
        slides_data: data.slides_data,
        created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        size: `${(data.content?.length / 1024).toFixed(1)} KB`,
        notebookId: "nb1"
      };
      
      setOutputs(p => [newOut, ...p]);
      setGenTool(null);
      logActivity(`${tool.label} generated`, notebookTitle, tool.color);
      toast(`${tool.label} generated successfully!`);
      setModalData(newOut);
      setModal("output");
    } catch (e) {
      console.error('Generation error:', e);
      toast(`Failed to generate ${tool.label}. Please try again.`, "error");
      setGenTool(null);
    }
  }, [sources, notebookTitle, logActivity, toast]);

  const deleteOutput = useCallback((id) => {
    setConfirm({ msg: "Delete this output?", onYes: () => { setOutputs(p => p.filter(o => o.id !== id)); setConfirm(null); toast("Output deleted", "warn"); }, onNo: () => setConfirm(null) });
  }, [toast]);

  // Load pptxgenjs dynamically from CDN
  const loadPptxGen = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.PptxGenJS) {
        resolve(window.PptxGenJS);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
      script.onload = () => resolve(window.PptxGenJS);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  const downloadOutput = useCallback(async (out) => {
    // For slides, generate actual PPTX file
    if (out.type === "slides" && out.slides_data && out.slides_data.length > 0) {
      try {
        toast("Preparing PowerPoint file...", "warn");
        const PptxGenJS = await loadPptxGen();
        const pptx = new PptxGenJS();
        pptx.author = 'InsightOS';
        pptx.title = out.title;
        pptx.subject = 'AI-Generated Presentation';
        
        out.slides_data.forEach((slideData, index) => {
          const slide = pptx.addSlide();
          
          // Title slide styling
          if (index === 0) {
            slide.addText(slideData.title || out.title, {
              x: 0.5, y: 2, w: 9, h: 1.5,
              fontSize: 36, bold: true, color: '363636',
              align: 'center', valign: 'middle'
            });
            if (slideData.bullets && slideData.bullets.length > 0) {
              slide.addText(slideData.bullets[0], {
                x: 0.5, y: 3.5, w: 9, h: 0.5,
                fontSize: 18, color: '666666',
                align: 'center'
              });
            }
          } else {
            // Regular slides
            slide.addText(slideData.title || `Slide ${index + 1}`, {
              x: 0.5, y: 0.3, w: 9, h: 0.8,
              fontSize: 28, bold: true, color: '363636'
            });
            
            // Bullet points
            if (slideData.bullets && slideData.bullets.length > 0) {
              const bulletText = slideData.bullets.map(b => ({ text: b, options: { bullet: true } }));
              slide.addText(bulletText, {
                x: 0.5, y: 1.3, w: 9, h: 3.5,
                fontSize: 18, color: '444444',
                valign: 'top', paraSpaceAfter: 8
              });
            }
            
            // Speaker notes
            if (slideData.notes) {
              slide.addNotes(slideData.notes);
            }
          }
        });
        
        // Download the PPTX
        await pptx.writeFile({ fileName: `${out.title.replace(/[<>:"/\\|?*]/g, "_")}.pptx` });
        toast("PowerPoint downloaded!");
        return;
      } catch (e) {
        console.error('PPTX generation error:', e);
        toast("Failed to generate PPTX, downloading as text", "warn");
      }
    }
    
    // For all other types, download as text
    const blob = new Blob([out.content || ""], { type: "text/plain;charset=utf-8" });
    const cleanTitle = out.title.replace(/[<>:"/\\|?*]/g, "_");
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = `${cleanTitle}.txt`; 
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Download started");
  }, [toast, loadPptxGen]);

  // ── Notes ────────────────────────────────────────────────────────────────
  const saveNote = useCallback(() => {
    if (!noteTitle.trim()) { toast("Note needs a title", "error"); return; }
    if (editNoteId) {
      setNotes(p => p.map(n => n.id === editNoteId ? { ...n, title: noteTitle, content: noteBody } : n));
      toast("Note updated");
    } else {
      const n = { id: Date.now(), title: noteTitle, content: noteBody, created: "just now", pinned: false };
      setNotes(p => [n, ...p]);
      logActivity("Note created", noteTitle, "#F59E0B");
      toast("Note saved");
    }
    setNoteTitle(""); setNoteBody(""); setEditNoteId(null); setModal(null);
  }, [noteTitle, noteBody, editNoteId, logActivity, toast]);

  const deleteNote = useCallback((id) => {
    setConfirm({ msg: "Delete this note?", onYes: () => { setNotes(p => p.filter(n => n.id !== id)); setConfirm(null); toast("Note deleted", "warn"); }, onNo: () => setConfirm(null) });
  }, [toast]);

  const openNoteEditor = useCallback((note = null) => {
    if (note) { setNoteTitle(note.title); setNoteBody(note.content); setEditNoteId(note.id); }
    else { setNoteTitle(""); setNoteBody(""); setEditNoteId(null); }
    setModal("note");
  }, []);

  // ── Share ────────────────────────────────────────────────────────────────
  const inviteCollaborator = useCallback(() => {
    if (!shareEmail.trim() || !shareEmail.includes("@")) { toast("Enter a valid email", "error"); return; }
    setCollaborators(p => [...p, { email: shareEmail, role: "Viewer", avatar: shareEmail[0].toUpperCase() }]);
    setShareEmail("");
    toast(`Invite sent to ${shareEmail}`);
  }, [shareEmail, toast]);

  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(shareLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast("Link copied to clipboard");
  }, [shareLink, toast]);

  // ── Settings ─────────────────────────────────────────────────────────────
  const exportNotebook = useCallback(() => {
    const data = { title: notebookTitle, description: nbDescription, sources: sources.map(s => ({ title: s.title, type: s.type, chunks: s.chunks })), outputs: outputs.map(o => ({ title: o.title, type: o.type, created: o.created })), notes: notes.map(n => ({ title: n.title, content: n.content })), exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${notebookTitle.replace(/ /g, "_")}.json`; a.click();
    toast("Notebook exported as JSON");
  }, [notebookTitle, nbDescription, sources, outputs, notes, toast]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const indexedSources = sources.filter(s => s.status === "indexed");
  const totalChunks = sources.reduce((a, s) => a + (s.chunks || 0), 0);
  const filteredSources = sources.filter(s => {
    const matchQ = s.title.toLowerCase().includes(searchQ.toLowerCase());
    const matchF = srcFilter === "all" || s.type === srcFilter || s.status === srcFilter;
    const matchTag = activeTags.length === 0 || activeTags.some(t => s.title.toLowerCase().includes(t.toLowerCase()));
    return matchQ && matchF && matchTag;
  });
  const TAGS = ["LLMs", "Transformers", "Scaling", "Training", "Benchmarks", "Architecture", "NLP", "Vision"];

  // ─── STYLE HELPERS ────────────────────────────────────────────────────
  const typeColor = t => ({ pdf: "#EF4444", url: "#5DA9FF", doc: "#22C55E", txt: "#F59E0B", ppt: "#C026D3", audio: "#A855F7", video: "#6D5EF7" }[t] || "#6B7285");
  const typeIcon  = t => ({ pdf: "pdf", url: "link", doc: "file", txt: "text", ppt: "slides", audio: "audio", video: "video" }[t] || "file");
  const toolFor   = id => STUDIO_TOOLS.find(t => t.id === id) || STUDIO_TOOLS[0];

  // ─── RENDER ───────────────────────────────────────────────────────────
  const BTN = ({ onClick, children, variant = "ghost", style = {}, disabled = false }) => {
    const base = { display: "flex", alignItems: "center", gap: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, borderRadius: 8, padding: "6px 12px", transition: "all 0.15s", opacity: disabled ? 0.5 : 1, ...style };
    const vars = { ghost: { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }, primary: { background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white" }, danger: { background: "#FEE2E2", color: "#DC2626" }, outline: { background: "white", color: "#6B7285", border: "1px solid #E7EAF3" }, subtle: { background: "#F8F9FF", color: "#6B7285", border: "1px solid #E7EAF3" } };
    return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...vars[variant] }}>{children}</button>;
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#F4F6FB", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(107,114,133,.2);border-radius:4px}
        .hr{transition:transform .18s,box-shadow .18s}
        .hr:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(109,94,247,.15)!important}
        .si{transition:background .12s;border-radius:10px;cursor:pointer}
        .si:hover{background:rgba(255,255,255,.08)}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .ani{animation:slideIn .2s ease}
        .spin{animation:spin 1.2s linear infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .pulse{animation:pulse 1.6s ease-in-out infinite}
        .dot1{animation:pulse 1.4s ease-in-out 0s infinite}
        .dot2{animation:pulse 1.4s ease-in-out .2s infinite}
        .dot3{animation:pulse 1.4s ease-in-out .4s infinite}
        input,textarea{outline:none;border:none;background:transparent;font-family:inherit;color:inherit}
        button{border:none;cursor:pointer;font-family:inherit}
        textarea{resize:none}
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{ background: "#0B0D1A", borderBottom: "1px solid rgba(255,255,255,.06)", height: 54, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Ic n="sparkle" size={14} />
            </div>
            <span style={{ color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>
              Insight<span style={{ background: "linear-gradient(90deg,#7C6FF7,#C026D3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OS</span>
            </span>
          </div>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.1)" }} />
          {editTitle
            ? <input ref={titleRef} value={notebookTitle} onChange={e => setNotebookTitle(e.target.value)} onBlur={() => { setEditTitle(false); toast("Notebook title saved"); }} onKeyDown={e => { if (e.key === "Enter") { setEditTitle(false); toast("Notebook title saved"); } }} autoFocus style={{ color: "white", fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,.09)", border: "1px solid rgba(109,94,247,.5)", borderRadius: 6, padding: "3px 9px", width: 220 }} />
            : <span onClick={() => setEditTitle(true)} title="Click to rename" style={{ color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 500, cursor: "text", padding: "3px 8px", borderRadius: 6, transition: "background .15s" }} onMouseEnter={e => e.target.style.background = "rgba(255,255,255,.07)"} onMouseLeave={e => e.target.style.background = "transparent"}>{notebookTitle}</span>
          }
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[["overview","Overview"],["chat","Chat"],["sources","Sources"],["studio","Studio"],["notes","Notes"]].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: view === v ? "rgba(109,94,247,.28)" : "transparent", color: view === v ? "#B8ABFF" : "rgba(255,255,255,.45)", border: view === v ? "1px solid rgba(109,94,247,.4)" : "1px solid transparent", transition: "all .15s" }}>{l}</button>
          ))}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.1)", margin: "0 4px" }} />
          <button onClick={() => setModal("upload")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700 }}>
            <Ic n="plus" size={13} /> New
          </button>
          <button onClick={() => setModal("share")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,.1)" }}>
            <Ic n="share" size={13} /> Share
          </button>
          <button onClick={() => { setSettingsTab("general"); setModal("settings"); }} style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.08)" }}>
            <Ic n="settings" size={14} />
          </button>
          <button onClick={() => setModal("profile")} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <Ic n="user" size={14} />
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{ width: 272, background: "#0B0D1A", borderRight: "1px solid rgba(255,255,255,.05)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
            {/* Profile card */}
            <div style={{ background: "linear-gradient(135deg,#181A3A,#20224A)", borderRadius: 14, padding: 14, marginBottom: 10, border: "1px solid rgba(109,94,247,.22)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}><Ic n="book" size={17} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notebookTitle}</div>
                  <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginTop: 2 }}>Research · {nbVisibility === "private" ? "🔒 Private" : "🌐 Public"}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {[["Sources", sources.length, "#5DA9FF"], ["Indexed", indexedSources.length, "#22C55E"], ["Outputs", outputs.length, "#A855F7"], ["Chunks", totalChunks, "#F59E0B"]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "7px 9px" }}>
                    <div style={{ color: c, fontWeight: 800, fontSize: 17, lineHeight: 1 }}>{v}</div>
                    <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Mix */}
            <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 12, marginBottom: 10, border: "1px solid rgba(255,255,255,.05)" }}>
              <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, marginBottom: 9 }}>Source Mix</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Donut segs={[{ p: 60, c: "#EF4444" }, { p: 30, c: "#5DA9FF" }, { p: 10, c: "#A855F7" }]} size={60} />
                <div style={{ flex: 1 }}>
                  {[["PDFs", "60%", "#EF4444"], ["URLs", "30%", "#5DA9FF"], ["Other", "10%", "#A855F7"]].map(([l, p, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: c, flexShrink: 0 }} />
                      <span style={{ color: "rgba(255,255,255,.5)", fontSize: 10, flex: 1 }}>{l}</span>
                      <span style={{ color: "rgba(255,255,255,.8)", fontSize: 10, fontWeight: 700 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, padding: "2px 6px", marginBottom: 6 }}>Filter by Topic</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {TAGS.map(t => {
                  const active = activeTags.includes(t);
                  return (
                    <span key={t} onClick={() => setActiveTags(p => active ? p.filter(x => x !== t) : [...p, t])} style={{ padding: "3px 9px", borderRadius: 20, background: active ? "rgba(109,94,247,.3)" : "rgba(255,255,255,.04)", color: active ? "#B8ABFF" : "rgba(255,255,255,.42)", fontSize: 10, cursor: "pointer", border: `1px solid ${active ? "rgba(109,94,247,.4)" : "rgba(255,255,255,.07)"}`, transition: "all .15s" }}>
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 10, border: "1px solid rgba(255,255,255,.05)", marginBottom: 10 }}>
              <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, marginBottom: 7 }}>Quick Actions</div>
              {[
                { l: "Add Source", i: "upload", a: () => setModal("upload") },
                { l: "Generate Report", i: "report", a: () => { setView("studio"); } },
                { l: "Add Note", i: "note", a: () => openNoteEditor() },
                { l: "Web Search", i: "globe", a: () => { setModal("upload"); setUploadTab("web"); } },
                { l: "Export Notebook", i: "export", a: exportNotebook },
              ].map(({ l, i, a }) => (
                <div key={l} className="si" onClick={a} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
                  <div style={{ color: "rgba(109,94,247,.85)", width: 14, display: "flex" }}><Ic n={i} size={14} /></div>
                  <span style={{ color: "rgba(255,255,255,.58)", fontSize: 12 }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div>
              <div style={{ color: "rgba(255,255,255,.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, padding: "2px 6px", marginBottom: 7 }}>Recent Activity</div>
              {activityLog.slice(0, 5).map((a, i) => (
                <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
                    <div style={{ color: "rgba(255,255,255,.25)", fontSize: 9 }}>{a.action} · {a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* OVERVIEW */}
          {view === "overview" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { l: "Total Sources",    v: sources.length,   i: "file",     bg: "linear-gradient(135deg,#6D5EF7,#A855F7)" },
                  { l: "Indexed Chunks",   v: totalChunks,      i: "activity", bg: "linear-gradient(135deg,#4F46E5,#5DA9FF)" },
                  { l: "Key Themes",       v: 12,               i: "sparkle",  bg: "linear-gradient(135deg,#A855F7,#C026D3)" },
                  { l: "Studio Outputs",   v: outputs.length,   i: "report",   bg: "linear-gradient(135deg,#22C55E,#16A34A)" },
                  { l: "AI Queries",       v: messages.filter(m => m.role === "user").length, i: "bot", bg: "linear-gradient(135deg,#F59E0B,#EF4444)" },
                ].map(k => (
                  <div key={k.l} className="hr" style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #E7EAF3" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 10 }}><Ic n={k.i} size={15} /></div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#1A1F36", lineHeight: 1 }}>{k.v}</div>
                    <div style={{ fontSize: 11, color: "#6B7285", marginTop: 3, fontWeight: 500 }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                <div>
                  {/* Source Intelligence */}
                  <div style={{ background: "white", borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #E7EAF3" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1F36" }}>Source Intelligence</h3>
                      <button onClick={() => setView("sources")} style={{ color: "#6D5EF7", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                    </div>
                    {sources.slice(0, 4).map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F4F6FB" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: typeColor(s.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(s.type), flexShrink: 0 }}><Ic n={typeIcon(s.type)} size={15} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1F36", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{s.chunks > 0 ? `${s.chunks} chunks` : "Processing…"} · {s.date}</div>
                        </div>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.status === "indexed" ? "#DCFCE7" : "#FEF3C7", color: s.status === "indexed" ? "#16A34A" : "#D97706" }}>{s.status}</span>
                      </div>
                    ))}
                    <button onClick={() => { setModal("upload"); }} style={{ marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 9, background: "#F8F9FF", color: "#6D5EF7", fontSize: 12, fontWeight: 600, border: "1px dashed #D8DBFF", cursor: "pointer" }}>
                      + Add Source
                    </button>
                  </div>
                  {/* Outputs */}
                  <div style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #E7EAF3" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1F36" }}>Studio Outputs</h3>
                      <button onClick={() => setView("studio")} style={{ color: "#6D5EF7", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Open Studio →</button>
                    </div>
                    {outputs.length === 0 ? <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 12 }}>No outputs yet — open Studio to generate</div> : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                        {outputs.slice(0, 6).map(o => {
                          const t = toolFor(o.type);
                          return (
                            <div key={o.id} className="hr" onClick={() => { setModalData(o); setModal("output"); }} style={{ background: "#F8F9FF", borderRadius: 12, padding: 12, border: "1px solid #E7EAF3", cursor: "pointer" }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: t.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: t.color, marginBottom: 7 }}><Ic n={t.icon} size={13} /></div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1F36", lineHeight: 1.3, marginBottom: 3 }}>{o.title.substring(0, 28)}{o.title.length > 28 ? "…" : ""}</div>
                              <div style={{ fontSize: 10, color: "#9CA3AF" }}>{o.created}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Timeline */}
                  <div style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #E7EAF3" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1F36", marginBottom: 14 }}>Activity</h3>
                    {activityLog.slice(0, 5).map((a, i) => (
                      <div key={a.id || i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 2, flexShrink: 0 }} />
                          {i < 4 && <div style={{ width: 1, flex: 1, background: "#F0F0F0", marginTop: 3 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1F36" }}>{a.action}</div>
                          <div style={{ fontSize: 10, color: "#6B7285", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
                          <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Quick chat */}
                  <div style={{ background: "linear-gradient(135deg,#181A3A,#21234A)", borderRadius: 16, padding: 18, border: "1px solid rgba(109,94,247,.2)" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 3 }}>Quick Chat</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 12 }}>Ask anything about your sources</div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (setView("chat"), sendMessage())} placeholder="Ask a question…" style={{ flex: 1, background: "rgba(255,255,255,.08)", borderRadius: 9, padding: "8px 12px", color: "white", fontSize: 12, border: "1px solid rgba(255,255,255,.12)" }} />
                      <button onClick={() => { setView("chat"); sendMessage(); }} style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ic n="send" size={14} />
                      </button>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {["Summarize sources", "Key findings", "Compare topics"].map(q => (
                        <button key={q} onClick={() => { setChatInput(q); setView("chat"); sendMessage(q); }} style={{ padding: "4px 9px", borderRadius: 20, background: "rgba(109,94,247,.22)", color: "#B8ABFF", fontSize: 10, fontWeight: 600, border: "1px solid rgba(109,94,247,.3)", cursor: "pointer" }}>{q}</button>
                      ))}
                    </div>
                  </div>
                  {/* Notes preview */}
                  {notes.length > 0 && (
                    <div style={{ background: "white", borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #E7EAF3" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1F36" }}>Notes</h3>
                        <button onClick={() => setView("notes")} style={{ color: "#6D5EF7", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                      </div>
                      {notes.slice(0, 2).map(n => (
                        <div key={n.id} onClick={() => openNoteEditor(n)} style={{ padding: "8px 10px", borderRadius: 9, background: "#F8F9FF", marginBottom: 6, cursor: "pointer", border: "1px solid #E7EAF3" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1F36" }}>{n.title}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{n.content.substring(0, 50)}…</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHAT */}
          {view === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Chat header */}
              <div style={{ padding: "10px 20px", background: "white", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="sparkle" size={14} /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F36" }}>AI Research Assistant</div>
                    <div style={{ fontSize: 10, color: indexedSources.length > 0 ? "#22C55E" : "#F59E0B", fontWeight: 600 }}>
                      {indexedSources.length > 0 ? `● Grounded in ${indexedSources.length} indexed sources` : "● No indexed sources — add sources first"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setShowChatSettings(p => !p)} title="Chat Settings" style={{ width: 30, height: 30, borderRadius: 7, background: showChatSettings ? "#EEF0FF" : "#F8F9FF", color: showChatSettings ? "#6D5EF7" : "#6B7285", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E7EAF3" }}>
                    <Ic n="settings" size={13} />
                  </button>
                  <button onClick={regenerateLast} title="Regenerate last answer" style={{ width: 30, height: 30, borderRadius: 7, background: "#F8F9FF", color: "#6B7285", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E7EAF3" }}>
                    <Ic n="refresh" size={13} />
                  </button>
                  <button onClick={exportChat} title="Export chat" style={{ width: 30, height: 30, borderRadius: 7, background: "#F8F9FF", color: "#6B7285", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E7EAF3" }}>
                    <Ic n="download" size={13} />
                  </button>
                  <button onClick={clearChat} title="Clear chat" style={{ width: 30, height: 30, borderRadius: 7, background: "#F8F9FF", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E7EAF3" }}>
                    <Ic n="trash" size={13} />
                  </button>
                </div>
              </div>
              {/* Chat settings bar */}
              {showChatSettings && (
                <div style={{ background: "#F8F9FF", borderBottom: "1px solid #E7EAF3", padding: "8px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7285" }}>Reasoning Depth:</span>
                  {["fast", "balanced", "deep"].map(d => (
                    <button key={d} onClick={() => { setChatDepth(d); toast(`Depth set to ${d}`); }} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: chatDepth === d ? "#6D5EF7" : "white", color: chatDepth === d ? "white" : "#6B7285", border: "1px solid " + (chatDepth === d ? "#6D5EF7" : "#E7EAF3"), cursor: "pointer" }}>{d.charAt(0).toUpperCase() + d.slice(1)}</button>
                  ))}
                </div>
              )}
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
                {messages.length === 0 && !indexedSources.length && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#9CA3AF" }}>
                    <Ic n="book" size={40} stroke="#D1D5DB" />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#6B7285" }}>Add a source to get started</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>Upload PDFs, add URLs, or search the web</div>
                    <button onClick={() => setModal("upload")} style={{ marginTop: 4, padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Upload a Source</button>
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} className="ani" style={{ marginBottom: 18, display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: m.role === "ai" ? "linear-gradient(135deg,#6D5EF7,#A855F7)" : "#E7EAF3", display: "flex", alignItems: "center", justifyContent: "center", color: m.role === "ai" ? "white" : "#6B7285", flexShrink: 0 }}>
                      <Ic n={m.role === "ai" ? "sparkle" : "user"} size={13} />
                    </div>
                    <div style={{ maxWidth: "74%" }}>
                      <div style={{ background: m.role === "user" ? "linear-gradient(135deg,#6D5EF7,#A855F7)" : "white", color: m.role === "user" ? "white" : "#1A1F36", borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "11px 14px", fontSize: 12, lineHeight: 1.7, boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: m.role === "ai" ? "1px solid #E7EAF3" : "none", whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                      {m.citations && m.citations.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {m.citations.map((c, ci) => (
                            <span key={ci} style={{ padding: "2px 9px", borderRadius: 20, background: "#EEF0FF", color: "#6D5EF7", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1px solid #D8DBFF" }} title="View source">📎 {c}</span>
                          ))}
                        </div>
                      )}
                      {m.pinned && <div style={{ fontSize: 10, color: "#6D5EF7", marginTop: 4 }}>📌 Pinned</div>}
                      {/* Message actions */}
                      <div style={{ display: "flex", gap: 5, marginTop: 5, opacity: 0.6 }}>
                        <span style={{ fontSize: 9, color: "#9CA3AF" }}>{m.time}</span>
                        {m.role === "ai" && (
                          <>
                            <button onClick={() => pinMessage(m.id)} title="Pin" style={{ background: "none", border: "none", cursor: "pointer", color: m.pinned ? "#6D5EF7" : "#9CA3AF", display: "flex", fontSize: 9, alignItems: "center", gap: 2 }}><Ic n="pin" size={10} /> Pin</button>
                            <button onClick={() => saveToNotes(m)} title="Save to notes" style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", fontSize: 9, alignItems: "center", gap: 2 }}><Ic n="save" size={10} /> Save</button>
                            <button onClick={() => { navigator.clipboard?.writeText(m.content); toast("Copied!"); }} title="Copy" style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", fontSize: 9, alignItems: "center", gap: 2 }}><Ic n="copy" size={10} /> Copy</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {generating && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6D5EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}><Ic n="sparkle" size={13} /></div>
                    <div style={{ background: "white", borderRadius: "4px 16px 16px 16px", padding: "13px 16px", border: "1px solid #E7EAF3", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6D5EF7" }} className={`dot${d + 1}`} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div style={{ padding: "12px 20px", background: "white", borderTop: "1px solid #E7EAF3", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#F8F9FF", borderRadius: 14, padding: "9px 12px", border: "1px solid #E7EAF3" }}>
                  <button onClick={() => setModal("upload")} title="Upload source" style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}><Ic n="upload" size={15} /></button>
                  <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={indexedSources.length > 0 ? "Ask anything about your sources… (Enter to send)" : "Upload and index a source first…"} rows={1} style={{ flex: 1, fontSize: 12, color: "#1A1F36", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", paddingTop: 1 }} />
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button title="Voice input" style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="mic" size={15} /></button>
                    <button onClick={() => sendMessage()} disabled={!chatInput.trim() || !indexedSources.length} style={{ width: 32, height: 32, borderRadius: 8, background: chatInput.trim() && indexedSources.length ? "linear-gradient(135deg,#6D5EF7,#A855F7)" : "#E7EAF3", color: chatInput.trim() && indexedSources.length ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", border: "none", cursor: chatInput.trim() && indexedSources.length ? "pointer" : "not-allowed" }}>
                      <Ic n="send" size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6, textAlign: "center" }}>Grounded in {indexedSources.length} indexed source{indexedSources.length !== 1 ? "s" : ""} · Powered by Llama 3.1 · Shift+Enter for new line</div>
              </div>
            </div>
          )}

          {/* SOURCES */}
          {view === "sources" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1F36" }}>Sources <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>({sources.length})</span></h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ display: "flex", background: "white", borderRadius: 9, border: "1px solid #E7EAF3", overflow: "hidden" }}>
                    {["all", "pdf", "url", "indexed", "processing"].map(f => (
                      <button key={f} onClick={() => setSrcFilter(f)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, background: srcFilter === f ? "#6D5EF7" : "transparent", color: srcFilter === f ? "white" : "#6B7285", border: "none", cursor: "pointer" }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: "white", borderRadius: 9, padding: "6px 12px", border: "1px solid #E7EAF3" }}>
                    <Ic n="search" size={13} stroke="#9CA3AF" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search sources…" style={{ fontSize: 12, color: "#1A1F36", width: 180 }} />
                  </div>
                  <button onClick={() => setModal("upload")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    <Ic n="plus" size={13} /> Add Source
                  </button>
                </div>
              </div>
              {/* Drag zone */}
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
                style={{ borderRadius: 14, border: `2px dashed ${dragOver ? "#6D5EF7" : "#D8DBFF"}`, background: dragOver ? "#EEF0FF" : "transparent", padding: "14px 20px", marginBottom: 16, textAlign: "center", transition: "all .2s", cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}>
                <Ic n="upload" size={20} stroke={dragOver ? "#6D5EF7" : "#9CA3AF"} />
                <div style={{ fontSize: 12, fontWeight: 600, color: dragOver ? "#6D5EF7" : "#9CA3AF", marginTop: 6 }}>Drop files here or click to browse</div>
                <div style={{ fontSize: 10, color: "#B0B7C3", marginTop: 3 }}>PDF, DOC, TXT, PPT, MP3, MP4</div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.mp3,.mp4,.wav" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 12 }}>
                {filteredSources.map(s => (
                  <div key={s.id} className="hr" style={{ background: "white", borderRadius: 14, padding: 14, border: "1px solid #E7EAF3", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: typeColor(s.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(s.type), flexShrink: 0 }}><Ic n={typeIcon(s.type)} size={18} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36", lineHeight: 1.4, marginBottom: 5 }}>{s.title}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
                          <span style={{ padding: "1px 7px", borderRadius: 20, background: typeColor(s.type) + "18", color: typeColor(s.type), fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{s.type}</span>
                          <span style={{ padding: "1px 7px", borderRadius: 20, background: s.status === "indexed" ? "#DCFCE7" : "#FEF3C7", color: s.status === "indexed" ? "#16A34A" : "#D97706", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{s.status}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#9CA3AF" }}>{s.date} · {s.size} {s.chunks > 0 ? `· ${s.chunks} chunks` : ""}</div>
                        {s.url && <div style={{ fontSize: 9, color: "#5DA9FF", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔗 {s.url}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button onClick={() => { setModalData(s); setModal("source"); }} title="View details" style={{ width: 26, height: 26, borderRadius: 6, background: "#F8F9FF", color: "#6B7285", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E7EAF3", cursor: "pointer" }}><Ic n="eye" size={11} /></button>
                        <button onClick={() => deleteSource(s.id)} title="Delete" style={{ width: 26, height: 26, borderRadius: 6, background: "#FFF0F0", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #FCA5A5", cursor: "pointer" }}><Ic n="trash" size={11} /></button>
                      </div>
                    </div>
                    {s.status === "processing" && (
                      <div style={{ marginTop: 10, background: "#F4F6FB", borderRadius: 6, overflow: "hidden", height: 3 }}>
                        <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg,#6D5EF7,#A855F7)", borderRadius: 6 }} className="pulse" />
                      </div>
                    )}
                  </div>
                ))}
                {filteredSources.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                    <Ic n="search" size={32} stroke="#D1D5DB" />
                    <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#6B7285" }}>No sources match your filter</div>
                    <button onClick={() => { setSearchQ(""); setSrcFilter("all"); setActiveTags([]); }} style={{ marginTop: 8, padding: "7px 16px", borderRadius: 8, background: "#6D5EF7", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>Clear Filters</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STUDIO */}
          {view === "studio" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1F36" }}>Studio</h2>
                <p style={{ fontSize: 12, color: "#6B7285", marginTop: 2 }}>Generate AI outputs from your {indexedSources.length} indexed source{indexedSources.length !== 1 ? "s" : ""}</p>
              </div>
              {indexedSources.length === 0 && (
                <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, border: "1px solid #FCD34D" }}>
                  <Ic n="alert" size={16} stroke="#D97706" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>Index at least one source to use Studio tools</span>
                  <button onClick={() => setModal("upload")} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 7, background: "#F59E0B", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>Add Source</button>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
                {STUDIO_TOOLS.map(tool => (
                  <div key={tool.id} className="hr" onClick={() => generateOutput(tool)} style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E7EAF3", cursor: indexedSources.length > 0 ? "pointer" : "not-allowed", opacity: indexedSources.length > 0 ? 1 : 0.5, boxShadow: "0 2px 8px rgba(0,0,0,.04)", position: "relative", overflow: "hidden", transition: "all .2s" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, borderRadius: "0 16px 0 70px", background: tool.color + "10" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: tool.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tool.color, marginBottom: 10 }}>
                      {genTool === tool.id
                        ? <div className="spin" style={{ width: 14, height: 14, border: `2px solid ${tool.color}40`, borderTop: `2px solid ${tool.color}`, borderRadius: "50%" }} />
                        : <Ic n={tool.icon} size={18} />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F36", marginBottom: 3 }}>{tool.label}</div>
                    <div style={{ fontSize: 11, color: "#6B7285" }}>{tool.desc}</div>
                    {genTool === tool.id && (
                      <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 10, color: tool.color, fontWeight: 700 }}>Generating…</div>
                    )}
                  </div>
                ))}
              </div>
              {/* Outputs list */}
              <div style={{ background: "white", borderRadius: 16, padding: 18, border: "1px solid #E7EAF3" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1F36" }}>Generated Outputs ({outputs.length})</h3>
                </div>
                {outputs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 0", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No outputs yet</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Click any tool above to generate your first output</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
                    {outputs.map(o => {
                      const t = toolFor(o.type);
                      return (
                        <div key={o.id} className="hr" style={{ background: "#F8F9FF", borderRadius: 12, padding: 14, border: "1px solid #E7EAF3" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: t.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: t.color }}><Ic n={t.icon} size={14} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1F36", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                              <div style={{ fontSize: 9, color: "#9CA3AF" }}>{o.created} · {o.size}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => { setModalData(o); setModal("output"); }} style={{ flex: 1, padding: "5px 0", borderRadius: 7, background: t.color + "18", color: t.color, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                              <Ic n="eye" size={10} /> Preview
                            </button>
                            <button onClick={() => downloadOutput(o)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, background: "#E7EAF3", color: "#6B7285", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                              <Ic n="download" size={10} /> Export
                            </button>
                            <button onClick={() => deleteOutput(o.id)} style={{ width: 28, padding: "5px 0", borderRadius: 7, background: "#FFF0F0", color: "#EF4444", fontSize: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Ic n="trash" size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTES */}
          {view === "notes" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1F36" }}>Notes <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>({notes.length})</span></h2>
                <button onClick={() => openNoteEditor()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  <Ic n="plus" size={13} /> New Note
                </button>
              </div>
              {notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
                  <Ic n="note" size={40} stroke="#D1D5DB" />
                  <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "#6B7285" }}>No notes yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Create your first note or save AI responses</div>
                  <button onClick={() => openNoteEditor()} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Create Note</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                  {notes.map(n => (
                    <div key={n.id} className="hr" style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #E7EAF3", boxShadow: "0 2px 8px rgba(0,0,0,.04)", cursor: "pointer" }} onClick={() => openNoteEditor(n)}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F36", flex: 1, marginRight: 8 }}>{n.title}</div>
                        <button onClick={e => { e.stopPropagation(); setNotes(p => p.map(x => x.id === n.id ? { ...x, pinned: !x.pinned } : x)); }} style={{ color: n.pinned ? "#F59E0B" : "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="pin" size={13} /></button>
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7285", lineHeight: 1.6, marginBottom: 10 }}>{n.content.substring(0, 120)}{n.content.length > 120 ? "…" : ""}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{n.created}</span>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={e => { e.stopPropagation(); openNoteEditor(n); }} style={{ padding: "3px 8px", borderRadius: 6, background: "#EEF0FF", color: "#6D5EF7", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>Edit</button>
                          <button onClick={e => { e.stopPropagation(); deleteNote(n.id); }} style={{ padding: "3px 8px", borderRadius: 6, background: "#FFF0F0", color: "#EF4444", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── RIGHT STUDIO RAIL (overview + chat) ── */}
        {(view === "overview" || view === "chat") && studioOpen && (
          <aside style={{ width: 290, background: "white", borderLeft: "1px solid #E7EAF3", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="sparkle" size={11} /></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36" }}>Studio</span>
              </div>
              <button onClick={() => setStudioOpen(false)} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={14} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
                {STUDIO_TOOLS.slice(0, 6).map(tool => (
                  <div key={tool.id} onClick={() => generateOutput(tool)} style={{ background: "#F8F9FF", borderRadius: 10, padding: "9px 7px", border: "1px solid #E7EAF3", cursor: "pointer", textAlign: "center", transition: "all .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = tool.color + "10"}
                    onMouseLeave={e => e.currentTarget.style.background = "#F8F9FF"}>
                    <div style={{ color: tool.color, display: "flex", justifyContent: "center", marginBottom: 5 }}>
                      {genTool === tool.id ? <div className="spin" style={{ width: 14, height: 14, border: `2px solid ${tool.color}40`, borderTop: `2px solid ${tool.color}`, borderRadius: "50%" }} /> : <Ic n={tool.icon} size={16} />}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1F36" }}>{tool.label}</div>
                  </div>
                ))}
              </div>
              {/* Quick note in rail */}
              <div style={{ background: "#F8F9FF", borderRadius: 12, padding: 12, border: "1px solid #E7EAF3", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1F36" }}>Quick Note</span>
                  <button onClick={() => openNoteEditor()} style={{ color: "#6D5EF7", fontSize: 10, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Full editor</button>
                </div>
                <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Title…" style={{ width: "100%", fontSize: 11, fontWeight: 600, color: "#1A1F36", background: "white", borderRadius: 6, padding: "5px 8px", border: "1px solid #E7EAF3", marginBottom: 5 }} />
                <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder="Write a note…" rows={3} style={{ width: "100%", fontSize: 11, color: "#1A1F36", background: "white", borderRadius: 6, padding: "5px 8px", border: "1px solid #E7EAF3", lineHeight: 1.5 }} />
                <button onClick={saveNote} style={{ width: "100%", marginTop: 7, padding: "6px 0", borderRadius: 7, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>Save Note</button>
              </div>
              {/* Recent outputs in rail */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>Recent Outputs</div>
              {outputs.slice(0, 4).map(o => {
                const t = toolFor(o.type);
                return (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #F4F6FB" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: t.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: t.color, flexShrink: 0 }}><Ic n={t.icon} size={12} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1F36", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                      <div style={{ fontSize: 9, color: "#9CA3AF" }}>{o.created}</div>
                    </div>
                    <button onClick={() => downloadOutput(o)} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="download" size={12} /></button>
                  </div>
                );
              })}
              {outputs.length === 0 && <div style={{ textAlign: "center", padding: "16px 0", color: "#9CA3AF", fontSize: 11 }}>No outputs yet</div>}
            </div>
          </aside>
        )}
        {(view === "overview" || view === "chat") && !studioOpen && (
          <button onClick={() => setStudioOpen(true)} style={{ position: "absolute", right: 14, top: 14, width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(109,94,247,.4)", zIndex: 10, border: "none", cursor: "pointer" }} title="Open Studio">
            <Ic n="sparkle" size={14} />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)", animation: "fadeIn .18s ease" }}>

          {/* ── UPLOAD ── */}
          {modal === "upload" && (
            <div style={{ background: "white", borderRadius: 22, width: 540, boxShadow: "0 24px 80px rgba(0,0,0,.22)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1A1F36" }}>Add Source</h3>
                <button onClick={() => { setModal(null); setWebResults([]); setWebSearchInput(""); setUrlInput(""); }} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", padding: "10px 24px 0", gap: 2, borderBottom: "1px solid #E7EAF3" }}>
                {[["file","Upload File"],["url","Add URL"],["web","Web Search"],["drive","Google Drive"]].map(([t, l]) => (
                  <button key={t} onClick={() => setUploadTab(t)} style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, color: uploadTab === t ? "#6D5EF7" : "#9CA3AF", background: "none", border: "none", borderBottom: `2px solid ${uploadTab === t ? "#6D5EF7" : "transparent"}`, cursor: "pointer", transition: "all .15s" }}>{l}</button>
                ))}
              </div>
              <div style={{ padding: 24 }}>
                {/* File upload */}
                {uploadTab === "file" && (
                  <>
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: `2px dashed ${dragOver ? "#6D5EF7" : "#D8DBFF"}`, borderRadius: 14, padding: "32px 20px", textAlign: "center", background: dragOver ? "#EEF0FF" : "#F8F9FF", cursor: "pointer", transition: "all .2s" }}>
                      <Ic n="upload" size={32} stroke={dragOver ? "#6D5EF7" : "#9CA3AF"} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: dragOver ? "#6D5EF7" : "#6B7285", marginTop: 10 }}>Drop files here or click to browse</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>PDF, DOC, DOCX, TXT, PPT, PPTX, MP3, MP4, WAV</div>
                      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.mp3,.mp4,.wav" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
                      {[["PDF/Doc","pdf","#EF4444"],["Presentation","slides","#C026D3"],["Audio","audio","#A855F7"],["Video","video","#6D5EF7"]].map(([l, i, c]) => (
                        <div key={l} onClick={() => fileInputRef.current?.click()} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, background: c + "10", cursor: "pointer", border: `1px solid ${c}25` }}>
                          <Ic n={i} size={20} stroke={c} />
                          <div style={{ fontSize: 9, fontWeight: 700, color: c, marginTop: 5 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {/* URL */}
                {uploadTab === "url" && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7285", display: "block", marginBottom: 8 }}>Enter a URL to scrape and index</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleURLAdd()} placeholder="https://example.com/article" style={{ flex: 1, background: "#F8F9FF", borderRadius: 10, padding: "10px 14px", color: "#1A1F36", fontSize: 13, border: "1px solid #E7EAF3" }} />
                      <button onClick={handleURLAdd} style={{ padding: "0 18px", borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Add</button>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 8 }}>Examples</div>
                      {["https://arxiv.org/abs/1706.03762", "https://openai.com/research", "https://en.wikipedia.org/wiki/Large_language_model"].map(u => (
                        <div key={u} onClick={() => setUrlInput(u)} style={{ padding: "7px 10px", borderRadius: 8, background: "#F8F9FF", border: "1px solid #E7EAF3", fontSize: 11, color: "#5DA9FF", cursor: "pointer", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Web search */}
                {uploadTab === "web" && (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <input value={webSearchInput} onChange={e => setWebSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleWebSearch()} placeholder="Search the web for sources…" style={{ flex: 1, background: "#F8F9FF", borderRadius: 10, padding: "10px 14px", color: "#1A1F36", fontSize: 13, border: "1px solid #E7EAF3" }} />
                      <button onClick={handleWebSearch} style={{ padding: "0 16px", borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        {webSearching ? <div className="spin" style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid white", borderRadius: "50%" }} /> : <Ic n="search" size={13} />} Search
                      </button>
                    </div>
                    {webResults.length > 0 && (
                      <div>
                        {webResults.map((r, i) => (
                          <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "#F8F9FF", border: "1px solid #E7EAF3", marginBottom: 7 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36", marginBottom: 2 }}>{r.title}</div>
                                <div style={{ fontSize: 10, color: "#5DA9FF", marginBottom: 4 }}>{r.url}</div>
                                <div style={{ fontSize: 10, color: "#6B7285", lineHeight: 1.5 }}>{r.snippet}</div>
                              </div>
                              <button onClick={() => { addWebResult(r); setModal(null); setWebResults([]); }} style={{ padding: "5px 12px", borderRadius: 7, background: "#6D5EF7", color: "white", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0 }}>Add</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!webSearching && webResults.length === 0 && webSearchInput && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 12 }}>Press Search to find sources</div>
                    )}
                  </div>
                )}
                {/* Google Drive */}
                {uploadTab === "drive" && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <Ic n="drive" size={40} stroke="#9CA3AF" />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#6B7285", marginTop: 12 }}>Connect Google Drive</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, marginBottom: 16 }}>Import documents directly from your Drive</div>
                    <button onClick={() => toast("Google Drive OAuth would open here", "warn")} style={{ padding: "10px 24px", borderRadius: 10, background: "white", color: "#1A1F36", fontSize: 13, fontWeight: 700, border: "2px solid #E7EAF3", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Ic n="drive" size={16} stroke="#4285F4" /> Connect Drive
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SHARE ── */}
          {modal === "share" && (
            <div style={{ background: "white", borderRadius: 22, width: 480, boxShadow: "0 24px 80px rgba(0,0,0,.22)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1A1F36" }}>Share Notebook</h3>
                <button onClick={() => setModal(null)} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              <div style={{ padding: 24 }}>
                {/* Invite */}
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7285", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Invite collaborators</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && inviteCollaborator()} placeholder="colleague@email.com" style={{ flex: 1, background: "#F8F9FF", borderRadius: 10, padding: "9px 13px", color: "#1A1F36", fontSize: 12, border: "1px solid #E7EAF3" }} />
                  <button onClick={inviteCollaborator} style={{ padding: "0 16px", borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Invite</button>
                </div>
                {/* Collaborators */}
                {collaborators.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .7, marginBottom: 8 }}>Current collaborators</div>
                    {collaborators.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 9, background: "#F8F9FF", marginBottom: 5, border: "1px solid #E7EAF3" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6D5EF7,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1F36" }}>{c.email}</div>
                        </div>
                        <select defaultValue={c.role} style={{ fontSize: 11, color: "#6B7285", background: "white", borderRadius: 6, padding: "3px 8px", border: "1px solid #E7EAF3", cursor: "pointer" }}>
                          <option>Viewer</option>
                          <option>Editor</option>
                          <option>Admin</option>
                        </select>
                        <button onClick={() => setCollaborators(p => p.filter((_, j) => j !== i))} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Copy link */}
                <div style={{ background: "#F8F9FF", borderRadius: 12, padding: 14, border: "1px solid #E7EAF3" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7285", marginBottom: 8, textTransform: "uppercase", letterSpacing: .7 }}>Share link</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, background: "white", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#9CA3AF", border: "1px solid #E7EAF3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</div>
                    <button onClick={copyLink} style={{ padding: "0 14px", borderRadius: 8, background: linkCopied ? "#22C55E" : "#6D5EF7", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", transition: "background .3s", display: "flex", alignItems: "center", gap: 5 }}>
                      <Ic n={linkCopied ? "check" : "copy"} size={12} /> {linkCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select defaultValue="private" onChange={e => setNbVisibility(e.target.value)} style={{ flex: 1, fontSize: 11, color: "#6B7285", background: "white", borderRadius: 8, padding: "6px 10px", border: "1px solid #E7EAF3", cursor: "pointer" }}>
                      <option value="private">🔒 Private — Only collaborators</option>
                      <option value="link">🔗 Anyone with link</option>
                      <option value="public">🌐 Public</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTE EDITOR ── */}
          {modal === "note" && (
            <div style={{ background: "white", borderRadius: 22, width: 600, boxShadow: "0 24px 80px rgba(0,0,0,.22)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1A1F36" }}>{editNoteId ? "Edit Note" : "New Note"}</h3>
                <button onClick={() => { setModal(null); setNoteTitle(""); setNoteBody(""); setEditNoteId(null); }} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              <div style={{ padding: 22 }}>
                <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note title…" style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "#1A1F36", marginBottom: 14, padding: "8px 0", borderBottom: "2px solid #E7EAF3" }} />
                <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder="Write your note here… You can use markdown formatting." rows={9} style={{ width: "100%", fontSize: 13, color: "#1A1F36", lineHeight: 1.75, background: "#F8F9FF", borderRadius: 12, padding: 16, border: "1px solid #E7EAF3", marginBottom: 16 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{noteBody.length} characters · {noteBody.split(/\s+/).filter(Boolean).length} words</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setModal(null); setNoteTitle(""); setNoteBody(""); setEditNoteId(null); }} style={{ padding: "8px 18px", borderRadius: 9, background: "#F4F6FB", color: "#6B7285", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveNote} style={{ padding: "8px 20px", borderRadius: 9, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Save Note</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {modal === "settings" && (
            <div style={{ background: "white", borderRadius: 22, width: 580, maxHeight: "80vh", boxShadow: "0 24px 80px rgba(0,0,0,.22)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1A1F36" }}>Notebook Settings</h3>
                <button onClick={() => setModal(null)} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              {/* Settings tabs */}
              <div style={{ display: "flex", padding: "8px 22px 0", borderBottom: "1px solid #E7EAF3", gap: 0 }}>
                {[["general","General"],["sources","Sources"],["ai","AI Model"],["export","Export"]].map(([t, l]) => (
                  <button key={t} onClick={() => setSettingsTab(t)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, color: settingsTab === t ? "#6D5EF7" : "#9CA3AF", background: "none", border: "none", borderBottom: `2px solid ${settingsTab === t ? "#6D5EF7" : "transparent"}`, cursor: "pointer", transition: "all .15s" }}>{l}</button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
                {settingsTab === "general" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7285", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Notebook Name</label>
                      <input value={notebookTitle} onChange={e => setNotebookTitle(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E7EAF3", fontSize: 13, color: "#1A1F36", background: "#F8F9FF" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7285", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Description</label>
                      <textarea value={nbDescription} onChange={e => setNbDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E7EAF3", fontSize: 12, color: "#1A1F36", background: "#F8F9FF", lineHeight: 1.6 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7285", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Visibility</label>
                      <select value={nbVisibility} onChange={e => setNbVisibility(e.target.value)} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E7EAF3", fontSize: 12, color: "#1A1F36", background: "#F8F9FF", width: "100%", cursor: "pointer" }}>
                        <option value="private">🔒 Private</option>
                        <option value="link">🔗 Anyone with link</option>
                        <option value="public">🌐 Public</option>
                      </select>
                    </div>
                    <button onClick={() => { toast("Settings saved"); setModal(null); }} style={{ padding: "10px 0", borderRadius: 10, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>Save Changes</button>
                  </div>
                )}
                {settingsTab === "sources" && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1F36", marginBottom: 12 }}>Manage Sources ({sources.length})</div>
                    {sources.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "#F8F9FF", marginBottom: 7, border: "1px solid #E7EAF3" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: typeColor(s.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(s.type), flexShrink: 0 }}><Ic n={typeIcon(s.type)} size={13} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1F36", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                          <div style={{ fontSize: 9, color: "#9CA3AF" }}>{s.chunks} chunks · {s.status}</div>
                        </div>
                        <button onClick={() => deleteSource(s.id)} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="trash" size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {settingsTab === "ai" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[["Model", "Llama 3.1 (405B)"], ["Embeddings", "BGE-M3"], ["Vector DB", "Weaviate"], ["Framework", "LlamaIndex"], ["Context Window", "128K tokens"], ["Temperature", "0.7"]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 10, background: "#F8F9FF", border: "1px solid #E7EAF3" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7285" }}>{l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ padding: 12, borderRadius: 10, background: "#EEF0FF", border: "1px solid #D8DBFF" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6D5EF7", marginBottom: 4 }}>Reasoning Depth</div>
                      <div style={{ display: "flex", gap: 7 }}>
                        {["fast", "balanced", "deep"].map(d => (
                          <button key={d} onClick={() => { setChatDepth(d); toast(`Depth set to ${d}`); }} style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, background: chatDepth === d ? "#6D5EF7" : "white", color: chatDepth === d ? "white" : "#6B7285", border: `1px solid ${chatDepth === d ? "#6D5EF7" : "#E7EAF3"}`, cursor: "pointer" }}>{d}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {settingsTab === "export" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7285", marginBottom: 4 }}>Export your notebook data</div>
                    {[
                      { l: "Export as JSON", d: "Full notebook backup", i: "file", a: exportNotebook },
                      { l: "Export Sources List", d: "CSV of all sources", i: "table", a: () => { toast("Exporting sources…"); } },
                      { l: "Export Chat History", d: "Full conversation transcript", i: "activity", a: exportChat },
                      { l: "Export All Outputs", d: "ZIP of generated content", i: "download", a: () => toast("Preparing ZIP…", "warn") },
                    ].map(({ l, d, i, a }) => (
                      <div key={l} onClick={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11, background: "#F8F9FF", border: "1px solid #E7EAF3", cursor: "pointer", transition: "all .15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#6D5EF7"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#E7EAF3"}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#6D5EF720", display: "flex", alignItems: "center", justifyContent: "center", color: "#6D5EF7" }}><Ic n={i} size={15} /></div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36" }}>{l}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{d}</div>
                        </div>
                        <Ic n="chevR" size={14} stroke="#9CA3AF" />
                      </div>
                    ))}
                    <div style={{ marginTop: 8, padding: 14, borderRadius: 11, background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>Danger Zone</div>
                      <button onClick={() => setConfirm({ msg: "Delete this entire notebook? All sources, outputs, and notes will be permanently deleted.", onYes: () => { toast("Notebook deleted", "error"); setConfirm(null); setModal(null); }, onNo: () => setConfirm(null) })} style={{ padding: "7px 16px", borderRadius: 8, background: "#EF4444", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>Delete Notebook</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── OUTPUT PREVIEW ── */}
          {modal === "output" && modalData && (() => {
            const tool = toolFor(modalData.type);
            return (
              <div style={{ background: "white", borderRadius: 22, width: 640, maxHeight: "82vh", boxShadow: "0 24px 80px rgba(0,0,0,.22)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 101 }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: tool.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: tool.color }}><Ic n={tool.icon} size={15} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1F36" }}>{modalData.title}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{modalData.created} · {modalData.size}</div>
                  </div>
                  <button data-testid="output-export-btn" onClick={() => downloadOutput(modalData)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: tool.color + "18", color: tool.color, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", position: "relative", zIndex: 102 }}><Ic n="download" size={12} /> Export</button>
                  <button data-testid="output-save-btn" onClick={() => saveToNotes({ content: modalData.content })} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "#F8F9FF", color: "#6B7285", fontSize: 11, fontWeight: 700, border: "1px solid #E7EAF3", cursor: "pointer" }}><Ic n="save" size={12} /> Save</button>
                  <button data-testid="output-close-btn" onClick={() => setModal(null)} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                  <pre style={{ fontFamily: "inherit", fontSize: 12, color: "#1A1F36", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{modalData.content || "No content generated."}</pre>
                </div>
              </div>
            );
          })()}

          {/* ── SOURCE DETAIL ── */}
          {modal === "source" && modalData && (
            <div style={{ background: "white", borderRadius: 22, width: 520, boxShadow: "0 24px 80px rgba(0,0,0,.22)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E7EAF3", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: typeColor(modalData.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(modalData.type), flexShrink: 0 }}><Ic n={typeIcon(modalData.type)} size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1F36" }}>{modalData.title}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>{modalData.date} · {modalData.size}</div>
                </div>
                <button onClick={() => setModal(null)} style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              <div style={{ padding: 20 }}>
                {[["Type", modalData.type.toUpperCase()], ["Status", modalData.status], ["Chunks", String(modalData.chunks || 0)], ["Size", modalData.size], ["Added", modalData.date]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F4F6FB" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36" }}>{v}</span>
                  </div>
                ))}
                {modalData.url && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 9, background: "#F0F9FF", border: "1px solid #BAE6FD" }}><div style={{ fontSize: 10, fontWeight: 700, color: "#0284C7", marginBottom: 3 }}>Source URL</div><div style={{ fontSize: 11, color: "#0284C7" }}>{modalData.url}</div></div>}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Content Preview</div>
                  <div style={{ background: "#F8F9FF", borderRadius: 10, padding: 12, border: "1px solid #E7EAF3", fontSize: 11, color: "#6B7285", lineHeight: 1.7 }}>{modalData.content?.substring(0, 300)}{modalData.content?.length > 300 ? "…" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={() => { setChatInput(`Summarize: ${modalData.title}`); setView("chat"); setModal(null); sendMessage(`Summarize: ${modalData.title}`); }} style={{ flex: 1, padding: "9px 0", borderRadius: 9, background: "linear-gradient(135deg,#6D5EF7,#A855F7)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Ask AI About This</button>
                  <button onClick={() => deleteSource(modalData.id)} style={{ padding: "9px 14px", borderRadius: 9, background: "#FFF0F0", color: "#EF4444", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {modal === "profile" && (
            <div style={{ background: "white", borderRadius: 22, width: 360, boxShadow: "0 24px 80px rgba(0,0,0,.22)", overflow: "hidden" }}>
              <div style={{ padding: "20px 22px", background: "linear-gradient(135deg,#181A3A,#21234A)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#6D5EF7,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="user" size={28} /></div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>Research User</div>
                <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>research@insightos.app</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {["Pro Plan", "Llama 3.1", "Weaviate"].map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(109,94,247,.3)", color: "#B8ABFF", fontSize: 10, fontWeight: 700 }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: 18 }}>
                {[["Notebooks Created", "12"], ["Total Sources", String(sources.length)], ["Outputs Generated", String(outputs.length)], ["AI Queries", String(messages.filter(m => m.role === "user").length)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F4F6FB" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F36" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
                  <button onClick={() => { setSettingsTab("general"); setModal("settings"); }} style={{ padding: "9px 0", borderRadius: 9, background: "#F8F9FF", color: "#1A1F36", fontSize: 12, fontWeight: 600, border: "1px solid #E7EAF3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Ic n="settings" size={13} /> Account Settings</button>
                  <button onClick={() => { setModal(null); toast("Logged out", "warn"); }} style={{ padding: "9px 0", borderRadius: 9, background: "#FFF0F0", color: "#EF4444", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Sign Out</button>
                </div>
              </div>
            </div>
          )}

          {/* Click-outside close */}
          <div style={{ position: "fixed", inset: 0, zIndex: -1 }} onClick={() => { if (modal !== "upload" || !dragOver) setModal(null); }} />
        </div>
      )}

      {/* ── CONFIRM DIALOG ── */}
      {confirm && <Confirm msg={confirm.msg} onYes={confirm.onYes} onNo={confirm.onNo} />}

      {/* ── TOASTS ── */}
      <Toast toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}