// Sol Marina Cover Maker — canvas cover renderer.
// Draws a multi-panel poster cover: three photo panels inside a white poster
// frame, a colour grade over every panel, grain and vignette, and a big
// Anton title with a Bebas Neue subtitle in a gradient title band.
// All art is original: fictional city "Sol Marina", no game artwork or logos.

export const LAYOUTS = {
  hero: { name: 'Hero Split', panels: 3 },
  triptych: { name: 'Triptych', panels: 3 },
  stack: { name: 'Poster Stack', panels: 3 },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    top: 'rgba(255,122,26,0.28)', mid: 'rgba(255,60,120,0.22)', bottom: 'rgba(120,20,140,0.42)',
    band: ['#ff7a1a', '#e83e8c', '#5b2a86'], bandText: '#ffffff', accent: '#ffd166',
  },
  neon: {
    name: 'Neon',
    top: 'rgba(255,0,180,0.30)', mid: 'rgba(0,220,255,0.16)', bottom: 'rgba(80,0,160,0.45)',
    band: ['#ff00b4', '#7b2ff7', '#00d4ff'], bandText: '#ffffff', accent: '#00f0ff',
  },
  dusk: {
    name: 'Dusk',
    top: 'rgba(90,40,160,0.30)', mid: 'rgba(20,120,140,0.20)', bottom: 'rgba(8,10,40,0.50)',
    band: ['#3b2a7a', '#0f766e', '#0b1030'], bandText: '#f5f0ff', accent: '#7ef0d4',
  },
};

