/**
 * Infographic Canvas Renderer — Flowing S-curve layout with AI images
 * Inspired by modern infographic designs with alternating sections,
 * large visuals, connecting paths, and decorative shapes
 */

const W = 1200;
const PAD = 60;
const HEADER_H = 260;
const FOOTER_H = 70;
const SEC_H = 320;
const IMG_W = 480;
const IMG_H = 260;
const CIRCLE_R = 36;
const PATH_W = 4;
const palette = ['#004D40','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B'];
const BG_DARK = '#0A2A24';
const BG_SECTION_L = '#004D40';
const BG_SECTION_R = '#003830';

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

// Draw a large decorative circle with icon
const drawNodeCircle = (ctx, cx, cy, num, color) => {
  // Outer glow
  ctx.fillStyle = color + '15';
  ctx.beginPath(); ctx.arc(cx, cy, CIRCLE_R + 14, 0, Math.PI * 2); ctx.fill();
  // White ring
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(cx, cy, CIRCLE_R + 6, 0, Math.PI * 2); ctx.fill();
  // Shadow ring
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, CIRCLE_R + 6, 0, Math.PI * 2); ctx.stroke();
  // Color fill
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, CIRCLE_R, 0, Math.PI * 2); ctx.fill();
  // Number
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 22px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(num), cx, cy);
};

