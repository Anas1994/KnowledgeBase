/**
 * Mind Map Canvas Renderer — radial layout with colored branches
 */
const W = 1400;
const H = 1000;
const CX = W / 2;
const CY = H / 2;
const COLORS = {
  teal: '#004D40', gold: '#C8A86B', blue: '#0ea5e9',
  red: '#EF4444', purple: '#8B5CF6', green: '#22C55E'
};
const BRANCH_COLORS = ['#004D40', '#C8A86B', '#0ea5e9', '#EF4444', '#8B5CF6', '#22C55E'];

const wrapText = (ctx, text, maxW) => {
  const words = text.split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
};

const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

export async function renderMindMap(out, toast) {
  const data = out.slides_data;
  if (!data || !data.branches) { toast("No mind map data", "warn"); return; }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0B1120';
  ctx.fillRect(0, 0, W, H);
  // Subtle radial glow
  const bg = ctx.createRadialGradient(CX, CY, 50, CX, CY, 500);
  bg.addColorStop(0, 'rgba(0,77,64,0.15)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x < W; x += 25) for (let y = 0; y < H; y += 25) {
    ctx.beginPath(); ctx.arc(x, y, 0.6, 0, Math.PI * 2); ctx.fill();
  }

  const branches = data.branches || [];
  const count = branches.length;
  const radius = 280;
  const childRadius = 160;

  // Draw branches
  branches.forEach((branch, bi) => {
    const angle = (bi / count) * Math.PI * 2 - Math.PI / 2;
    const bx = CX + Math.cos(angle) * radius;
    const by = CY + Math.sin(angle) * radius;
    const color = COLORS[branch.color] || BRANCH_COLORS[bi % BRANCH_COLORS.length];

    // Connection line to center
    ctx.strokeStyle = color + '50';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(bx, by); ctx.stroke();
    // Glow
    ctx.strokeStyle = color + '15'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(bx, by); ctx.stroke();

    // Branch node
    ctx.fillStyle = color + '20';
    ctx.beginPath(); ctx.arc(bx, by, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(bx, by, 42, 0, Math.PI * 2); ctx.fill();
    // Branch label
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 12px Inter, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const bLines = wrapText(ctx, branch.label || '', 70);
    bLines.slice(0, 2).forEach((l, li) => {
      ctx.fillText(l, bx, by + (li - (Math.min(bLines.length, 2) - 1) / 2) * 15);
    });

    // Children
    const children = branch.children || [];
    children.forEach((child, ci) => {
      const childAngle = angle + ((ci - (children.length - 1) / 2) * 0.35);
      const cx2 = bx + Math.cos(childAngle) * childRadius;
      const cy2 = by + Math.sin(childAngle) * childRadius;

      // Connection
      ctx.strokeStyle = color + '30'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx2, cy2); ctx.stroke();

      // Child node pill
      ctx.font = '11px Inter, Arial';
      const tw = Math.max(ctx.measureText(child.label || '').width + 24, 60);
      const pillH = 28;
      ctx.fillStyle = color + '18';
      rr(ctx, cx2 - tw / 2, cy2 - pillH / 2, tw, pillH, 14); ctx.fill();
      ctx.strokeStyle = color + '40'; ctx.lineWidth = 1;
      rr(ctx, cx2 - tw / 2, cy2 - pillH / 2, tw, pillH, 14); ctx.stroke();
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(child.label || '', cx2, cy2);
    });
  });

  // Center node
  ctx.fillStyle = '#004D40';
  ctx.beginPath(); ctx.arc(CX, CY, 68, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#C8A86B'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(CX, CY, 68, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#C8A86B30';
  ctx.beginPath(); ctx.arc(CX, CY, 78, 0, Math.PI * 2); ctx.fill();
  // Center text
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cLines = wrapText(ctx, data.center || out.title, 110);
  cLines.slice(0, 3).forEach((l, li) => {
    ctx.fillText(l, CX, CY + (li - (Math.min(cLines.length, 3) - 1) / 2) * 18);
  });

  // Title bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  rr(ctx, 0, H - 44, W, 44, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '12px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${out.title}  |  ${count} branches  |  Knowledge Base`, W / 2, H - 20);

  // Export
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_mindmap.png`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("Mind map downloaded!"); resolve();
    }, 'image/png');
  });
}
