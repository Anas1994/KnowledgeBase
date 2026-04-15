/**
 * Flashcard Canvas Renderer — card grid with Q&A, categories, difficulty
 */
const W = 1400;
const PAD = 40;
const COLS = 3;
const CARD_W = (W - PAD * 2 - 24 * (COLS - 1)) / COLS;
const CARD_H = 220;
const GAP = 24;
const HEADER_H = 100;
const FOOTER_H = 50;
const DIFF_COLORS = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };
const CAT_COLORS = ['#004D40', '#0ea5e9', '#8B5CF6', '#EC4899', '#C8A86B', '#EF4444'];

const wrapText = (ctx, text, maxW) => {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
};
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

export async function renderFlashcards(out, toast) {
  const cards = out.slides_data;
  if (!cards || !cards.length) { toast("No flashcard data", "warn"); return; }

  const rows = Math.ceil(cards.length / COLS);
  const totalH = HEADER_H + rows * (CARD_H + GAP) + GAP + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F8FAFB'; ctx.fillRect(0, 0, W, totalH);
  // Dot grid
  ctx.fillStyle = '#E0E4EA';
  for (let x = 0; x < W; x += 20) for (let y = HEADER_H; y < totalH; y += 20) {
    ctx.beginPath(); ctx.arc(x, y, 0.5, 0, Math.PI * 2); ctx.fill();
  }

  // Header
  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, '#004D40'); hg.addColorStop(1, '#006C5B');
  ctx.fillStyle = hg; rr(ctx, 0, 0, W, HEADER_H, [0, 0, 16, 16]); ctx.fill();
  ctx.fillStyle = '#C8A86B'; ctx.fillRect(0, 0, W, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 28px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(out.title, W / 2, 40);
  ctx.font = '13px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${cards.length} Flashcards  |  Knowledge Base`, W / 2, 68);
  // Category legend
  const categories = [...new Set(cards.map(c => c.category || 'General'))];
  categories.forEach((cat, i) => {
    const lx = W / 2 + (i - (categories.length - 1) / 2) * 100;
    ctx.fillStyle = CAT_COLORS[i % CAT_COLORS.length];
    rr(ctx, lx - 30, 82, 60, 4, 2); ctx.fill();
  });

  // Cards
  cards.forEach((card, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = HEADER_H + GAP + row * (CARD_H + GAP);
    const catIdx = categories.indexOf(card.category || 'General');
    const catColor = CAT_COLORS[catIdx % CAT_COLORS.length];
    const diffColor = DIFF_COLORS[card.difficulty] || DIFF_COLORS.Medium;

    // Card shadow + bg
    ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#FFFFFF';
    rr(ctx, x, y, CARD_W, CARD_H, 14); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Top accent
    ctx.fillStyle = catColor;
    rr(ctx, x, y, CARD_W, 4, [14, 14, 0, 0]); ctx.fill();

    // Card number
    ctx.fillStyle = catColor; ctx.font = 'bold 10px Inter, Arial';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    rr(ctx, x + 12, y + 12, 26, 22, 6); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px Inter, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(card.id || idx + 1), x + 25, y + 23);

    // Difficulty badge
    ctx.fillStyle = diffColor + '15';
    rr(ctx, x + CARD_W - 62, y + 12, 50, 20, 10); ctx.fill();
    ctx.fillStyle = diffColor; ctx.font = 'bold 9px Inter, Arial';
    ctx.fillText(card.difficulty || 'Medium', x + CARD_W - 37, y + 22);

    // Category
    ctx.fillStyle = catColor + '80'; ctx.font = '9px Inter, Arial';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(card.category || 'General', x + 44, y + 27);

    // Question
    ctx.fillStyle = '#1A1F36'; ctx.font = 'bold 13px Inter, Arial';
    ctx.textAlign = 'left';
    const qLines = wrapText(ctx, 'Q: ' + (card.question || ''), CARD_W - 28);
    qLines.slice(0, 3).forEach((l, li) => { ctx.fillText(l, x + 14, y + 56 + li * 18); });

    // Divider
    const divY = y + 56 + Math.min(qLines.length, 3) * 18 + 8;
    ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 14, divY); ctx.lineTo(x + CARD_W - 14, divY); ctx.stroke();

    // Answer
    ctx.fillStyle = '#475569'; ctx.font = '12px Inter, Arial';
    const aLines = wrapText(ctx, 'A: ' + (card.answer || ''), CARD_W - 28);
    aLines.slice(0, 4).forEach((l, li) => { ctx.fillText(l, x + 14, divY + 18 + li * 16); });
  });

  // Footer
  const fg = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fg.addColorStop(0, '#004D40'); fg.addColorStop(1, '#006C5B');
  ctx.fillStyle = fg; rr(ctx, 0, totalH - FOOTER_H, W, FOOTER_H, [16, 16, 0, 0]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Knowledge Base  |  AI-Generated Study Cards', W / 2, totalH - FOOTER_H / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_flashcards.png`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("Flashcards downloaded!"); resolve();
    }, 'image/png');
  });
}
