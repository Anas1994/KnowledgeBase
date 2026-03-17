/**
 * Infographic Canvas Renderer — image-first, minimal text, rich visuals
 * Each section card: large AI image + overlay text + workflow/stat visuals
 */

const W = 1400;
const PAD = 48;
const GAP = 28;
const COL_W = (W - PAD * 2 - GAP) / 2;
const HEADER_H = 280;
const FOOTER_H = 70;
const CARD_PAD = 20;
const IMG_H = 260;
const palette = ['#004D40','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B','#EC4899','#10B981','#3B82F6','#D946EF'];

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

const loadImg = (b64) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = `data:image/jpeg;base64,${b64}`;
});

const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

export async function renderInfographicWithImages(out, apiUrl, toast) {
  const sections = out.slides_data;
  const themeName = out.theme || 'corporate';

  // Step 1: Generate AI images for ALL sections
  const toGenerate = sections.filter(s => !s.sectionImage).slice(0, 6);
  if (toGenerate.length > 0) {
    toast(`Generating ${toGenerate.length} infographic visuals...`, "warn");
    let done = 0;
    for (const sec of toGenerate) {
      try {
        toast(`Visual ${done + 1}/${toGenerate.length}: ${sec.title}...`, "warn");
        const res = await fetch(`${apiUrl}/api/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide_title: sec.title,
            slide_content: (sec.bullets || []).join(', '),
            layout: 'infographic',
            theme: themeName,
            image_keyword: sec.imageKeyword || sec.title
          })
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.imageBase64) { sec.sectionImage = result.imageBase64; done++; }
        }
      } catch (e) { console.error(`Image gen failed: ${sec.title}`, e); }
    }
    toast(`${done} visuals ready! Rendering infographic...`);
  } else {
    toast("Rendering infographic...", "warn");
  }

  // Step 2: Pre-load images
  const loadedImages = {};
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].sectionImage) loadedImages[i] = await loadImg(sections[i].sectionImage);
  }

  // Step 3: Calculate card heights
  const mCtx = document.createElement('canvas').getContext('2d');
  const contentW = COL_W - CARD_PAD * 2;
  const hasWorkflow = (s) => s.visualType === 'workflow' && s.workflowSteps?.length > 0;
  const hasStat = (s) => (s.visualType === 'stat' || s.stat) && s.stat;

  const cardHeights = sections.map((sec, si) => {
    let h = CARD_PAD;
    // Image area
    if (loadedImages[si]) h += IMG_H + 12;
    // Title + subtitle
    h += 52;
    // Stat highlight
    if (hasStat(sec)) h += 56;
    // Bullets (compact)
    mCtx.font = '12px Inter, Arial';
    (sec.bullets || []).slice(0, 2).forEach(b => { h += wrapText(mCtx, b, contentW - 20).length * 18 + 4; });
    h += 8;
    // Workflow
    if (hasWorkflow(sec)) h += 72;
    h += CARD_PAD;
    return Math.max(h, loadedImages[si] ? 440 : 260);
  });

  const rows = [];
  for (let i = 0; i < sections.length; i += 2) {
    rows.push(Math.max(cardHeights[i], i + 1 < sections.length ? cardHeights[i + 1] : 0));
  }
  const totalH = HEADER_H + rows.reduce((a, h) => a + h + GAP, GAP) + FOOTER_H;

  // Step 4: Canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#EFF3F8';
  ctx.fillRect(0, 0, W, totalH);
  // Subtle dot grid
  ctx.fillStyle = '#D8DFE8';
  for (let gx = 0; gx < W; gx += 30) {
    for (let gy = HEADER_H; gy < totalH - FOOTER_H; gy += 30) {
      ctx.beginPath(); ctx.arc(gx, gy, 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Header ──
  const hGrad = ctx.createLinearGradient(0, 0, W, 0);
  hGrad.addColorStop(0, '#004D40'); hGrad.addColorStop(0.5, '#006C5B'); hGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = hGrad;
  rr(ctx, 0, 0, W, HEADER_H, [0, 0, 20, 20]); ctx.fill();

  ctx.globalAlpha = 0.04; ctx.fillStyle = '#FFFFFF';
  [[120, 60, 80], [350, 180, 60], [900, 80, 100], [1100, 200, 50], [W - 100, 120, 70]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  const goldGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  goldGrad.addColorStop(0, '#C8A86B00'); goldGrad.addColorStop(0.3, '#C8A86B');
  goldGrad.addColorStop(0.7, '#C8A86B'); goldGrad.addColorStop(1, '#C8A86B00');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, W, 5);

  // Title
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 42px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(out.title.length > 55 ? out.title.substring(0, 52) + '...' : out.title, W / 2, 75);

  ctx.font = '18px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`Visual insights from ${sections.length} key areas`, W / 2, 118);

  ctx.strokeStyle = '#C8A86B'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 45, 148); ctx.lineTo(W / 2 + 45, 148); ctx.stroke();
  ctx.fillStyle = '#C8A86B';
  ctx.save(); ctx.translate(W / 2, 148); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();

  // Badges
  [{ label: `${sections.length} Sections`, icon: '\u25A6' }, { label: 'AI-Generated', icon: '\u2726' }, { label: 'HealthOS', icon: '\u2666' }]
    .forEach((badge, i) => {
      const bx = W / 2 + (i - 1) * 180;
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '13px Inter, Arial';
      const tw = ctx.measureText(badge.label).width + 40;
      rr(ctx, bx - tw / 2, 180, tw, 28, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
      rr(ctx, bx - tw / 2, 180, tw, 28, 14); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textAlign = 'center';
      ctx.fillText(`${badge.icon}  ${badge.label}`, bx, 196);
    });

  // Color indicators
  sections.forEach((_, si) => {
    const ix = W / 2 + (si - (sections.length - 1) / 2) * 22;
    ctx.fillStyle = palette[si % palette.length];
    rr(ctx, ix - 6, 230, 12, 5, 3); ctx.fill();
  });

  // ── Section Cards ──
  let yOff = HEADER_H + GAP;
  sections.forEach((section, idx) => {
    const col = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const cardX = PAD + col * (COL_W + GAP);
    const cardY = yOff;
    const rowH = rows[rowIdx];
    const color = palette[idx % palette.length];
    const imgObj = loadedImages[idx];
    const isWf = hasWorkflow(section);
    const isSt = hasStat(section);

    // Card shadow + bg
    ctx.shadowColor = 'rgba(0,0,0,0.07)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    rr(ctx, cardX, cardY, COL_W, rowH, 16); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Top color accent
    ctx.fillStyle = color;
    rr(ctx, cardX, cardY, COL_W, 5, [16, 16, 0, 0]); ctx.fill();

    let cy = cardY + CARD_PAD;

    // ── Large Image ──
    if (imgObj) {
      const imgX = cardX + CARD_PAD;
      const imgW = COL_W - CARD_PAD * 2;
      ctx.save();
      rr(ctx, imgX, cy, imgW, IMG_H, 12); ctx.clip();
      const scale = Math.max(imgW / imgObj.width, IMG_H / imgObj.height);
      const dw = imgObj.width * scale, dh = imgObj.height * scale;
      ctx.drawImage(imgObj, imgX + (imgW - dw) / 2, cy + (IMG_H - dh) / 2, dw, dh);
      ctx.restore();
      // Gradient overlay at bottom of image for readability
      const oGrad = ctx.createLinearGradient(imgX, cy + IMG_H - 60, imgX, cy + IMG_H);
      oGrad.addColorStop(0, 'rgba(0,0,0,0)'); oGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = oGrad;
      rr(ctx, imgX, cy, imgW, IMG_H, 12); ctx.fill();
      // Section number badge on image
      ctx.fillStyle = color;
      rr(ctx, imgX + 12, cy + 12, 32, 32, 8); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 15px Inter, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), imgX + 28, cy + 28);
      // Subtle border
      ctx.strokeStyle = color + '25'; ctx.lineWidth = 1.5;
      rr(ctx, imgX, cy, imgW, IMG_H, 12); ctx.stroke();
      cy += IMG_H + 12;
    } else {
      // No image — color block header
      const blockH = 70;
      ctx.fillStyle = color + '12';
      rr(ctx, cardX + CARD_PAD, cy, COL_W - CARD_PAD * 2, blockH, 10); ctx.fill();
      ctx.fillStyle = color;
      rr(ctx, cardX + CARD_PAD + 12, cy + 14, 34, 34, 8); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px Inter, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), cardX + CARD_PAD + 29, cy + 31);
      cy += blockH + 8;
    }

    // ── Title + Subtitle ──
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1A1F36'; ctx.font = 'bold 18px Inter, Arial';
    ctx.fillText(section.title || 'Section', cardX + CARD_PAD + 4, cy + 16);
    if (section.subtitle) {
      ctx.fillStyle = '#64748B'; ctx.font = '13px Inter, Arial';
      ctx.fillText(section.subtitle, cardX + CARD_PAD + 4, cy + 36);
    }
    cy += 48;

    // ── Stat Highlight ──
    if (isSt) {
      const stX = cardX + CARD_PAD + 4;
      ctx.fillStyle = color + '10';
      rr(ctx, stX, cy, contentW, 44, 8); ctx.fill();
      ctx.fillStyle = color + '30';
      rr(ctx, stX, cy, 5, 44, [8, 0, 0, 8]); ctx.fill();
      ctx.fillStyle = color; ctx.font = 'bold 26px Inter, Arial';
      ctx.fillText(section.stat, stX + 16, cy + 28);
      if (section.statLabel) {
        const sw = ctx.measureText(section.stat).width;
        ctx.fillStyle = '#64748B'; ctx.font = '12px Inter, Arial';
        ctx.fillText(section.statLabel, stX + 20 + sw + 8, cy + 27);
      }
      cy += 52;
    }

    // ── Compact Bullets ──
    ctx.font = '12px Inter, Arial';
    (section.bullets || []).slice(0, 2).forEach((bullet) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cardX + CARD_PAD + 8, cy + 4, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#475569';
      const lines = wrapText(ctx, bullet, contentW - 20);
      lines.forEach((line, li) => { ctx.fillText(line, cardX + CARD_PAD + 18, cy + 8 + li * 18); });
      cy += lines.length * 18 + 4;
    });
    cy += 4;

    // ── Workflow Diagram ──
    if (isWf) {
      const steps = section.workflowSteps.slice(0, 5);
      const stepCount = steps.length;
      const stepW = Math.min(120, (contentW - (stepCount - 1) * 16) / stepCount);
      const gap = 16;
      const totalStepW = stepCount * stepW + (stepCount - 1) * gap;
      const startX = cardX + CARD_PAD + (contentW - totalStepW) / 2;

      // Workflow background
      ctx.fillStyle = color + '08';
      rr(ctx, cardX + CARD_PAD, cy, contentW, 64, 8); ctx.fill();
      // Label
      ctx.fillStyle = color + '70'; ctx.font = 'bold 8px Inter, Arial';
      ctx.textAlign = 'left';
      ctx.fillText('WORKFLOW', cardX + CARD_PAD + 8, cy + 10);

      steps.forEach((step, si) => {
        const sx = startX + si * (stepW + gap);
        const isFirst = si === 0;
        const isLast = si === stepCount - 1;
        // Step pill
        ctx.fillStyle = isFirst ? color : isLast ? color + 'CC' : color + '70';
        rr(ctx, sx, cy + 18, stepW, 36, 8); ctx.fill();
        // Number
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(sx + 14, cy + 36, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 9px Inter, Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(si + 1), sx + 14, cy + 36);
        // Step label
        ctx.fillStyle = '#FFFFFF'; ctx.font = '10px Inter, Arial';
        const sl = wrapText(ctx, step, stepW - 28);
        sl.slice(0, 2).forEach((l, li) => {
          ctx.fillText(l, sx + stepW / 2 + 6, cy + 36 + (li - (Math.min(sl.length, 2) - 1) / 2) * 12);
        });
        // Arrow
        if (si < stepCount - 1) {
          const ax = sx + stepW + 2;
          ctx.strokeStyle = color + '45'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(ax, cy + 36); ctx.lineTo(ax + gap - 4, cy + 36); ctx.stroke();
          ctx.fillStyle = color + '45';
          ctx.beginPath();
          ctx.moveTo(ax + gap - 4, cy + 36);
          ctx.lineTo(ax + gap - 9, cy + 32);
          ctx.lineTo(ax + gap - 9, cy + 40);
          ctx.closePath(); ctx.fill();
        }
      });
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    if (col === 1 || idx === sections.length - 1) yOff += rowH + GAP;
  });

  // Timeline
  const tlX = PAD / 2 + 2;
  ctx.strokeStyle = '#006C5B30'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(tlX, HEADER_H + GAP + 30); ctx.lineTo(tlX, totalH - FOOTER_H - 10); ctx.stroke();
  ctx.setLineDash([]);
  let tlY = HEADER_H + GAP;
  rows.forEach((rh, ri) => {
    ctx.fillStyle = palette[ri * 2 % palette.length];
    ctx.beginPath(); ctx.arc(tlX, tlY + rh / 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(tlX, tlY + rh / 2, 2, 0, Math.PI * 2); ctx.fill();
    tlY += rh + GAP;
  });

  // ── Footer ──
  const fGrad = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fGrad.addColorStop(0, '#004D40'); fGrad.addColorStop(0.5, '#006C5B'); fGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = fGrad;
  rr(ctx, 0, totalH - FOOTER_H, W, FOOTER_H, [20, 20, 0, 0]); ctx.fill();
  ctx.fillStyle = goldGrad; ctx.fillRect(0, totalH - FOOTER_H, W, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '15px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Generated by HealthOS  |  AI-Powered Research Assistant', W / 2, totalH - FOOTER_H / 2 + 3);

  // Export
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_infographic.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Infographic downloaded!");
      resolve();
    }, 'image/png');
  });
}
