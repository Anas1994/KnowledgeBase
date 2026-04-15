/**
 * Quiz Canvas Renderer — professional exam paper layout
 */
const W = 1000;
const PAD = 50;
const HEADER_H = 120;
const FOOTER_H = 50;
const TEAL = '#004D40';
const GOLD = '#C8A86B';

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

export async function renderQuiz(out, toast) {
  const data = out.slides_data;
  if (!data) { toast("No quiz data", "warn"); return; }

  const mcq = data.mcq || [];
  const tf = data.truefalse || [];
  const short = data.short || [];
  const total = mcq.length + tf.length + short.length;

  // Measure heights
  const mCtx = document.createElement('canvas').getContext('2d');
  const cw = W - PAD * 2;

  let bodyH = 0;
  // MCQ section
  if (mcq.length) { bodyH += 50; mcq.forEach(q => { mCtx.font = '13px Inter'; bodyH += wrapText(mCtx, q.question, cw - 60).length * 18 + 20; bodyH += q.options.length * 26 + 16; }); }
  // TF section
  if (tf.length) { bodyH += 50; tf.forEach(q => { mCtx.font = '13px Inter'; bodyH += wrapText(mCtx, q.statement, cw - 60).length * 18 + 50; }); }
  // Short section
  if (short.length) { bodyH += 50; short.forEach(q => { mCtx.font = '13px Inter'; bodyH += wrapText(mCtx, q.question, cw - 60).length * 18 + 60; }); }
  // Answer key
  bodyH += 80 + total * 22;

  const totalH = HEADER_H + bodyH + 40 + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, totalH);

  // Header
  ctx.fillStyle = TEAL; rr(ctx, 0, 0, W, HEADER_H, [0, 0, 12, 12]); ctx.fill();
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, 4);
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 24px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(out.title, W / 2, 42);
  ctx.font = '12px Inter, Arial'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${total} Questions  |  MCQ: ${mcq.length}  |  True/False: ${tf.length}  |  Short Answer: ${short.length}`, W / 2, 70);
  // Info bar
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, PAD, 88, cw, 24, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px Inter, Arial';
  ctx.fillText('Name: ________________________    Date: ____________    Score: ______ / ' + total, W / 2, 100);

  let y = HEADER_H + 20;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  // ── MCQ Section ──
  if (mcq.length) {
    ctx.fillStyle = TEAL; ctx.font = 'bold 16px Inter, Arial';
    ctx.fillText('Multiple Choice', PAD, y + 16);
    ctx.strokeStyle = TEAL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, y + 24); ctx.lineTo(PAD + 140, y + 24); ctx.stroke();
    y += 44;

    mcq.forEach((q, qi) => {
      // Question number
      ctx.fillStyle = TEAL;
      rr(ctx, PAD, y - 2, 24, 24, 6); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 11px Inter, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(qi + 1), PAD + 12, y + 10);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      // Question text
      ctx.fillStyle = '#1A1F36'; ctx.font = 'bold 13px Inter, Arial';
      const qLines = wrapText(ctx, q.question, cw - 40);
      qLines.forEach((l, li) => { ctx.fillText(l, PAD + 32, y + 12 + li * 18); });
      y += qLines.length * 18 + 12;

      // Options
      ctx.font = '12px Inter, Arial';
      (q.options || []).forEach((opt) => {
        ctx.fillStyle = '#F4F6FB';
        rr(ctx, PAD + 30, y - 4, cw - 40, 22, 4); ctx.fill();
        ctx.fillStyle = '#374151';
        ctx.fillText(opt, PAD + 40, y + 10);
        y += 26;
      });
      y += 10;
    });
  }

  // ── True/False Section ──
  if (tf.length) {
    ctx.fillStyle = '#0ea5e9'; ctx.font = 'bold 16px Inter, Arial';
    ctx.fillText('True or False', PAD, y + 16);
    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, y + 24); ctx.lineTo(PAD + 120, y + 24); ctx.stroke();
    y += 44;

    tf.forEach((q, qi) => {
      ctx.fillStyle = '#0ea5e9';
      rr(ctx, PAD, y - 2, 24, 24, 6); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 11px Inter, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(mcq.length + qi + 1), PAD + 12, y + 10);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#1A1F36'; ctx.font = '13px Inter, Arial';
      const sLines = wrapText(ctx, q.statement, cw - 120);
      sLines.forEach((l, li) => { ctx.fillText(l, PAD + 32, y + 12 + li * 18); });
      // T/F circles
      const ty = y + 4;
      const tx = PAD + cw - 70;
      ['T', 'F'].forEach((label, li) => {
        ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tx + li * 36, ty + 6, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#64748B'; ctx.font = 'bold 11px Inter, Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, tx + li * 36, ty + 6);
      });
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      y += sLines.length * 18 + 30;
    });
  }

  // ── Short Answer Section ──
  if (short.length) {
    ctx.fillStyle = '#8B5CF6'; ctx.font = 'bold 16px Inter, Arial';
    ctx.fillText('Short Answer', PAD, y + 16);
    ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, y + 24); ctx.lineTo(PAD + 120, y + 24); ctx.stroke();
    y += 44;

    short.forEach((q, qi) => {
      ctx.fillStyle = '#8B5CF6';
      rr(ctx, PAD, y - 2, 24, 24, 6); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 11px Inter, Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(mcq.length + tf.length + qi + 1), PAD + 12, y + 10);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#1A1F36'; ctx.font = '13px Inter, Arial';
      const qLines = wrapText(ctx, q.question, cw - 40);
      qLines.forEach((l, li) => { ctx.fillText(l, PAD + 32, y + 12 + li * 18); });
      y += qLines.length * 18 + 10;
      // Answer lines
      ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      for (let li = 0; li < 2; li++) {
        ctx.beginPath(); ctx.moveTo(PAD + 32, y + li * 20); ctx.lineTo(PAD + cw - 10, y + li * 20); ctx.stroke();
      }
      ctx.setLineDash([]);
      y += 44;
    });
  }

  // ── Answer Key ──
  y += 20;
  ctx.fillStyle = '#F4F6FB';
  const akH = 40 + total * 22;
  rr(ctx, PAD, y, cw, akH, 10); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + cw, y); ctx.stroke();
  ctx.fillStyle = TEAL; ctx.font = 'bold 14px Inter, Arial';
  ctx.fillText('Answer Key', PAD + 14, y + 22);
  let ay = y + 38;
  ctx.font = '11px Inter, Arial';
  mcq.forEach((q, i) => { ctx.fillStyle = '#374151'; ctx.fillText(`${i + 1}. ${q.correct || '—'}  ${q.explanation ? '— ' + q.explanation : ''}`, PAD + 14, ay); ay += 22; });
  tf.forEach((q, i) => { ctx.fillStyle = '#374151'; ctx.fillText(`${mcq.length + i + 1}. ${q.answer ? 'True' : 'False'}  ${q.explanation ? '— ' + q.explanation : ''}`, PAD + 14, ay); ay += 22; });
  short.forEach((q, i) => { ctx.fillStyle = '#374151'; const saL = wrapText(ctx, `${mcq.length + tf.length + i + 1}. ${q.sampleAnswer || ''}`, cw - 28); saL.slice(0, 1).forEach(l => { ctx.fillText(l, PAD + 14, ay); ay += 22; }); });

  // Footer
  const fg = ctx.createLinearGradient(0, totalH - FOOTER_H, W, totalH);
  fg.addColorStop(0, TEAL); fg.addColorStop(1, '#006C5B');
  ctx.fillStyle = fg; rr(ctx, 0, totalH - FOOTER_H, W, FOOTER_H, [12, 12, 0, 0]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px Inter, Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Knowledge Base  |  AI-Generated Assessment', W / 2, totalH - FOOTER_H / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${out.title.replace(/[<>:"/\\|?*]/g, "_")}_quiz.png`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("Quiz downloaded!"); resolve();
    }, 'image/png');
  });
}
