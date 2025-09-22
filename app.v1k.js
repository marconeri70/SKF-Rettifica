/* ===========================================================
   SKF 5S – BUILD v1k-CH24
   =========================================================== */

const CH_ID = '24';                 // canale
const STORAGE_KEY = `skf5s-ch${CH_ID}`;
const PIN = '2468';                  // <-- PIN per azioni protette

const COLORS = {
  '1S': '#7c4dff',
  '2S': '#ef5350',
  '3S': '#f9a825', // ambra
  '4S': '#43a047',
  '5S': '#1e88e5',
  late: '#e11d48'
};

const SECTION_TEXT = {
  '1S': 'Selezionare',
  '2S': 'Sistemare',
  '3S': 'Splendere',
  '4S': 'Standardizzare',
  '5S': 'Sostenere'
};

// stato app --------------------------------------------------
const state = loadState() ?? seed();

function seed(){
  return {
    locked: true,
    sections: [
      mkSection('1S'), mkSection('2S'), mkSection('3S'), mkSection('4S'), mkSection('5S')
    ]
  };
}
function mkSection(code){
  return {
    code, name: SECTION_TEXT[code],
    value: 0, // 0/1/3/5 -> percent calc sotto
    items: [
      { title: '', owner: '', notes: '', date: todayISO() }
    ]
  };
}
function todayISO(){
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch{ return null;} }

// routing ----------------------------------------------------
const pageHome = qs('#page-home');
const pageChecklist = qs('#page-checklist');
qs('#btnToChecklist').addEventListener('click', ()=> show('checklist'));
qs('#btnBack').addEventListener('click', ()=> show('home'));
function show(which){
  if(which==='checklist'){ pageHome.classList.remove('active'); pageChecklist.classList.add('active'); renderChecklist(); }
  else { pageChecklist.classList.remove('active'); pageHome.classList.add('active'); renderHome(); }
  window.scrollTo({top:0, behavior:'instant'});
}

