import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../theme/ThemeContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ─── Simple Markdown renderer for AI chat messages ────────────────────────
const MdText = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        listType === 'ol'
          ? <ol key={`ol-${elements.length}`} style={{ margin: '6px 0', paddingLeft: 20, fontSize: 'inherit', lineHeight: 1.7 }}>{listItems}</ol>
          : <ul key={`ul-${elements.length}`} style={{ margin: '6px 0', paddingLeft: 18, fontSize: 'inherit', lineHeight: 1.7, listStyleType: 'disc' }}>{listItems}</ul>
      );
      listItems = [];
      listType = null;
    }
  };

  const renderInline = (str) => {
    // Bold, italic, inline code
    const parts = [];
    let remaining = str;
    let idx = 0;
    const rx = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let match;
    let lastIdx = 0;
    while ((match = rx.exec(remaining)) !== null) {
      if (match.index > lastIdx) parts.push(<span key={idx++}>{remaining.slice(lastIdx, match.index)}</span>);
      if (match[2]) parts.push(<strong key={idx++}>{match[2]}</strong>);
      else if (match[3]) parts.push(<em key={idx++}>{match[3]}</em>);
      else if (match[4]) parts.push(<code key={idx++} style={{ background: 'var(--bg-tint)', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace' }}>{match[4]}</code>);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < remaining.length) parts.push(<span key={idx++}>{remaining.slice(lastIdx)}</span>);
    return parts.length > 0 ? parts : str;
  };

  lines.forEach((line, li) => {
    const trimmed = line.trimStart();
    // Headers
    if (trimmed.startsWith('### ')) { flushList(); elements.push(<div key={li} style={{ fontWeight: 700, fontSize: '1.05em', marginTop: 10, marginBottom: 3, color: 'var(--text-primary)' }}>{renderInline(trimmed.slice(4))}</div>); return; }
    if (trimmed.startsWith('## ')) { flushList(); elements.push(<div key={li} style={{ fontWeight: 700, fontSize: '1.1em', marginTop: 12, marginBottom: 4, color: 'var(--text-primary)' }}>{renderInline(trimmed.slice(3))}</div>); return; }
    if (trimmed.startsWith('# ')) { flushList(); elements.push(<div key={li} style={{ fontWeight: 800, fontSize: '1.15em', marginTop: 12, marginBottom: 4, color: 'var(--text-primary)' }}>{renderInline(trimmed.slice(2))}</div>); return; }
    // Unordered list
    if (/^[-*•]\s/.test(trimmed)) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(<li key={li}>{renderInline(trimmed.replace(/^[-*•]\s/, ''))}</li>);
      return;
    }
    // Ordered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(<li key={li}>{renderInline(trimmed.replace(/^\d+[.)]\s/, ''))}</li>);
      return;
    }
    // Horizontal rule
    if (/^---+$/.test(trimmed)) { flushList(); elements.push(<hr key={li} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />); return; }
    // Empty line
    if (!trimmed) { flushList(); elements.push(<div key={li} style={{ height: 6 }} />); return; }
    // Paragraph
    flushList();
    elements.push(<div key={li} style={{ marginBottom: 2 }}>{renderInline(trimmed)}</div>);
  });
  flushList();
  return <>{elements}</>;
};


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
  sun:       "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon:      "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  image:     "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
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
      <div key={t.id} onClick={() => dismiss(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: t.type === "error" ? "var(--toast-error-bg)" : t.type === "warn" ? "var(--toast-warn-bg)" : "var(--toast-success-bg)", border: `1px solid ${t.type === "error" ? "var(--toast-error-border)" : t.type === "warn" ? "var(--toast-warn-border)" : "var(--toast-success-border)"}`, color: t.type === "error" ? "var(--toast-error-color)" : t.type === "warn" ? "var(--toast-warn-color)" : "var(--toast-success-color)", fontSize: 13, fontWeight: 600, boxShadow: "var(--toast-shadow)", cursor: "pointer", animation: "slideUp 0.25s ease", minWidth: 240, maxWidth: 360 }}>
        <Ic n={t.type === "error" ? "alert" : t.type === "warn" ? "info" : "check"} size={15} />
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────
const Confirm = ({ msg, onYes, onNo }) => (
  <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
    <div style={{ background: "var(--bg-modal)", borderRadius: 20, padding: 28, width: 380, boxShadow: "var(--shadow-heavy)" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>{msg}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onNo} style={{ padding: "8px 20px", borderRadius: 9, background: "var(--bg-light)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Cancel</button>
        <button onClick={onYes} style={{ padding: "8px 20px", borderRadius: 9, background: "var(--danger)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Delete</button>
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
    audio: `🎙️ AI PODCAST SCRIPT — "${title}"\n\nHOST A: Welcome back to HealthOS Audio! Today we're diving deep into the knowledge base titled "${title}".\n\nHOST B: That's right. We've processed ${src.length} sources and extracted the key themes.\n\nHOST A: Let's start with the fundamentals. The sources reveal three major themes...\n\nHOST B: What really stood out to me was the tension between different perspectives in the indexed materials.\n\nHOST A: Exactly. ${src[0] ? `"${src[0].title}"` : "The primary source"} makes a compelling case that...\n\n[Duration: ~12 minutes | Generated from ${src.length} sources]`,
    slides: `📊 SLIDE DECK — "${title}"\n\nSlide 1: Title & Overview\n━━━━━━━━━━━━━━━━━━━\n"${title}" — Research Summary\nGenerated from ${src.length} indexed sources\n\nSlide 2: Executive Summary\n━━━━━━━━━━━━━━━━━━━\n• 3 key themes identified\n• ${src.length} sources analyzed\n• Critical insights highlighted\n\nSlide 3-8: Core Content\n━━━━━━━━━━━━━━━━━━━\n${topics.slice(0, 4).map((t, i) => `Slide ${i + 3}: ${t}`).join("\n")}\n\nSlide 9: Conclusions & Next Steps\nSlide 10: References & Citations\n\n[${src.length * 2 + 4} slides total]`,
    mindmap: `🗺️ MIND MAP — "${title}"\n\nCentral Node: ${title}\n\n├── Theme 1: Core Concepts\n│   ├── Definition & Scope\n│   ├── Historical Context\n│   └── Key Terminology\n│\n├── Theme 2: Key Findings\n│   ├── Primary Evidence\n│   ├── Supporting Data\n│   └── Contradictions\n│\n├── Theme 3: Methodology\n│   ├── Research Approach\n│   └── Data Sources\n│\n└── Theme 4: Implications\n    ├── Short-term Impact\n    └── Long-term Outlook\n\n[${src.length * 8 + 12} nodes | Generated from ${src.length} sources]`,
    report: `📄 RESEARCH REPORT\n\nTitle: ${title}\nGenerated: ${new Date().toLocaleDateString()}\nSources: ${src.length} documents\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n1. EXECUTIVE SUMMARY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis report synthesizes findings from ${src.length} indexed sources. The analysis reveals consistent patterns across materials with notable insights for practitioners and researchers alike.\n\n2. INTRODUCTION\nThe scope of this analysis encompasses the full breadth of uploaded materials, cross-referenced for thematic consistency.\n\n3. KEY FINDINGS\n• Finding 1: Primary theme identified across majority of sources\n• Finding 2: Secondary patterns emerge in supporting materials\n• Finding 3: Contradictions noted between ${src[0]?.title || "Source A"} and ${src[1]?.title || "Source B"}\n\n4. ANALYSIS & INSIGHTS\nDetailed examination of the source materials reveals...\n\n5. CONCLUSIONS\nBased on the evidence, the most defensible conclusion is...\n\n6. REFERENCES\n${src.map((s, i) => `[${i + 1}] ${s.title}`).join("\n")}\n\n[Word count: ~2,400]`,
    flashcards: `🃏 FLASHCARD SET — "${title}"\n\n━━━━━━━━━━━━━━━━━━━\nCard 1 of ${src.length * 3 + 5}\n━━━━━━━━━━━━━━━━━━━\nQ: What is the central thesis of the primary source material?\nA: The materials collectively argue for a nuanced, evidence-based approach that considers multiple stakeholder perspectives.\n\n━━━━━━━━━━━━━━━━━━━\nCard 2\n━━━━━━━━━━━━━━━━━━━\nQ: What methodology is employed across the sources?\nA: Mixed-methods approach combining quantitative analysis with qualitative case studies.\n\n━━━━━━━━━━━━━━━━━━━\nCard 3\n━━━━━━━━━━━━━━━━━━━\nQ: What are the key limitations identified in the literature?\nA: Sample size constraints, temporal scope, and geographic specificity are the primary limitations noted.\n\n[${src.length * 3 + 5} cards total | Auto-generated from ${src.length} sources]`,
    quiz: `📝 QUIZ — "${title}"\n\nGenerated from ${src.length} sources | ${src.length * 2 + 3} questions\n\n━━━━━━━━━━━━━━━━━━━\nQuestion 1 (Multiple Choice)\n━━━━━━━━━━━━━━━━━━━\nAccording to the source materials, which approach is most strongly supported?\n\nA) Theoretical framework without empirical validation\nB) ✓ Evidence-based approach with cross-source verification\nC) Single-source dependency\nD) Anecdotal reasoning\n\n━━━━━━━━━━━━━━━━━━━\nQuestion 2 (True/False)\n━━━━━━━━━━━━━━━━━━━\nThe sources unanimously agree on all presented conclusions.\n→ FALSE — notable contradictions exist between sources.\n\n━━━━━━━━━━━━━━━━━━━\nQuestion 3 (Short Answer)\n━━━━━━━━━━━━━━━━━━━\nDescribe the primary methodology used across the indexed sources.\n→ Sample answer: Mixed quantitative/qualitative with systematic review...\n\n[${src.length * 2 + 3} questions total]`,
    infographic: `📊 INFOGRAPHIC DATA — "${title}"\n\n╔══════════════════════════════╗\n║   KEY METRICS AT A GLANCE   ║\n╠══════════════════════════════╣\n║  📚 ${src.length} Sources Analyzed       ║\n║  🔍 ${src.reduce((a, s) => a + (s.chunks || 0), 0)} Total Chunks Indexed   ║\n║  🏷️  6 Topic Tags Identified  ║\n║  💡 12 Key Insights Found    ║\n╚══════════════════════════════╝\n\nSOURCE DISTRIBUTION\n████████████ 60% PDFs\n██████ 30% URLs  \n██ 10% Other\n\nTOP 3 THEMES\n1. ████████████ Primary Topic (42%)\n2. ████████ Secondary Topic (31%)\n3. █████ Supporting Context (27%)\n\n[Visual infographic data — export for rendering]`,
    datatable: `📋 EXTRACTED DATA TABLE — "${title}"\n\n┌─────────────────────┬──────────┬──────────┬────────────┐\n│ Source              │ Type     │ Chunks   │ Key Topics │\n├─────────────────────┼──────────┼──────────┼────────────┤\n${src.map(s => `│ ${s.title.substring(0, 19).padEnd(19)} │ ${s.type.padEnd(8)} │ ${String(s.chunks || 0).padEnd(8)} │ AI, ML     │`).join("\n")}\n└─────────────────────┴──────────┴──────────┴────────────┘\n\nSUMMARY STATISTICS\n• Total Sources: ${src.length}\n• Total Chunks: ${src.reduce((a, s) => a + (s.chunks || 0), 0)}\n• Avg Chunks/Source: ${src.length ? Math.round(src.reduce((a, s) => a + (s.chunks || 0), 0) / src.length) : 0}\n• Source Types: ${[...new Set(src.map(s => s.type))].join(", ")}\n\n[CSV export available]`,
    video: `🎬 VIDEO SCRIPT — "${title}"\n\nDuration: ~8 minutes\nFormat: Explainer / Documentary\n\nSCENE 1 — INTRO (0:00 - 0:45)\n[Fade in with ambient music]\nNARRATOR: "In today's exploration, we examine the findings from ${src.length} carefully curated sources on the topic of ${title}."\n\nSCENE 2 — CONTEXT (0:45 - 2:00)\n[B-roll: Abstract visualization of knowledge graph]\nNARRATOR: "The landscape of this subject has evolved significantly, as evidenced by the materials we've analyzed..."\n\nSCENE 3 — KEY FINDINGS (2:00 - 5:30)\n[Split screen: source highlights]\nFor each of the ${src.length} sources, we surface the most salient points...\n\nSCENE 4 — SYNTHESIS (5:30 - 7:15)\n[Animated timeline]\nBringing it all together...\n\nSCENE 5 — OUTRO (7:15 - 8:00)\n[Logo animation]\n"Powered by HealthOS"\n\n[Script ready for narration recording]`,
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

HOST A: Welcome back to HealthOS Audio! Today we're diving deep into the knowledge base covering AI research trends.

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
  { id: "audio",      label: "Audio Overview",  labelKey: "audioOverview",     icon: "audio",   desc: "AI podcast from sources",   descKey: "audioOverviewDesc",     color: "#006C5B", ext: "mp3" },
  { id: "slides",     label: "Slide Deck",       labelKey: "slideDeck",        icon: "slides",  desc: "Auto-generate slides",      descKey: "slideDeckDesc",         color: "#0ea5e9", ext: "pptx" },
  { id: "video",      label: "Video Script",     labelKey: "videoScript",      icon: "video",   desc: "Explainer video script",    descKey: "videoScriptDesc",       color: "#C8A86B", ext: "txt" },
  { id: "mindmap",    label: "Mind Map",         labelKey: "mindMap",          icon: "mindmap", desc: "Visual knowledge graph",    descKey: "mindMapDesc",           color: "#22C55E", ext: "svg" },
  { id: "report",     label: "Research Report",  labelKey: "researchReport",   icon: "report",  desc: "Structured full report",    descKey: "researchReportDesc",    color: "#F59E0B", ext: "pdf" },
  { id: "flashcards", label: "Flashcards",       labelKey: "flashcards",       icon: "cards",   desc: "Study Q&A cards",           descKey: "flashcardsDesc",        color: "#EF4444", ext: "json" },
  { id: "quiz",       label: "Quiz",             labelKey: "quiz",             icon: "quiz",    desc: "MCQ, T/F, short answer",    descKey: "quizDesc",              color: "#0ea5e9", ext: "json" },
  { id: "infographic",label: "Infographic",      labelKey: "infographic",      icon: "chart",   desc: "Visual data summary",       descKey: "infographicDesc",       color: "#C026D3", ext: "svg" },
  { id: "datatable",  label: "Data Table",       labelKey: "dataTable",        icon: "table",   desc: "Structured extraction",     descKey: "dataTableDesc",         color: "#22C55E", ext: "csv" },
];
const ACTIVITY_LOG_INIT = [
  { id: 1, action: "Source indexed",    detail: "Transformer Deep Dive",          time: "2h ago",  color: "#22C55E" },
  { id: 2, action: "Report generated",  detail: "LLM Architecture Comparison",    time: "5h ago",  color: "#006C5B" },
  { id: 3, action: "Source added",      detail: "Stanford AI Index Report",       time: "1d ago",  color: "#0ea5e9" },
  { id: 4, action: "Note created",      detail: "Key Takeaways on Scaling",       time: "2d ago",  color: "#F59E0B" },
  { id: 5, action: "Mind map created",  detail: "Neural Architecture Map",        time: "3d ago",  color: "#C8A86B" },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────
export default function HealthOS() {
  const { t, toggleLang, isRTL, dir, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  // Core state
  const [view, setView] = useState("overview");
  const [notebookTitle, setNotebookTitle] = useState("Health Intelligence Workspace");
  const [editTitle, setEditTitle] = useState(false);
  const [sources, setSources] = useState([]); // Load from backend
  const [messages, setMessages] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [notes, setNotes] = useState(INIT_NOTES);
  const [activityLog, setActivityLog] = useState(ACTIVITY_LOG_INIT);
  const [sourcesLoading, setSourcesLoading] = useState(true);
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
  const [nbDescription, setNbDescription] = useState("Healthcare intelligence workspace for analyzing medical research, clinical data, and health policy documents.");
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

  // Load sources from backend on mount
  useEffect(() => {
    const loadSources = async () => {
      setSourcesLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/sources?notebook_id=default`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Transform backend data to frontend format
            const formattedSources = data.map(s => ({
              id: s.id,
              title: s.title,
              type: s.type,
              date: s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown",
              chunks: s.chunks || 0,
              size: s.size || "—",
              status: s.status || "indexed",
              url: s.url
            }));
            setSources(formattedSources);
          }
        }
      } catch (e) {
        console.error('Failed to load sources:', e);
      }
      setSourcesLoading(false);
    };
    loadSources();
  }, []);

  // Load outputs from backend on mount
  useEffect(() => {
    const loadOutputs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/outputs?notebook_id=default`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const formattedOutputs = data.map(o => ({
              id: o.id,
              type: o.type,
              title: o.title,
              content: o.content,
              slides_data: o.slides_data,
              created: o.created_at ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unknown",
              size: o.size || "—",
              notebookId: o.notebook_id
            }));
            setOutputs(formattedOutputs);
          }
        }
      } catch (e) {
        console.error('Failed to load outputs:', e);
      }
    };
    loadOutputs();
  }, []);

  // Toast helper
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  const dismissToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  // Log activity
  const logActivity = useCallback((action, detail, color = "#006C5B") => {
    setActivityLog(p => [{ id: Date.now(), action, detail, time: "just now", color }, ...p.slice(0, 14)]);
  }, []);

  // ── Source processing ───────────────────────────────────────────────────
  const processSource = useCallback((src) => {
    setSources(p => [...p, src]);
    logActivity("Source added", src.title, "#0ea5e9");
  }, [logActivity]);

  const handleFileUpload = useCallback(async (files) => {
    if (!files || !files.length) return;
    setModal(null);
    toast(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`, "warn");
    
    for (const file of Array.from(files)) {
      const isValid = /\.(pdf|txt|doc|docx|ppt|pptx|xls|xlsx|png|jpg|jpeg|gif|webp|bmp)$/i.test(file.name);
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
          type: (() => { const ext = file.name.split('.').pop().toLowerCase(); if (ext === 'pdf') return 'pdf'; if (['doc','docx'].includes(ext)) return 'doc'; if (['ppt','pptx'].includes(ext)) return 'ppt'; if (['xls','xlsx'].includes(ext)) return 'xlsx'; if (['png','jpg','jpeg','gif','webp','bmp'].includes(ext)) return 'image'; return 'txt'; })(),
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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setChatInput("");
    setGenerating(true);
    
    try {
      // Build history from previous messages (last 10)
      const history = updatedMessages.slice(-11, -1).map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content
      }));

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          notebook_id: 'default',
          history,
          depth: chatDepth
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
      logActivity("AI query answered", text.substring(0, 40), "#006C5B");
    } catch (e) {
      console.error('Chat error:', e);
      const aiMsg = { id: Date.now() + 1, role: "ai", content: "Something went wrong while processing your request. This could be a temporary issue — please try again. If it persists, your LLM key balance may need to be topped up (Profile > Universal Key > Add Balance).", citations: [], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), pinned: false };
      setMessages(p => [...p, aiMsg]);
    }
    
    setGenerating(false);
  }, [chatInput, messages, chatDepth, sources, logActivity, toast]);

  const clearChat = useCallback(() => {
    setConfirm({ msg: "Clear all chat history? This cannot be undone.", onYes: () => { setMessages([]); setConfirm(null); toast("Chat cleared", "warn"); }, onNo: () => setConfirm(null) });
  }, [toast]);

  const regenerateLast = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    // Remove last AI response
    const lastAiId = Math.max(...messages.filter(x => x.role === "ai").map(x => x.id));
    const filtered = messages.filter(m => !(m.role === "ai" && m.id === lastAiId));
    setMessages(filtered);
    setGenerating(true);
    
    try {
      const history = filtered.slice(-10).map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content
      }));
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUser.content,
          notebook_id: 'default',
          history: history.slice(0, -1),
          depth: chatDepth
        })
      });
      if (!response.ok) throw new Error('Regenerate failed');
      const data = await response.json();
      const aiMsg = { id: Date.now(), role: "ai", content: data.response, citations: data.citations || [], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), pinned: false };
      setMessages(p => [...p, aiMsg]);
    } catch (e) {
      console.error('Regenerate error:', e);
      const aiMsg = { id: Date.now(), role: "ai", content: "Sorry, regeneration failed. Please try again.", citations: [], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), pinned: false };
      setMessages(p => [...p, aiMsg]);
    }
    setGenerating(false);
    toast("Response regenerated");
  }, [messages, chatDepth, toast]);

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
        theme: data.theme,
        created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        size: `${(data.content?.length / 1024).toFixed(1)} KB`,
        notebookId: "default"
      };
      
      // Save to backend for persistence
      try {
        await fetch(`${API_URL}/api/outputs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newOut.id,
            type: newOut.type,
            title: newOut.title,
            content: newOut.content,
            slides_data: newOut.slides_data,
            notebook_id: 'default'
          })
        });
      } catch (saveErr) {
        console.error('Failed to save output:', saveErr);
      }
      
      setOutputs(p => [newOut, ...p]);
      setGenTool(null);
      logActivity(`${tool.label} generated`, notebookTitle, tool.color);
      toast(`${tool.label} generated! Generating images in background...`);
      setModalData(newOut);
      setModal("output");
      
      // Generate images asynchronously for key slides or infographic sections (runs in background)
      if ((tool.id === 'slides' || tool.id === 'infographic') && newOut.slides_data) {
        generateImagesAsync(newOut);
      }
    } catch (e) {
      console.error('Generation error:', e);
      toast(`Failed to generate ${tool.label}. Please try again.`, "error");
      setGenTool(null);
    }
  }, [sources, notebookTitle, logActivity, toast]);

  // Generate images asynchronously for slides or infographics
  const generateImagesAsync = useCallback(async (output) => {
    if (!output.slides_data) return;
    
    // For slides: process slides 2-5
    // For infographics: process sections that need images
    const isInfographic = output.type === 'infographic';
    
    const itemsToProcess = output.slides_data.filter((s, i) => 
      isInfographic 
        ? (i < 3 && !s.sectionImage) // First 3 infographic sections
        : (i >= 1 && i <= 4 && !s.imageBase64) // Slides 2-5
    );
    
    if (itemsToProcess.length === 0) return;
    
    toast(`Generating ${itemsToProcess.length} images in background...`, "warn");
    
    let imagesGenerated = 0;
    for (const item of itemsToProcess) {
      try {
        const response = await fetch(`${API_URL}/api/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide_title: item.title,
            slide_content: (item.bullets || []).join(' '),
            layout: item.layout || item.visualType || 'bullets',
            theme: output.theme || 'corporate',
            image_keyword: item.imageKeyword || ''
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.imageBase64) {
            // Update the item with the image
            item.imageBase64 = result.imageBase64;
            imagesGenerated++;
            
            // Update outputs state with new image
            setOutputs(prev => prev.map(o => 
              o.id === output.id 
                ? { ...o, slides_data: [...output.slides_data] }
                : o
            ));
          }
        }
      } catch (e) {
        console.error('Image generation failed for:', item.title, e);
      }
    }
    
    if (imagesGenerated > 0) {
      toast(`${imagesGenerated} images generated! Click Export to download.`);
    }
  }, [toast]);

  const deleteOutput = useCallback(async (id) => {
    setConfirm({ 
      msg: "Delete this output?", 
      onYes: async () => { 
        setOutputs(p => p.filter(o => o.id !== id)); 
        setConfirm(null); 
        toast("Output deleted", "warn");
        // Also delete from backend
        try {
          await fetch(`${API_URL}/api/outputs/${id}`, { method: 'DELETE' });
        } catch (e) {
          console.error('Failed to delete output:', e);
        }
      }, 
      onNo: () => setConfirm(null) 
    });
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

  // Theme configurations for professional presentations
  const THEMES = {
    tech: {
      primary: '2563EB',      // Blue
      secondary: '3B82F6',
      accent: '60A5FA',
      dark: '1E3A8A',
      light: 'DBEAFE',
      gradient: ['1E40AF', '3B82F6'],
      bgColor: 'F0F9FF'
    },
    smart_home: {
      primary: '059669',      // Emerald
      secondary: '10B981',
      accent: '34D399',
      dark: '065F46',
      light: 'D1FAE5',
      gradient: ['065F46', '10B981'],
      bgColor: 'ECFDF5'
    },
    corporate: {
      primary: '4F46E5',      // Indigo
      secondary: '6366F1',
      accent: '818CF8',
      dark: '312E81',
      light: 'E0E7FF',
      gradient: ['312E81', '6366F1'],
      bgColor: 'F5F3FF'
    },
    finance: {
      primary: '0D9488',      // Teal
      secondary: '14B8A6',
      accent: '2DD4BF',
      dark: '115E59',
      light: 'CCFBF1',
      gradient: ['115E59', '14B8A6'],
      bgColor: 'F0FDFA'
    },
    health: {
      primary: '004D40',      // Dark teal (Saudi Healthcare)
      secondary: '006C5B',
      accent: 'C8A86B',       // Gold accent
      dark: '00332B',
      light: 'E0F2F1',
      gradient: ['004D40', '006C5B'],
      bgColor: 'F5FAF9'
    },
    education: {
      primary: 'F59E0B',      // Amber
      secondary: 'FBBF24',
      accent: 'FCD34D',
      dark: 'B45309',
      light: 'FEF3C7',
      gradient: ['B45309', 'F59E0B'],
      bgColor: 'FFFBEB'
    }
  };

  // Icon SVG paths (simple geometric representations)
  const ICON_SHAPES = {
    home: { type: 'rect', w: 0.4, h: 0.35 },
    briefcase: { type: 'rect', w: 0.4, h: 0.3 },
    chart: { type: 'rect', w: 0.35, h: 0.35 },
    users: { type: 'ellipse', w: 0.35, h: 0.35 },
    cog: { type: 'ellipse', w: 0.35, h: 0.35 },
    shield: { type: 'rect', w: 0.3, h: 0.4 },
    cloud: { type: 'ellipse', w: 0.45, h: 0.3 },
    mobile: { type: 'rect', w: 0.25, h: 0.4 },
    check: { type: 'ellipse', w: 0.35, h: 0.35 },
    lightbulb: { type: 'ellipse', w: 0.3, h: 0.4 },
    rocket: { type: 'rect', w: 0.25, h: 0.45 },
    target: { type: 'ellipse', w: 0.4, h: 0.4 },
    clock: { type: 'ellipse', w: 0.35, h: 0.35 },
    globe: { type: 'ellipse', w: 0.4, h: 0.4 },
    lock: { type: 'rect', w: 0.3, h: 0.35 },
    server: { type: 'rect', w: 0.35, h: 0.4 },
    database: { type: 'ellipse', w: 0.35, h: 0.4 },
    code: { type: 'rect', w: 0.45, h: 0.3 },
    team: { type: 'ellipse', w: 0.4, h: 0.35 },
    growth: { type: 'rect', w: 0.4, h: 0.4 }
  };

  const downloadOutput = useCallback(async (out) => {
    // For slides, generate professional PPTX file
    if (out.type === "slides" && out.slides_data && out.slides_data.length > 0) {
      try {
        const PptxGenJS = await loadPptxGen();
        const pptx = new PptxGenJS();
        pptx.author = 'HealthOS';
        pptx.title = out.title;
        pptx.subject = 'AI-Generated Professional Presentation';
        pptx.layout = 'LAYOUT_16x9';
        
        const themeName = out.theme || 'corporate';
        const theme = THEMES[themeName] || THEMES.corporate;

        // ── Helper: add consistent title bar to content slides ──
        const addTitle = (slide, title) => {
          slide.addShape('rect', { x: 0, y: 0.22, w: 0.1, h: 0.6, fill: { color: theme.accent } });
          slide.addText(title, {
            x: 0.35, y: 0.22, w: 8.5, h: 0.6,
            fontSize: 24, bold: true, color: theme.dark,
            fontFace: 'Calibri', valign: 'middle'
          });
        };

        // ── Helper: nice image placeholder when no image available ──
        const addPlaceholder = (slide, x, y, w, h) => {
          slide.addShape('roundRect', {
            x, y, w, h,
            fill: { color: theme.light },
            line: { color: theme.secondary, width: 1, dashType: 'dash' },
            rectRadius: 0.1
          });
          slide.addShape('ellipse', {
            x: x + w / 2 - 0.35, y: y + h / 2 - 0.35, w: 0.7, h: 0.7,
            fill: { color: theme.primary, transparency: 75 }
          });
        };

        // ── Generate images for content slides (sequential, with progress) ──
        // Prioritize image-left/right slides, then bullets, limit to 6 max
        const allContentSlides = out.slides_data
          .map((s, i) => ({ s, i }))
          .filter(({ s, i }) => i > 0 && !s.imageBase64 && s.layout !== 'title');
        // Prioritize: image layouts first, then bullets, then others
        const priority = { 'image-left': 0, 'image-right': 0, 'bullets': 1, 'two-column': 2, 'comparison': 2, 'quote': 2, 'timeline': 3 };
        allContentSlides.sort((a, b) => (priority[a.s.layout] ?? 2) - (priority[b.s.layout] ?? 2));
        const slidesForImages = allContentSlides.slice(0, 6);

        if (slidesForImages.length > 0) {
          toast(`Generating ${slidesForImages.length} AI images — please wait...`, "warn");
          let generated = 0;
          for (const { s, i } of slidesForImages) {
            try {
              toast(`Image ${generated + 1}/${slidesForImages.length}: ${s.title}...`, "warn");
              const res = await fetch(`${API_URL}/api/generate-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slide_title: s.title,
                  slide_content: (s.bullets || []).join(', '),
                  layout: s.layout || 'bullets',
                  theme: themeName,
                  image_keyword: s.imageKeyword || s.title
                })
              });
              if (res.ok) {
                const result = await res.json();
                if (result.success && result.imageBase64) {
                  s.imageBase64 = result.imageBase64;
                  generated++;
                }
              }
            } catch (e) {
              console.error(`Image gen failed for slide ${i}:`, e);
            }
          }
          toast(`${generated} images ready! Building presentation...`);
        } else {
          toast("Building presentation...", "warn");
        }

        // ── Define Slide Masters ──
        pptx.defineSlideMaster({
          title: 'CONTENT',
          background: { color: theme.bgColor },
          objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: theme.primary } } },
            { rect: { x: 0, y: 5.25, w: '100%', h: 0.38, fill: { color: theme.primary } } },
            { text: { text: 'HealthOS', options: { x: 0.4, y: 5.28, w: 2, h: 0.3, fontSize: 8, color: theme.accent, fontFace: 'Calibri' } } },
          ]
        });

        pptx.defineSlideMaster({
          title: 'COVER',
          background: { color: theme.dark },
          objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.05, fill: { color: theme.accent } } },
            { ellipse: { x: 7.8, y: -1.2, w: 3.5, h: 3.5, fill: { color: theme.secondary, transparency: 88 } } },
            { ellipse: { x: -1.2, y: 3.8, w: 2.5, h: 2.5, fill: { color: theme.accent, transparency: 92 } } },
            { rect: { x: 0, y: 5.05, w: '100%', h: 0.58, fill: { color: theme.primary } } },
          ]
        });

        // ── Build each slide ──
        out.slides_data.forEach((sd, idx) => {
          const layout = sd.layout || 'bullets';
          const isTitle = idx === 0 || layout === 'title';
          const slide = pptx.addSlide({ masterName: isTitle ? 'COVER' : 'CONTENT' });

          if (isTitle) {
            // ═══ TITLE / COVER SLIDE ═══
            // Background image (subtle, behind text)
            if (sd.imageBase64) {
              try {
                slide.addImage({
                  data: `data:image/jpeg;base64,${sd.imageBase64}`,
                  x: 0, y: 0, w: 10, h: 5.63,
                  transparency: 75
                });
              } catch (e) { /* skip bg image */ }
            }
            slide.addText(sd.title || out.title, {
              x: 0.8, y: 1.3, w: 8.4, h: 1.0,
              fontSize: 36, bold: true, color: 'FFFFFF',
              fontFace: 'Calibri', align: 'center', valign: 'middle'
            });
            slide.addShape('rect', { x: 3.8, y: 2.5, w: 2.4, h: 0.04, fill: { color: theme.accent } });
            const sub = sd.subtitle || sd.bullets?.[0] || '';
            if (sub) {
              slide.addText(sub, {
                x: 1.2, y: 2.75, w: 7.6, h: 0.55,
                fontSize: 17, color: theme.light, fontFace: 'Calibri', align: 'center'
              });
            }
            slide.addText('AI-Generated Presentation  |  HealthOS', {
              x: 2.5, y: 4.6, w: 5, h: 0.3,
              fontSize: 9, color: theme.accent, fontFace: 'Calibri', align: 'center'
            });

          } else if (layout === 'two-column' || layout === 'comparison') {
            // ═══ TWO-COLUMN ═══
            addTitle(slide, sd.title || `Slide ${idx + 1}`);
            const bullets = sd.bullets || [];
            const mid = Math.ceil(bullets.length / 2);

            // Background accent image strip if available
            if (sd.imageBase64) {
              try {
                slide.addImage({
                  data: `data:image/jpeg;base64,${sd.imageBase64}`,
                  x: 0, y: 0.06, w: 10, h: 0.14,
                  transparency: 60
                });
              } catch (e) { /* skip */ }
            }

            // Left card
            slide.addShape('roundRect', {
              x: 0.35, y: 1.1, w: 4.4, h: 3.7,
              fill: { color: 'FFFFFF' },
              shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, opacity: 0.08 },
              rectRadius: 0.08
            });
            slide.addShape('rect', { x: 0.35, y: 1.1, w: 4.4, h: 0.04, fill: { color: theme.primary } });
            if (bullets.slice(0, mid).length > 0) {
              slide.addText(bullets.slice(0, mid).map(b => ({
                text: b, options: { bullet: { code: '25CF', color: theme.primary }, paraSpaceAfter: 12 }
              })), {
                x: 0.6, y: 1.35, w: 3.9, h: 3.2,
                fontSize: 13, color: '374151', fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.35
              });
            }

            // Right card
            slide.addShape('roundRect', {
              x: 5.15, y: 1.1, w: 4.4, h: 3.7,
              fill: { color: 'FFFFFF' },
              shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, opacity: 0.08 },
              rectRadius: 0.08
            });
            slide.addShape('rect', { x: 5.15, y: 1.1, w: 4.4, h: 0.04, fill: { color: theme.secondary } });
            if (bullets.slice(mid).length > 0) {
              slide.addText(bullets.slice(mid).map(b => ({
                text: b, options: { bullet: { code: '25CF', color: theme.secondary }, paraSpaceAfter: 12 }
              })), {
                x: 5.4, y: 1.35, w: 3.9, h: 3.2,
                fontSize: 13, color: '374151', fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.35
              });
            }

          } else if (layout === 'timeline') {
            // ═══ TIMELINE ═══
            addTitle(slide, sd.title || `Slide ${idx + 1}`);
            const items = sd.bullets || [];
            const count = Math.min(items.length, 5);
            const totalW = 8.8;
            const startX = 0.6;
            const itemW = totalW / count;
            const lineY = 2.15;

            slide.addShape('rect', { x: startX, y: lineY, w: totalW, h: 0.03, fill: { color: theme.secondary } });

            items.slice(0, count).forEach((item, i) => {
              const cx = startX + i * itemW + itemW / 2;
              const cardW = Math.min(itemW - 0.15, 1.7);
              // Circle
              slide.addShape('ellipse', {
                x: cx - 0.14, y: lineY - 0.12, w: 0.28, h: 0.28,
                fill: { color: theme.primary }
              });
              slide.addText(`${i + 1}`, {
                x: cx - 0.14, y: lineY - 0.12, w: 0.28, h: 0.28,
                fontSize: 10, bold: true, color: 'FFFFFF',
                fontFace: 'Calibri', align: 'center', valign: 'middle'
              });
              // Card
              slide.addShape('roundRect', {
                x: cx - cardW / 2, y: lineY + 0.3, w: cardW, h: 2.5,
                fill: { color: 'FFFFFF' },
                shadow: { type: 'outer', blur: 3, offset: 1, angle: 45, opacity: 0.06 },
                rectRadius: 0.06
              });
              slide.addShape('rect', {
                x: cx - cardW / 2, y: lineY + 0.3, w: cardW, h: 0.03,
                fill: { color: theme.primary }
              });
              slide.addText(item, {
                x: cx - cardW / 2 + 0.08, y: lineY + 0.45, w: cardW - 0.16, h: 2.2,
                fontSize: 10, color: '4B5563', fontFace: 'Calibri',
                align: 'center', valign: 'top', lineSpacingMultiple: 1.25
              });
            });

          } else if (layout === 'image-left' || layout === 'image-right') {
            // ═══ IMAGE + CONTENT SPLIT ═══
            const isLeft = layout === 'image-left';
            addTitle(slide, sd.title || `Slide ${idx + 1}`);

            const imgX = isLeft ? 0.35 : 5.15;
            const cntX = isLeft ? 5.15 : 0.35;

            // Image area
            if (sd.imageBase64) {
              try {
                slide.addImage({
                  data: `data:image/jpeg;base64,${sd.imageBase64}`,
                  x: imgX, y: 1.1, w: 4.4, h: 3.7,
                  rounding: false
                });
              } catch (e) {
                addPlaceholder(slide, imgX, 1.1, 4.4, 3.7);
              }
            } else {
              addPlaceholder(slide, imgX, 1.1, 4.4, 3.7);
            }

            // Content card
            slide.addShape('roundRect', {
              x: cntX, y: 1.1, w: 4.4, h: 3.7,
              fill: { color: 'FFFFFF' },
              shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, opacity: 0.08 },
              rectRadius: 0.08
            });
            if (sd.bullets?.length > 0) {
              slide.addText(sd.bullets.map(b => ({
                text: b, options: { bullet: { code: '25CF', color: theme.primary }, paraSpaceAfter: 14 }
              })), {
                x: cntX + 0.25, y: 1.3, w: 3.9, h: 3.3,
                fontSize: 13, color: '374151', fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.35
              });
            }

          } else if (layout === 'quote') {
            // ═══ QUOTE ═══
            addTitle(slide, sd.title || `Slide ${idx + 1}`);
            slide.addText('\u201C', {
              x: 0.8, y: 1.1, w: 0.7, h: 0.7,
              fontSize: 64, color: theme.light, fontFace: 'Georgia'
            });
            const quote = sd.highlight || sd.bullets?.[0] || '';
            slide.addText(quote, {
              x: 1.4, y: 1.5, w: 7.2, h: 1.1,
              fontSize: 20, italic: true, color: theme.dark,
              fontFace: 'Georgia', align: 'center', valign: 'middle'
            });
            if (sd.bullets?.length > 1) {
              slide.addShape('roundRect', {
                x: 0.6, y: 2.9, w: 8.8, h: 2.0,
                fill: { color: 'FFFFFF' },
                shadow: { type: 'outer', blur: 4, offset: 1, angle: 45, opacity: 0.06 },
                rectRadius: 0.08
              });
              slide.addText(sd.bullets.slice(1).map(b => ({
                text: b, options: { bullet: { code: '25CF', color: theme.secondary }, paraSpaceAfter: 10 }
              })), {
                x: 0.9, y: 3.1, w: 8.2, h: 1.6,
                fontSize: 12, color: '6B7280', fontFace: 'Calibri', valign: 'top'
              });
            }

          } else {
            // ═══ DEFAULT BULLETS (with optional image on right) ═══
            addTitle(slide, sd.title || `Slide ${idx + 1}`);

            if (sd.imageBase64) {
              // Split: bullets left, image right
              try {
                slide.addImage({
                  data: `data:image/jpeg;base64,${sd.imageBase64}`,
                  x: 5.15, y: 1.1, w: 4.4, h: 3.7,
                  rounding: false
                });
              } catch (e) { /* skip */ }

              slide.addShape('roundRect', {
                x: 0.35, y: 1.1, w: 4.5, h: 3.7,
                fill: { color: 'FFFFFF' },
                shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, opacity: 0.08 },
                rectRadius: 0.08
              });
              if (sd.bullets?.length > 0) {
                slide.addText(sd.bullets.map(b => ({
                  text: b, options: { bullet: { code: '25CF', color: theme.primary }, paraSpaceAfter: 14 }
                })), {
                  x: 0.6, y: 1.3, w: 4.0, h: 3.3,
                  fontSize: 13, color: '374151', fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.35
                });
              }
            } else {
              // Full-width bullets
              slide.addShape('roundRect', {
                x: 0.35, y: 1.1, w: 9.3, h: 3.7,
                fill: { color: 'FFFFFF' },
                shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, opacity: 0.08 },
                rectRadius: 0.08
              });
              if (sd.bullets?.length > 0) {
                slide.addText(sd.bullets.map(b => ({
                  text: b, options: { bullet: { code: '25CF', color: theme.primary }, paraSpaceAfter: 16 }
                })), {
                  x: 0.65, y: 1.3, w: 8.7, h: 3.3,
                  fontSize: 15, color: '374151', fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.35
                });
              }
            }

            // Highlight box
            if (sd.highlight) {
              slide.addShape('roundRect', {
                x: 0.4, y: 4.65, w: 9.2, h: 0.38,
                fill: { color: theme.light }, rectRadius: 0.04
              });
              slide.addText(sd.highlight, {
                x: 0.6, y: 4.68, w: 8.8, h: 0.32,
                fontSize: 11, color: theme.dark, bold: true,
                fontFace: 'Calibri', valign: 'middle'
              });
            }
          }

          // Speaker notes
          if (sd.notes) slide.addNotes(sd.notes);

          // Slide number (skip title slide)
          if (idx > 0) {
            slide.addText(`${idx}`, {
              x: 9.15, y: 5.28, w: 0.4, h: 0.25,
              fontSize: 8, color: theme.accent, fontFace: 'Calibri', align: 'center'
            });
          }
        });

        await pptx.writeFile({ fileName: `${out.title.replace(/[<>:"/\\|?*]/g, "_")}.pptx` });
        toast("Presentation downloaded successfully!");
        return;
      } catch (e) {
        console.error('PPTX generation error:', e);
        toast(`PPTX export failed: ${e.message || 'Unknown error'}. Try again.`, "error");
      }
    }
    
    // For infographic, generate a visual PNG using Canvas
    if (out.type === "infographic" && out.slides_data && out.slides_data.length > 0) {
      try {
        toast("Creating infographic image...", "warn");
        const sections = out.slides_data;
        const W = 1400;
        const PAD = 48;
        const GAP = 24;
        const COL_W = (W - PAD * 2 - GAP) / 2;
        const HEADER_H = 320;
        const FOOTER_H = 70;
        const CARD_PAD = 28;
        const BORDER_W = 6;
        const palette = ['#006C5B','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B','#EC4899','#10B981','#3B82F6','#D946EF'];

        // ── Helpers ──────────────────────
        const parseStatNum = (stat) => {
          if (!stat) return null;
          const m = stat.match(/([\d.]+)/);
          return m ? parseFloat(m[1]) : null;
        };
        const isPercent = (stat) => stat && stat.includes('%');

        const wrapText = (ctx, text, maxW) => {
          const words = text.split(' ');
          const lines = [];
          let line = '';
          for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
            else line = test;
          }
          if (line) lines.push(line);
          return lines;
        };

        // ── Draw a filled icon with background circle ──
        const drawFilledIcon = (ctx, name, cx, cy, radius, color) => {
          // Outer glow
          ctx.fillStyle = color + '15';
          ctx.beginPath(); ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2); ctx.fill();
          // Background circle
          ctx.fillStyle = color + '25';
          ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
          // Icon stroke
          ctx.save();
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const s = (radius * 0.9) / 12;
          ctx.translate(cx - 12 * s, cy - 12 * s);
          ctx.scale(s, s);
          const ic = {
            chart: () => { ctx.fillRect(4, 14, 4, 6); ctx.fillRect(10, 8, 4, 12); ctx.fillRect(16, 4, 4, 16); ctx.strokeRect(2, 2, 20, 20); },
            users: () => { ctx.beginPath(); ctx.arc(9, 8, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(17, 10, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, 22); ctx.quadraticCurveTo(9, 14, 16, 22); ctx.fill(); },
            clock: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(12, 12); ctx.lineTo(17, 15); ctx.stroke(); },
            target: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 12, 6, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 12, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(12, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12, 20); ctx.lineTo(12, 24); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(4, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20, 12); ctx.lineTo(24, 12); ctx.stroke(); },
            shield: () => { ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(21, 5); ctx.lineTo(21, 12); ctx.quadraticCurveTo(21, 21, 12, 23); ctx.quadraticCurveTo(3, 21, 3, 12); ctx.lineTo(3, 5); ctx.closePath(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(11, 15); ctx.lineTo(16, 9); ctx.stroke(); },
            globe: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(12, 12, 4, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, 9); ctx.quadraticCurveTo(12, 6, 22, 9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, 15); ctx.quadraticCurveTo(12, 18, 22, 15); ctx.stroke(); },
            lightbulb: () => { ctx.beginPath(); ctx.arc(12, 10, 7, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(9, 17, 6, 2); ctx.fillRect(10, 20, 4, 2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 3); ctx.lineTo(12, 1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(3, 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(19, 5); ctx.lineTo(21, 3); ctx.stroke(); },
            rocket: () => { ctx.beginPath(); ctx.moveTo(12, 1); ctx.quadraticCurveTo(20, 8, 17, 17); ctx.lineTo(7, 17); ctx.quadraticCurveTo(4, 8, 12, 1); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 10, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, 17); ctx.lineTo(5, 22); ctx.lineTo(9, 19); ctx.fill(); ctx.beginPath(); ctx.moveTo(17, 17); ctx.lineTo(19, 22); ctx.lineTo(15, 19); ctx.fill(); },
            cog: () => { ctx.beginPath(); ctx.arc(12, 12, 4, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(12 + Math.cos(a) * 7 - 2, 12 + Math.sin(a) * 7 - 2, 4, 4); } },
            check: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(7, 12); ctx.lineTo(10, 16); ctx.lineTo(17, 7); ctx.stroke(); },
            growth: () => { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3, 20); ctx.lineTo(9, 12); ctx.lineTo(14, 16); ctx.lineTo(21, 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(17, 5); ctx.lineTo(21, 5); ctx.lineTo(21, 9); ctx.stroke(); ctx.strokeStyle = color + '40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, 5); ctx.lineTo(3, 22); ctx.lineTo(21, 22); ctx.stroke(); },
            home: () => { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, 13); ctx.lineTo(12, 3); ctx.lineTo(22, 13); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5, 11); ctx.lineTo(5, 22); ctx.lineTo(19, 22); ctx.lineTo(19, 11); ctx.stroke(); ctx.fillRect(10, 15, 4, 7); },
            briefcase: () => { ctx.strokeRect(2, 8, 20, 14); ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(8, 4); ctx.lineTo(16, 4); ctx.lineTo(16, 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, 14); ctx.lineTo(22, 14); ctx.stroke(); },
          };
          (ic[name] || ic.briefcase)();
          ctx.restore();
        };

        // ── Draw progress bar ──
        const drawProgressBar = (ctx, x, y, w, h, pct, color, showLabel = true) => {
          // Track
          ctx.fillStyle = '#E8ECF0';
          ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
          // Fill gradient
          const grad = ctx.createLinearGradient(x, y, x + w * Math.min(pct / 100, 1), y);
          grad.addColorStop(0, color);
          grad.addColorStop(1, color + 'BB');
          ctx.fillStyle = grad;
          const fillW = Math.max(w * Math.min(pct / 100, 1), h);
          ctx.beginPath(); ctx.roundRect(x, y, fillW, h, h / 2); ctx.fill();
          // Shine effect
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath(); ctx.roundRect(x, y, fillW, h / 2, [h / 2, h / 2, 0, 0]); ctx.fill();
          if (showLabel) {
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 12px Inter, Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(pct)}%`, x + w + 38, y + h / 2 + 4);
            ctx.textAlign = 'left';
          }
        };

        // ── Draw donut chart (LARGE) ──
        const drawDonut = (ctx, cx, cy, r, pct, color) => {
          const lineW = r * 0.28;
          // Shadow ring
          ctx.strokeStyle = '#E8ECF020';
          ctx.lineWidth = lineW + 6;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          // Background ring
          ctx.strokeStyle = '#E8ECF0';
          ctx.lineWidth = lineW;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          // Value arc with gradient
          const arcGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
          arcGrad.addColorStop(0, color);
          arcGrad.addColorStop(0.5, color + 'DD');
          arcGrad.addColorStop(1, color);
          ctx.strokeStyle = arcGrad;
          ctx.lineWidth = lineW;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(pct / 100, 1)));
          ctx.stroke();
          ctx.lineCap = 'butt';
          // Center percentage
          ctx.fillStyle = color;
          ctx.font = `bold ${r * 0.55}px Inter, Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(pct)}%`, cx, cy - 4);
          // Small label
          ctx.fillStyle = '#9CA3AF';
          ctx.font = `${Math.max(r * 0.2, 9)}px Inter, Arial`;
          ctx.fillText('complete', cx, cy + r * 0.3);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        };

        // ── Draw horizontal bar chart (LARGE) ──
        const drawHorizBars = (ctx, x, y, w, h, count, color, labels) => {
          const bars = Math.min(Math.max(count, 3), 6);
          const barH = Math.min((h - (bars - 1) * 6) / bars, 20);
          const gap = 6;
          const barLabels = labels || ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Phase 6'];
          for (let i = 0; i < bars; i++) {
            const by = y + i * (barH + gap);
            const pct = 30 + Math.random() * 70;
            // Label
            ctx.fillStyle = '#6B7285';
            ctx.font = '10px Inter, Arial';
            ctx.textAlign = 'left';
            ctx.fillText(barLabels[i % barLabels.length], x, by + barH / 2 + 3);
            // Track
            const barX = x + 60;
            const barW = w - 60;
            ctx.fillStyle = '#E8ECF0';
            ctx.beginPath(); ctx.roundRect(barX, by, barW, barH, barH / 2); ctx.fill();
            // Fill
            const g = ctx.createLinearGradient(barX, by, barX + barW * (pct / 100), by);
            g.addColorStop(0, color); g.addColorStop(1, color + 'AA');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.roundRect(barX, by, barW * (pct / 100), barH, barH / 2); ctx.fill();
            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.roundRect(barX, by, barW * (pct / 100), barH / 2, [barH / 2, barH / 2, 0, 0]); ctx.fill();
          }
        };

        // ── Draw mini bar chart ──
        const drawMiniBarChart = (ctx, x, y, w, h, count, color) => {
          const bars = Math.min(Math.max(count || 5, 3), 10);
          const barW = Math.min((w - (bars - 1) * 3) / bars, 14);
          for (let i = 0; i < bars; i++) {
            const bh = (0.25 + Math.random() * 0.75) * h;
            const bx = x + i * (barW + 3);
            const g = ctx.createLinearGradient(bx, y + h - bh, bx, y + h);
            g.addColorStop(0, color); g.addColorStop(1, color + '70');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.roundRect(bx, y + h - bh, barW, bh, 2); ctx.fill();
          }
          ctx.strokeStyle = '#D1D5DB';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y + h + 2); ctx.lineTo(x + w, y + h + 2); ctx.stroke();
        };

        // ── Draw workflow steps ──
        const drawWorkflow = (ctx, x, y, w, steps, color) => {
          const stepCount = Math.min(steps, 5);
          const stepW = 36;
          const totalW = stepCount * stepW + (stepCount - 1) * ((w - stepCount * stepW) / (stepCount - 1 || 1));
          const gap = (w - stepCount * stepW) / Math.max(stepCount - 1, 1);
          for (let i = 0; i < stepCount; i++) {
            const sx = x + i * (stepW + gap);
            // Circle
            const cAlpha = i === 0 ? '' : (i === stepCount - 1 ? '90' : 'CC');
            ctx.fillStyle = color + cAlpha;
            ctx.beginPath(); ctx.arc(sx + stepW / 2, y + stepW / 2, stepW / 2, 0, Math.PI * 2); ctx.fill();
            // Number
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Inter, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), sx + stepW / 2, y + stepW / 2);
            // Arrow to next
            if (i < stepCount - 1) {
              const ax = sx + stepW + 4;
              const aw = gap - 8;
              ctx.strokeStyle = color + '50';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(ax, y + stepW / 2); ctx.lineTo(ax + aw, y + stepW / 2); ctx.stroke();
              // Arrowhead
              ctx.fillStyle = color + '50';
              ctx.beginPath();
              ctx.moveTo(ax + aw, y + stepW / 2);
              ctx.lineTo(ax + aw - 6, y + stepW / 2 - 4);
              ctx.lineTo(ax + aw - 6, y + stepW / 2 + 4);
              ctx.closePath(); ctx.fill();
            }
          }
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          return stepW + 8;
        };

        // ── Calculate card heights ──
        const measureCtx = document.createElement('canvas').getContext('2d');
        const cardHeights = sections.map((sec) => {
          let h = CARD_PAD + 32; // top pad + title row
          const hasPercent = isPercent(sec.stat);
          const statNum = parseStatNum(sec.stat);
          const vType = sec.visualType || 'none';
          if (vType === 'none' || (!sec.stat && vType !== 'process')) h += 10; // text-only card
          else if (vType === 'process') h += 68; // workflow
          else if (hasPercent) h += 110; // LARGE donut
          else if (vType === 'comparison') h += 110; // horizontal bars
          else if (sec.stat) h += 90; // stat + mini chart
          else h += 10;
          h += 16; // divider
          measureCtx.font = '13px Inter, Arial';
          const textW = COL_W - CARD_PAD * 2 - BORDER_W - 12;
          (sec.bullets || []).slice(0, 4).forEach(b => {
            h += wrapText(measureCtx, b, textW).length * 20 + 2;
          });
          h += CARD_PAD;
          return Math.max(h, 220);
        });

        const rows = [];
        for (let i = 0; i < sections.length; i += 2) {
          rows.push(Math.max(cardHeights[i], i + 1 < sections.length ? cardHeights[i + 1] : 0));
        }
        const totalH = HEADER_H + rows.reduce((a, h) => a + h + GAP, GAP) + FOOTER_H;

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = totalH;
        const ctx = canvas.getContext('2d');

        // ─── Background ─────────────
        // Subtle pattern background
        ctx.fillStyle = '#EFF3F8';
        ctx.fillRect(0, 0, W, totalH);
        // Subtle grid dots
        ctx.fillStyle = '#D8DFE8';
        for (let gx = 0; gx < W; gx += 30) {
          for (let gy = HEADER_H; gy < totalH - FOOTER_H; gy += 30) {
            ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI * 2); ctx.fill();
          }
        }

        // ─── Header ─────────────────
        const hGrad = ctx.createLinearGradient(0, 0, W, 0);
        hGrad.addColorStop(0, '#004D40');
        hGrad.addColorStop(0.5, '#006C5B');
        hGrad.addColorStop(1, '#004D40');
        ctx.fillStyle = hGrad;
        ctx.beginPath(); ctx.roundRect(0, 0, W, HEADER_H, [0, 0, 20, 20]); ctx.fill();

        // Decorative circles
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = '#FFFFFF';
        [[120, 60, 80], [350, 200, 60], [900, 80, 100], [1100, 220, 50], [W - 100, 120, 70]].forEach(([x, y, r]) => {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Gold accent line at top
        const goldGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
        goldGrad.addColorStop(0, '#C8A86B00');
        goldGrad.addColorStop(0.3, '#C8A86B');
        goldGrad.addColorStop(0.7, '#C8A86B');
        goldGrad.addColorStop(1, '#C8A86B00');
        ctx.fillStyle = goldGrad;
        ctx.fillRect(0, 0, W, 5);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 44px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const titleText = out.title.length > 55 ? out.title.substring(0, 52) + '...' : out.title;
        ctx.fillText(titleText, W / 2, 90);

        // Subtitle
        ctx.font = '20px Inter, Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillText(`Based on ${sections.length} key insights from your sources`, W / 2, 140);

        // Gold divider
        ctx.strokeStyle = '#C8A86B';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(W / 2 - 50, 172); ctx.lineTo(W / 2 + 50, 172); ctx.stroke();
        // Diamond decoration
        ctx.fillStyle = '#C8A86B';
        ctx.save(); ctx.translate(W / 2, 172); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-5, -5, 10, 10); ctx.restore();

        // Section count badges
        const badgeY = 220;
        const badges = [
          { label: `${sections.length} Sections`, icon: '▦' },
          { label: 'AI-Generated', icon: '✦' },
          { label: 'HealthOS', icon: '♦' }
        ];
        badges.forEach((badge, i) => {
          const bx = W / 2 + (i - 1) * 180;
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.font = '13px Inter, Arial';
          const tw = ctx.measureText(badge.label).width + 40;
          ctx.beginPath(); ctx.roundRect(bx - tw / 2, badgeY - 15, tw, 30, 15); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(bx - tw / 2, badgeY - 15, tw, 30, 15); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.textAlign = 'center';
          ctx.fillText(`${badge.icon}  ${badge.label}`, bx, badgeY + 1);
        });

        // Section mini-indicators
        const indY = 270;
        sections.forEach((_, si) => {
          const ix = W / 2 + (si - (sections.length - 1) / 2) * 22;
          ctx.fillStyle = palette[si % palette.length];
          ctx.beginPath(); ctx.roundRect(ix - 6, indY, 12, 5, 3); ctx.fill();
        });

        // ─── Section Cards ──────────
        let yOff = HEADER_H + GAP;
        sections.forEach((section, idx) => {
          const col = idx % 2;
          const rowIdx = Math.floor(idx / 2);
          const cardX = PAD + col * (COL_W + GAP);
          const cardY = yOff;
          const rowH = rows[rowIdx];
          const color = palette[idx % palette.length];
          const iconName = section.icon || 'briefcase';
          const statNum = parseStatNum(section.stat);
          const hasPct = isPercent(section.stat);
          const vType = section.visualType || 'none';

          // Card shadow
          ctx.shadowColor = 'rgba(0,0,0,0.06)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 6;

          // Card background
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.roundRect(cardX, cardY, COL_W, rowH, 16); ctx.fill();
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

          // Card border
          ctx.strokeStyle = '#E8ECF0';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(cardX, cardY, COL_W, rowH, 16); ctx.stroke();

          // Left color accent
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.roundRect(cardX, cardY, BORDER_W, rowH, [16, 0, 0, 16]); ctx.fill();

          // ─── Card Content ───────
          let cx = cardX + BORDER_W + CARD_PAD;
          let cy = cardY + CARD_PAD;
          const contentW = COL_W - BORDER_W - CARD_PAD * 2;

          // ── Title Row ──
          // Number badge
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(cx + 16, cy + 12, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Inter, Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(idx + 1), cx + 16, cy + 12);

          // Title text
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#1A1F36';
          ctx.font = 'bold 17px Inter, Arial';
          const titleMaxW = contentW - 44;
          const tLines = wrapText(ctx, section.title || 'Section', titleMaxW);
          tLines.slice(0, 2).forEach((tl, ti) => {
            ctx.fillText(tl, cx + 42, cy + 17 + ti * 20);
          });
          cy += 12 + tLines.length * 20 + 8;

          // ── Visualization Area ──
          // Only render visuals when the type is explicitly data-driven
          if (vType === 'none' || (!section.stat && vType !== 'process')) {
            // Text-only card - no visual, just a subtle accent
            cy += 4;
          } else if (vType === 'process') {
            // Workflow steps diagram - use statNum or bullet count as step count
            const steps = statNum || Math.min((section.bullets || []).length, 5) || 3;
            const wfH = drawWorkflow(ctx, cx, cy, contentW, steps, color);
            cy += wfH;
            if (section.stat) {
              ctx.fillStyle = color;
              ctx.font = 'bold 22px Inter, Arial';
              ctx.fillText(section.stat, cx, cy + 4);
              if (section.statLabel) {
                const sw = ctx.measureText(section.stat + '  ').width;
                ctx.fillStyle = '#6B7285';
                ctx.font = '13px Inter, Arial';
                ctx.fillText(section.statLabel, cx + sw + 4, cy + 3);
              }
              cy += 26;
            }
          } else if (hasPct && statNum) {
            // LARGE donut chart centered + stat info
            const donutR = 38;
            drawDonut(ctx, cx + donutR + 8, cy + donutR + 6, donutR, statNum, color);
            // Progress bar below donut
            drawProgressBar(ctx, cx + donutR * 2 + 32, cy + donutR - 4, contentW - donutR * 2 - 50, 14, statNum, color, false);
            // Stat info to the right of donut
            const infoX = cx + donutR * 2 + 32;
            ctx.fillStyle = color;
            ctx.font = 'bold 26px Inter, Arial';
            ctx.fillText(section.stat, infoX, cy + 34);
            if (section.statLabel) {
              ctx.fillStyle = '#6B7285';
              ctx.font = '14px Inter, Arial';
              ctx.fillText(section.statLabel, infoX, cy + 54);
            }
            cy += donutR * 2 + 22;
          } else if (vType === 'comparison' && section.stat) {
            // Horizontal bar chart
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Inter, Arial';
            ctx.fillText(section.stat, cx, cy + 6);
            if (section.statLabel) {
              const sw = ctx.measureText(section.stat + '  ').width;
              ctx.fillStyle = '#6B7285';
              ctx.font = '13px Inter, Arial';
              ctx.fillText(section.statLabel, cx + sw + 4, cy + 5);
            }
            cy += 28;
            drawHorizBars(ctx, cx, cy, contentW, 70, parseStatNum(section.stat) || 4, color);
            cy += 80;
          } else if (section.stat) {
            // Large stat number + mini bar chart side by side
            // Stat text (left side, large and bold)
            ctx.fillStyle = color;
            ctx.font = 'bold 36px Inter, Arial';
            ctx.fillText(section.stat, cx, cy + 32);
            if (section.statLabel) {
              ctx.fillStyle = '#6B7285';
              ctx.font = '14px Inter, Arial';
              ctx.fillText(section.statLabel, cx, cy + 54);
            }
            // Mini bar chart (right side, larger)
            const chartW = Math.min(contentW * 0.4, 180);
            const chartH = 60;
            drawMiniBarChart(ctx, cx + contentW - chartW, cy, chartW, chartH, statNum || 6, color);
            cy += 68;
          }

          // ── Divider ──
          const divGrad = ctx.createLinearGradient(cx, cy, cx + contentW, cy);
          divGrad.addColorStop(0, color + '40');
          divGrad.addColorStop(0.5, '#E8ECF0');
          divGrad.addColorStop(1, color + '10');
          ctx.strokeStyle = divGrad;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + contentW, cy + 4); ctx.stroke();
          cy += 16;

          // ── Bullets ──
          ctx.font = '13px Inter, Arial';
          const maxTextW = contentW - 18;
          (section.bullets || []).slice(0, 4).forEach((bullet, bi) => {
            // Bullet marker (colored dot)
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(cx + 5, cy + 1, 3, 0, Math.PI * 2); ctx.fill();
            // Text
            ctx.fillStyle = '#475569';
            const lines = wrapText(ctx, bullet, maxTextW);
            lines.forEach((line, li) => {
              ctx.fillText(line, cx + 16, cy + 5 + li * 19);
            });
            cy += lines.length * 19 + 4;
          });

          // ── Floating Icon (bottom-right) ──
          const iconR = 24;
          const iconCX = cardX + COL_W - CARD_PAD - iconR;
          const iconCY = cardY + rowH - CARD_PAD - iconR;
          drawFilledIcon(ctx, iconName, iconCX, iconCY, iconR, color);

          // Move to next row
          if (col === 1 || idx === sections.length - 1) {
            yOff += rowH + GAP;
          }
        });

        // ─── Connecting timeline (left side) ─────
        const tlX = PAD / 2 + 2;
        ctx.strokeStyle = '#006C5B30';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tlX, HEADER_H + GAP + 30);
        ctx.lineTo(tlX, totalH - FOOTER_H - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        // Timeline dots
        let tlY = HEADER_H + GAP;
        rows.forEach((rh, ri) => {
          ctx.fillStyle = palette[ri * 2 % palette.length];
          ctx.beginPath(); ctx.arc(tlX, tlY + rh / 2, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(tlX, tlY + rh / 2, 2, 0, Math.PI * 2); ctx.fill();
          tlY += rh + GAP;
        });

        // ─── Footer ─────────────────
        const fGrad = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
        fGrad.addColorStop(0, '#004D40');
        fGrad.addColorStop(0.5, '#006C5B');
        fGrad.addColorStop(1, '#004D40');
        ctx.fillStyle = fGrad;
        ctx.beginPath(); ctx.roundRect(0, totalH - FOOTER_H, W, FOOTER_H, [20, 20, 0, 0]); ctx.fill();
        // Gold line
        ctx.fillStyle = goldGrad;
        ctx.fillRect(0, totalH - FOOTER_H, W, 3);
        // Footer text
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '15px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Generated by HealthOS  |  AI-Powered Research Assistant', W / 2, totalH - FOOTER_H / 2 + 3);

        // ─── Export ─────────────────
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_infographic.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast("Infographic downloaded!");
        }, 'image/png');
        return;
      } catch (e) {
        console.error('Infographic generation error:', e);
        toast("Failed to generate infographic, downloading as text", "warn");
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
  const typeColor = t => ({ pdf: "var(--danger)", url: "var(--info)", doc: "var(--success)", txt: "var(--warning)", ppt: "var(--purple)", xlsx: "var(--success)", image: "var(--accent)", audio: "var(--accent)", video: "var(--primary)" }[t] || "var(--text-secondary)");
  const typeIcon  = t => ({ pdf: "pdf", url: "link", doc: "file", txt: "text", ppt: "slides", xlsx: "activity", image: "image", audio: "audio", video: "video" }[t] || "file");
  const toolFor   = id => STUDIO_TOOLS.find(t => t.id === id) || STUDIO_TOOLS[0];

  // ─── RENDER ───────────────────────────────────────────────────────────
  const BTN = ({ onClick, children, variant = "ghost", style = {}, disabled = false }) => {
    const base = { display: "flex", alignItems: "center", gap: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, borderRadius: 8, padding: "6px 12px", transition: "all 0.15s", opacity: disabled ? 0.5 : 1, ...style };
    const vars = { ghost: { background: "var(--bg-input)", color: "var(--text-secondary)" }, primary: { background: "var(--primary)", color: "white" }, danger: { background: "var(--danger-bg-light)", color: "var(--danger-dark)" }, outline: { background: "var(--bg-tint)", color: "var(--text-secondary)", border: "1px solid var(--border)" }, subtle: { background: "var(--bg-tint)", color: "var(--text-secondary)", border: "1px solid var(--border)" } };
    return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...vars[variant] }}>{children}</button>;
  };

  return (
    <div dir={dir} data-theme={isDark ? "dark" : "light"} style={{ fontFamily: "'Cairo','Inter',sans-serif", background: "var(--bg-main)", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {isDark && <>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "url('https://images.unsplash.com/photo-1663900108404-a05e8bf82cda?q=80&w=2574&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "rgba(2,6,23,0.88)" }} />
        <div style={{ position: "fixed", inset: 0, zIndex: 1, opacity: 0.03, mixBlendMode: "overlay", backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')", pointerEvents: "none" }} />
      </>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        [data-theme="light"]{
          --bg-main:#F5F7FA;--bg-card:white;--bg-tint:#F8F9FF;--bg-light:#F4F6FB;--bg-input:#F0F2F7;
          --bg-nav:white;--bg-sidebar:white;--bg-rail:white;--bg-modal:white;
          --bg-chat-ai:#F4F6FB;--bg-hover:rgba(0,108,91,.04);--bg-active:rgba(0,108,91,.08);
          --text-primary:#1A1F36;--text-secondary:#6B7285;--text-tertiary:#9CA3AF;--text-muted:#B0B7C3;--text-strong:#4B5563;
          --border:#E7EAF3;--shadow:0 2px 8px rgba(0,0,0,.04);--nav-shadow:0 1px 3px rgba(0,0,0,.04);
          --scrollbar:rgba(0,108,91,.2);--tab-active-bg:rgba(0,108,91,.08);--tab-active-color:#006C5B;--tab-active-border:rgba(0,108,91,.2);
          --toast-success-bg:#ECFDF5;--toast-success-border:#A7F3D0;--toast-success-color:#059669;
          --toast-warn-bg:#FFFBEB;--toast-warn-border:#FDE68A;--toast-warn-color:#D97706;
          --toast-error-bg:#FEF2F2;--toast-error-border:#FECACA;--toast-error-color:#DC2626;
          --toast-shadow:0 4px 20px rgba(0,0,0,0.08);
          --status-indexed-bg:rgba(0,108,91,0.08);--status-indexed-color:#16A34A;
          --status-pending-bg:rgba(200,168,107,0.1);--status-pending-color:#D97706;
          --brand-suffix:#006C5B;
          --primary:#006C5B;--accent:#C8A86B;--gradient:linear-gradient(135deg,#006C5B,#C8A86B);--gradient-h:linear-gradient(90deg,#006C5B,#C8A86B);
          --primary-subtle:rgba(0,108,91,.04);--primary-light:rgba(0,108,91,.06);--primary-soft:rgba(0,108,91,.08);
          --primary-medium:rgba(0,108,91,.1);--primary-strong:rgba(0,108,91,.15);--primary-bold:rgba(0,108,91,.22);--primary-intense:rgba(0,108,91,.3);
          --primary-border-subtle:rgba(0,108,91,.15);--primary-border:rgba(0,108,91,.2);--primary-border-medium:rgba(0,108,91,.3);--primary-border-strong:rgba(0,108,91,.4);
          --primary-icon:rgba(0,108,91,.85);--primary-shadow:0 2px 10px rgba(0,108,91,.15);--primary-glow:0 2px 12px rgba(0,108,91,.15);
          --primary-shadow-strong:0 4px 14px rgba(0,108,91,.4);
          --accent-soft:rgba(200,168,107,.1);--accent-medium:rgba(200,168,107,.15);--accent-strong:rgba(200,168,107,.2);--accent-border:rgba(200,168,107,.25);
          --danger:#EF4444;--danger-dark:#DC2626;--danger-bg:rgba(239,68,68,.2);--danger-bg-light:rgba(239,68,68,.12);--danger-border:rgba(239,68,68,.2);
          --success:#22C55E;--success-alt:#16A34A;--info:#0ea5e9;--warning:#F59E0B;--purple:#C026D3;
          --overlay:rgba(0,0,0,.55);--shadow-heavy:0 24px 80px rgba(0,0,0,.22);--shadow-sm:0 2px 8px rgba(0,0,0,.06);
          --profile-gradient:linear-gradient(135deg,#006C5B,#009B7D);
        }
        [data-theme="dark"]{
          --bg-main:#0A1628;--bg-card:rgba(255,255,255,0.04);--bg-tint:rgba(255,255,255,0.05);--bg-light:rgba(255,255,255,0.03);--bg-input:rgba(255,255,255,0.07);
          --bg-nav:rgba(10,22,40,0.85);--bg-sidebar:rgba(10,22,40,0.7);--bg-rail:rgba(10,22,40,0.7);--bg-modal:rgba(15,23,42,0.95);
          --bg-chat-ai:rgba(255,255,255,0.04);--bg-hover:rgba(255,255,255,.08);--bg-active:rgba(0,108,91,.3);
          --text-primary:#f8fafc;--text-secondary:#94a3b8;--text-tertiary:#64748b;--text-muted:rgba(255,255,255,.35);--text-strong:rgba(255,255,255,.75);
          --border:rgba(255,255,255,.08);--shadow:0 2px 8px rgba(0,0,0,.2);--nav-shadow:none;
          --scrollbar:rgba(200,168,107,.25);--tab-active-bg:rgba(0,108,91,.3);--tab-active-color:#C8A86B;--tab-active-border:rgba(0,108,91,.5);
          --toast-success-bg:rgba(0,108,91,0.15);--toast-success-border:rgba(0,108,91,0.3);--toast-success-color:#22C55E;
          --toast-warn-bg:rgba(200,168,107,0.15);--toast-warn-border:rgba(200,168,107,0.3);--toast-warn-color:#C8A86B;
          --toast-error-bg:rgba(239,68,68,0.15);--toast-error-border:rgba(239,68,68,0.25);--toast-error-color:#EF4444;
          --toast-shadow:0 4px 20px rgba(0,0,0,0.3);
          --status-indexed-bg:rgba(0,108,91,0.2);--status-indexed-color:#22C55E;
          --status-pending-bg:rgba(200,168,107,0.2);--status-pending-color:#C8A86B;
          --brand-suffix:#C8A86B;
          --primary:#006C5B;--accent:#C8A86B;--gradient:linear-gradient(135deg,#006C5B,#C8A86B);--gradient-h:linear-gradient(90deg,#006C5B,#C8A86B);
          --primary-subtle:rgba(0,108,91,.08);--primary-light:rgba(0,108,91,.1);--primary-soft:rgba(0,108,91,.12);
          --primary-medium:rgba(0,108,91,.15);--primary-strong:rgba(0,108,91,.2);--primary-bold:rgba(0,108,91,.35);--primary-intense:rgba(0,108,91,.4);
          --primary-border-subtle:rgba(0,108,91,.2);--primary-border:rgba(0,108,91,.3);--primary-border-medium:rgba(0,108,91,.4);--primary-border-strong:rgba(0,108,91,.5);
          --primary-icon:rgba(0,108,91,.9);--primary-shadow:0 2px 10px rgba(0,108,91,.3);--primary-glow:0 2px 12px rgba(0,108,91,.3);
          --primary-shadow-strong:0 4px 14px rgba(0,108,91,.5);
          --accent-soft:rgba(200,168,107,.15);--accent-medium:rgba(200,168,107,.2);--accent-strong:rgba(200,168,107,.25);--accent-border:rgba(200,168,107,.3);
          --danger:#EF4444;--danger-dark:#EF4444;--danger-bg:rgba(239,68,68,.15);--danger-bg-light:rgba(239,68,68,.1);--danger-border:rgba(239,68,68,.25);
          --success:#22C55E;--success-alt:#22C55E;--info:#0ea5e9;--warning:#F59E0B;--purple:#C026D3;
          --overlay:rgba(0,0,0,.7);--shadow-heavy:0 24px 80px rgba(0,0,0,.4);--shadow-sm:0 2px 8px rgba(0,0,0,.15);
          --profile-gradient:linear-gradient(135deg,#006C5B,#009B7D);
        }
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:var(--scrollbar);border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
        .hr{transition:transform .18s,box-shadow .18s}
        .hr:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,108,91,.1)!important}
        .si{transition:background .12s;border-radius:10px;cursor:pointer}
        .si:hover{background:var(--bg-hover)}
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
      <nav data-testid="top-nav" style={{ background: "var(--bg-nav)", borderBottom: "1px solid var(--border)", height: 56, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 20, boxShadow: "var(--nav-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "var(--primary-glow)" }}>
              <Ic n="sparkle" size={14} />
            </div>
            <span style={{ color: "var(--text-primary)", fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "0.02em" }}>
              {t("brandName")}<span style={{ color: "var(--brand-suffix)" }}>{t("brandSuffix")}</span>
            </span>
          </div>
          <div style={{ width: 1, height: 18, background: "var(--border)" }} />
          {editTitle
            ? <input ref={titleRef} value={notebookTitle} onChange={e => setNotebookTitle(e.target.value)} onBlur={() => { setEditTitle(false); toast("Workspace title saved"); }} onKeyDown={e => { if (e.key === "Enter") { setEditTitle(false); toast("Workspace title saved"); } }} autoFocus style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 9px", width: 260 }} />
            : <span data-testid="notebook-title" onClick={() => setEditTitle(true)} title="Click to rename" style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "text", padding: "3px 8px", borderRadius: 6, transition: "background .15s" }} onMouseEnter={e => e.target.style.background = "var(--bg-light)"} onMouseLeave={e => e.target.style.background = "transparent"}>{notebookTitle}</span>
          }
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[["overview",t("overview")],["chat",t("chat")],["sources",t("sources")],["studio",t("studio")],["notes",t("notes")]].map(([v,l]) => (
            <button key={v} data-testid={`nav-tab-${v}`} onClick={() => setView(v)} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: view === v ? "var(--tab-active-bg)" : "transparent", color: view === v ? "var(--tab-active-color)" : "var(--text-tertiary)", border: view === v ? "1px solid var(--tab-active-border)" : "1px solid transparent", transition: "background .15s, color .15s" }}>{l}</button>
          ))}
          <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />
          <button data-testid="theme-toggle-btn" onClick={toggleTheme} style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-light)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", fontSize: 14 }} title={isDark ? "Switch to Light" : "Switch to Dark"}>
            {isDark ? <Ic n="sun" size={14} /> : <Ic n="moon" size={14} />}
          </button>
          <button data-testid="lang-toggle-btn" onClick={toggleLang} style={{ width: 30, height: 30, borderRadius: 7, background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--primary-border-subtle)", fontSize: 11, fontWeight: 800, letterSpacing: 0 }} title={isRTL ? "Switch to English" : "التبديل إلى العربية"}>
            {t("switchLanguage")}
          </button>
          <button data-testid="new-btn" onClick={() => setModal("upload")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "var(--primary)", color: "white", fontSize: 12, fontWeight: 700, boxShadow: "var(--primary-shadow)" }}>
            <Ic n="plus" size={13} /> {t("new")}
          </button>
          <button data-testid="share-btn" onClick={() => setModal("share")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, background: "var(--bg-light)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, border: "1px solid var(--border)" }}>
            <Ic n="share" size={13} /> {t("share")}
          </button>
          <button data-testid="settings-btn" onClick={() => { setSettingsTab("general"); setModal("settings"); }} style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-light)", color: "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
            <Ic n="settings" size={14} />
          </button>
          <button data-testid="profile-btn" onClick={() => setModal("profile")} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <Ic n="user" size={14} />
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 2 }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside data-testid="left-sidebar" style={{ width: 272, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
            {/* Profile card */}
            <div style={{ background: "var(--bg-tint)", borderRadius: 14, padding: 14, marginBottom: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: "var(--primary-shadow)" }}><Ic n="book" size={17} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notebookTitle}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{t("healthcare")} · {nbVisibility === "private" ? t("private") : t("public")}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {[[t("sourcesLabel"), sources.length, "var(--success)"], [t("indexed"), indexedSources.length, "var(--primary)"], [t("outputs"), outputs.length, "var(--accent)"], [t("chunks"), totalChunks, "var(--info)"]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "var(--primary-subtle)", borderRadius: 8, padding: "7px 9px" }}>
                    <div style={{ color: c, fontWeight: 800, fontSize: 17, lineHeight: 1 }}>{v}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Mix */}
            <div style={{ background: "var(--bg-tint)", borderRadius: 12, padding: 12, marginBottom: 10, border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, marginBottom: 9 }}>{t("sourceMix")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Donut segs={[{ p: 60, c: "var(--primary)" }, { p: 30, c: "var(--accent)" }, { p: 10, c: "var(--info)" }]} size={60} />
                <div style={{ flex: 1 }}>
                  {[[t("pdfs"), "60%", "var(--primary)"], [t("urls"), "30%", "var(--accent)"], [t("other"), "10%", "var(--info)"]].map(([l, p, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: c, flexShrink: 0 }} />
                      <span style={{ color: "var(--text-secondary)", fontSize: 10, flex: 1 }}>{l}</span>
                      <span style={{ color: "var(--text-primary)", fontSize: 10, fontWeight: 700 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, padding: "2px 6px", marginBottom: 6 }}>{t("filterByTopic")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {TAGS.map(t => {
                  const active = activeTags.includes(t);
                  return (
                    <span key={t} onClick={() => setActiveTags(p => active ? p.filter(x => x !== t) : [...p, t])} style={{ padding: "3px 9px", borderRadius: 20, background: active ? "var(--primary-intense)" : "var(--primary-subtle)", color: active ? "var(--accent)" : "var(--text-tertiary)", fontSize: 10, cursor: "pointer", border: `1px solid ${active ? "var(--primary-border-strong)" : "var(--border)"}`, transition: "all .15s" }}>
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: "var(--bg-tint)", borderRadius: 12, padding: 10, border: "1px solid var(--border)", marginBottom: 10 }}>
              <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, marginBottom: 7 }}>{t("quickActions")}</div>
              {[
                { l: t("addSource"), i: "upload", a: () => setModal("upload") },
                { l: t("generateReport"), i: "report", a: () => { setView("studio"); } },
                { l: t("addNote"), i: "note", a: () => openNoteEditor() },
                { l: t("webSearch"), i: "globe", a: () => { setModal("upload"); setUploadTab("web"); } },
                { l: t("exportNotebook"), i: "export", a: exportNotebook },
              ].map(({ l, i, a }) => (
                <div key={l} className="si" onClick={a} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
                  <div style={{ color: "var(--primary-icon)", width: 14, display: "flex" }}><Ic n={i} size={14} /></div>
                  <span style={{ color: "var(--text-strong)", fontSize: 12 }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, padding: "2px 6px", marginBottom: 7 }}>{t("recentActivity")}</div>
              {activityLog.slice(0, 5).map((a, i) => (
                <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
                    <div style={{ color: "var(--text-tertiary)", fontSize: 9 }}>{a.action} · {a.time}</div>
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
            <div data-testid="overview-section" style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { l: t("totalSources"),    v: sources.length,   i: "file",     bg: "var(--primary)" },
                  { l: t("indexedChunks"),   v: totalChunks,      i: "activity", bg: "var(--info)" },
                  { l: t("keyThemes"),       v: 12,               i: "sparkle",  bg: "var(--accent)" },
                  { l: t("studioOutputs"),   v: outputs.length,   i: "report",   bg: "var(--success)" },
                  { l: t("aiQueries"),       v: messages.filter(m => m.role === "user").length, i: "bot", bg: "var(--text-tertiary)" },
                ].map(k => (
                  <div key={k.l} className="hr" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 10 }}><Ic n={k.i} size={15} /></div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{k.v}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3, fontWeight: 500 }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                <div>
                  {/* Source Intelligence */}
                  <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, marginBottom: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("sourceIntelligence")}</h3>
                      <button data-testid="view-all-sources-btn" onClick={() => setView("sources")} style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>{t("viewAll")}</button>
                    </div>
                    {sources.slice(0, 4).map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: typeColor(s.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(s.type), flexShrink: 0 }}><Ic n={typeIcon(s.type)} size={15} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{s.chunks > 0 ? `${s.chunks} chunks` : "Processing..."} · {s.date}</div>
                        </div>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.status === "indexed" ? "var(--status-indexed-bg)" : "var(--status-pending-bg)", color: s.status === "indexed" ? "var(--status-indexed-color)" : "var(--status-pending-color)" }}>{s.status}</span>
                      </div>
                    ))}
                    <button data-testid="add-source-overview-btn" onClick={() => { setModal("upload"); }} style={{ marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 9, background: "var(--primary-medium)", color: "var(--primary)", fontSize: 12, fontWeight: 600, border: "1px dashed var(--primary-border-medium)", cursor: "pointer" }}>
                      {t("addSourceBtn")}
                    </button>
                  </div>
                  {/* Outputs */}
                  <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("studioOutputsTitle")}</h3>
                      <button data-testid="open-studio-btn" onClick={() => setView("studio")} style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>{t("openStudio")}</button>
                    </div>
                    {outputs.length === 0 ? <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-tertiary)", fontSize: 12 }}>{t("noOutputsYet")}</div> : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                        {outputs.slice(0, 6).map(o => {
                          const tl = toolFor(o.type);
                          return (
                            <div key={o.id} className="hr" data-testid={`output-card-${o.id}`} onClick={() => { setModalData(o); setModal("output"); }} style={{ background: "var(--bg-tint)", borderRadius: 12, padding: 12, border: "1px solid var(--border)", cursor: "pointer" }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: tl.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: tl.color, marginBottom: 7 }}><Ic n={tl.icon} size={13} /></div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 3 }}>{o.title.substring(0, 28)}{o.title.length > 28 ? "..." : ""}</div>
                              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{o.created}</div>
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
                  <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("activity")}</h3>
                    {activityLog.slice(0, 5).map((a, i) => (
                      <div key={a.id || i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 2, flexShrink: 0 }} />
                          {i < 4 && <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 3 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{a.action}</div>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
                          <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 2 }}>{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Quick chat */}
                  <div style={{ background: "var(--primary-light)", borderRadius: 16, padding: 18, border: "1px solid var(--primary-border-subtle)" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{t("quickChat")}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 12 }}>{t("askAnything")}</div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <input data-testid="quick-chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (setView("chat"), sendMessage())} placeholder={t("askQuestion")} style={{ flex: 1, background: "var(--bg-card)", borderRadius: 9, padding: "8px 12px", color: "var(--text-primary)", fontSize: 12, border: "1px solid var(--border)" }} />
                      <button data-testid="quick-chat-send-btn" onClick={() => { setView("chat"); sendMessage(); }} style={{ width: 36, height: 36, borderRadius: 9, background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
                        <Ic n="send" size={14} />
                      </button>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {[t("summarizeSources"), t("keyFindings"), t("compareTopics")].map(q => (
                        <button key={q} data-testid={`quick-prompt-${q.replace(/\s/g,'-')}`} onClick={() => { setChatInput(q); setView("chat"); sendMessage(q); }} style={{ padding: "4px 9px", borderRadius: 20, background: "var(--primary-bold)", color: "var(--accent)", fontSize: 10, fontWeight: 600, border: "1px solid var(--primary-border-medium)", cursor: "pointer" }}>{q}</button>
                      ))}
                    </div>
                  </div>
                  {/* Notes preview */}
                  {notes.length > 0 && (
                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("notesTitle")}</h3>
                        <button onClick={() => setView("notes")} style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>{t("viewAll")}</button>
                      </div>
                      {notes.slice(0, 2).map(n => (
                        <div key={n.id} onClick={() => openNoteEditor(n)} style={{ padding: "8px 10px", borderRadius: 9, background: "var(--bg-tint)", marginBottom: 6, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</div>
                          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{n.content.substring(0, 50)}...</div>
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
              <div style={{ padding: "10px 20px", background: "var(--bg-nav)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="sparkle" size={14} /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t("healthIntelligenceAssistant")}</div>
                    <div style={{ fontSize: 10, color: indexedSources.length > 0 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>
                      {indexedSources.length > 0 ? `● Grounded in ${indexedSources.length} indexed sources` : "● No indexed sources — add sources first"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setShowChatSettings(p => !p)} title="Chat Settings" style={{ width: 30, height: 30, borderRadius: 7, background: showChatSettings ? "var(--primary-strong)" : "var(--bg-tint)", color: showChatSettings ? "var(--primary)" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                    <Ic n="settings" size={13} />
                  </button>
                  <button onClick={regenerateLast} title="Regenerate last answer" style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-tint)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                    <Ic n="refresh" size={13} />
                  </button>
                  <button onClick={exportChat} title="Export chat" style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-tint)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                    <Ic n="download" size={13} />
                  </button>
                  <button onClick={clearChat} title="Clear chat" style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-tint)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                    <Ic n="trash" size={13} />
                  </button>
                </div>
              </div>
              {/* Chat settings bar */}
              {showChatSettings && (
                <div style={{ background: "var(--bg-tint)", borderBottom: "1px solid var(--border)", padding: "8px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>Reasoning Depth:</span>
                  {["fast", "balanced", "deep"].map(d => (
                    <button key={d} onClick={() => { setChatDepth(d); toast(`Depth set to ${d}`); }} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: chatDepth === d ? "var(--primary)" : "var(--bg-light)", color: chatDepth === d ? "white" : "var(--text-secondary)", border: "1px solid " + (chatDepth === d ? "var(--primary)" : "var(--border)"), cursor: "pointer" }}>{d.charAt(0).toUpperCase() + d.slice(1)}</button>
                  ))}
                </div>
              )}
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
                {messages.length === 0 && !indexedSources.length && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--text-tertiary)" }}>
                    <Ic n="book" size={40} stroke="var(--text-tertiary)" />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{t("addSourceToStart")}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t("uploadPdfs")}</div>
                    <button onClick={() => setModal("upload")} style={{ marginTop: 4, padding: "9px 20px", borderRadius: 10, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("uploadSource")}</button>
                  </div>
                )}
                {messages.length === 0 && indexedSources.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="sparkle" size={24} /></div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", textAlign: "center" }}>What would you like to do?</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", maxWidth: 360 }}>I can translate, summarize, analyze, compare, or answer questions about your {indexedSources.length} indexed source{indexedSources.length !== 1 ? 's' : ''}.</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500, marginTop: 6 }}>
                      {[
                        { label: "Translate to Arabic", icon: "globe", prompt: "Translate all source content to Arabic" },
                        { label: "Translate to English", icon: "globe", prompt: "Translate all source content to English" },
                        { label: "Summarize sources", icon: "book", prompt: "Summarize all my sources in a comprehensive overview" },
                        { label: "Key findings", icon: "lightbulb", prompt: "What are the key findings across all sources?" },
                        { label: "Compare sources", icon: "chart", prompt: "Compare and contrast the main points across my sources" },
                        { label: "Extract action items", icon: "check", prompt: "Extract all action items, deliverables, and next steps from the sources" },
                      ].map((chip) => (
                        <button key={chip.label} data-testid={`chat-chip-${chip.label.replace(/\s/g,'-').toLowerCase()}`} onClick={() => sendMessage(chip.prompt)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-strong)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary-border-medium)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        ><Ic n={chip.icon} size={12} /> {chip.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} className="ani" style={{ marginBottom: 18, display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: m.role === "ai" ? "var(--gradient)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: m.role === "ai" ? "white" : "var(--text-secondary)", flexShrink: 0 }}>
                      <Ic n={m.role === "ai" ? "sparkle" : "user"} size={13} />
                    </div>
                    <div style={{ maxWidth: "74%" }}>
                      <div style={{ background: m.role === "user" ? "var(--primary)" : "var(--bg-chat-ai)", color: m.role === "user" ? "white" : "var(--text-primary)", borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "11px 14px", fontSize: 12, lineHeight: 1.7, boxShadow: "var(--shadow-sm)", border: m.role === "ai" ? "1px solid var(--border)" : "none", whiteSpace: m.role === "user" ? "pre-wrap" : "normal" }}>
                        {m.role === "ai" ? <MdText text={m.content} /> : m.content}
                      </div>
                      {m.citations && m.citations.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {m.citations.map((c, ci) => (
                            <span key={ci} style={{ padding: "2px 9px", borderRadius: 20, background: "var(--primary-strong)", color: "var(--primary)", fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1px solid var(--primary-border-medium)" }} title="View source">📎 {c}</span>
                          ))}
                        </div>
                      )}
                      {m.pinned && <div style={{ fontSize: 10, color: "var(--primary)", marginTop: 4 }}>📌 Pinned</div>}
                      {/* Message actions */}
                      <div style={{ display: "flex", gap: 5, marginTop: 5, opacity: 0.6 }}>
                        <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{m.time}</span>
                        {m.role === "ai" && (
                          <>
                            <button onClick={() => pinMessage(m.id)} title={t("pin")} style={{ background: "none", border: "none", cursor: "pointer", color: m.pinned ? "var(--primary)" : "var(--text-tertiary)", display: "flex", fontSize: 9, alignItems: "center", gap: 2 }}><Ic n="pin" size={10} /> {t("pin")}</button>
                            <button onClick={() => saveToNotes(m)} title="Save to notes" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", fontSize: 9, alignItems: "center", gap: 2 }}><Ic n="save" size={10} /> Save</button>
                            <button onClick={() => { navigator.clipboard?.writeText(m.content); toast(t("copied")); }} title={t("copy")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", fontSize: 9, alignItems: "center", gap: 2 }}><Ic n="copy" size={10} /> {t("copy")}</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {generating && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}><Ic n="sparkle" size={13} /></div>
                    <div style={{ background: "var(--bg-card)", borderRadius: "4px 16px 16px 16px", padding: "13px 16px", border: "1px solid var(--border)", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} className={`dot${d + 1}`} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div style={{ padding: "12px 20px", background: "var(--bg-nav)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "var(--bg-tint)", borderRadius: 14, padding: "9px 12px", border: "1px solid var(--border)" }}>
                  <button onClick={() => setModal("upload")} title="Upload source" style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}><Ic n="upload" size={15} /></button>
                  <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={indexedSources.length > 0 ? "Ask anything about your sources… (Enter to send)" : "Upload and index a source first…"} rows={1} style={{ flex: 1, fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", paddingTop: 1 }} />
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button title="Voice input" style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="mic" size={15} /></button>
                    <button onClick={() => sendMessage()} disabled={!chatInput.trim() || !indexedSources.length} style={{ width: 32, height: 32, borderRadius: 8, background: chatInput.trim() && indexedSources.length ? "var(--gradient)" : "var(--border)", color: chatInput.trim() && indexedSources.length ? "white" : "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", border: "none", cursor: chatInput.trim() && indexedSources.length ? "pointer" : "not-allowed" }}>
                      <Ic n="send" size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 6, textAlign: "center" }}>{t("groundedIn")} {indexedSources.length} {indexedSources.length !== 1 ? t("indexedSources") : t("indexedSource")} · {t("poweredBy")} · {t("shiftEnter")}</div>
              </div>
            </div>
          )}

          {/* SOURCES */}
          {view === "sources" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{t("sources")} <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}>({sources.length})</span></h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ display: "flex", background: "var(--bg-card)", borderRadius: 9, border: "1px solid var(--border)", overflow: "hidden" }}>
                    {["all", "pdf", "url", "indexed", "processing"].map(f => (
                      <button key={f} onClick={() => setSrcFilter(f)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, background: srcFilter === f ? "var(--primary)" : "transparent", color: srcFilter === f ? "white" : "var(--text-secondary)", border: "none", cursor: "pointer" }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-card)", borderRadius: 9, padding: "6px 12px", border: "1px solid var(--border)" }}>
                    <Ic n="search" size={13} stroke="var(--text-tertiary)" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={t("searchSources")} style={{ fontSize: 12, color: "var(--text-primary)", width: 180 }} />
                  </div>
                  <button onClick={() => setModal("upload")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    <Ic n="plus" size={13} /> Add Source
                  </button>
                </div>
              </div>
              {/* Drag zone */}
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
                style={{ borderRadius: 14, border: `2px dashed ${dragOver ? "var(--primary)" : "var(--primary-border-medium)"}`, background: dragOver ? "var(--primary-strong)" : "transparent", padding: "14px 20px", marginBottom: 16, textAlign: "center", transition: "all .2s", cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}>
                <Ic n="upload" size={20} stroke={dragOver ? "var(--primary)" : "var(--text-tertiary)"} />
                <div style={{ fontSize: 12, fontWeight: 600, color: dragOver ? "var(--primary)" : "var(--text-tertiary)", marginTop: 6 }}>{t("dropFilesHere")}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 3 }}>{t("supportedFormats")}</div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.bmp" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 12 }}>
                {filteredSources.map(s => (
                  <div key={s.id} className="hr" style={{ background: "var(--bg-card)", borderRadius: 14, padding: 14, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: typeColor(s.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(s.type), flexShrink: 0 }}><Ic n={typeIcon(s.type)} size={18} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 5 }}>{s.title}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
                          <span style={{ padding: "1px 7px", borderRadius: 20, background: typeColor(s.type) + "18", color: typeColor(s.type), fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{s.type}</span>
                          <span style={{ padding: "1px 7px", borderRadius: 20, background: s.status === "indexed" ? "var(--accent-medium)" : "var(--accent-strong)", color: s.status === "indexed" ? "var(--success-alt)" : "var(--status-pending-color)", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{s.status}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{s.date} · {s.size} {s.chunks > 0 ? `· ${s.chunks} chunks` : ""}</div>
                        {s.url && <div style={{ fontSize: 9, color: "var(--info)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔗 {s.url}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button onClick={() => { setModalData(s); setModal("source"); }} title="View details" style={{ width: 26, height: 26, borderRadius: 6, background: "var(--bg-tint)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", cursor: "pointer" }}><Ic n="eye" size={11} /></button>
                        <button onClick={() => deleteSource(s.id)} title="Delete" style={{ width: 26, height: 26, borderRadius: 6, background: "var(--danger-bg)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--danger-border)", cursor: "pointer" }}><Ic n="trash" size={11} /></button>
                      </div>
                    </div>
                    {s.status === "processing" && (
                      <div style={{ marginTop: 10, background: "var(--bg-light)", borderRadius: 6, overflow: "hidden", height: 3 }}>
                        <div style={{ width: "65%", height: "100%", background: "var(--gradient-h)", borderRadius: 6 }} className="pulse" />
                      </div>
                    )}
                  </div>
                ))}
                {filteredSources.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)" }}>
                    <Ic n="search" size={32} stroke="var(--text-tertiary)" />
                    <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{t("noSourcesMatch")}</div>
                    <button onClick={() => { setSearchQ(""); setSrcFilter("all"); setActiveTags([]); }} style={{ marginTop: 8, padding: "7px 16px", borderRadius: 8, background: "var(--primary)", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("clearFilters")}</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STUDIO */}
          {view === "studio" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{t("studioTitle")}</h2>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{t("generateAiOutputs")} {indexedSources.length} {indexedSources.length !== 1 ? t("indexedSourcePlural") : t("indexedSourceSingle")}</p>
              </div>
              {indexedSources.length === 0 && (
                <div style={{ background: "var(--accent-soft)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--accent-border)" }}>
                  <Ic n="alert" size={16} stroke="var(--accent)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{t("indexAtLeast")}</span>
                  <button onClick={() => setModal("upload")} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 7, background: "var(--accent)", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>Add Source</button>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
                {STUDIO_TOOLS.map(tool => (
                  <div key={tool.id} className="hr" onClick={() => generateOutput(tool)} style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)", cursor: indexedSources.length > 0 ? "pointer" : "not-allowed", opacity: indexedSources.length > 0 ? 1 : 0.5, boxShadow: "0 2px 8px rgba(0,0,0,.04)", position: "relative", overflow: "hidden", transition: "all .2s" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, borderRadius: "0 16px 0 70px", background: tool.color + "10" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: tool.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tool.color, marginBottom: 10 }}>
                      {genTool === tool.id
                        ? <div className="spin" style={{ width: 14, height: 14, border: `2px solid ${tool.color}40`, borderTop: `2px solid ${tool.color}`, borderRadius: "50%" }} />
                        : <Ic n={tool.icon} size={18} />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{t(tool.labelKey)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t(tool.descKey)}</div>
                    {genTool === tool.id && (
                      <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 10, color: tool.color, fontWeight: 700 }}>{t("generating")}</div>
                    )}
                  </div>
                ))}
              </div>
              {/* Outputs list */}
              <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("generatedOutputs")} ({outputs.length})</h3>
                </div>
                {outputs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-tertiary)" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t("noOutputsYetStudio")}</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{t("clickToolAbove")}</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
                    {outputs.map(o => {
                      const tl = toolFor(o.type);
                      return (
                        <div key={o.id} className="hr" style={{ background: "var(--bg-tint)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: tl.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: tl.color }}><Ic n={tl.icon} size={14} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                              <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{o.created} · {o.size}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => { setModalData(o); setModal("output"); }} style={{ flex: 1, padding: "5px 0", borderRadius: 7, background: tl.color + "18", color: tl.color, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                              <Ic n="eye" size={10} /> {t("preview")}
                            </button>
                            <button onClick={() => downloadOutput(o)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, background: "var(--border)", color: "var(--text-secondary)", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                              <Ic n="download" size={10} /> {t("export")}
                            </button>
                            <button onClick={() => deleteOutput(o.id)} style={{ width: 28, padding: "5px 0", borderRadius: 7, background: "var(--danger-bg)", color: "var(--danger)", fontSize: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{t("notesTitle")} <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}>({notes.length})</span></h2>
                <button onClick={() => openNoteEditor()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  <Ic n="plus" size={13} /> New Note
                </button>
              </div>
              {notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-tertiary)" }}>
                  <Ic n="note" size={40} stroke="var(--text-tertiary)" />
                  <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{t("noNotesYet")}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{t("createFirstNote")}</div>
                  <button onClick={() => openNoteEditor()} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 10, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("createNote")}</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                  {notes.map(n => (
                    <div key={n.id} className="hr" style={{ background: "var(--bg-card)", borderRadius: 14, padding: 16, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,.04)", cursor: "pointer" }} onClick={() => openNoteEditor(n)}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flex: 1, marginRight: 8 }}>{n.title}</div>
                        <button onClick={e => { e.stopPropagation(); setNotes(p => p.map(x => x.id === n.id ? { ...x, pinned: !x.pinned } : x)); }} style={{ color: n.pinned ? "var(--warning)" : "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="pin" size={13} /></button>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>{n.content.substring(0, 120)}{n.content.length > 120 ? "…" : ""}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{n.created}</span>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={e => { e.stopPropagation(); openNoteEditor(n); }} style={{ padding: "3px 8px", borderRadius: 6, background: "var(--primary-strong)", color: "var(--primary)", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>{t("edit")}</button>
                          <button onClick={e => { e.stopPropagation(); deleteNote(n.id); }} style={{ padding: "3px 8px", borderRadius: 6, background: "var(--danger-bg)", color: "var(--danger)", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer" }}>{t("delete")}</button>
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
          <aside data-testid="right-studio-rail" style={{ width: 290, background: "var(--bg-rail)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="sparkle" size={11} /></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{t("studio")}</span>
              </div>
              <button onClick={() => setStudioOpen(false)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={14} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
                {STUDIO_TOOLS.slice(0, 6).map(tool => (
                  <div key={tool.id} onClick={() => generateOutput(tool)} style={{ background: "var(--bg-tint)", borderRadius: 10, padding: "9px 7px", border: "1px solid var(--border)", cursor: "pointer", textAlign: "center", transition: "all .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = tool.color + "10"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--bg-tint)"}>
                    <div style={{ color: tool.color, display: "flex", justifyContent: "center", marginBottom: 5 }}>
                      {genTool === tool.id ? <div className="spin" style={{ width: 14, height: 14, border: `2px solid ${tool.color}40`, borderTop: `2px solid ${tool.color}`, borderRadius: "50%" }} /> : <Ic n={tool.icon} size={16} />}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{t(tool.labelKey)}</div>
                  </div>
                ))}
              </div>
              {/* Quick note in rail */}
              <div style={{ background: "var(--bg-tint)", borderRadius: 12, padding: 12, border: "1px solid var(--border)", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{t("quickNote")}</span>
                  <button onClick={() => openNoteEditor()} style={{ color: "var(--primary)", fontSize: 10, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>{t("fullEditor")}</button>
                </div>
                <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder={t("title")} style={{ width: "100%", fontSize: 11, fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-card)", borderRadius: 6, padding: "5px 8px", border: "1px solid var(--border)", marginBottom: 5 }} />
                <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder={t("writeANote")} rows={3} style={{ width: "100%", fontSize: 11, color: "var(--text-primary)", background: "var(--bg-card)", borderRadius: 6, padding: "5px 8px", border: "1px solid var(--border)", lineHeight: 1.5 }} />
                <button onClick={saveNote} style={{ width: "100%", marginTop: 7, padding: "6px 0", borderRadius: 7, background: "var(--gradient)", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("saveNote")}</button>
              </div>
              {/* Recent outputs in rail */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>{t("recentOutputs")}</div>
              {outputs.slice(0, 4).map(o => {
                const tl = toolFor(o.type);
                return (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: tl.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tl.color, flexShrink: 0 }}><Ic n={tl.icon} size={12} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
                      <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{o.created}</div>
                    </div>
                    <button onClick={() => downloadOutput(o)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="download" size={12} /></button>
                  </div>
                );
              })}
              {outputs.length === 0 && <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-tertiary)", fontSize: 11 }}>{t("noOutputs")}</div>}
            </div>
          </aside>
        )}
        {(view === "overview" || view === "chat") && !studioOpen && (
          <button onClick={() => setStudioOpen(true)} style={{ position: "absolute", right: 14, top: 14, width: 34, height: 34, borderRadius: 9, background: "var(--gradient)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--primary-shadow-strong)", zIndex: 10, border: "none", cursor: "pointer" }} title="Open Studio">
            <Ic n="sparkle" size={14} />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)", animation: "fadeIn .18s ease" }}>

          {/* ── UPLOAD ── */}
          {modal === "upload" && (
            <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 540, boxShadow: "var(--shadow-heavy)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{t("addSourceTitle")}</h3>
                <button onClick={() => { setModal(null); setWebResults([]); setWebSearchInput(""); setUrlInput(""); }} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", padding: "10px 24px 0", gap: 2, borderBottom: "1px solid var(--border)" }}>
                {[["file",t("uploadFile")],["url",t("addUrl")],["web",t("webSearchTab")],["drive",t("googleDrive")]].map(([tt, l]) => (
                  <button key={tt} onClick={() => setUploadTab(tt)} style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, color: uploadTab === tt ? "var(--primary)" : "var(--text-tertiary)", background: "none", border: "none", borderBottom: `2px solid ${uploadTab === tt ? "var(--primary)" : "transparent"}`, cursor: "pointer", transition: "all .15s" }}>{l}</button>
                ))}
              </div>
              <div style={{ padding: 24 }}>
                {/* File upload */}
                {uploadTab === "file" && (
                  <>
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: `2px dashed ${dragOver ? "var(--primary)" : "var(--primary-border-medium)"}`, borderRadius: 14, padding: "32px 20px", textAlign: "center", background: dragOver ? "var(--primary-strong)" : "var(--bg-tint)", cursor: "pointer", transition: "all .2s" }}>
                      <Ic n="upload" size={32} stroke={dragOver ? "var(--primary)" : "var(--text-tertiary)"} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: dragOver ? "var(--primary)" : "var(--text-secondary)", marginTop: 10 }}>{t("dropFilesHere")}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 5 }}>{t("supportedFormatsLong")}</div>
                      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.bmp" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
                      {[["PDF/Doc","pdf","var(--danger)"],["Presentation","slides","var(--purple)"],["Excel","activity","var(--success)"],["Image","image","var(--accent)"]].map(([l, i, c]) => (
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
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Enter a URL to scrape and index</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleURLAdd()} placeholder="https://example.com/article" style={{ flex: 1, background: "var(--bg-tint)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, border: "1px solid var(--border)" }} />
                      <button onClick={handleURLAdd} style={{ padding: "0 18px", borderRadius: 10, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Add</button>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8 }}>Examples</div>
                      {["https://arxiv.org/abs/1706.03762", "https://openai.com/research", "https://en.wikipedia.org/wiki/Large_language_model"].map(u => (
                        <div key={u} onClick={() => setUrlInput(u)} style={{ padding: "7px 10px", borderRadius: 8, background: "var(--bg-tint)", border: "1px solid var(--border)", fontSize: 11, color: "var(--info)", cursor: "pointer", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Web search */}
                {uploadTab === "web" && (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <input value={webSearchInput} onChange={e => setWebSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleWebSearch()} placeholder="Search the web for sources…" style={{ flex: 1, background: "var(--bg-tint)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, border: "1px solid var(--border)" }} />
                      <button onClick={handleWebSearch} style={{ padding: "0 16px", borderRadius: 10, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        {webSearching ? <div className="spin" style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid white", borderRadius: "50%" }} /> : <Ic n="search" size={13} />} Search
                      </button>
                    </div>
                    {webResults.length > 0 && (
                      <div>
                        {webResults.map((r, i) => (
                          <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-tint)", border: "1px solid var(--border)", marginBottom: 7 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{r.title}</div>
                                <div style={{ fontSize: 10, color: "var(--info)", marginBottom: 4 }}>{r.url}</div>
                                <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>{r.snippet}</div>
                              </div>
                              <button onClick={() => { addWebResult(r); setModal(null); setWebResults([]); }} style={{ padding: "5px 12px", borderRadius: 7, background: "var(--primary)", color: "white", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0 }}>Add</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!webSearching && webResults.length === 0 && webSearchInput && (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-tertiary)", fontSize: 12 }}>Press Search to find sources</div>
                    )}
                  </div>
                )}
                {/* Google Drive */}
                {uploadTab === "drive" && (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <Ic n="drive" size={40} stroke="var(--text-tertiary)" />
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginTop: 12 }}>Connect Google Drive</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6, marginBottom: 16 }}>Import documents directly from your Drive</div>
                    <button onClick={() => toast("Google Drive OAuth would open here", "warn")} style={{ padding: "10px 24px", borderRadius: 10, background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 13, fontWeight: 700, border: "2px solid var(--border)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Ic n="drive" size={16} stroke="#4285F4" /> Connect Drive
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SHARE ── */}
          {modal === "share" && (
            <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 480, boxShadow: "var(--shadow-heavy)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{t("shareNotebook")}</h3>
                <button onClick={() => setModal(null)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              <div style={{ padding: 24 }}>
                {/* Invite */}
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Invite collaborators</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && inviteCollaborator()} placeholder="colleague@email.com" style={{ flex: 1, background: "var(--bg-tint)", borderRadius: 10, padding: "9px 13px", color: "var(--text-primary)", fontSize: 12, border: "1px solid var(--border)" }} />
                  <button onClick={inviteCollaborator} style={{ padding: "0 16px", borderRadius: 10, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Invite</button>
                </div>
                {/* Collaborators */}
                {collaborators.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 8 }}>{t("currentCollaborators")}</div>
                    {collaborators.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 9, background: "var(--bg-tint)", marginBottom: 5, border: "1px solid var(--border)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{c.email}</div>
                        </div>
                        <select defaultValue={c.role} style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: 6, padding: "3px 8px", border: "1px solid var(--border)", cursor: "pointer" }}>
                          <option>Viewer</option>
                          <option>Editor</option>
                          <option>Admin</option>
                        </select>
                        <button onClick={() => setCollaborators(p => p.filter((_, j) => j !== i))} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Copy link */}
                <div style={{ background: "var(--bg-tint)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: .7 }}>{t("shareLink")}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, background: "var(--bg-card)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "var(--text-tertiary)", border: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</div>
                    <button onClick={copyLink} style={{ padding: "0 14px", borderRadius: 8, background: linkCopied ? "var(--success)" : "var(--primary)", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", transition: "background .3s", display: "flex", alignItems: "center", gap: 5 }}>
                      <Ic n={linkCopied ? "check" : "copy"} size={12} /> {linkCopied ? t("copied") : t("copyLink")}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select defaultValue="private" onChange={e => setNbVisibility(e.target.value)} style={{ flex: 1, fontSize: 11, color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: 8, padding: "6px 10px", border: "1px solid var(--border)", cursor: "pointer" }}>
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
            <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 600, boxShadow: "var(--shadow-heavy)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{editNoteId ? t("editNote") : t("newNote")}</h3>
                <button onClick={() => { setModal(null); setNoteTitle(""); setNoteBody(""); setEditNoteId(null); }} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              <div style={{ padding: 22 }}>
                <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder={t("noteTitle")} style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, padding: "8px 0", borderBottom: "2px solid var(--border)" }} />
                <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder={t("writeNote")} rows={9} style={{ width: "100%", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.75, background: "var(--bg-tint)", borderRadius: 12, padding: 16, border: "1px solid var(--border)", marginBottom: 16 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{noteBody.length} {t("characters")} · {noteBody.split(/\s+/).filter(Boolean).length} {t("words")}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setModal(null); setNoteTitle(""); setNoteBody(""); setEditNoteId(null); }} style={{ padding: "8px 18px", borderRadius: 9, background: "var(--bg-light)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>{t("cancel")}</button>
                    <button onClick={saveNote} style={{ padding: "8px 20px", borderRadius: 9, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("saveNote")}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {modal === "settings" && (
            <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 580, maxHeight: "80vh", boxShadow: "var(--shadow-heavy)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{t("notebookSettings")}</h3>
                <button onClick={() => setModal(null)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              {/* Settings tabs */}
              <div style={{ display: "flex", padding: "8px 22px 0", borderBottom: "1px solid var(--border)", gap: 0 }}>
                {[["general",t("general")],["sources",t("sources")],["ai",t("aiModel")],["export",t("export")]].map(([tab, l]) => (
                  <button key={tab} onClick={() => setSettingsTab(tab)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, color: settingsTab === tab ? "var(--primary)" : "var(--text-tertiary)", background: "none", border: "none", borderBottom: `2px solid ${settingsTab === tab ? "var(--primary)" : "transparent"}`, cursor: "pointer", transition: "all .15s" }}>{l}</button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
                {settingsTab === "general" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>{t("notebookName")}</label>
                      <input value={notebookTitle} onChange={e => setNotebookTitle(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, color: "var(--text-primary)", background: "var(--bg-tint)" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>{t("description")}</label>
                      <textarea value={nbDescription} onChange={e => setNbDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-primary)", background: "var(--bg-tint)", lineHeight: 1.6 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>{t("visibility")}</label>
                      <select value={nbVisibility} onChange={e => setNbVisibility(e.target.value)} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-primary)", background: "var(--bg-tint)", width: "100%", cursor: "pointer" }}>
                        <option value="private">🔒 Private</option>
                        <option value="link">🔗 Anyone with link</option>
                        <option value="public">🌐 Public</option>
                      </select>
                    </div>
                    <button onClick={() => { toast(t("settingsSaved")); setModal(null); }} style={{ padding: "10px 0", borderRadius: 10, background: "var(--gradient)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("saveChanges")}</button>
                  </div>
                )}
                {settingsTab === "sources" && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>{t("manageSources")} ({sources.length})</div>
                    {sources.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "var(--bg-tint)", marginBottom: 7, border: "1px solid var(--border)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: typeColor(s.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(s.type), flexShrink: 0 }}><Ic n={typeIcon(s.type)} size={13} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                          <div style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{s.chunks} chunks · {s.status}</div>
                        </div>
                        <button onClick={() => deleteSource(s.id)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="trash" size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {settingsTab === "ai" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[["Model", "Llama 3.1 (405B)"], ["Embeddings", "BGE-M3"], ["Vector DB", "Weaviate"], ["Framework", "LlamaIndex"], ["Context Window", "128K tokens"], ["Temperature", "0.7"]].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 10, background: "var(--bg-tint)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ padding: 12, borderRadius: 10, background: "var(--primary-strong)", border: "1px solid var(--primary-border-medium)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>{t("reasoningDepth")}</div>
                      <div style={{ display: "flex", gap: 7 }}>
                        {["fast", "balanced", "deep"].map(d => (
                          <button key={d} onClick={() => { setChatDepth(d); toast(`Depth set to ${d}`); }} style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, background: chatDepth === d ? "var(--primary)" : "var(--bg-light)", color: chatDepth === d ? "white" : "var(--text-secondary)", border: `1px solid ${chatDepth === d ? "var(--primary)" : "var(--border)"}`, cursor: "pointer" }}>{d}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {settingsTab === "export" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>{t("exportAs")}</div>
                    {[
                      { l: t("exportJson"), d: t("fullBackup"), i: "file", a: exportNotebook },
                      { l: t("exportSourcesList"), d: t("csvOfSources"), i: "table", a: () => { toast("Exporting sources..."); } },
                      { l: t("exportChatHistory"), d: t("fullConversation"), i: "activity", a: exportChat },
                      { l: t("exportAllOutputs"), d: t("zipContent"), i: "download", a: () => toast("Preparing ZIP...", "warn") },
                    ].map(({ l, d, i, a }) => (
                      <div key={l} onClick={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11, background: "var(--bg-tint)", border: "1px solid var(--border)", cursor: "pointer", transition: "all .15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-medium)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}><Ic n={i} size={15} /></div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{l}</div>
                          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{d}</div>
                        </div>
                        <Ic n="chevR" size={14} stroke="var(--text-tertiary)" />
                      </div>
                    ))}
                    <div style={{ marginTop: 8, padding: 14, borderRadius: 11, background: "var(--danger-bg-light)", border: "1px solid var(--danger-border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger-dark)", marginBottom: 6 }}>{t("dangerZone")}</div>
                      <button onClick={() => setConfirm({ msg: "Delete this entire notebook? All sources, outputs, and notes will be permanently deleted.", onYes: () => { toast("Notebook deleted", "error"); setConfirm(null); setModal(null); }, onNo: () => setConfirm(null) })} style={{ padding: "7px 16px", borderRadius: 8, background: "var(--danger)", color: "white", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("deleteNotebook")}</button>
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
              <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 640, maxHeight: "82vh", boxShadow: "var(--shadow-heavy)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 101 }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: tool.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: tool.color }}><Ic n={tool.icon} size={15} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{modalData.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{modalData.created} · {modalData.size}</div>
                  </div>
                  <button data-testid="output-export-btn" onClick={() => downloadOutput(modalData)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: tool.color + "18", color: tool.color, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", position: "relative", zIndex: 102 }}><Ic n="download" size={12} /> Export</button>
                  <button data-testid="output-save-btn" onClick={() => saveToNotes({ content: modalData.content })} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "var(--bg-tint)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, border: "1px solid var(--border)", cursor: "pointer" }}><Ic n="save" size={12} /> Save</button>
                  <button data-testid="output-close-btn" onClick={() => setModal(null)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                  {modalData.type === "infographic" && modalData.slides_data?.length > 0 ? (
                    <div>
                      {/* Visual Infographic Header */}
                      <div style={{ background: "linear-gradient(135deg, #006C5B, #004D40)", borderRadius: 16, padding: "28px 24px", marginBottom: 16, textAlign: "center", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, opacity: 0.05, background: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)" }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ color: "white", fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.3px" }}>{modalData.title}</div>
                          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Based on {modalData.slides_data.length} key insights from your sources</div>
                          <div style={{ width: 60, height: 3, background: "#C8A86B", borderRadius: 2, margin: "12px auto 0" }} />
                        </div>
                      </div>
                      {/* Section Cards Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {modalData.slides_data.map((sec, si) => {
                          const colors = ['#006C5B','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B','#EC4899','#10B981','#3B82F6','#D946EF'];
                          const c = colors[si % colors.length];
                          return (
                            <div key={si} style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: c, borderRadius: "12px 0 0 12px" }} />
                              <div style={{ padding: "14px 14px 14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: c, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{si + 1}</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{sec.title}</div>
                                </div>
                                {sec.stat && (
                                  <div style={{ marginBottom: 6 }}>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: "-0.5px" }}>{sec.stat}</span>
                                    {sec.statLabel && <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600, marginTop: 1 }}>{sec.statLabel}</div>}
                                  </div>
                                )}
                                <div style={{ height: 1, background: "var(--border)", marginBottom: 6 }} />
                                {(sec.bullets || []).slice(0, 3).map((b, bi) => (
                                  <div key={bi} style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 2, paddingLeft: 8, position: "relative" }}>
                                    <span style={{ position: "absolute", left: 0, color: c }}>&#x2022;</span> {b}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Footer */}
                      <div style={{ textAlign: "center", marginTop: 14, padding: "10px 0", borderTop: "1px solid var(--border)", color: "var(--text-tertiary)", fontSize: 10 }}>Generated by HealthOS  |  AI-Powered Research Assistant</div>
                    </div>
                  ) : (
                    <pre style={{ fontFamily: "inherit", fontSize: 12, color: "var(--text-primary)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{modalData.content || "No content generated."}</pre>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── SOURCE DETAIL ── */}
          {modal === "source" && modalData && (
            <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 520, boxShadow: "var(--shadow-heavy)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: typeColor(modalData.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", color: typeColor(modalData.type), flexShrink: 0 }}><Ic n={typeIcon(modalData.type)} size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{modalData.title}</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{modalData.date} · {modalData.size}</div>
                </div>
                <button onClick={() => setModal(null)} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><Ic n="x" size={16} /></button>
              </div>
              <div style={{ padding: 20 }}>
                {[["Type", modalData.type.toUpperCase()], ["Status", modalData.status], ["Chunks", String(modalData.chunks || 0)], ["Size", modalData.size], ["Added", modalData.date]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{v}</span>
                  </div>
                ))}
                {modalData.url && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 9, background: "var(--primary-medium)", border: "1px solid var(--primary-border)" }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", marginBottom: 3 }}>Source URL</div><div style={{ fontSize: 11, color: "var(--info)" }}>{modalData.url}</div></div>}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", marginBottom: 7, textTransform: "uppercase", letterSpacing: .7 }}>Content Preview</div>
                  <div style={{ background: "var(--bg-tint)", borderRadius: 10, padding: 12, border: "1px solid var(--border)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>{modalData.content?.substring(0, 300)}{modalData.content?.length > 300 ? "…" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={() => { setChatInput(`Summarize: ${modalData.title}`); setView("chat"); setModal(null); sendMessage(`Summarize: ${modalData.title}`); }} style={{ flex: 1, padding: "9px 0", borderRadius: 9, background: "var(--gradient)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Ask AI About This</button>
                  <button onClick={() => deleteSource(modalData.id)} style={{ padding: "9px 14px", borderRadius: 9, background: "var(--danger-bg)", color: "var(--danger)", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {modal === "profile" && (
            <div style={{ background: "var(--bg-card)", borderRadius: 22, width: 360, boxShadow: "var(--shadow-heavy)", overflow: "hidden" }}>
              <div style={{ padding: "20px 22px", background: "var(--profile-gradient)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Ic n="user" size={28} /></div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{t("healthcareAnalyst")}</div>
                <div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{t("analystEmail")}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {["Pro Plan", "Llama 3.1", "Weaviate"].map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 20, background: "var(--primary-intense)", color: "var(--accent)", fontSize: 10, fontWeight: 700 }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: 18 }}>
                {[[t("notebooksCreated"), "12"], [t("totalSourcesProfile"), String(sources.length)], [t("outputsGenerated"), String(outputs.length)], [t("aiQueries"), String(messages.filter(m => m.role === "user").length)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
                  <button onClick={() => { setSettingsTab("general"); setModal("settings"); }} style={{ padding: "9px 0", borderRadius: 9, background: "var(--bg-tint)", color: "var(--text-primary)", fontSize: 12, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Ic n="settings" size={13} /> {t("accountSettings")}</button>
                  <button onClick={() => { setModal(null); toast(t("loggedOut"), "warn"); }} style={{ padding: "9px 0", borderRadius: 9, background: "var(--danger-bg)", color: "var(--danger)", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>{t("signOut")}</button>
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