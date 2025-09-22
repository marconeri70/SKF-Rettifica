/* ===========================================================
   SKF 5S – v1k-CH24
   =========================================================== */

const UI = {
  pageHome: document.getElementById('home'),
  pageChecklist: document.getElementById('checklist'),
  goChecklist: document.getElementById('goChecklist'),
  backHome: document.getElementById('backHome'),
  chipsRow: document.getElementById('chipsRow'),
  sList: document.getElementById('sList'),
  avgKpi: document.getElementById('avgKpi'),
  lateKpi: document.getElementById('lateKpi'),
  toggleAll: document.getElementById('toggleAll'),
  kpiChartCanvas: document.getElementById('kpiChart'),
  latePills: document.getElementById('latePills'),
  exportBtn: document.getElementById('exportBtn'),
  chartTitle: document.getElementById('chartTitle'),
};

const COLORS = {
  s1: getCss('--s1'),
  s2: getCss('--s2'),
  s3: getCss('--s3'), // fix: era nero, ora arancio giallo
  s4: getCss('--s4'),
  s5: getCss('--s5'),
  late: getCss('--late'),
};
function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

const STATE = {
  chName: 'CH 24 — Rettifica',
  locked: true,
  sections: {
    s1: { key:'1S', title:'Selezionare', info:'Eliminare il superfluo.', value:0, items:[makeItem()] },
    s2: { key:'2S', title:'Sistemare', info:'Un posto per tutto e tutto al suo posto.', value:0, items:[makeItem()] },
    s3: { key:'3S', title:'Splendere', info:'Pulire e prevenire lo sporco.', value:0, items:[makeItem()] },
    s4: { key:'4S', title:'Standardizzare', info:'Regole e segnali chiari.', value:0, items:[makeItem()] },
    s5: { key:'5S', title:'Sostenere', info:'Abitudine e miglioramento continuo.', value:0, items:[makeItem()] },
  },
  chart: null,
};

