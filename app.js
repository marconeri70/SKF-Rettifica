/* app.js — Home Supervisor (v6) */

// --- Stato -------------------------------------------------------------------
const STORAGE_KEY = 'skf5s-data';
const state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { channels: {}, selectedCH: null };
    const parsed = JSON.parse(raw);
    if (!parsed.channels) parsed.channels = {};
    return parsed;
  } catch {
    return { channels: {}, selectedCH: null };
  }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
const byId = (id)=> document.getElementById(id);
const channelList = ()=> Object.keys(state.channels);
const pct = (n)=> `${Math.round(n)}%`;

// --- KPI ---------------------------------------------------------------------
function computeKPIs(ch){
  const src = ch?.scores || { s1:0, s2:0, s3:0, s4:0, s5:0 };
  const vals = ['s1','s2','s3','s4','s5'].map(k => Number(src[k] || 0));
  const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
  const late = Number(ch?.late || 0);
  return { vals, avg, late };
}

// --- Import JSON -------------------------------------------------------------
function importJSONFile() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json';
  inp.onchange = () => {
    const f = inp.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        // atteso: { "CH 24": { name:"Rettifica", scores:{s1..s5}, late:1 }, ... }
        Object.entries(data).forEach(([k,v]) => state.channels[k] = v);
        if (!state.selectedCH) state.selectedCH = channelList()[0] || null;
        saveState();
        renderAll();
      } catch {
        alert('File JSON non valido.');
      }
    };
    r.readAsText(f);
  };
  inp.click();
}

// --- Chart -------------------------------------------------------------------
let chart;
function renderChart(){
  const el = byId('progressChart');
  if (!el || typeof Chart === 'undefined') return;

  const labels = ['1S','2S','3S','4S','5S','Ritardi'];
  let values = [0,0,0,0,0,0];
  let title  = 'Andamento CH — Panoramica';

  const chKey = state.selectedCH;
  if (chKey && state.channels[chKey]) {
    const ch = state.channels[chKey];
    const { vals, late } = computeKPIs(ch);
    values = [...vals, late];
    title = `Andamento ${chKey} — ${ch.name || ''}`.trim();
  } else {
    const list = channelList();
    if (list.length) {
      let sum = [0,0,0,0,0], lateSum = 0;
      list.forEach(k=>{
        const { vals, late } = computeKPIs(state.channels[k]);
        sum = sum.map((v,i)=> v + (vals[i] || 0));
        lateSum += late;
      });
      const avg = sum.map(v => v / list.length);
      values = [...avg, lateSum];
    }
  }
  byId('chartTitle').textContent = title;

  if (chart) chart.destroy();
  chart = new Chart(el, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            title: (items)=> items?.[0]?.label || '',
            label: (item)=> {
              const lab = item.label;
              const val = item.parsed.y;
              return lab === 'Ritardi' ? ` ${val} azioni` : ` ${val}%`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display:false } },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: v => v + '%' },
          grid: { display:false }
        }
      }
    }
  });

  // KPI e badge
  let avg = 0, lateCount = 0;
  if (chKey && state.channels[chKey]) {
    const k = computeKPIs(state.channels[chKey]); avg = k.avg; lateCount = k.late;
  } else {
    const list = channelList();
    if (list.length){
      let a=0,l=0;
      list.forEach(k=>{ const x = computeKPIs(state.channels[k]); a+=x.avg; l+=x.late; });
      avg = a/list.length; lateCount = l;
    }
  }
  byId('avgScore').textContent = pct(avg);
  byId('lateCount').textContent = lateCount;
  const badge = byId('lateBadge');
  if (lateCount > 0) { badge.style.display=''; byId('lateText').textContent = `Azioni in ritardo: ${lateCount}`; }
  else { badge.style.display='none'; }
}

// --- Filtri CH ---------------------------------------------------------------
function renderCHFilters(){
  const wrap = byId('chFilters'); if (!wrap) return;
  wrap.innerHTML = '';
  const list = channelList();

  if (!list.length) {
    const info = document.createElement('div');
    info.className = 'muted';
    info.textContent = 'Importa i report CH per vedere i dati.';
    wrap.appendChild(info);
    return;
  }

  list.forEach(key=>{
    const chip = document.createElement('button');
    chip.className = 'chip';
    if (state.selectedCH === key) chip.classList.add('active');
    const name = state.channels[key]?.name ? ` — ${state.channels[key].name}` : '';
    chip.textContent = `${key}${name}`;
    chip.onclick = ()=>{ state.selectedCH = key; saveState(); renderAll(); };
    wrap.appendChild(chip);
  });

  const all = document.createElement('button');
  all.className = 'chip';
  if (!state.selectedCH) all.classList.add('active');
  all.textContent = 'Tutti i CH';
  all.onclick = ()=>{ state.selectedCH = null; saveState(); renderAll(); };
  wrap.appendChild(all);
}

// --- SW force update ---------------------------------------------------------
async function forceUpdateSW(){
  if (!('serviceWorker' in navigator)) return location.reload();
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return location.reload();
  try {
    await reg.update();
    if (reg.waiting) reg.waiting.postMessage({ type:'SKIP_WAITING' });
    setTimeout(()=>location.reload(), 250);
  } catch { location.reload(); }
}

// --- UI wiring ---------------------------------------------------------------
function wireUI(){
  const p = document.body.getAttribute('data-page');
  if (p !== 'home') return;
  byId('btnImport')?.addEventListener('click', importJSONFile);
  byId('btnUpdate')?.addEventListener('click', forceUpdateSW);
}

function renderAll(){ renderCHFilters(); renderChart(); }

document.addEventListener('DOMContentLoaded', ()=>{ wireUI(); renderAll(); });