// Draw decorative shapes (circles, dots, rings) to fill empty space
const drawDecoShapes = (ctx, x, y, w, h, color, seed) => {
  const rng = (i) => ((seed * 9301 + i * 49297) % 233280) / 233280;
  ctx.globalAlpha = 0.06;
  // Scattered circles
  for (let i = 0; i < 5; i++) {
    const cx = x + rng(i) * w;
    const cy = y + rng(i + 10) * h;
    const r = 10 + rng(i + 20) * 30;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  // Rings
  for (let i = 0; i < 3; i++) {
    const cx = x + rng(i + 30) * w;
    const cy = y + rng(i + 40) * h;
    const r = 15 + rng(i + 50) * 20;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  // Dots
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 8; i++) {
    const cx = x + rng(i + 60) * w;
    const cy = y + rng(i + 70) * h;
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// Draw workflow steps as a compact horizontal flow
const drawWorkflow = (ctx, steps, x, y, w, color) => {
  const count = steps.length;
  const stepW = Math.min(110, (w - (count - 1) * 14 - 20) / count);
  const gap = 14;
  const totalW = count * stepW + (count - 1) * gap;
  const startX = x + (w - totalW) / 2;

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, x, y, w, 52, 8); ctx.fill();

  steps.forEach((step, si) => {
    const sx = startX + si * (stepW + gap);
    // Pill
    ctx.fillStyle = si === 0 ? '#FFFFFF' : 'rgba(255,255,255,' + (0.7 - si * 0.1) + ')';
    rr(ctx, sx, y + 8, stepW, 34, 6); ctx.fill();
    // Text
    ctx.fillStyle = si === 0 ? color : BG_DARK;
    ctx.font = 'bold 9px Inter, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapText(ctx, step, stepW - 10);
    lines.slice(0, 2).forEach((l, li) => {
      ctx.fillText(l, sx + stepW / 2, y + 25 + (li - (Math.min(lines.length, 2) - 1) / 2) * 11);
    });
    // Arrow
    if (si < count - 1) {
      const ax = sx + stepW + 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ax, y + 25); ctx.lineTo(ax + gap - 3, y + 25); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(ax + gap - 3, y + 25);
      ctx.lineTo(ax + gap - 7, y + 21);
      ctx.lineTo(ax + gap - 7, y + 29);
      ctx.closePath(); ctx.fill();
    }
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
};

export async function renderInfographicWithImages(out, apiUrl, toast) {
  const sections = out.slides_data;
  const themeName = out.theme || 'corporate';

  // Ensure even number of sections for balanced layout
  const secs = sections.slice(0, 6);

  // Step 1: Generate AI images for all sections
  const toGenerate = secs.filter(s => !s.sectionImage).slice(0, 6);
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
  for (let i = 0; i < secs.length; i++) {
    if (secs[i].sectionImage) loadedImages[i] = await loadImg(secs[i].sectionImage);
  }

  // Step 3: Calculate heights per section
  const secHeights = secs.map((sec) => {
    const hasWf = sec.visualType === 'workflow' && sec.workflowSteps?.length > 0;
    let h = SEC_H;
    if (hasWf) h += 60;
    return h;
  });
  const totalH = HEADER_H + secHeights.reduce((a, h) => a + h, 0) + FOOTER_H;

  // Step 4: Canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // ── Full Background ──
  ctx.fillStyle = BG_DARK;
  ctx.fillRect(0, 0, W, totalH);

  // Subtle radial gradient overlay
  const bgGrad = ctx.createRadialGradient(W / 2, totalH / 2, 100, W / 2, totalH / 2, totalH);
  bgGrad.addColorStop(0, 'rgba(0,108,91,0.12)');
  bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, totalH);

  // ── Header ──
  const hGrad = ctx.createLinearGradient(0, 0, W, 0);
  hGrad.addColorStop(0, '#004D40'); hGrad.addColorStop(0.5, '#006C5B'); hGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = hGrad;
  rr(ctx, 0, 0, W, HEADER_H, [0, 0, 24, 24]); ctx.fill();

  // Decorative header circles
  ctx.globalAlpha = 0.05; ctx.fillStyle = '#FFFFFF';
  [[80, 40, 60], [300, 170, 45], [W - 120, 50, 80], [W - 300, 180, 35], [W / 2, 220, 30]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Gold accent
  const goldGrad = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, 0);
  goldGrad.addColorStop(0, '#C8A86B00'); goldGrad.addColorStop(0.3, '#C8A86B');
  goldGrad.addColorStop(0.7, '#C8A86B'); goldGrad.addColorStop(1, '#C8A86B00');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, W, 4);

  // Title
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 38px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(out.title.length > 50 ? out.title.substring(0, 47) + '...' : out.title, W / 2, 70);

  ctx.font = '16px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`Visual insights from ${secs.length} key areas`, W / 2, 108);

  // Decorative divider
  ctx.strokeStyle = '#C8A86B'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 40, 135); ctx.lineTo(W / 2 + 40, 135); ctx.stroke();
  ctx.fillStyle = '#C8A86B';
  ctx.save(); ctx.translate(W / 2, 135); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore();

  // Badges
  ctx.font = '12px Inter, Arial';
  [{ label: `${secs.length} Sections`, x: W / 2 - 160 }, { label: 'AI-Generated', x: W / 2 }, { label: 'Knowledge Base', x: W / 2 + 160 }]
    .forEach((b) => {
      const tw = ctx.measureText(b.label).width + 30;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      rr(ctx, b.x - tw / 2, 162, tw, 26, 13); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x, 177);
    });

  // Section color dots
  secs.forEach((_, si) => {
    const ix = W / 2 + (si - (secs.length - 1) / 2) * 20;
    ctx.fillStyle = palette[si % palette.length];
    rr(ctx, ix - 5, 210, 10, 4, 2); ctx.fill();
  });

  // ── Central Connecting Path ──
  const centerX = W / 2;
  let pathY = HEADER_H;
  ctx.strokeStyle = '#C8A86B40';
  ctx.lineWidth = PATH_W;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(centerX, pathY);
  ctx.lineTo(centerX, totalH - FOOTER_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Sections ──
  let yOff = HEADER_H;
  secs.forEach((sec, idx) => {
    const color = palette[idx % palette.length];
    const isLeft = idx % 2 === 0; // Image on left for even, right for odd
    const imgObj = loadedImages[idx];
    const hasWf = sec.visualType === 'workflow' && sec.workflowSteps?.length > 0;
    const hasStat = sec.stat && sec.stat !== '';
    const secHeight = secHeights[idx];

    // Section background band (alternating tint)
    const bandColor = isLeft ? BG_SECTION_L : BG_SECTION_R;
    ctx.fillStyle = bandColor + '30';
    ctx.fillRect(0, yOff, W, secHeight);

    // Decorative shapes in the background
    drawDecoShapes(ctx, 0, yOff, W, secHeight, color, idx * 137 + 42);

    // Horizontal accent line
    ctx.fillStyle = color + '25';
    ctx.fillRect(isLeft ? 0 : W - 6, yOff, 6, secHeight);

    // ── Node circle on center path ──
    const nodeCY = yOff + secHeight / 2;
    drawNodeCircle(ctx, centerX, nodeCY, idx + 1, color);

    // ── IMAGE SIDE ──
    const imgSideX = isLeft ? PAD : centerX + CIRCLE_R + 30;
    const imgSideW = centerX - CIRCLE_R - 30 - PAD;
    const imgY = yOff + (secHeight - IMG_H) / 2;

    if (imgObj) {
      // Draw large image with rounded corners
      ctx.save();
      rr(ctx, imgSideX, imgY, imgSideW, IMG_H, 14); ctx.clip();
      const scale = Math.max(imgSideW / imgObj.width, IMG_H / imgObj.height);
      const dw = imgObj.width * scale, dh = imgObj.height * scale;
      ctx.drawImage(imgObj, imgSideX + (imgSideW - dw) / 2, imgY + (IMG_H - dh) / 2, dw, dh);
      ctx.restore();
      // Gradient overlay at bottom
      const oGrad = ctx.createLinearGradient(imgSideX, imgY + IMG_H - 70, imgSideX, imgY + IMG_H);
      oGrad.addColorStop(0, 'rgba(0,0,0,0)'); oGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = oGrad;
      rr(ctx, imgSideX, imgY, imgSideW, IMG_H, 14); ctx.fill();
      // Subtle border
      ctx.strokeStyle = color + '40'; ctx.lineWidth = 2;
      rr(ctx, imgSideX, imgY, imgSideW, IMG_H, 14); ctx.stroke();
      // Stat badge overlay on image (if applicable)
      if (hasStat) {
        const badgeW = Math.max(ctx.measureText(sec.stat).width + 60, 80);
        const bx = imgSideX + imgSideW - badgeW - 12;
        const by = imgY + IMG_H - 48;
        ctx.fillStyle = color + 'DD';
        rr(ctx, bx, by, badgeW, 38, 8); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 20px Inter, Arial';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(sec.stat, bx + 12, by + 14);
        if (sec.statLabel) {
          ctx.font = '10px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillText(sec.statLabel, bx + 12, by + 30);
        }
      }
    } else {
      // Color placeholder with pattern
      ctx.fillStyle = color + '20';
      rr(ctx, imgSideX, imgY, imgSideW, IMG_H, 14); ctx.fill();
      ctx.strokeStyle = color + '30'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      rr(ctx, imgSideX, imgY, imgSideW, IMG_H, 14); ctx.stroke();
      ctx.setLineDash([]);
      // Large stat display
      if (hasStat) {
        ctx.fillStyle = color; ctx.font = 'bold 48px Inter, Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(sec.stat, imgSideX + imgSideW / 2, imgY + IMG_H / 2 - 10);
        if (sec.statLabel) {
          ctx.font = '14px Inter, Arial'; ctx.fillStyle = '#FFFFFF80';
          ctx.fillText(sec.statLabel, imgSideX + imgSideW / 2, imgY + IMG_H / 2 + 20);
        }
      }
    }

    // ── TEXT SIDE ──
    const textSideX = isLeft ? centerX + CIRCLE_R + 30 : PAD;
    const textSideW = centerX - CIRCLE_R - 30 - PAD;
    let ty = yOff + 30;

    // Text background block
    ctx.fillStyle = color + '12';
    rr(ctx, textSideX - 8, ty - 10, textSideW + 16, secHeight - 50, 12); ctx.fill();

    // Title
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color; ctx.font = 'bold 20px Inter, Arial';
    const titleLines = wrapText(ctx, sec.title || 'Section', textSideW - 16);
    titleLines.slice(0, 2).forEach((l, li) => {
      ctx.fillText(l, textSideX + 8, ty + 16 + li * 24);
    });
    ty += titleLines.length * 24 + 8;

    // Subtitle
    if (sec.subtitle) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '13px Inter, Arial';
      const subLines = wrapText(ctx, sec.subtitle, textSideW - 16);
      subLines.slice(0, 2).forEach((l, li) => {
        ctx.fillText(l, textSideX + 8, ty + li * 18);
      });
      ty += subLines.length * 18 + 10;
    }

    // Divider
    ctx.strokeStyle = color + '35'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(textSideX + 8, ty); ctx.lineTo(textSideX + textSideW - 8, ty); ctx.stroke();
    ty += 14;

    // Bullets (compact, white text)
    ctx.font = '12px Inter, Arial';
    (sec.bullets || []).slice(0, 2).forEach((bullet) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(textSideX + 14, ty + 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const lines = wrapText(ctx, bullet, textSideW - 36);
      lines.forEach((line, li) => { ctx.fillText(line, textSideX + 24, ty + 7 + li * 17); });
      ty += lines.length * 17 + 6;
    });

    // Workflow (inside text area)
    if (hasWf) {
      ty += 10;
      drawWorkflow(ctx, sec.workflowSteps.slice(0, 5), textSideX, ty, textSideW, color);
    }

    // Connecting curved line from node to image
    ctx.strokeStyle = color + '30'; ctx.lineWidth = 2;
    const nodeEdgeX = isLeft ? centerX - CIRCLE_R - 6 : centerX + CIRCLE_R + 6;
    const imgEdge = isLeft ? imgSideX + imgSideW : imgSideX;
    ctx.beginPath();
    ctx.moveTo(nodeEdgeX, nodeCY);
    ctx.quadraticCurveTo((nodeEdgeX + imgEdge) / 2, nodeCY - 20, imgEdge, nodeCY);
    ctx.stroke();

    yOff += secHeight;
  });

  // ── Footer ──
  const fGrad = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fGrad.addColorStop(0, '#004D40'); fGrad.addColorStop(0.5, '#006C5B'); fGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = fGrad;
  rr(ctx, 0, totalH - FOOTER_H, W, FOOTER_H, [20, 20, 0, 0]); ctx.fill();
  ctx.fillStyle = goldGrad; ctx.fillRect(0, totalH - FOOTER_H, W, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '14px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Generated by Knowledge Base  |  AI-Powered Research Assistant', W / 2, totalH - FOOTER_H / 2 + 3);

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
