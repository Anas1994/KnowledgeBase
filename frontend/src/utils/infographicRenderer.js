/**
 * Infographic Canvas Renderer with AI-generated images
 * Generates a professional infographic PNG with AI images in each section card
 */

const W = 1400;
const PAD = 48;
const GAP = 24;
const COL_W = (W - PAD * 2 - GAP) / 2;
const HEADER_H = 320;
const FOOTER_H = 70;
const CARD_PAD = 28;
const BORDER_W = 6;
const IMG_H = 180;
const palette = ['#006C5B','#C8A86B','#0ea5e9','#EF4444','#8B5CF6','#F59E0B','#EC4899','#10B981','#3B82F6','#D946EF'];

const parseStatNum = (stat) => { if (!stat) return null; const m = stat.match(/([\d.]+)/); return m ? parseFloat(m[1]) : null; };
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

const loadImg = (b64) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = `data:image/jpeg;base64,${b64}`;
});

const drawFilledIcon = (ctx, name, cx, cy, radius, color) => {
  ctx.fillStyle = color + '15';
  ctx.beginPath(); ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color + '25';
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const s = (radius * 0.9) / 12;
  ctx.translate(cx - 12 * s, cy - 12 * s); ctx.scale(s, s);
  const ic = {
    chart: () => { ctx.fillRect(4, 14, 4, 6); ctx.fillRect(10, 8, 4, 12); ctx.fillRect(16, 4, 4, 16); ctx.strokeRect(2, 2, 20, 20); },
    users: () => { ctx.beginPath(); ctx.arc(9, 8, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(17, 10, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, 22); ctx.quadraticCurveTo(9, 14, 16, 22); ctx.fill(); },
    clock: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(12, 12); ctx.lineTo(17, 15); ctx.stroke(); },
    target: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 12, 6, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 12, 2, 0, Math.PI * 2); ctx.fill(); },
    shield: () => { ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(21, 5); ctx.lineTo(21, 12); ctx.quadraticCurveTo(21, 21, 12, 23); ctx.quadraticCurveTo(3, 21, 3, 12); ctx.lineTo(3, 5); ctx.closePath(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(11, 15); ctx.lineTo(16, 9); ctx.stroke(); },
    globe: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(12, 12, 4, 10, 0, 0, Math.PI * 2); ctx.stroke(); },
    lightbulb: () => { ctx.beginPath(); ctx.arc(12, 10, 7, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(9, 17, 6, 2); ctx.fillRect(10, 20, 4, 2); },
    rocket: () => { ctx.beginPath(); ctx.moveTo(12, 1); ctx.quadraticCurveTo(20, 8, 17, 17); ctx.lineTo(7, 17); ctx.quadraticCurveTo(4, 8, 12, 1); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 10, 2, 0, Math.PI * 2); ctx.fill(); },
    cog: () => { ctx.beginPath(); ctx.arc(12, 12, 4, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(12 + Math.cos(a) * 7 - 2, 12 + Math.sin(a) * 7 - 2, 4, 4); } },
    check: () => { ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(7, 12); ctx.lineTo(10, 16); ctx.lineTo(17, 7); ctx.stroke(); },
    growth: () => { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3, 20); ctx.lineTo(9, 12); ctx.lineTo(14, 16); ctx.lineTo(21, 5); ctx.stroke(); },
    home: () => { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, 13); ctx.lineTo(12, 3); ctx.lineTo(22, 13); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5, 11); ctx.lineTo(5, 22); ctx.lineTo(19, 22); ctx.lineTo(19, 11); ctx.stroke(); },
    briefcase: () => { ctx.strokeRect(2, 8, 20, 14); ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(8, 4); ctx.lineTo(16, 4); ctx.lineTo(16, 8); ctx.stroke(); },
  };
  (ic[name] || ic.briefcase)();
  ctx.restore();
};

const drawDonut = (ctx, cx, cy, r, pct, color) => {
  const lineW = r * 0.28;
  ctx.lineWidth = lineW;
  ctx.strokeStyle = '#E8ECF0';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, color); grad.addColorStop(1, color + 'AA');
  ctx.strokeStyle = grad; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct / 100)); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(cx, cy, r - lineW, 0, Math.PI * 2); ctx.fill();
};

/**
 * Generate AI images for infographic sections and render a Canvas infographic
 * @param {Object} out - The output object with title, slides_data, theme
 * @param {string} apiUrl - Backend API URL
 * @param {Function} toast - Toast notification function
 * @returns {Promise<void>}
 */