function makeItem(){
  return { title:'', resp:'', note:'', date:isoToday(), score:0, late:false };
}
function isoToday(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

/* ---------- Routing ---------- */
UI.goChecklist.addEventListener('click', ()=>showPage('checklist'));
UI.backHome.addEventListener('click', ()=>showPage('home'));

function showPage(id){
  UI.pageHome.classList.toggle('page--active', id==='home');
  UI.pageChecklist.classList.toggle('page--active', id==='checklist');
  if(id==='home'){ buildChart(); updateLatePills(); }
  else { renderChecklist(); }
}

/* ---------- Build chips & cards ---------- */
function renderChecklist(){
  document.getElementById('chTitle').textContent = STATE.chName;

  // Chips riassuntive cliccabili
  UI.chipsRow.innerHTML = '';
  ['s1','s2','s3','s4','s5'].forEach(sid=>{
    const s = STATE.sections[sid];
    const chip = el('button','chip '+sid,`${s.key} ${s.value}%`);
    chip.addEventListener('click', ()=>document.getElementById(`card-${sid}`).scrollIntoView({behavior:'smooth',block:'start'}));
    UI.chipsRow.appendChild(chip);
  });

  // Cards
  UI.sList.innerHTML = '';
  Object.entries(STATE.sections).forEach(([sid,s])=>{
    UI.sList.appendChild(buildSectionCard(sid,s));
  });

  updateGlobalKpis();
}

/* ---------- Card builder ---------- */
function buildSectionCard(sid,s){
  const card = el('article','s-card',null,{id:`card-${sid}`});

  // head
  const head = el('div','s-card__head');
  const color = el('div','s-color'); color.style.background = COLORS[sid];
  const title = el('div','s-title',`${s.key} — ${s.title}`);
  const tools = el('div','s-tools');

  // badge Valore
  const badge = el('div','s-badge',`Valore: ${s.value}%`);
  badge.id = `badge-${sid}`;
  tools.appendChild(badge);

  // info popover
  const infoWrap = el('div','info-pop '+sid);
  const infoBtn = el('button','icon-btn', 'i'); infoBtn.type='button';
  const pop = el('div','info-pop__box');
  pop.innerHTML = `<div class="info-pop__title">${s.key} — ${s.title}</div><div>${s.info}</div>`;
  infoWrap.append(infoBtn,pop);
  infoBtn.addEventListener('click', ()=>pop.classList.toggle('show'));
  document.addEventListener('click',(e)=>{ if(!infoWrap.contains(e.target)) pop.classList.remove('show'); });
  tools.appendChild(infoWrap);

  // add voice (PIN gestito altrove; qui abilitiamo sempre)
  const addBtn = el('button','icon-btn','+'); addBtn.type='button';
  addBtn.addEventListener('click',()=>{
    s.items.push(makeItem());
    renderChecklist();
  });
  tools.appendChild(addBtn);

  head.append(color,title,tools);
  card.appendChild(head);

  // body
  const body = el('div','s-body');
  const details = el('details'); details.open = true;
  const sum = el('summary',null,'Dettagli');
  details.appendChild(sum);

  s.items.forEach((it,idx)=>{
    const row = el('div','row');

    // Responsabile
    const resp = inputText('Responsabile / Operatore', it.resp);
    resp.addEventListener('input',e=>{ it.resp = e.target.value; saveAndRefresh(sid); });

    // Note
    const note = el('textarea'); note.placeholder='Note...'; note.value = it.note;
    note.addEventListener('input',e=>{ it.note = e.target.value; saveAndRefresh(sid); });

    // Score
    const scoreBox = el('div','row__score');
    [0,1,3,5].forEach(v=>{
      const b = el('button','score', String(v)); b.type='button';
      if(it.score===v) b.classList.add('active');
      b.addEventListener('click',()=>{
        it.score = v;
        scoreBox.querySelectorAll('.score').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        saveAndRefresh(sid);
      });
      scoreBox.appendChild(b);
    });

    // Data
    const dateWrap = el('div','date');
    const datelabel = el('span',null,'Data');
    const date = el('input'); date.type='date'; date.value = it.date || isoToday();
    date.addEventListener('change',e=>{ it.date = e.target.value; saveAndRefresh(sid); });
    dateWrap.append(datelabel,date);

    // Trash (protetto da PIN? opzionale — qui lasciamo il bottone disabilitato se locked)
    const del = el('button','icon-btn','🗑'); del.type='button';
    del.disabled = STATE.locked;
    del.addEventListener('click',()=>{
      if(STATE.locked) return;
      s.items.splice(idx,1);
      if(s.items.length===0) s.items.push(makeItem());
      saveAndRefresh(sid);
    });

    // mount
    row.append(resp,note,scoreBox,dateWrap,del);
    details.appendChild(row);
  });

  card.appendChild(details);
  // late style
  if(s.items.some(it=>it.late)) card.classList.add('late'); else card.classList.remove('late');
  return card;
}

function inputText(placeholder,val){
  const i = el('input'); i.type='text'; i.placeholder = placeholder; i.value = val||'';
  return i;
}

/* ---------- Helpers ---------- */
function el(tag,cls,txt,attrs){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(txt!=null) n.textContent = txt;
  if(attrs) Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));
  return n;
}

/* ---------- State / compute ---------- */
function saveAndRefresh(sid){
  computeSectionValue(sid);
  updateGlobalKpis();
  renderChecklist(); // re-render per aggiornare badge, late, chips
}

function computeSectionValue(sid){
  const s = STATE.sections[sid];
  // valore = media semplice dei punteggi delle voci (in %) — RESTA come valore corrente della S
  const arr = s.items.map(i=>i.score);
  const val = arr.length ? Math.round((arr.reduce((a,b)=>a+b,0) / (5*arr.length))*100) : 0;
  s.value = val;

  // ritardo: se data < oggi E punteggio < 100%
  const today = new Date(isoToday());
  s.items.forEach(it=>{
    const d = new Date(it.date || isoToday());
    it.late = (d < today) && (it.score < 5);
  });
}

function updateGlobalKpis(){
  // ricalcola tutte
  ['s1','s2','s3','s4','s5'].forEach(computeSectionValue);

  const values = ['s1','s2','s3','s4','s5'].map(k=>STATE.sections[k].value);
  const avg = values.length? Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;
  const lateCount = Object.values(STATE.sections).reduce((n,s)=> n + s.items.filter(i=>i.late).length, 0);

  UI.avgKpi.textContent = `${avg}%`;
  UI.lateKpi.textContent = String(lateCount);

  // aggiorna chips
  ['s1','s2','s3','s4','s5'].forEach(k=>{
    const chip = UI.chipsRow.querySelector(`.chip.${k}`);
    if(chip) chip.textContent = `${STATE.sections[k].key} ${STATE.sections[k].value}%`;
  });

  // aggiorna badges e late style
  Object.entries(STATE.sections).forEach(([sid,s])=>{
    const b = document.getElementById(`badge-${sid}`);
    if(b) b.textContent = `Valore: ${s.value}%`;
    const card = document.getElementById(`card-${sid}`);
    if(card) card.classList.toggle('late', s.items.some(i=>i.late));
  });

  // grafico home
  buildChart();
  updateLatePills();
}

