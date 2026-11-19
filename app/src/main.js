// Sol Marina Cover Maker — UI wiring for app/index.html.
// Photos stay on the user's machine (FileReader / object URLs, never uploaded).
// The preview canvas redraws live; exports render offscreen at full post size.

import { drawSolMarinaCover, EXPORT_SIZES, GRADES, LAYOUTS } from './cover.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

const state = {
  photos: [],          // { name, img } — samples first, then uploads
  layout: 'hero',
  grade: 'sunset',
  fillMode: 'single',
  singlePhoto: 0,
  panels: [
    { photo: 0, zoom: 1, panX: 0, panY: 0 },
    { photo: 1, zoom: 1, panX: 0, panY: 0 },
    { photo: 0, zoom: 1, panX: 0, panY: 0 },
  ],
  title: 'SOL MARINA',
  subtitle: 'NEON BAY NIGHTS',
  titleSize: 1,
  titleColor: '#ffffff',
  outline: true,
  slant: 8,
  selectedPanel: 0,
  exportSize: 'portrait',
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = src;
  });
}

function redraw() {
  drawSolMarinaCover(preview, state);
  renderPhotoChips();
  renderPanelList();
}

function renderPhotoChips() {
  const box = $('photoChips');
  box.innerHTML = '';
  state.photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (state.fillMode === 'single' && state.singlePhoto === i ? ' active' : '');
    b.textContent = p.name;
    b.title = 'Use this photo in every panel';
    b.addEventListener('click', () => {
      state.singlePhoto = i;
      if (state.fillMode === 'single') redraw();
      else { state.panels[state.selectedPanel].photo = i; redraw(); }
    });
    box.appendChild(b);
  });
  if (!state.photos.length) box.textContent = 'No photos yet — load a sample below.';
}

function renderPanelList() {
  const box = $('panelList');
  box.innerHTML = '';
  state.panels.forEach((p, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'panelRow' + (state.selectedPanel === i ? ' active' : '');
    const photoName = state.fillMode === 'single'
      ? (state.photos[state.singlePhoto]?.name || '—')
      : (state.photos[p.photo]?.name || '—');
    row.textContent = `Panel ${i + 1} · ${photoName} · zoom ${p.zoom.toFixed(1)}×`;
    row.addEventListener('click', () => { state.selectedPanel = i; syncPanelControls(); redraw(); });
    box.appendChild(row);
  });
}

function syncPanelControls() {
  const p = state.panels[state.selectedPanel];
  $('zoom').value = p.zoom;
  $('zoomVal').textContent = `${p.zoom.toFixed(1)}×`;
  $('panelPhoto').innerHTML = '';
  state.photos.forEach((ph, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = ph.name;
    $('panelPhoto').appendChild(o);
  });
  $('panelPhoto').value = String(p.photo);
  $('panelLabel').textContent = `Panel ${state.selectedPanel + 1} photo`;
}

// --- photo sources ---------------------------------------------------------

async function addSample(name, file) {
  try {
    const img = await loadImage(`samples/${file}`);
    state.photos.push({ name, img });
    redraw();
  } catch (e) { statusEl.textContent = `Could not load sample ${name}.`; }
}

$('loadBoulevard').addEventListener('click', () => addSample('Boulevard', 'boulevard.jpg'));
$('loadPier').addEventListener('click', () => addSample('Pier', 'pier.jpg'));
$('loadBoth').addEventListener('click', async () => {
  if (!state.photos.length) { await addSample('Boulevard', 'boulevard.jpg'); await addSample('Pier', 'pier.jpg'); }
});

$('upload').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.photos.push({ name: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo', img });
    } catch (err) { statusEl.textContent = `Could not read ${file.name}.`; }
  }
  redraw();
  statusEl.textContent = `${state.photos.length} photo(s) loaded. Drag the preview to pan the selected panel.`;
});

// --- layout / grade / fill -------------------------------------------------

function buildOptionButtons(el, entries, current, onPick) {
  el.innerHTML = '';
  Object.entries(entries).forEach(([key, val]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt' + (current === key ? ' active' : '');
    b.textContent = val.name || val.label || key;
    b.addEventListener('click', () => { onPick(key); buildOptionButtons(el, entries, key, onPick); redraw(); });
    el.appendChild(b);
  });
}

buildOptionButtons($('layoutBtns'), LAYOUTS, state.layout, (k) => { state.layout = k; });
buildOptionButtons($('gradeBtns'), GRADES, state.grade, (k) => { state.grade = k; });
buildOptionButtons($('sizeBtns'), EXPORT_SIZES, state.exportSize, (k) => { state.exportSize = k; });

