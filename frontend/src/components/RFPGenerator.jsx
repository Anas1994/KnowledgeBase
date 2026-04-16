import { useState, useRef, useCallback, useEffect } from "react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SAMPLE_SECTIONS = [
  "Executive Summary",
  "Background & Context",
  "Definitions & Acronyms",
  "Project Objectives",
  "Scope of Work",
  "Technical Requirements",
  "Deliverables & Acceptance Criteria",
  "Timeline & Milestones",
  "Commercial Model & Budget",
  "Evaluation Criteria",
  "Instructions to Bidders",
  "Submission Requirements",
  "Legal Terms & Conditions",
  "Data Protection & Security Compliance",
  "Appendices"
];

const PROGRESS_STEPS = [
  "Analyzing knowledge base",
  "Writing Executive Summary",
  "Building Background & Context",
  "Defining Terms & Acronyms",
  "Structuring Objectives",
  "Mapping Scope of Work",
  "Detailing Technical Requirements",
  "Defining Deliverables",
  "Planning Timeline & Milestones",
  "Structuring Commercial Model",
  "Building Evaluation Criteria",
  "Writing Bidder Instructions",
  "Defining Submission Requirements",
  "Adding Legal & Compliance",
  "Compiling Appendices",
  "Finalizing document"
];

const TONES = ["Formal", "Technical", "Executive", "Proposal-style"];

// Simple icon SVGs
const Icons = {
  doc: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  upload: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  print: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
};