// HOME render -----------------------------------------------
let chart;
function renderHome(){
  // titolo
  qs('#titleAndamento').textContent = `Andamento CH ${CH_ID} — Rettifica`;

  // data per grafico
  const vals = state.sections.map(s => toPercent(s.value));
  const labels = state.sections.map(s => s.code);
  const colors = state.sections.map(s => COLORS[s.code]);

  // ritardi
  const late = countLate();

  // chart
  const ctx = qs('#chart5s').getContext('2d');
  if(chart){ chart.destroy(); }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [...labels, 'Ritardi'],
      datasets: [{
        data: [...vals, late>0? (Math.min(100, late*20)) : 0], // “altezza” visiva ritardi
        backgroundColor: [...colors, COLORS.late],
        borderRadius: 8,
        maxBarThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero:true, grid:{display:false}, ticks:{ callback:v=>v+'%'} },
        x: { grid:{display:false} }
      },
      plugins: {
        legend: { display:false },
        tooltip: { enabled:true },
        // Etichette percentuali sopra le barre
        afterDatasetsDraw(chart, args, pluginOptions){
          const {ctx, data} = chart;
          ctx.save();
          ctx.font = '700 12px system-ui';
          ctx.fillStyle = '#111';
          chart.getDatasetMeta(0).data.forEach((bar, i)=>{
            const val = data.datasets[0].data[i];
            const label = data.labels[i];
            const text = (label==='Ritardi') ? String(late) : `${val}%`;
            const cx = bar.x; const cy = bar.y - 8;
            ctx.textAlign = 'center';
            ctx.fillText(text, cx, cy);
          });
          ctx.restore();
        }
      }
    }
  });

  // legenda colorata ordinata
  const legend = qs('#chartLegend');
  legend.innerHTML = state.sections.map(s =>
    `<span class="dot"><span class="box" style="background:${COLORS[s.code]}"></span>${s.code}: ${toPercent(s.value)}%</span>`
  ).join('') + `<span class="dot"><span class="box" style="background:${COLORS.late}"></span>Ritardi: ${late}</span>`;

  // bottoni “in ritardo – Vai”
  const lateDiv = qs('#lateButtons');
  const lateSections = collectLateSections();
  if(lateSections.length===0){
    lateDiv.innerHTML = '';
  }else{
    lateDiv.innerHTML = lateSections.map(code =>
      `<button class="late-btn ${code.toLowerCase()}" data-goto="${code}" style="color:${COLORS[code]}">${code} in ritardo — Vai</button>`
    ).join('');
    lateDiv.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=>{
        show('checklist');
        // scroll alla sezione corretta
        const anchor = qs(\`.s-card[data-code="\${b.dataset.goto}"]\`);
        if(anchor) anchor.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }
}

// CHECKLIST render ------------------------------------------
qs('#btnLock').addEventListener('click', ()=>{
  // toggle lock visuale, ma le azioni protette chiedono comunque PIN
  state.locked = !state.locked; saveState();
  qs('#btnLock').textContent = state.locked ? '🔒' : '🔓';
});

qs('#btnToggleAll').addEventListener('click', ()=>{
  const openAny = [...qsa('.s-card .s-details')].some(d => !d.hidden);
  qsa('.s-card .s-details').forEach(d => d.hidden = openAny); // se ce n'è aperta, chiudi tutto; altrimenti apri tutto
});

function renderChecklist(){
  // badge 1S..5S con percenti
  const chips = qs('#chipsRow');
  chips.innerHTML = state.sections.map(s =>
    `<button class="badge ${s.code.toLowerCase()}" style="background:${COLORS[s.code]}" data-goto="${s.code}">
      ${s.code} ${toPercent(s.value)}%
    </button>`).join('');
  chips.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const el = qs(\`.s-card[data-code="\${b.dataset.goto}"]\`);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // schede
  const wrap = qs('#sections');
  wrap.innerHTML = '';
  state.sections.forEach((s, idx)=>{
    wrap.insertAdjacentHTML('beforeend', sectionTemplate(s));
  });

  // wire up interazioni
  qsa('.s-card').forEach(card=>{
    const code = card.dataset.code;
    const s = state.sections.find(x => x.code===code);

    // apri/chiudi dettagli
    const detailBtn = card.querySelector('.toggle-details');
    const details = card.querySelector('.s-details');
    detailBtn.addEventListener('click', ()=>{
      details.hidden = !details.hidden;
    });

    // info popup
    card.querySelector('.btn-info').addEventListener('click', ()=>{
      alert(`${code} — ${SECTION_TEXT[code]}\n\n` + explain(code));
    });

    // aggiungi voce (PIN)
    card.querySelector('.btn-plus').addEventListener('click', ()=>{
      if(!checkPIN()) return;
      s.items.push({ title:'', owner:'', notes:'', date: todayISO() });
      saveState(); renderChecklist(); // re-render section
    });

    // inputs binding + score pills
    const title = card.querySelector('.inp-title');
    const owner = card.querySelector('.inp-owner');
    const notes = card.querySelector('.inp-notes');
    const date  = card.querySelector('.inp-date');

    // bind first item (semplificazione)
    const it = s.items[0];

    title.value = it.title; owner.value = it.owner; notes.value = it.notes; date.value = it.date;
    title.addEventListener('input', e=>{ it.title=e.target.value; saveState(); });
    owner.addEventListener('input', e=>{ it.owner=e.target.value; saveState(); });
    notes.addEventListener('input', e=>{ it.notes=e.target.value; saveState(); });
    date.addEventListener('change', e=>{ it.date=e.target.value; saveState(); renderChecklist(); });

    // pills
    card.querySelectorAll('.pill').forEach(p=>{
      p.addEventListener('click', ()=>{
        s.value = Number(p.dataset.v);
        saveState();
        renderChecklist();
      });
    });

    // delete voce (PIN)
    card.querySelector('.btn-trash').addEventListener('click', ()=>{
      if(!checkPIN()) return;
      s.items.splice(0,1);
      if(s.items.length===0) s.items.push({title:'',owner:'',notes:'',date:todayISO()});
      saveState(); renderChecklist();
    });
  });

  // KPI, evidenze ritardo, lock icon
  qs('#btnLock').textContent = state.locked ? '🔒' : '🔓';
  const late = countLate();
  qs('#lateCount').textContent = String(late);
  qs('#avgScore').textContent = `${average()}%`;

  // bordo rosso sulle schede in ritardo
  qsa('.s-card').forEach(card=>{
    const code = card.dataset.code;
    if(isSectionLate(code)) card.classList.add('late'); else card.classList.remove('late');
  });
}

function sectionTemplate(s){
  const percent = toPercent(s.value);
  const late = isSectionLate(s.code);
  const swatchStyle = `background:${COLORS[s.code]}`;

  // pills active
  const p = (v)=> s.value===v ? 'pill active' : 'pill';

  return `
  <article class="s-card ${late?'late':''}" data-code="${s.code}">
    <div class="s-head">
      <div class="s-title">
        <span class="s-swatch" style="${swatchStyle}"></span>
        <span>${s.code} — ${s.name}</span>
      </div>
      <div class="s-actions">
        <span class="s-val">Valore: <b>${percent}%</b></span>
        <button class="icon-btn info btn-info" title="Info">i</button>
        <button class="icon-btn plus btn-plus" title="Aggiungi">+</button>
      </div>
    </div>

    <button class="toggle-details" style="margin:.5rem 0 0; background:none; border:none; color:#6b7280; cursor:pointer">▼ Dettagli</button>

    <div class="s-details" ${late?'':'hidden'}>
      <div class="row"><input class="inp-owner" placeholder="Responsabile / Operatore" /></div>
      <div class="row"><textarea class="inp-notes" placeholder="Note..."></textarea></div>
      <div class="grid3">
        <div class="score">
          <button class="${p(0)}" data-v="0">0</button>
          <button class="${p(1)}" data-v="1">1</button>
          <button class="${p(3)}" data-v="3">3</button>
          <button class="${p(5)}" data-v="5">5</button>
        </div>
        <div class="datebox">
          <label style="color:var(--muted);font-weight:700">Data</label>
          <input type="date" class="inp-date" />
        </div>
        <div style="text-align:right">
          <button class="icon-btn trash btn-trash" title="Elimina (PIN)">🗑</button>
        </div>
      </div>
      <div class="row"><input class="inp-title" placeholder="Titolo voce…" /></div>
    </div>
  </article>`;
}

function explain(code){
  switch(code){
    case '1S': return 'Avere solo ciò che serve, eliminare il superfluo.';
    case '2S': return 'Un posto per tutto e tutto al suo posto.';
    case '3S': return 'Pulire e prevenire lo sporco.';
    case '4S': return 'Regole e segnali chiari.';
    case '5S': return 'Abitudine e miglioramento continuo.';
  }
  return '';
}

// Helpers business ------------------------------------------
function toPercent(score){
  // mappa 0/1/3/5 a 0/20/60/100
  if(score===5) return 100;
  if(score===3) return 60;
  if(score===1) return 20;
  return 0;
}
function average(){
  const arr = state.sections.map(s=>toPercent(s.value));
  if(arr.length===0) return 0;
  return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
}
function isLateDate(iso){
  const t = new Date(iso); t.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  return t < now;
}
function isSectionLate(code){
  const s = state.sections.find(x=>x.code===code);
  const it = s.items[0];
  // consideriamo in “ritardo” se la data è nel passato e il valore < 5
  return isLateDate(it.date) && s.value < 5;
}
function collectLateSections(){
  return state.sections.filter(s=>isSectionLate(s.code)).map(s=>s.code);
}
function countLate(){ return collectLateSections().length; }

// PIN gate
function checkPIN(){
  const p = prompt('Inserisci PIN');
  return p===PIN;
}

// EXPORT (per Supervisore)
qs('#btnExport').addEventListener('click', ()=>{
  if(!checkPIN()) return;
  const payload = {
    channel: CH_ID,
    updatedAt: new Date().toISOString(),
    sections: state.sections.map(s=>({
      code: s.code, name: s.name, value: s.value, percent: toPercent(s.value),
      item: s.items[0]
    }))
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `skf5s_ch${CH_ID}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// utils DOM
function qs(sel, el=document){ return el.querySelector(sel); }
function qsa(sel, el=document){ return [...el.querySelectorAll(sel)]; }

// bootstrap
document.addEventListener('DOMContentLoaded', ()=>{
  renderHome();
});