$('fillSingle').addEventListener('click', () => { state.fillMode = 'single'; $('fillSingle').classList.add('active'); $('fillMulti').classList.remove('active'); redraw(); });
$('fillMulti').addEventListener('click', () => { state.fillMode = 'multi'; $('fillMulti').classList.add('active'); $('fillSingle').classList.remove('active'); redraw(); });

// --- caption controls ------------------------------------------------------

$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('titleSize').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); $('titleSizeVal').textContent = `${Math.round(state.titleSize * 100)}%`; redraw(); });
$('titleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; redraw(); });
$('outline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });
$('slant').addEventListener('input', (e) => { state.slant = Number(e.target.value); $('slantVal').textContent = `${state.slant}°`; redraw(); });

// --- per-panel crop: drag to pan, zoom slider, photo picker -----------------

let dragging = false;
let lastX = 0;
let lastY = 0;
let downX = 0;
let downY = 0;

preview.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  downX = e.clientX;
  downY = e.clientY;
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = state.panels[state.selectedPanel];
  const rect = preview.getBoundingClientRect();
  p.panX = Math.max(-1, Math.min(1, p.panX + ((e.clientX - lastX) / rect.width) * 2));
  p.panY = Math.max(-1, Math.min(1, p.panY + ((e.clientY - lastY) / rect.height) * 2));
  lastX = e.clientX;
  lastY = e.clientY;
  redraw();
});
preview.addEventListener('pointerup', () => { dragging = false; });
preview.addEventListener('click', (e) => {
  // A real drag pans the panel; a plain click selects the next panel.
  if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) return;
  state.selectedPanel = (state.selectedPanel + 1) % state.panels.length;
  syncPanelControls();
  redraw();
});

$('zoom').addEventListener('input', (e) => {
  state.panels[state.selectedPanel].zoom = Number(e.target.value);
  $('zoomVal').textContent = `${Number(e.target.value).toFixed(1)}×`;
  redraw();
});
$('panelPhoto').addEventListener('change', (e) => {
  state.panels[state.selectedPanel].photo = Number(e.target.value);
  state.fillMode = 'multi';
  $('fillMulti').classList.add('active');
  $('fillSingle').classList.remove('active');
  redraw();
});
$('resetCrop').addEventListener('click', () => {
  state.panels[state.selectedPanel] = { photo: state.panels[state.selectedPanel].photo, zoom: 1, panX: 0, panY: 0 };
  syncPanelControls();
  redraw();
});

// --- export ----------------------------------------------------------------

function renderExport(sizeKey) {
  const size = EXPORT_SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.width;
  off.height = size.height;
  drawSolMarinaCover(off, state);
  return off;
}

function exportCover(sizeKey) {
  const size = EXPORT_SIZES[sizeKey];
  const off = renderExport(sizeKey);
  off.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sol-marina-cover-${size.width}x${size.height}.png`;
    a.click();
    statusEl.textContent = `Saved sol-marina-cover-${size.width}x${size.height}.png`;
  }, 'image/png');
}

$('exportBtn').addEventListener('click', () => exportCover(state.exportSize));

// --- demo hooks (also the app's own screenshot helpers) ---------------------

window.__exportCover = (sizeLabel) => {
  const key = Object.keys(EXPORT_SIZES).find((k) => EXPORT_SIZES[k].label === sizeLabel) || state.exportSize;
  return renderExport(key).toDataURL('image/png');
};
window.__setLayout = (name) => { if (LAYOUTS[name]) { state.layout = name; redraw(); return true; } return false; };
window.__setGrade = (name) => { if (GRADES[name]) { state.grade = name; redraw(); return true; } return false; };
window.__state = state;

async function loadDemo() {
  await addSample('Boulevard', 'boulevard.jpg');
  await addSample('Pier', 'pier.jpg');
  state.title = 'SOL MARINA';
  state.subtitle = 'NEON BAY NIGHTS';
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  await document.fonts.load('400 100px Anton');
  await document.fonts.load('400 40px "Bebas Neue"');
  await document.fonts.ready;
  syncPanelControls();
  redraw();
  window.__ready = true;
}

if (new URLSearchParams(location.search).get('demo') === '1') {
  loadDemo();
} else {
  syncPanelControls();
  document.fonts.ready.then(() => redraw());
  redraw();
}