export async function renderInfographicWithImages(out, apiUrl, toast) {
  const sections = out.slides_data;
  const themeName = out.theme || 'corporate';

  // Step 1: Generate AI images for sections (max 6)
  const toGenerate = sections.filter(s => !s.sectionImage).slice(0, 6);
  if (toGenerate.length > 0) {
    toast(`Generating ${toGenerate.length} infographic images — please wait...`, "warn");
    let done = 0;
    for (const sec of toGenerate) {
      try {
        toast(`Image ${done + 1}/${toGenerate.length}: ${sec.title}...`, "warn");
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
          if (result.success && result.imageBase64) {
            sec.sectionImage = result.imageBase64;
            done++;
          }
        }
      } catch (e) {
        console.error(`Image gen failed: ${sec.title}`, e);
      }
    }
    toast(`${done} images ready! Rendering infographic...`);
  } else {
    toast("Rendering infographic...", "warn");
  }

  // Step 2: Pre-load all section images
  const loadedImages = {};
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].sectionImage) {
      loadedImages[i] = await loadImg(sections[i].sectionImage);
    }
  }

  // Step 3: Calculate card heights
  const measureCtx = document.createElement('canvas').getContext('2d');
  const cardHeights = sections.map((sec, si) => {
    let h = CARD_PAD + 32;
    if (loadedImages[si]) h += IMG_H + 10;
    const vType = sec.visualType || 'none';
    const hasPct = isPercent(sec.stat);
    if (vType === 'none' || (!sec.stat && vType !== 'process')) h += 4;
    else if (vType === 'process') h += 68;
    else if (hasPct) h += 110;
    else if (sec.stat) h += 68;
    else h += 4;
    h += 16;
    measureCtx.font = '13px Inter, Arial';
    const textW = COL_W - CARD_PAD * 2 - BORDER_W - 12;
    (sec.bullets || []).slice(0, 4).forEach(b => { h += wrapText(measureCtx, b, textW).length * 20 + 2; });
    h += CARD_PAD;
    return Math.max(h, loadedImages[si] ? 380 : 220);
  });

  const rows = [];
  for (let i = 0; i < sections.length; i += 2) {
    rows.push(Math.max(cardHeights[i], i + 1 < sections.length ? cardHeights[i + 1] : 0));
  }
  const totalH = HEADER_H + rows.reduce((a, h) => a + h + GAP, GAP) + FOOTER_H;

  // Step 4: Create and draw canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#EFF3F8';
  ctx.fillRect(0, 0, W, totalH);
  ctx.fillStyle = '#D8DFE8';
  for (let gx = 0; gx < W; gx += 30) {
    for (let gy = HEADER_H; gy < totalH - FOOTER_H; gy += 30) {
      ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Header
  const hGrad = ctx.createLinearGradient(0, 0, W, 0);
  hGrad.addColorStop(0, '#004D40'); hGrad.addColorStop(0.5, '#006C5B'); hGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = hGrad;
  ctx.beginPath(); ctx.roundRect(0, 0, W, HEADER_H, [0, 0, 20, 20]); ctx.fill();

  ctx.globalAlpha = 0.04; ctx.fillStyle = '#FFFFFF';
  [[120, 60, 80], [350, 200, 60], [900, 80, 100], [1100, 220, 50], [W - 100, 120, 70]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  const goldGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  goldGrad.addColorStop(0, '#C8A86B00'); goldGrad.addColorStop(0.3, '#C8A86B');
  goldGrad.addColorStop(0.7, '#C8A86B'); goldGrad.addColorStop(1, '#C8A86B00');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, W, 5);

  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 44px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(out.title.length > 55 ? out.title.substring(0, 52) + '...' : out.title, W / 2, 90);

  ctx.font = '20px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(`Based on ${sections.length} key insights from your sources`, W / 2, 140);

  ctx.strokeStyle = '#C8A86B'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 50, 172); ctx.lineTo(W / 2 + 50, 172); ctx.stroke();
  ctx.fillStyle = '#C8A86B';
  ctx.save(); ctx.translate(W / 2, 172); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();

  [{ label: `${sections.length} Sections`, icon: '\u25A6' }, { label: 'AI-Generated', icon: '\u2726' }, { label: 'HealthOS', icon: '\u2666' }]
    .forEach((badge, i) => {
      const bx = W / 2 + (i - 1) * 180;
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '13px Inter, Arial';
      const tw = ctx.measureText(badge.label).width + 40;
      ctx.beginPath(); ctx.roundRect(bx - tw / 2, 205, tw, 30, 15); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(bx - tw / 2, 205, tw, 30, 15); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textAlign = 'center';
      ctx.fillText(`${badge.icon}  ${badge.label}`, bx, 221);
    });

  sections.forEach((_, si) => {
    const ix = W / 2 + (si - (sections.length - 1) / 2) * 22;
    ctx.fillStyle = palette[si % palette.length];
    ctx.beginPath(); ctx.roundRect(ix - 6, 270, 12, 5, 3); ctx.fill();
  });

  // Section Cards
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

    // Card shadow + background
    ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(cardX, cardY, COL_W, rowH, 16); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#E8ECF0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(cardX, cardY, COL_W, rowH, 16); ctx.stroke();

    // Left accent
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cardX, cardY, BORDER_W, rowH, [16, 0, 0, 16]); ctx.fill();

    let cx = cardX + BORDER_W + CARD_PAD;
    let cy = cardY + CARD_PAD;
    const contentW = COL_W - BORDER_W - CARD_PAD * 2;

    // Title row
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx + 16, cy + 12, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px Inter, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(idx + 1), cx + 16, cy + 12);

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1A1F36'; ctx.font = 'bold 17px Inter, Arial';
    const tLines = wrapText(ctx, section.title || 'Section', contentW - 44);
    tLines.slice(0, 2).forEach((tl, ti) => { ctx.fillText(tl, cx + 42, cy + 17 + ti * 20); });
    cy += 12 + tLines.length * 20 + 8;

    // AI Image
    const imgObj = loadedImages[idx];
    if (imgObj) {
      ctx.save();
      ctx.beginPath(); ctx.roundRect(cx, cy, contentW, IMG_H, 10); ctx.clip();
      const scale = Math.max(contentW / imgObj.width, IMG_H / imgObj.height);
      const dw = imgObj.width * scale, dh = imgObj.height * scale;
      ctx.drawImage(imgObj, cx + (contentW - dw) / 2, cy + (IMG_H - dh) / 2, dw, dh);
      ctx.restore();
      ctx.strokeStyle = color + '30'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(cx, cy, contentW, IMG_H, 10); ctx.stroke();
      cy += IMG_H + 10;
    }

    // Visualization (charts for stat types only)
    if (vType === 'none' || (!section.stat && vType !== 'process')) {
      cy += 4;
    } else if (vType === 'process') {
      const steps = statNum || Math.min((section.bullets || []).length, 5) || 3;
      const stepW = 42;
      const gap = Math.min(20, (contentW - steps * stepW) / Math.max(steps - 1, 1));
      const totalStepW = steps * stepW + (steps - 1) * gap;
      const startX = cx + (contentW - totalStepW) / 2;
      for (let i = 0; i < steps; i++) {
        const sx = startX + i * (stepW + gap);
        ctx.fillStyle = color + (i === 0 ? '' : '80');
        ctx.beginPath(); ctx.roundRect(sx, cy, stepW, stepW, 10); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px Inter, Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, sx + stepW / 2, cy + stepW / 2);
        if (i < steps - 1) {
          ctx.strokeStyle = color + '50'; ctx.lineWidth = 2;
          const ax = sx + stepW + 4;
          ctx.beginPath(); ctx.moveTo(ax, cy + stepW / 2); ctx.lineTo(ax + gap - 8, cy + stepW / 2); ctx.stroke();
        }
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      cy += stepW + 8;
      if (section.stat) {
        ctx.fillStyle = color; ctx.font = 'bold 22px Inter, Arial';
        ctx.fillText(section.stat, cx, cy + 4);
        if (section.statLabel) {
          const sw = ctx.measureText(section.stat + '  ').width;
          ctx.fillStyle = '#6B7285'; ctx.font = '13px Inter, Arial';
          ctx.fillText(section.statLabel, cx + sw + 4, cy + 3);
        }
        cy += 26;
      }
    } else if (hasPct && statNum) {
      const donutR = 38;
      drawDonut(ctx, cx + donutR + 8, cy + donutR + 6, donutR, statNum, color);
      ctx.fillStyle = color; ctx.font = 'bold 26px Inter, Arial';
      ctx.fillText(section.stat, cx + donutR * 2 + 32, cy + 34);
      if (section.statLabel) {
        ctx.fillStyle = '#6B7285'; ctx.font = '14px Inter, Arial';
        ctx.fillText(section.statLabel, cx + donutR * 2 + 32, cy + 54);
      }
      cy += donutR * 2 + 22;
    } else if (section.stat) {
      ctx.fillStyle = color; ctx.font = 'bold 36px Inter, Arial';
      ctx.fillText(section.stat, cx, cy + 32);
      if (section.statLabel) {
        ctx.fillStyle = '#6B7285'; ctx.font = '14px Inter, Arial';
        ctx.fillText(section.statLabel, cx, cy + 54);
      }
      cy += 68;
    }

    // Divider
    const divGrad = ctx.createLinearGradient(cx, cy, cx + contentW, cy);
    divGrad.addColorStop(0, color + '40'); divGrad.addColorStop(0.5, '#E8ECF0'); divGrad.addColorStop(1, color + '10');
    ctx.strokeStyle = divGrad; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + contentW, cy + 4); ctx.stroke();
    cy += 16;

    // Bullets
    ctx.font = '13px Inter, Arial';
    (section.bullets || []).slice(0, 4).forEach((bullet) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + 5, cy + 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#475569';
      const lines = wrapText(ctx, bullet, contentW - 18);
      lines.forEach((line, li) => { ctx.fillText(line, cx + 16, cy + 5 + li * 19); });
      cy += lines.length * 19 + 4;
    });

    // Icon
    drawFilledIcon(ctx, iconName, cardX + COL_W - CARD_PAD - 24, cardY + rowH - CARD_PAD - 24, 24, color);

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

  // Footer
  const fGrad = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fGrad.addColorStop(0, '#004D40'); fGrad.addColorStop(0.5, '#006C5B'); fGrad.addColorStop(1, '#004D40');
  ctx.fillStyle = fGrad;
  ctx.beginPath(); ctx.roundRect(0, totalH - FOOTER_H, W, FOOTER_H, [20, 20, 0, 0]); ctx.fill();
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
