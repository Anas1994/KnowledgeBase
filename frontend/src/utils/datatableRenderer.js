/**
 * Data Table Canvas Renderer — professional tables with stats
 */
const W = 1200;
const PAD = 40;
const HEADER_H = 100;
const FOOTER_H = 50;
const TEAL = '#004D40';
const GOLD = '#C8A86B';
const ROW_H = 32;
const HDR_H = 38;

const wrapText = (ctx, text, maxW) => {
  const words = String(text).split(' '); const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
};
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

export async function renderDataTable(out, toast) {
  const data = out.slides_data;
  if (!data) { toast("No table data", "warn"); return; }

  const tables = data.tables || [];
  const stats = data.stats || [];
  const cw = W - PAD * 2;

  // Measure heights
  let bodyH = 0;
  // Stats bar
  if (stats.length) bodyH += 90;
  // Tables
  tables.forEach(t => {
    bodyH += 50 + HDR_H + (t.rows || []).length * ROW_H + 20;
  });
  bodyH += 20;

  const totalH = HEADER_H + bodyH + FOOTER_H;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F8FAFB'; ctx.fillRect(0, 0, W, totalH);

  // Header
  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, TEAL); hg.addColorStop(1, '#006C5B');
  ctx.fillStyle = hg; rr(ctx, 0, 0, W, HEADER_H, [0, 0, 12, 12]); ctx.fill();
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 24px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(out.title, W / 2, 38);
  ctx.font = '12px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${tables.length} Tables  |  ${stats.length} Key Metrics  |  Knowledge Base`, W / 2, 62);
  // Color bar
  const statColors = ['#004D40', '#0ea5e9', '#8B5CF6', '#EF4444', '#F59E0B'];
  stats.slice(0, 5).forEach((_, i) => {
    const sx = W / 2 + (i - Math.min(stats.length, 5) / 2 + 0.5) * 24;
    ctx.fillStyle = statColors[i % statColors.length];
    rr(ctx, sx - 8, 80, 16, 4, 2); ctx.fill();
  });

  let y = HEADER_H + 16;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  // ── Stats Cards ──
  if (stats.length) {
    const statW = Math.min((cw - (stats.length - 1) * 12) / stats.length, 220);
    const startX = PAD + (cw - stats.length * statW - (stats.length - 1) * 12) / 2;
    stats.forEach((stat, si) => {
      const sx = startX + si * (statW + 12);
      const color = statColors[si % statColors.length];
      // Card
      ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
      ctx.fillStyle = '#FFFFFF';
      rr(ctx, sx, y, statW, 65, 10); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      // Top accent
      ctx.fillStyle = color;
      rr(ctx, sx, y, statW, 3, [10, 10, 0, 0]); ctx.fill();
      // Value
      ctx.fillStyle = color; ctx.font = 'bold 22px Inter, Arial';
      ctx.fillText(String(stat.value || ''), sx + 12, y + 30);
      // Label
      ctx.fillStyle = '#64748B'; ctx.font = '10px Inter, Arial';
      ctx.fillText(stat.label || '', sx + 12, y + 48);
      // Description
      if (stat.description) {
        ctx.fillStyle = '#94A3B8'; ctx.font = '9px Inter, Arial';
        ctx.fillText(stat.description.substring(0, 30), sx + 12, y + 60);
      }
    });
    y += 80;
  }

  // ── Tables ──
  tables.forEach((table, ti) => {
    const headers = table.headers || [];
    const rows = table.rows || [];
    const colCount = headers.length || 1;
    const colW = (cw - 2) / colCount;

    // Table title
    y += 8;
    ctx.fillStyle = TEAL; ctx.font = 'bold 15px Inter, Arial';
    ctx.fillText(table.title || `Table ${ti + 1}`, PAD, y + 14);
    y += 30;

    // Table background
    const tableH = HDR_H + rows.length * ROW_H;
    ctx.shadowColor = 'rgba(0,0,0,0.04)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#FFFFFF';
    rr(ctx, PAD, y, cw, tableH, 8); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
    rr(ctx, PAD, y, cw, tableH, 8); ctx.stroke();

    // Header row
    ctx.fillStyle = TEAL;
    rr(ctx, PAD, y, cw, HDR_H, [8, 8, 0, 0]); ctx.fill();
    ctx.font = 'bold 11px Inter, Arial'; ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    headers.forEach((h, hi) => {
      ctx.fillText(String(h).substring(0, 25), PAD + hi * colW + 12, y + HDR_H / 2);
    });
    y += HDR_H;

    // Data rows
    rows.forEach((row, ri) => {
      // Alternating bg
      if (ri % 2 === 0) {
        ctx.fillStyle = '#F8FAFB';
        ctx.fillRect(PAD + 1, y, cw - 2, ROW_H);
      }
      // Row border
      ctx.strokeStyle = '#F0F2F5'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(PAD, y + ROW_H); ctx.lineTo(PAD + cw, y + ROW_H); ctx.stroke();
      // Cell values
      ctx.font = '11px Inter, Arial'; ctx.fillStyle = '#374151';
      (Array.isArray(row) ? row : []).forEach((cell, ci) => {
        ctx.fillText(String(cell || '').substring(0, 30), PAD + ci * colW + 12, y + ROW_H / 2);
      });
      y += ROW_H;
    });
    y += 14;
  });

  // Footer
  ctx.textBaseline = 'alphabetic';
  const fg = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fg.addColorStop(0, TEAL); fg.addColorStop(1, '#006C5B');
  ctx.fillStyle = fg; rr(ctx, 0, totalH - FOOTER_H, W, FOOTER_H, [12, 12, 0, 0]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Knowledge Base  |  AI-Extracted Data', W / 2, totalH - FOOTER_H / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_data.png`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("Data table downloaded!"); resolve();
    }, 'image/png');
  });
}
