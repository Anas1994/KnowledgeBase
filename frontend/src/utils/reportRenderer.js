/**
 * Visual Report Renderer — image-first, minimal text, professional canvas PNG
 */

const W = 1400;
const PAD = 50;
const SEC_GAP = 32;
const HEADER_H = 260;
const FOOTER_H = 60;
const IMG_W = 520;
const IMG_H = 300;
const palette = ['#004D40','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B','#EC4899','#10B981'];

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

const drawRoundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

export async function renderVisualReport(out, apiUrl, toast) {
  const sections = out.slides_data || [];
  if (!sections.length) { toast("No report sections to render", "warn"); return; }

  const themeName = out.theme || 'corporate';

  // Step 1: Generate AI images for ALL sections (image-first design)
  const toGen = sections.filter(s => !s.sectionImage).slice(0, 5);
  if (toGen.length > 0) {
    toast(`Generating ${toGen.length} report visuals...`, "warn");
    let done = 0;
    for (const sec of toGen) {
      try {
        toast(`Visual ${done + 1}/${toGen.length}: ${sec.title}...`, "warn");
        const res = await fetch(`${apiUrl}/api/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slide_title: sec.title,
            slide_content: (sec.bullets || []).join(', '),
            layout: 'report',
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
    toast(`${done} visuals ready! Rendering report...`);
  } else {
    toast("Rendering report...", "warn");
  }

  // Step 2: Pre-load images
  const loadedImages = {};
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].sectionImage) loadedImages[i] = await loadImg(sections[i].sectionImage);
  }

  // Step 3: Measure section heights
  const mCtx = document.createElement('canvas').getContext('2d');
  const contentW = W - PAD * 2;

  const sectionHeights = sections.map((sec, si) => {
    const hasImg = !!loadedImages[si];
    const hasWorkflow = sec.visualType === 'workflow' && sec.workflowSteps?.length > 0;
    const hasStat = sec.visualType === 'stat' && sec.stat;
    const isEven = si % 2 === 0;

    let h = 0;
    // Title + subtitle
    h += 60;
    // Main content area: image + text side by side
    if (hasImg) {
      // Image takes the large portion, text is compact alongside
      const textH = 40 + (sec.bullets || []).length * 24 + (hasStat ? 70 : 0);
      h += Math.max(IMG_H, textH) + 16;
    } else {
      h += (sec.bullets || []).length * 24 + 30 + (hasStat ? 80 : 0);
    }
    // Workflow below
    if (hasWorkflow) h += 90;
    h += 20; // padding
    return Math.max(h, hasImg ? 400 : 200);
  });

  const totalH = HEADER_H + sectionHeights.reduce((a, h) => a + h + SEC_GAP, SEC_GAP) + FOOTER_H;

  // Step 4: Draw canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F8FAFB';
  ctx.fillRect(0, 0, W, totalH);

  // Header
  const hGrad = ctx.createLinearGradient(0, 0, W, 0);
  hGrad.addColorStop(0, '#004D40'); hGrad.addColorStop(0.5, '#006C5B'); hGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Gold accent line
  const goldGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  goldGrad.addColorStop(0, '#C8A86B00'); goldGrad.addColorStop(0.3, '#C8A86B');
  goldGrad.addColorStop(0.7, '#C8A86B'); goldGrad.addColorStop(1, '#C8A86B00');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, W, 4);

  // Decorative circles
  ctx.globalAlpha = 0.04; ctx.fillStyle = '#FFFFFF';
  [[100, 50, 70], [W - 150, 80, 90], [W / 2, 200, 50]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Report label
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '12px Inter, Arial'; ctx.textAlign = 'center';
  const labelW = ctx.measureText('VISUAL REPORT').width + 30;
  drawRoundRect(ctx, W / 2 - labelW / 2, 30, labelW, 26, 13); ctx.fill();
  ctx.fillStyle = '#C8A86B'; ctx.fillText('VISUAL REPORT', W / 2, 47);

  // Title
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 38px Inter, Arial';
  ctx.fillText(out.title.length > 55 ? out.title.substring(0, 52) + '...' : out.title, W / 2, 105);

  // Divider
  ctx.strokeStyle = '#C8A86B'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 40, 130); ctx.lineTo(W / 2 + 40, 130); ctx.stroke();

  // Meta
  ctx.font = '16px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`${sections.length} Sections  |  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  |  AI-Generated`, W / 2, 158);

  // Section color indicators
  sections.forEach((_, si) => {
    const ix = W / 2 + (si - (sections.length - 1) / 2) * 24;
    ctx.fillStyle = palette[si % palette.length];
    drawRoundRect(ctx, ix - 6, 190, 12, 5, 2.5); ctx.fill();
  });

  // ── Sections ──
  let yOff = HEADER_H + SEC_GAP;
  sections.forEach((sec, idx) => {
    const cardX = PAD;
    const cardY = yOff;
    const cardW = contentW;
    const cardH = sectionHeights[idx];
    const color = palette[idx % palette.length];
    const hasImg = !!loadedImages[idx];
    const hasWorkflow = sec.visualType === 'workflow' && sec.workflowSteps?.length > 0;
    const hasStat = (sec.visualType === 'stat' || sec.stat) && sec.stat;
    const imgOnLeft = idx % 2 === 0;

    // Card shadow + bg
    ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(ctx, cardX, cardY, cardW, cardH, 16); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Top accent line
    ctx.fillStyle = color;
    drawRoundRect(ctx, cardX, cardY, cardW, 4, [16, 16, 0, 0]); ctx.fill();

    // Section number badge
    ctx.fillStyle = color;
    drawRoundRect(ctx, cardX + 20, cardY + 16, 34, 34, 10); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px Inter, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(idx + 1), cardX + 37, cardY + 33);

    // Title
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1A1F36'; ctx.font = 'bold 22px Inter, Arial';
    ctx.fillText(sec.title || 'Section', cardX + 66, cardY + 39);

    // Subtitle
    if (sec.subtitle) {
      ctx.fillStyle = '#64748B'; ctx.font = '14px Inter, Arial';
      ctx.fillText(sec.subtitle, cardX + 66, cardY + 58);
    }

    let contentStartY = cardY + 72;

    if (hasImg) {
      const imgObj = loadedImages[idx];
      const imgX = imgOnLeft ? cardX + 18 : cardX + cardW - IMG_W - 18;
      const imgY = contentStartY;
      const textX = imgOnLeft ? imgX + IMG_W + 28 : cardX + 28;
      const textW = cardW - IMG_W - 64;

      // Draw image with rounded corners
      ctx.save();
      drawRoundRect(ctx, imgX, imgY, IMG_W, IMG_H, 12); ctx.clip();
      const scale = Math.max(IMG_W / imgObj.width, IMG_H / imgObj.height);
      const dw = imgObj.width * scale, dh = imgObj.height * scale;
      ctx.drawImage(imgObj, imgX + (IMG_W - dw) / 2, imgY + (IMG_H - dh) / 2, dw, dh);
      ctx.restore();
      // Subtle border
      ctx.strokeStyle = color + '30'; ctx.lineWidth = 1.5;
      drawRoundRect(ctx, imgX, imgY, IMG_W, IMG_H, 12); ctx.stroke();

      // Stat highlight (if present)
      let ty = imgY + 10;
      if (hasStat) {
        // Stat card
        ctx.fillStyle = color + '10';
        drawRoundRect(ctx, textX, ty, textW, 60, 10); ctx.fill();
        ctx.fillStyle = color + '20';
        drawRoundRect(ctx, textX, ty, 5, 60, [10, 0, 0, 10]); ctx.fill();
        ctx.fillStyle = color; ctx.font = 'bold 32px Inter, Arial';
        ctx.textAlign = 'left';
        ctx.fillText(sec.stat, textX + 18, ty + 36);
        if (sec.statLabel) {
          ctx.fillStyle = '#64748B'; ctx.font = '12px Inter, Arial';
          ctx.fillText(sec.statLabel, textX + 18, ty + 52);
        }
        ty += 72;
      }

      // Bullets (compact)
      ctx.font = '13px Inter, Arial';
      (sec.bullets || []).slice(0, 2).forEach((bullet) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(textX + 5, ty + 5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#475569';
        const lines = wrapText(ctx, bullet, textW - 24);
        lines.forEach((line, li) => { ctx.fillText(line, textX + 16, ty + 9 + li * 20); });
        ty += lines.length * 20 + 6;
      });

    } else {
      // No image — stat + bullets layout (centered, compact)
      let ty = contentStartY + 8;

      if (hasStat) {
        // Big stat display
        const statW = 200;
        ctx.fillStyle = color + '10';
        drawRoundRect(ctx, cardX + 28, ty, statW, 70, 12); ctx.fill();
        ctx.fillStyle = color + '25';
        drawRoundRect(ctx, cardX + 28, ty, 6, 70, [12, 0, 0, 12]); ctx.fill();
        ctx.fillStyle = color; ctx.font = 'bold 36px Inter, Arial';
        ctx.textAlign = 'left';
        ctx.fillText(sec.stat, cardX + 48, ty + 40);
        if (sec.statLabel) {
          ctx.fillStyle = '#64748B'; ctx.font = '12px Inter, Arial';
          ctx.fillText(sec.statLabel, cardX + 48, ty + 58);
        }
        // Bullets to the right of stat
        const bx = cardX + 28 + statW + 24;
        let by = ty + 8;
        ctx.font = '13px Inter, Arial';
        (sec.bullets || []).slice(0, 2).forEach((bullet) => {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(bx + 5, by + 5, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#475569';
          const lines = wrapText(ctx, bullet, contentW - statW - 100);
          lines.forEach((line, li) => { ctx.fillText(line, bx + 16, by + 9 + li * 20); });
          by += lines.length * 20 + 6;
        });
        ty += 78;
      } else {
        // Just bullets
        ctx.font = '13px Inter, Arial';
        (sec.bullets || []).slice(0, 2).forEach((bullet) => {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(cardX + 33, ty + 5, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#475569';
          const lines = wrapText(ctx, bullet, contentW - 60);
          lines.forEach((line, li) => { ctx.fillText(line, cardX + 44, ty + 9 + li * 20); });
          ty += lines.length * 20 + 6;
        });
      }
    }

    // Workflow diagram
    if (hasWorkflow) {
      const steps = sec.workflowSteps.slice(0, 6);
      const stepCount = steps.length;
      const stepW = 150;
      const gap = 28;
      const totalStepW = stepCount * stepW + (stepCount - 1) * gap;
      const startX = cardX + (cardW - totalStepW) / 2;
      const wfY = cardY + cardH - 88;

      // Workflow background strip
      ctx.fillStyle = color + '08';
      drawRoundRect(ctx, cardX + 16, wfY - 8, cardW - 32, 76, 10); ctx.fill();
      // Workflow label
      ctx.fillStyle = color + '60'; ctx.font = 'bold 9px Inter, Arial';
      ctx.textAlign = 'left';
      ctx.fillText('WORKFLOW', cardX + 28, wfY + 2);

      steps.forEach((step, si) => {
        const sx = startX + si * (stepW + gap);
        // Step pill
        const isFirst = si === 0;
        const isLast = si === stepCount - 1;
        ctx.fillStyle = isFirst ? color : isLast ? color + 'CC' : color + '80';
        drawRoundRect(ctx, sx, wfY + 12, stepW, 42, 10); ctx.fill();
        // Step number circle
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(sx + 16, wfY + 33, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px Inter, Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(si + 1), sx + 16, wfY + 33);
        // Step text
        ctx.fillStyle = '#FFFFFF'; ctx.font = '11px Inter, Arial';
        const stepLines = wrapText(ctx, step, stepW - 38);
        stepLines.slice(0, 2).forEach((l, li) => {
          ctx.fillText(l, sx + stepW / 2 + 8, wfY + 33 + (li - (Math.min(stepLines.length, 2) - 1) / 2) * 14);
        });
        // Arrow connector
        if (si < stepCount - 1) {
          const ax = sx + stepW + 3;
          ctx.strokeStyle = color + '50'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ax, wfY + 33); ctx.lineTo(ax + gap - 6, wfY + 33); ctx.stroke();
          ctx.fillStyle = color + '50';
          ctx.beginPath();
          ctx.moveTo(ax + gap - 6, wfY + 33);
          ctx.lineTo(ax + gap - 12, wfY + 28);
          ctx.lineTo(ax + gap - 12, wfY + 38);
          ctx.closePath(); ctx.fill();
        }
      });
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    yOff += cardH + SEC_GAP;
  });

  // Footer
  const fGrad = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fGrad.addColorStop(0, '#004D40'); fGrad.addColorStop(0.5, '#006C5B'); fGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = fGrad;
  drawRoundRect(ctx, 0, totalH - FOOTER_H, W, FOOTER_H, [16, 16, 0, 0]); ctx.fill();
  ctx.fillStyle = goldGrad; ctx.fillRect(0, totalH - FOOTER_H, W, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '14px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Generated by Knowledge Base  |  AI-Powered Research Assistant', W / 2, totalH - FOOTER_H / 2 + 2);

  // Export
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_report.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Visual report downloaded!");
      resolve();
    }, 'image/png');
  });
}
