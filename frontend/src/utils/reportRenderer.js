/**
 * Visual Report Renderer — generates a professional report PNG with AI images and workflow diagrams
 */

const W = 1400;
const PAD = 50;
const SEC_GAP = 28;
const HEADER_H = 260;
const FOOTER_H = 60;
const IMG_W = 420;
const IMG_H = 240;
const palette = ['#006C5B','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B','#EC4899','#10B981'];

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

export async function renderVisualReport(out, apiUrl, toast) {
  const sections = out.slides_data || [];
  if (!sections.length) { toast("No report sections to render", "warn"); return; }

  const themeName = out.theme || 'corporate';

  // Step 1: Generate AI images for all sections
  const toGen = sections.filter(s => !s.sectionImage).slice(0, 7);
  if (toGen.length > 0) {
    toast(`Generating ${toGen.length} report images — please wait...`, "warn");
    let done = 0;
    for (const sec of toGen) {
      try {
        toast(`Image ${done + 1}/${toGen.length}: ${sec.title}...`, "warn");
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
    toast(`${done} images ready! Rendering report...`);
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
  const textAreaW = contentW - IMG_W - 30;

  const sectionHeights = sections.map((sec, si) => {
    let h = 50; // title
    const hasImg = !!loadedImages[si];
    const hasWorkflow = sec.visualType === 'workflow' && sec.workflowSteps?.length > 0;

    // Bullets height
    mCtx.font = '14px Inter, Arial';
    let bulletsH = 0;
    (sec.bullets || []).forEach(b => {
      bulletsH += wrapText(mCtx, b, hasImg ? textAreaW - 30 : contentW - 30).length * 22 + 6;
    });

    if (hasImg) {
      h += Math.max(IMG_H, bulletsH + 10);
    } else {
      h += bulletsH + 10;
    }

    if (hasWorkflow) h += 80;
    h += 24; // bottom padding
    return Math.max(h, hasImg ? 320 : 180);
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

  // Gold accent
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
  const labelW = ctx.measureText('RESEARCH REPORT').width + 30;
  ctx.beginPath(); ctx.roundRect(W / 2 - labelW / 2, 30, labelW, 26, 13); ctx.fill();
  ctx.fillStyle = '#C8A86B'; ctx.fillText('RESEARCH REPORT', W / 2, 47);

  // Title
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 38px Inter, Arial';
  ctx.fillText(out.title.length > 60 ? out.title.substring(0, 57) + '...' : out.title, W / 2, 105);

  // Divider
  ctx.strokeStyle = '#C8A86B'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 40, 130); ctx.lineTo(W / 2 + 40, 130); ctx.stroke();

  // Meta
  ctx.font = '16px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`${sections.length} Sections  |  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  |  AI-Generated`, W / 2, 158);

  // Section indicators
  sections.forEach((_, si) => {
    const ix = W / 2 + (si - (sections.length - 1) / 2) * 20;
    ctx.fillStyle = palette[si % palette.length];
    ctx.beginPath(); ctx.roundRect(ix - 5, 190, 10, 4, 2); ctx.fill();
  });

  // Sections
  let yOff = HEADER_H + SEC_GAP;
  sections.forEach((sec, idx) => {
    const cardX = PAD;
    const cardY = yOff;
    const cardW = contentW;
    const cardH = sectionHeights[idx];
    const color = palette[idx % palette.length];
    const hasImg = !!loadedImages[idx];
    const hasWorkflow = sec.visualType === 'workflow' && sec.workflowSteps?.length > 0;

    // Card shadow + bg
    ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 14); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Top accent line
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, 4, [14, 14, 0, 0]); ctx.fill();

    // Section number badge
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cardX + 20, cardY + 16, 32, 32, 8); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 15px Inter, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(idx + 1), cardX + 36, cardY + 32);

    // Title
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1A1F36'; ctx.font = 'bold 20px Inter, Arial';
    ctx.fillText(sec.title || 'Section', cardX + 64, cardY + 38);

    let cy = cardY + 58;

    if (hasImg) {
      // Image on left, bullets on right
      const imgX = cardX + 18;
      const imgY = cy;
      const imgObj = loadedImages[idx];

      ctx.save();
      ctx.beginPath(); ctx.roundRect(imgX, imgY, IMG_W, IMG_H, 10); ctx.clip();
      const scale = Math.max(IMG_W / imgObj.width, IMG_H / imgObj.height);
      const dw = imgObj.width * scale, dh = imgObj.height * scale;
      ctx.drawImage(imgObj, imgX + (IMG_W - dw) / 2, imgY + (IMG_H - dh) / 2, dw, dh);
      ctx.restore();
      ctx.strokeStyle = color + '25'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(imgX, imgY, IMG_W, IMG_H, 10); ctx.stroke();

      // Bullets to the right of image
      const bx = imgX + IMG_W + 24;
      let by = imgY + 6;
      ctx.font = '14px Inter, Arial';
      (sec.bullets || []).forEach((bullet) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(bx + 4, by + 4, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#475569';
        const lines = wrapText(ctx, bullet, textAreaW - 30);
        lines.forEach((line, li) => { ctx.fillText(line, bx + 16, by + 8 + li * 22); });
        by += lines.length * 22 + 6;
      });

      cy += Math.max(IMG_H, by - imgY) + 10;
    } else {
      // Full-width bullets
      const bx = cardX + 28;
      let by = cy;
      ctx.font = '14px Inter, Arial';
      (sec.bullets || []).forEach((bullet) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(bx + 4, by + 4, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#475569';
        const lines = wrapText(ctx, bullet, contentW - 60);
        lines.forEach((line, li) => { ctx.fillText(line, bx + 16, by + 8 + li * 22); });
        by += lines.length * 22 + 6;
      });
      cy = by + 10;
    }

    // Workflow diagram
    if (hasWorkflow) {
      const steps = sec.workflowSteps.slice(0, 6);
      const stepCount = steps.length;
      const stepW = 140;
      const gap = 30;
      const totalStepW = stepCount * stepW + (stepCount - 1) * gap;
      const startX = cardX + (cardW - totalStepW) / 2;
      const wfY = cy;

      // Workflow label
      ctx.fillStyle = color + '15';
      ctx.beginPath(); ctx.roundRect(cardX + 18, wfY - 4, cardW - 36, 70, 8); ctx.fill();

      steps.forEach((step, si) => {
        const sx = startX + si * (stepW + gap);
        // Step box
        ctx.fillStyle = si === 0 ? color : color + '90';
        ctx.beginPath(); ctx.roundRect(sx, wfY + 8, stepW, 44, 8); ctx.fill();
        // Step text
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 11px Inter, Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const stepLines = wrapText(ctx, step, stepW - 16);
        stepLines.slice(0, 2).forEach((l, li) => {
          ctx.fillText(l, sx + stepW / 2, wfY + 30 + (li - (stepLines.length - 1) / 2) * 14);
        });
        // Arrow
        if (si < stepCount - 1) {
          const ax = sx + stepW + 4;
          ctx.strokeStyle = color + '60'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ax, wfY + 30); ctx.lineTo(ax + gap - 8, wfY + 30); ctx.stroke();
          ctx.fillStyle = color + '60';
          ctx.beginPath();
          ctx.moveTo(ax + gap - 8, wfY + 30);
          ctx.lineTo(ax + gap - 14, wfY + 25);
          ctx.lineTo(ax + gap - 14, wfY + 35);
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
  ctx.beginPath(); ctx.roundRect(0, totalH - FOOTER_H, W, FOOTER_H, [16, 16, 0, 0]); ctx.fill();
  ctx.fillStyle = goldGrad; ctx.fillRect(0, totalH - FOOTER_H, W, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '14px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Generated by HealthOS  |  AI-Powered Research Assistant', W / 2, totalH - FOOTER_H / 2 + 2);

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