export const EXPORT_SIZES = {
  square: { label: '1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: '1080 x 1350', width: 1080, height: 1350 },
  wide: { label: '1920 x 1080', width: 1920, height: 1080 },
};

/** Panel rectangles for a layout, inside the photo region (x, y, w, h). */
export function layoutPanels(layout, x, y, w, h, gap) {
  if (layout === 'triptych') {
    const pw = (w - gap * 2) / 3;
    return [
      { x, y, w: pw, h },
      { x: x + pw + gap, y, w: pw, h },
      { x: x + (pw + gap) * 2, y, w: pw, h },
    ];
  }
  if (layout === 'stack') {
    const topH = h * 0.66;
    const botH = h - topH - gap;
    const bw = (w - gap) / 2;
    return [
      { x, y, w, h: topH },
      { x, y: y + topH + gap, w: bw, h: botH },
      { x: x + bw + gap, y: y + topH + gap, w: bw, h: botH },
    ];
  }
  // hero: one big panel left, two stacked right.
  const bigW = w * 0.60;
  const sideW = w - bigW - gap;
  const sideH = (h - gap) / 2;
  return [
    { x, y, w: bigW, h },
    { x: x + bigW + gap, y, w: sideW, h: sideH },
    { x: x + bigW + gap, y: y + sideH + gap, w: sideW, h: sideH },
  ];
}

/** Draw one photo into a panel rect, cover-fit, with zoom and pan (-1..1). */
export function drawPanelPhoto(ctx, img, rect, zoom, panX, panY) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Pan shifts the photo, then clamps so the photo always covers the panel.
  let dx = rect.x + (rect.w - dw) / 2 + panX * rect.w * 0.25;
  let dy = rect.y + (rect.h - dh) / 2 + panY * rect.h * 0.25;
  dx = Math.max(rect.x + rect.w - dw, Math.min(rect.x, dx));
  dy = Math.max(rect.y + rect.h - dh, Math.min(rect.y, dy));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Colour grade, vignette and grain over one panel rect. */
export function gradePanel(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, grade.top);
  g.addColorStop(0.55, grade.mid);
  g.addColorStop(1, grade.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Vignette: darkened corners.
  const v = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,0,20,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Grain: deterministic speckle so exports are stable.
  let seed = 1234567 + Math.floor(rect.x) * 31 + Math.floor(rect.y) * 17;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const dots = Math.floor((rect.w * rect.h) / 900);
  for (let i = 0; i < dots; i++) {
    const px = rect.x + rand() * rect.w;
    const py = rect.y + rand() * rect.h;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(px, py, 1.6, 1.6);
  }
  ctx.restore();
}

/** Fit a font size so `text` fits `maxWidth`, starting from `start`. */
export function fitFont(ctx, text, start, maxWidth, family, weight) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/**
 * Draw the whole cover onto `canvas` (any size) from `state`:
 * { photos: Image[], layout, grade, fillMode, singlePhoto, panels: [{photo, zoom, panX, panY}],
 *   title, subtitle, titleSize, titleColor, outline, slant }
 */
export function drawSolMarinaCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const frame = Math.round(Math.min(W, H) * 0.028);
  const gap = Math.round(Math.min(W, H) * 0.012);
  const bandH = Math.round(H * 0.235);
  const photoY = frame;
  const photoH = H - bandH - frame * 2 + Math.round(H * 0.02);

  // Poster paper: white frame, dark ink behind the panels.
  ctx.fillStyle = '#fdf8f2';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#14082b';
  ctx.fillRect(frame, frame, W - frame * 2, H - frame * 2);

  const panels = layoutPanels(state.layout, frame + gap, photoY + gap, W - frame * 2 - gap * 2, photoH - gap * 2, gap);
  const autoPan = [-0.35, 0.3, -0.15];
  // Photos are stored as { name, img } records; unwrap the drawable image.
  const photoImage = (entry) => (entry && entry.img) || entry || null;
  panels.forEach((rect, i) => {
    const p = state.panels[i] || { photo: 0, zoom: 1, panX: 0, panY: 0 };
    let img = null;
    if (state.fillMode === 'single') {
      img = photoImage(state.photos[state.singlePhoto]) || photoImage(state.photos[0]);
    } else {
      img = photoImage(state.photos[p.photo]);
    }
    if (!img) {
      // Empty panel placeholder: sunset gradient + palm-ish sun disc.
      const pg = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      pg.addColorStop(0, '#ff9a3d');
      pg.addColorStop(1, '#7b2ff7');
      ctx.fillStyle = pg;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,240,180,0.9)';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const panX = state.fillMode === 'single' ? autoPan[i] : p.panX;
      // A panel much wider than the photo can only show a thin slice: aim
      // the slice at the photo's top third, where a face usually is.
      const wideSlice = state.fillMode === 'single' && rect.w > rect.h * 1.5;
      const panY = wideSlice ? 2.2 : (state.fillMode === 'single' ? (i === 1 ? -0.25 : 0.1) : p.panY);
      drawPanelPhoto(ctx, img, rect, p.zoom, panX, panY);
    }
    gradePanel(ctx, rect, grade);
    // Thin white keyline around each panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, gap * 0.35);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Title band: gradient wash with a neon sun disc.
  const bandY = H - bandH - frame;
  const bg = ctx.createLinearGradient(0, bandY, W, bandY + bandH);
  bg.addColorStop(0, grade.band[0]);
  bg.addColorStop(0.55, grade.band[1]);
  bg.addColorStop(1, grade.band[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(frame, bandY, W - frame * 2, bandH);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(W - frame - bandH * 0.22, bandY + bandH * 0.5, bandH * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, bandH * 0.012);
  ctx.beginPath();
  ctx.moveTo(frame + gap * 2, bandY + bandH * 0.16);
  ctx.lineTo(W - frame - gap * 2, bandY + bandH * 0.16);
  ctx.stroke();

  // Title with optional slant and outline.
  const title = (state.title || 'SOL MARINA').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const cx = W / 2;
  const titleMax = W - frame * 2 - gap * 6;
  const baseSize = Math.round(bandH * 0.46 * (state.titleSize || 1));
  ctx.save();
  ctx.translate(cx, bandY + bandH * 0.58);
  if (state.slant) ctx.transform(1, 0, -Math.tan((state.slant * Math.PI) / 180), 1, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, title, baseSize, titleMax, 'Anton, "Arial Black", sans-serif', '400');
  if (state.outline) {
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#14082b';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, 0, 0);
  }
  ctx.fillStyle = state.titleColor || '#ffffff';
  ctx.shadowColor = 'rgba(20,8,43,0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  // Subtitle in Bebas Neue, letterspaced, with accent stars.
  if (sub) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${Math.round(bandH * 0.20)}px "Bebas Neue", "Arial Narrow", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(bandH * 0.02)}px`; } catch (e) { /* older canvas */ }
    ctx.fillStyle = grade.accent;
    ctx.fillText(`★ ${sub} ★`, cx, bandY + bandH * 0.86);
    ctx.restore();
  }

  // Corner tag: fictional city, est. line.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${Math.round(bandH * 0.13)}px "Bebas Neue", sans-serif`;
  try { ctx.letterSpacing = '2px'; } catch (e) { /* older canvas */ }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('SOL MARINA  •  EST. 2026', frame + gap * 2, bandY + bandH * 0.09);
  ctx.restore();
}
