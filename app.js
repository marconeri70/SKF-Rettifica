/* app.js — SKF 5S Supervisor (v6 safe) */
'use strict';

// ---------- util ----------
const $ = (id) => document.getElementById(id);
const pct = (n) => `${Math.round(n)}%`;

// ---------- stato ----------
const STORAGE_KEY = 'skf5s-data';
const state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { channels: {}, selectedCH: null };
    const obj = JSON.parse(raw);
    if (!obj.channels) obj.channels = {};
    return obj;
  } catch {
    return { channels: {}, selectedCH: null };
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
const channelKeys = () => Object.keys(state.channels);

// ---------- calcoli ----------
function kpisOf(ch) {
  const s = ch?.scores || {};
  const vals = ['s1','s2','s3','s4','s5'].map(k => Number(s[k] || 0));
  const avg  = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
  const late = Number(ch?.late || 0);
  return { vals, avg, late };
}

// ---------- import JSON ----------
function importJSONFile() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json';
  inp.onchange = () => {
    const f = inp.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        // atteso: { "CH 24": { name:"Rettifica", scores:{s1..s5}, late:1 }, ... }
        Object.entries(data).forEach(([k,v]) => { state.channels[k] = v; });
        if (!state.selectedCH) state.selectedCH = channelKeys()[0] || null;
        saveState();
        renderAll();
      } catch (e) {
        console.error('JSON non valido', e);
        alert('File JSON non valido.');
      }
    };
    r.readAsText(f);
  };
  inp.click();
}

// ---------- grafico ----------
let chart;
function renderChart() {
  const cvs = $('progressChart');
  const titleEl = $('chartTitle');
  const avgEl = $('avgScore');
  const lateEl = $('lateCount');
  const badgeWrap = $('lateBadge');
  if (!cvs || !titleEl || !avgEl || !lateEl) return;

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js non caricato: controlla lo <script> CDN prima di app.js');
    return;
  }

  const labels = ['1S','2S','3S','4S','5S','Ritardi'];
  let values = [0,0,0,0,0,0];
  let title  = 'Andamento CH — Panoramica';

  const sel = state.selectedCH;
  const keys = channelKeys();

  if (sel && state.channels[sel]) {
    const { vals, late } = kpisOf(state.channels[sel]);
    values = [...vals, late];
    title = `Andamento ${sel} — ${(state.channels[sel].name || '').trim()}`;
  } else if (keys.length) {
    let sum = [0,0,0,0,0], lateSum = 0;
    keys.forEach(k => {
      const { vals, late } = kpisOf(state.channels[k]);
      sum = sum.map((v,i) => v + (vals[i] || 0));
      lateSum += late;
    });
    const avg = sum.map(v => v / keys.length);
    values = [...avg, lateSum];
  }

  titleEl.textContent = title;

  if (chart) chart.destroy();
  chart = new Chart(cvs, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.label === 'Ritardi' ? ` ${ctx.parsed.y} azioni` : ` ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true, max: 100,
          ticks: { callback: v => v + '%' },
          grid: { display: false }
        }
      }
    }
  });

  // KPI e badge
  let avg = 0, late = 0;
  if (sel && state.channels[sel]) {
    const k = kpisOf(state.channels[sel]); avg = k.avg; late = k.late;
  } else if (keys.length) {
    keys.forEach(k => { const x = kpisOf(state.channels[k]); avg += x.avg; late += x.late; });
    avg = avg / keys.length;
  }
  avgEl.textContent = pct(avg);
  lateEl.textContent = late;
  if (badgeWrap) badgeWrap.style.display = late > 0 ? '' : 'none';
  const lt = $('lateText'); if (lt) lt.textContent = `Azioni in ritardo: ${late}`;
}

// ---------- filtri CH ----------
function renderFilters() {
  const host = $('chFilters'); if (!host) return;
  host.innerHTML = '';
  const keys = channelKeys();
  if (!keys.length) {
    const info = document.createElement('div');
    info.className = 'muted';
    info.textContent = 'Importa i report CH per vedere i dati.';
    host.appendChild(info);
    return;
  }
  keys.forEach(k => {
    const b = document.createElement('button');
    b.className = 'chip';
    if (state.selectedCH === k) b.classList.add('active');
    const name = state.channels[k]?.name ? ` — ${state.channels[k].name}` : '';
    b.textContent = `${k}${name}`;
    b.onclick = () => { state.selectedCH = k; saveState(); renderAll(); };
    host.appendChild(b);
  });
  const all = document.createElement('button');
  all.className = 'chip'; if (!state.selectedCH) all.classList.add('active');
  all.textContent = 'Tutti i CH';
  all.onclick = () => { state.selectedCH = null; saveState(); renderAll(); };
  host.appendChild(all);
}

// ---------- SW update forzato ----------
async function forceUpdateSW() {
  if (!('serviceWorker' in navigator)) { location.reload(); return; }
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) { location.reload(); return; }
  try {
    await reg.update();
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => location.reload(), 250);
  } catch {
    location.reload();
  }
}

// ---------- wiring ----------
function wire() {
  // pagina home?
  if (document.body.getAttribute('data-page') !== 'home') return;

  $('btnImport')?.addEventListener('click', importJSONFile);
  $('btnUpdate')?.addEventListener('click', forceUpdateSW);
  // facoltativo: PIN e Note se li userai
}

function renderAll() { renderFilters(); renderChart(); }

// ---------- bootstrap ----------
document.addEventListener('DOMContentLoaded', () => {
  // SW (assicurati <script src="./sw.js"> è registrato in index.html)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  }
  wire();
  renderAll();
});