UI.toggleAll.addEventListener('click',()=>{
  const all = UI.sList.querySelectorAll('details');
  const someOpen = Array.from(all).some(d=>d.open);
  all.forEach(d=> d.open = !someOpen);
});

/* ---------- Late pills (home) ---------- */
function updateLatePills(){
  UI.latePills.innerHTML = '';
  Object.entries(STATE.sections).forEach(([sid,s])=>{
    const count = s.items.filter(i=>i.late).length;
    if(count>0){
      const pill = el('button',`pill ${sid}`,`${s.key} in ritardo (${count})`);
      pill.addEventListener('click',()=>{
        showPage('checklist');
        document.getElementById(`card-${sid}`).scrollIntoView({behavior:'smooth',block:'start'});
      });
      UI.latePills.appendChild(pill);
    }
  });
}

/* ---------- Chart ---------- */
function buildChart(){
  if(!UI.kpiChartCanvas) return;
  const ctx = UI.kpiChartCanvas.getContext('2d');

  const vals = ['s1','s2','s3','s4','s5'].map(k=>STATE.sections[k].value);
  const bars = [COLORS.s1, COLORS.s2, COLORS.s3, COLORS.s4, COLORS.s5];
  const late = Object.values(STATE.sections).reduce((n,s)=> n + s.items.filter(i=>i.late).length, 0);

  const data = {
    labels: ['1S','2S','3S','4S','5S','Ritardi'],
    datasets: [{
      data: [...vals, late? (late/5)*100 : 0], // ultima barra “Ritardi” scala 0–100
      backgroundColor: [...bars, COLORS.s2],
      borderRadius: 8,
    }]
  };

  // plugin per etichette percentuali senza taglio
  const labelsPlugin = {
    id:'valueLabels',
    afterDatasetsDraw(chart,args,pluginOptions){
      const {ctx,chartArea,scales:{x,y}} = chart;
      ctx.save();
      ctx.font = '600 12px system-ui';
      ctx.textAlign='center';
      ctx.fillStyle = '#1f2937';
      chart.getDatasetMeta(0).data.forEach((bar,i)=>{
        const val = data.datasets[0].data[i];
        const label = i<5 ? `${val}%` : String(Math.round((val/100)*5)); // ritardi numerico
        const yPos = Math.min(bar.y, chartArea.top + 14); // clamp per non uscire
        ctx.fillText(label, bar.x, bar.y - 6);
      });
      ctx.restore();
    }
  };

  const opts = {
    responsive:true,
    maintainAspectRatio:false,
    layout:{padding:{top:30,bottom:20,left:8,right:8}},
    scales:{
      y:{beginAtZero:true,max:100,grid:{color:'#eef1f8'}},
      x:{grid:{display:false}}
    },
    plugins:{
      legend:{display:false},
      tooltip:{enabled:true}
    }
  };

  if(STATE.chart){ STATE.chart.destroy(); }
  STATE.chart = new Chart(ctx,{type:'bar',data,options:opts,plugins:[labelsPlugin]});
}

/* ---------- PIN lock demo (semplificato) ---------- */
function askPin(){
  const p = prompt('Inserisci PIN per sbloccare (demo: 1234)');
  if(p==='1234'){ STATE.locked=false; alert('Sbloccato'); renderChecklist(); }
  else { alert('PIN errato'); }
}
document.getElementById('lockBtn').addEventListener('click',askPin);
document.getElementById('lockBtn2').addEventListener('click',askPin);

/* ---------- Export (stub con PIN) ---------- */
UI.exportBtn.addEventListener('click', ()=>{
  const p = prompt('PIN supervisore (demo: 1234)');
  if(p!=='1234') return alert('PIN errato');
  // genera JSON compatibile con app supervisore
  const payload = {
    channel: STATE.chName,
    updatedAt: new Date().toISOString(),
    sections: Object.fromEntries(Object.entries(STATE.sections).map(([k,s])=>[
      s.key, { value:s.value, items:s.items }
    ]))
  };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'SKF-5S-CH24.json'; a.click();
  URL.revokeObjectURL(url);
});

/* ---------- Boot ---------- */
window.addEventListener('load',()=>{
  UI.chartTitle.textContent = `Andamento ${STATE.chName}`;
  showPage('home'); // start on home
});