// ── Rich content renderer for RFP sections (tables, bullets, sub-headings) ──
function RfpContent({ text }) {
  if (!text) return null;
  const clean = text.replace(/\[Source:[^\]]*\]/g, '').trim();
  const lines = clean.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Markdown table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse table: skip separator row (---), treat first as header
      const rows = tableLines
        .filter(r => !r.replace(/[|\-\s:]/g, '').length === false)
        .filter(r => !/^\|[\s\-:]+\|$/.test(r.replace(/\s/g, '').replace(/-+/g, '-')))
        .map(r => r.split('|').filter((c, ci, arr) => ci > 0 && ci < arr.length - (r.trim().endsWith('|') ? 1 : 0)).map(c => c.trim()));
      const isSeparator = (r) => r.every(c => /^[\-:]+$/.test(c));
      const dataRows = rows.filter(r => !isSeparator(r));
      if (dataRows.length > 0) {
        const headerRow = dataRows[0];
        const bodyRows = dataRows.slice(1);
        elements.push(
          <div key={`tbl-${i}`} style={{ margin: "14px 0", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#004D40" }}>
                  {headerRow.map((h, hi) => (
                    <th key={hi} style={{ padding: "8px 12px", color: "#fff", fontWeight: 700, textAlign: "left", borderBottom: "2px solid #C8A86B", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "#F8FAFB" : "#fff" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "7px 12px", borderBottom: "1px solid #E5E7EB", color: "#374151", fontSize: 12 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Sub-headings (### or **)
    if (/^#{2,4}\s/.test(line)) {
      const level = (line.match(/^#+/) || [''])[0].length;
      const txt = line.replace(/^#+\s*/, '');
      elements.push(
        <div key={`h-${i}`} style={{ fontSize: level <= 2 ? 14 : 13, fontWeight: 700, color: level <= 2 ? "#004D40" : "#1A1F36", marginTop: level <= 2 ? 18 : 12, marginBottom: 6 }}>{txt}</div>
      );
      i++;
      continue;
    }

    // Bullet points
    if (/^\s*[-*•]\s/.test(line)) {
      const bullets = [];
      while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) {
        bullets.push(lines[i].replace(/^\s*[-*•]\s*/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0", paddingLeft: 18 }}>
          {bullets.map((b, bi) => (
            <li key={bi} style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginBottom: 3 }}>
              <BoldText text={b} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (/^\s*\d+[.)]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0", paddingLeft: 22 }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginBottom: 3 }}>
              <BoldText text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line = paragraph break
    if (!line.trim()) { i++; continue; }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} style={{ fontSize: 13, color: "#374151", lineHeight: 1.85, margin: "0 0 10px 0" }}>
        <BoldText text={line} />
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function BoldText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: "#1A1F36" }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  })}</>;
}

export default function RFPGenerator({ open, onClose, toast, sources, onSaveNote }) {
  const [step, setStep] = useState(1); // 1=upload, 2=configure, 3=loading, 4=preview
  const [templateFile, setTemplateFile] = useState(null);
  const [templateSections, setTemplateSections] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [tone, setTone] = useState("Formal");
  const [additionalCtx, setAdditionalCtx] = useState("");
  const [progressIdx, setProgressIdx] = useState(0);
  const [rfpResult, setRfpResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setTemplateFile(null);
      setTemplateSections([]);
      setProjectName("");
      setClientName("");
      setTone("Formal");
      setAdditionalCtx("");
      setProgressIdx(0);
      setRfpResult(null);
    }
  }, [open]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const valid = /\.(pdf|docx|txt)$/i.test(file.name);
    if (!valid) { toast("Please upload PDF, DOCX, or TXT files only", "error"); return; }
    setTemplateFile(file);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/rfp/parse-template`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Parse failed');
      const data = await res.json();
      setTemplateSections(data.sections || SAMPLE_SECTIONS);
      toast(`Template parsed: ${(data.sections || []).length} sections detected`);
    } catch (e) {
      console.error('Template parse error:', e);
      toast("Could not parse template. Using standard sections.", "warn");
      setTemplateSections(SAMPLE_SECTIONS);
    }
    setParsing(false);
    setStep(2);
  }, [toast]);

  const useSample = useCallback(() => {
    setTemplateFile({ name: "Enterprise_RFP_Template.txt", size: 4096 });
    setTemplateSections(SAMPLE_SECTIONS);
    toast("Using enterprise RFP template with 15 sections");
    setStep(2);
  }, [toast]);

  const generate = useCallback(async () => {
    if (!templateSections.length) { toast("No template sections", "error"); return; }
    setStep(3);
    setProgressIdx(0);

    try {
      // Batch sections — 1 section per call for comprehensive generation
      const batchSize = 1;
      const batches = [];
      for (let i = 0; i < templateSections.length; i += batchSize) {
        batches.push(templateSections.slice(i, i + batchSize));
      }

      const allSections = [];
      let sourceNames = [];
      const stepsPerBatch = Math.floor(PROGRESS_STEPS.length / batches.length);

      for (let bi = 0; bi < batches.length; bi++) {
        // Update progress
        const stepIdx = Math.min(bi * stepsPerBatch + 1, PROGRESS_STEPS.length - 1);
        setProgressIdx(stepIdx);

        let retries = 2;
        let data = null;
        while (retries > 0) {
          try {
            const res = await fetch(`${API_URL}/api/rfp/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                template_sections: batches[bi],
                project_name: projectName,
                client_name: clientName,
                tone,
                additional_context: additionalCtx,
                notebook_id: 'default'
              })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
            break;
          } catch (err) {
            retries--;
            if (retries > 0) {
              console.warn(`Batch ${bi + 1} failed, retrying... (${err.message})`);
              await new Promise(r => setTimeout(r, 2000));
            } else {
              throw new Error(`Batch ${bi + 1} failed after retries: ${err.message}`);
            }
          }
        }
        if (data) {
          allSections.push(...(data.sections || []));
          if (data.source_names) sourceNames = data.source_names;
        }
      }

      // Final progress
      setProgressIdx(PROGRESS_STEPS.length);
      await new Promise(r => setTimeout(r, 400));

      // Build full text
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      let fullText = `REQUEST FOR PROPOSAL\n${projectName || 'Project'}\nPrepared for: ${clientName || 'Organization'}\nDate: ${date}\n\n${'='.repeat(60)}\n\n`;
      for (const sec of allSections) {
        fullText += `\n${'='.repeat(60)}\n${sec.section.toUpperCase()}\n${'='.repeat(60)}\n\n${sec.content}\n\n`;
      }

      setRfpResult({
        sections: allSections,
        full_text: fullText,
        project_name: projectName,
        client_name: clientName,
        tone,
        source_names: sourceNames
      });
      setStep(4);
      toast("RFP generated successfully!");
    } catch (e) {
      console.error('RFP generation error:', e);
      toast("RFP generation failed. Please try again.", "error");
      setStep(2);
    }
  }, [templateSections, projectName, clientName, tone, additionalCtx, toast]);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportFile = useCallback(async (format) => {
    if (!rfpResult || exporting) return;
    setExporting(true);
    setExportMenuOpen(false);
    toast(`Exporting as ${format.toUpperCase()}...`, "warn");
    
    try {
      const res = await fetch(`${API_URL}/api/rfp/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: rfpResult.sections,
          project_name: rfpResult.project_name || projectName,
          client_name: rfpResult.client_name || clientName,
          tone: rfpResult.tone || tone,
          source_names: rfpResult.source_names || [],
          format
        })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const ext = format === 'pdf' ? 'pdf' : 'docx';
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(projectName || 'RFP').replace(/[<>:"/\\|?*]/g, "_")}_RFP.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast(`RFP exported as ${format.toUpperCase()}`);
    } catch (e) {
      console.error('Export error:', e);
      toast(`Export failed. Please try again.`, "error");
    }
    setExporting(false);
  }, [rfpResult, projectName, clientName, tone, exporting, toast]);

  const stripCitations = (text) => text.replace(/\[Source:[^\]]*\]/g, '').replace(/\s{2,}/g, ' ').trim();

  const copyAll = useCallback(() => {
    if (!rfpResult) return;
    const cleanText = rfpResult.sections.map(s => `${s.section}\n\n${stripCitations(s.content)}`).join('\n\n---\n\n');
    navigator.clipboard?.writeText(cleanText).catch(() => {});
    toast("RFP copied to clipboard");
  }, [rfpResult, toast]);

  const saveNote = useCallback(() => {
    if (!rfpResult || !onSaveNote) return;
    const cleanText = rfpResult.sections.map(s => `${s.section}\n\n${stripCitations(s.content)}`).join('\n\n---\n\n');
    onSaveNote({ content: cleanText });
    toast("RFP saved to Notes");
  }, [rfpResult, onSaveNote, toast]);

  const regenerate = useCallback(() => {
    setRfpResult(null);
    generate();
  }, [generate]);

  const printRfp = useCallback(() => {
    const w = window.open('', '_blank');
    if (!w || !rfpResult) return;
    const html = rfpResult.sections.map((s, i) =>
      `<h2 style="color:#004D40;border-bottom:2px solid #C8A86B;padding-bottom:8px;margin-top:32px;font-size:18px;">${i + 1}. ${s.section}</h2><div style="font-size:13px;line-height:1.8;color:#374151;white-space:pre-wrap;">${stripCitations(s.content)}</div>`
    ).join('');
    w.document.write(`<html><head><title>${projectName || 'RFP'}</title><style>body{font-family:Calibri,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;}h1{color:#004D40;font-size:28px;}</style></head><body><h1>${projectName || 'Request for Proposal'}</h1><p style="color:#666;">Prepared for: ${clientName || 'Organization'} | ${new Date().toLocaleDateString()}</p>${html}</body></html>`);
    w.document.close();
    w.print();
  }, [rfpResult, projectName, clientName]);

  if (!open) return null;

  const accentColor = "#F97316";

  // Close export menu on outside click
  const handleOverlayClick = (e) => {
    if (exportMenuOpen && !e.target.closest('[data-testid="rfp-export-menu"]') && !e.target.closest('[data-testid="rfp-export-btn"]')) {
      setExportMenuOpen(false);
    }
  };

  return (
    <div data-testid="rfp-modal-overlay" onClick={handleOverlayClick} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>

      {/* ── STEP 1 & 2: Upload + Configure ── */}
      {(step === 1 || step === 2) && (
        <div data-testid="rfp-wizard-modal" style={{ background: "var(--bg-card)", borderRadius: 22, width: 580, boxShadow: "0 24px 80px rgba(0,0,0,.25)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: accentColor + "18", display: "flex", alignItems: "center", justifyContent: "center", color: accentColor }}>
                {Icons.doc}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>Generate RFP from Template</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>AI-powered document generation</div>
              </div>
            </div>
            <button data-testid="rfp-close-btn" onClick={onClose} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>{Icons.x}</button>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "14px 24px", background: "var(--bg-tint)" }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= s ? accentColor : "var(--border)", color: step >= s ? "#fff" : "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, transition: "all .3s" }}>{step > s ? <span style={{ color: "#fff" }}>&#10003;</span> : s}</div>
                <div style={{ marginLeft: 8, fontSize: 11, fontWeight: step === s ? 700 : 500, color: step === s ? "var(--text-primary)" : "var(--text-tertiary)" }}>{s === 1 ? "Upload Template" : "Configure"}</div>
                {s < 2 && <div style={{ flex: 1, height: 2, background: step > 1 ? accentColor : "var(--border)", marginLeft: 12, borderRadius: 1, transition: "background .3s" }} />}
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
            {step === 1 && (
              <>
                <div
                  data-testid="rfp-dropzone"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? accentColor : "var(--border)"}`, borderRadius: 16, padding: "40px 20px", textAlign: "center", background: dragOver ? accentColor + "08" : "var(--bg-tint)", cursor: "pointer", transition: "all .2s" }}
                >
                  <div style={{ color: dragOver ? accentColor : "var(--text-tertiary)", display: "flex", justifyContent: "center", marginBottom: 10 }}>{Icons.upload}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: dragOver ? accentColor : "var(--text-secondary)" }}>
                    {parsing ? "Parsing template..." : "Drop your RFP template here"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>Supports PDF, DOCX, TXT</div>
                  {parsing && <div style={{ marginTop: 12 }}><div className="spin" style={{ width: 20, height: 20, border: `2px solid ${accentColor}30`, borderTop: `2px solid ${accentColor}`, borderRadius: "50%", margin: "0 auto" }} /></div>}
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>
                <div style={{ textAlign: "center", margin: "16px 0", fontSize: 11, color: "var(--text-tertiary)" }}>or</div>
                <button data-testid="rfp-sample-btn" onClick={useSample} style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: accentColor + "10", color: accentColor, fontSize: 13, fontWeight: 700, border: `1px solid ${accentColor}30`, cursor: "pointer" }}>
                  Use Enterprise Template (15 standard sections)
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Template info */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: accentColor + "08", border: `1px solid ${accentColor}20`, marginBottom: 18 }}>
                  <div style={{ color: accentColor }}>{Icons.file}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{templateFile?.name || "Template"}</div>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{templateSections.length} sections detected</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ fontSize: 10, fontWeight: 600, color: accentColor, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                </div>

                {/* Fields */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Project Name</label>
                  <input data-testid="rfp-project-name" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Hospital at Home Platform" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-tint)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13 }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Client / Organization Name</label>
                  <input data-testid="rfp-client-name" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Ministry of Health" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-tint)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13 }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>RFP Tone</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {TONES.map(t => (
                      <button data-testid={`rfp-tone-${t.toLowerCase()}`} key={t} onClick={() => setTone(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: tone === t ? accentColor : "var(--bg-tint)", color: tone === t ? "#fff" : "var(--text-secondary)", fontSize: 11, fontWeight: 700, border: tone === t ? "none" : "1px solid var(--border)", cursor: "pointer", transition: "all .2s" }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Additional Context or Instructions</label>
                  <textarea data-testid="rfp-context" value={additionalCtx} onChange={e => setAdditionalCtx(e.target.value)} placeholder="Any specific instructions for the AI..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-tint)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }} />
                </div>

                {/* Sections preview */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Template Sections ({templateSections.length})</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {templateSections.map((s, i) => (
                      <span key={i} style={{ padding: "4px 10px", borderRadius: 6, background: "var(--bg-tint)", border: "1px solid var(--border)", fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {step === 2 && (
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStep(1)} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--bg-tint)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer" }}>Back</button>
              <button data-testid="rfp-generate-btn" onClick={generate} style={{ padding: "10px 28px", borderRadius: 10, background: `linear-gradient(135deg, ${accentColor}, #EA580C)`, color: "#fff", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: `0 4px 14px ${accentColor}40` }}>
                Generate RFP
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Loading ── */}
      {step === 3 && (
        <div data-testid="rfp-loading" style={{ background: "#0B0D1A", borderRadius: 22, width: 500, padding: "48px 40px", boxShadow: "0 24px 80px rgba(0,0,0,.5)", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: accentColor + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: accentColor }}>{Icons.doc}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Generating RFP</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>{projectName || "Your document"} for {clientName || "Organization"}</div>
          <div style={{ textAlign: "left" }}>
            {PROGRESS_STEPS.map((s, i) => {
              const done = i < progressIdx;
              const active = i === progressIdx - 1 || (i === 0 && progressIdx === 0);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", opacity: done || active ? 1 : 0.3, transition: "opacity .5s ease" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: done ? "#22C55E" : active ? accentColor + "30" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .3s" }}>
                    {done ? <span style={{ color: "#fff" }}>{Icons.check}</span> : active ? <div className="spin" style={{ width: 12, height: 12, border: `2px solid ${accentColor}40`, borderTop: `2px solid ${accentColor}`, borderRadius: "50%" }} /> : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />}
                  </div>
                  <span style={{ fontSize: 13, color: done ? "#22C55E" : active ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: done || active ? 600 : 400 }}>{s}{done ? " ✓" : active ? "..." : ""}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg, ${accentColor}, #EA580C)`, borderRadius: 2, width: `${(progressIdx / PROGRESS_STEPS.length) * 100}%`, transition: "width .5s ease" }} />
          </div>
        </div>
      )}

      {/* ── STEP 4: Preview ── */}
      {step === 4 && rfpResult && (
        <div data-testid="rfp-preview-modal" style={{ background: "var(--bg-card)", borderRadius: 22, width: "85vw", maxWidth: 860, height: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Preview Header */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: accentColor + "18", display: "flex", alignItems: "center", justifyContent: "center", color: accentColor }}>{Icons.doc}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{rfpResult.project_name || "RFP Document"}</div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>For: {rfpResult.client_name || "Organization"} · {rfpResult.sections?.length || 0} sections · {rfpResult.tone} tone</div>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button data-testid="rfp-export-btn" onClick={() => setExportMenuOpen(!exportMenuOpen)} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: accentColor + "18", color: accentColor, fontSize: 11, fontWeight: 700, border: "none", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.6 : 1 }}>
                  {exporting ? <div className="spin" style={{ width: 12, height: 12, border: `2px solid ${accentColor}40`, borderTop: `2px solid ${accentColor}`, borderRadius: "50%" }} /> : Icons.download}
                  {exporting ? "Exporting..." : "Export"}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {exportMenuOpen && (
                  <div data-testid="rfp-export-menu" style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--bg-card)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,.18)", border: "1px solid var(--border)", overflow: "hidden", zIndex: 10, minWidth: 160 }}>
                    <button data-testid="rfp-export-docx" onClick={() => exportFile('docx')} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 6, background: "#2563EB18", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>DOC</span>
                      <div>
                        <div>Word Document</div>
                        <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 400 }}>.docx with headings & styles</div>
                      </div>
                    </button>
                    <div style={{ height: 1, background: "var(--border)" }} />
                    <button data-testid="rfp-export-pdf" onClick={() => exportFile('pdf')} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 6, background: "#DC262618", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>PDF</span>
                      <div>
                        <div>PDF Document</div>
                        <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 400 }}>.pdf with formatted layout</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button data-testid="rfp-copy-btn" onClick={copyAll} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: "var(--bg-tint)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, border: "1px solid var(--border)", cursor: "pointer" }}>{Icons.copy} Copy</button>
              <button data-testid="rfp-save-btn" onClick={saveNote} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: "var(--bg-tint)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, border: "1px solid var(--border)", cursor: "pointer" }}>{Icons.save} Save</button>
              <button data-testid="rfp-regen-btn" onClick={regenerate} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: "var(--bg-tint)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, border: "1px solid var(--border)", cursor: "pointer" }}>{Icons.refresh} Regen</button>
              <button data-testid="rfp-print-btn" onClick={printRfp} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, background: "var(--bg-tint)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, border: "1px solid var(--border)", cursor: "pointer" }}>{Icons.print} Print</button>
              <button onClick={onClose} style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex", marginLeft: 4 }}>{Icons.x}</button>
            </div>
          </div>

          {/* Document Preview */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
            <div style={{ maxWidth: 720, margin: "28px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 20px rgba(0,0,0,.06)", border: "1px solid #E5E7EB" }}>
              {/* Document Title Page */}
              <div style={{ padding: "40px 48px 32px", borderBottom: "3px solid #004D40", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Request for Proposal</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#1A1F36", marginBottom: 8, letterSpacing: "-0.5px" }}>{rfpResult.project_name || "Project"}</div>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>Prepared for: <strong style={{ color: "#1A1F36" }}>{rfpResult.client_name || "Organization"}</strong></div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {rfpResult.tone} Tone</div>
              </div>

              {/* Sections */}
              <div style={{ padding: "0 48px 40px" }}>
                {(rfpResult.sections || []).map((sec, si) => (
                  <div key={si} style={{ marginTop: 32 }} data-testid={`rfp-section-${si}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: "#004D40", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{si + 1}</div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#004D40", margin: 0 }}>{sec.section}</h2>
                    </div>
                    <div style={{ borderLeft: "3px solid #E5E7EB", paddingLeft: 20, marginLeft: 12 }}>
                      <RfpContent text={sec.content} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
