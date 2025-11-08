/* app.js — supervisor home essentials */

// ---- Stato & persistenza ----------------------------------------------------
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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---- Helpers ---------------------------------------------------------------
function byId(id){ return document.getElementById(id); }
function pct(n){ return `${Math.round(n)}%`; }

function channelList(){
  return Object.keys(state.channels);
}

function computeKPIs(ch){
  // Ritorna [s1..s5] in %
  const src = ch?.scores || { s1:0, s2:0, s3:0, s4:0, s5:0 };
  const vals = ['s1','s2','s3','s4','s5'].map(k => Number(src[k]||0));
  const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;

  // Ritardi (conteggio semplice)
  const late = Number(ch?.late || 0);

  return { vals, avg, late };
}

// ---- Import semplice (JSON dei CH) -----------------------------------------
function importJSONFile() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json';
  inp.onchange = () => {
    const f = inp.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        // Atteso: { "CH 24": { name:"Rettifica", scores:{s1..s5}, late:1 }, ... }
        Object.entries(data).forEach(([key, val]) => {
          state.channels[key] = val;
        });
        if (!state.selectedCH) {
          state.selectedCH = channelList()[0] || null;
        }
        saveState();
        renderAll();
      } catch (e) {
        alert('File JSON non valido.');
      }
    };
    reader.readAsText(f);
  };
  inp.click();
}

// ---- Chart ------------------------------------------------------------------
let chart;

function renderChart(){
  const ctx = byId('progressChart');
  if (!ctx) return;

  // Etichette fisse in asse X
  const labels = ["1S","2S","3S","4S","5S","Ritardi"];

  // Dati (CH selezionato o media globale)
  let title = 'Andamento CH — Panoramica';
  let dataVals = [0,0,0,0,0,0];

  const chKey = state.selectedCH;
  if (chKey && state.channels[chKey]) {
    const ch = state.channels[chKey];
    const { vals, late } = computeKPIs(ch);
    dataVals = [...vals, late];
    title = `Andamento ${chKey} — ${ch.name || ''}`.trim();
  } else {
    // Panoramica su tutti i CH
    const list = channelList();
    if (list.length) {
      let sum = [0,0,0,0,0];
      let lateSum = 0;
      list.forEach(k => {
        const { vals, late } = computeKPIs(state.channels[k]);
        sum = sum.map((v,i)=> v + (vals[i]||0));
        lateSum += late;
      });
      const avg = sum.map(v => v / list.length);
      dataVals = [...avg, lateSum];
    }
  }

  byId('chartTitle').textContent = title;

  // Destroy precedente
  if (chart) { chart.destroy(); }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: dataVals,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            title: (items)=> items[0]?.label || '',
            label: (item)=> {
              const l = item.label;
              const v = item.parsed.y;
              if (l === 'Ritardi') return ` ${v} azioni`;
              return ` ${v}%`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display:false } },
        y: {
          beginAtZero:true,
          max: 100,
          ticks: { callback:(v)=> v + '%' },
          grid: { display:false }
        }
      }
    }
  });

  // KPI e badge ritardi
  let avg = 0, lateCount = 0;
  if (state.selectedCH && state.channels[state.selectedCH]) {
    const k = computeKPIs(state.channels[state.selectedCH]);
    avg = k.avg; lateCount = k.late;
  } else {
    const list = channelList();
    if (list.length){
      let a=0, l=0;
      list.forEach(k=>{
        const x = computeKPIs(state.channels[k]);
        a += x.avg; l += x.late;
      });
      avg = a / list.length; lateCount = l;
    }
  }
  byId('avgScore').textContent  = pct(avg);
  byId('lateCount').textContent = lateCount;
  const badge = byId('lateBadge');
  if (lateCount > 0) {
    badge.style.display = '';
    byId('lateText').textContent = `Azioni in ritardo: ${lateCount}`;
  } else {
    badge.style.display = 'none';
  }
}

// ---- Filtri CH (chips) ------------------------------------------------------
function renderCHFilters(){
  const wrap = byId('chFilters');
  if (!wrap) return;
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
    const active = state.selectedCH === key || (!state.selectedCH && list[0]===key);
    if (active) chip.classList.add('active');

    const name = state.channels[key]?.name ? ` — ${state.channels[key].name}` : '';
    chip.textContent = `${key}${name}`;
    chip.onclick = ()=>{
      state.selectedCH = key;
      saveState();
      renderAll();
    };
    wrap.appendChild(chip);
  });

  // chip "Tutti i CH"
  const all = document.createElement('button');
  all.className = 'chip';
  if (!state.selectedCH) all.classList.add('active');
  all.textContent = 'Tutti i CH';
  all.onclick = ()=>{
    state.selectedCH = null;
    saveState();
    renderAll();
  };
  wrap.appendChild(all);
}

// ---- Aggiorna SW da bottone -------------------------------------------------
async function forceUpdateSW(){
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) { alert('Service Worker non registrato'); return; }
  try {
    await reg.update();
    // se c’è una waiting, attivala
    if (reg.waiting) {
      reg.waiting.postMessage({ type:'SKIP_WAITING' });
    }
    // micro delay e ricarico
    setTimeout(()=>location.reload(), 300);
  } catch(e){
    location.reload();
  }
}

// ---- Init -------------------------------------------------------------------
function renderAll(){
  renderCHFilters();
  renderChart();
}

function wireUI(){
  const p = document.body.getAttribute('data-page');
  if (p !== 'home') return;

  const btnImport = document.getElementById('btnImport');
  if (btnImport) btnImport.addEventListener('click', importJSONFile);

  const btnUpdate = document.getElementById('btnUpdate');
  if (btnUpdate) btnUpdate.addEventListener('click', forceUpdateSW);
}

document.addEventListener('DOMContentLoaded', ()=>{
  wireUI();
  renderAll();
});

// Accorcia l’attesa se il SW invia skipWaiting
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // quando cambia il controller, ricarico per usare subito i nuovi file
    location.reload();
  });
}

// opzionale: ascolta messaggi dal SW
navigator.serviceWorker?.addEventListener?.('message', (e)=>{
  if (e.data?.type === 'SKIP_WAITING_DONE') {
    location.reload();
  }
});
