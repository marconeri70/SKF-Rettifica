/* ===========================================================
   SKF 5S – v1k-CH24 (fix ritardi + PIN per ogni azione)
   =========================================================== */

const PIN_CODE = '1234'; // <- cambia qui il PIN

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
  lockBtnTop: document.getElementById('lockBtn'),
  lockBtnChk: document.getElementById('lockBtn2'),
};

const COLORS = {
  s1: css('--s1'),
  s2: css('--s2'),
  s3: css('--s3'),
  s4: css('--s4'),
  s5: css('--s5'),
  late: css('--late'),
};
function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

const STATE = {
  chName: 'CH 24 — Rettifica',
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
  return { title:'', resp:'', note:'', date:todayISO(), score:0, late:false };
}
function todayISO(){
  const d = new Date(); d.setHours(0,0,0,0);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toLocalDate(yyyy_mm_dd){
  // parsing senza timezone (evita sfasamenti)
  const [y,m,d] = (yyyy_mm_dd || todayISO()).split('-').map(Number);
  const dt = new Date(y, m-1, d);
  dt.setHours(0,0,0,0);
  return dt;
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

/* ---------- Rendering ---------- */
function renderChecklist(){
  document.getElementById('chTitle').textContent = STATE.chName;

  // Chips
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

function buildSectionCard(sid,s){
  const card = el('article','s-card',{id:`card-${sid}`});

  // head
  const head = el('div','s-card__head');
  const color = el('div','s-color'); color.style.background = COLORS[sid];
  const title = el('div','s-title',null); title.textContent = `${s.key} — ${s.title}`;
  const tools = el('div','s-tools');

  // Valore %
  const badge = el('div','s-badge',null); badge.id=`badge-${sid}`; badge.textContent = `Valore: ${s.value}%`;
  tools.appendChild(badge);

  // info (tematizzata)
  const infoWrap = el('div','info-pop '+sid);
  const infoBtn = el('button','icon-btn','i'); infoBtn.type='button';
  const pop = el('div','info-pop__box');
  pop.innerHTML = `<div class="info-pop__title">${s.key} — ${s.title}</div><div>${s.info}</div>`;
  infoWrap.append(infoBtn,pop);
  infoBtn.addEventListener('click', ()=>pop.classList.toggle('show'));
  document.addEventListener('click',e=>{ if(!infoWrap.contains(e.target)) pop.classList.remove('show'); });
  tools.appendChild(infoWrap);

  // add (+) → PIN ogni volta
  const addBtn = el('button','icon-btn','+'); addBtn.type='button';
  addBtn.addEventListener('click',async ()=>{
    if(!(await requirePin())) return;
    s.items.push(makeItem());
    saveAndRefresh(sid);
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

    const resp = inputText('Responsabile / Operatore', it.resp);
    resp.addEventListener('input',e=>{ it.resp=e.target.value; saveAndRefresh(sid); });

    const note = el('textarea'); note.placeholder='Note...'; note.value=it.note;
    note.addEventListener('input',e=>{ it.note=e.target.value; saveAndRefresh(sid); });

    const scoreBox = el('div','row__score');
    [0,1,3,5].forEach(v=>{
      const b = el('button','score',String(v)); b.type='button';
      if(it.score===v) b.classList.add('active');
      b.addEventListener('click',()=>{
        it.score=v;
        scoreBox.querySelectorAll('.score').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        saveAndRefresh(sid);
      });
      scoreBox.appendChild(b);
    });

    const dateWrap = el('div','date');
    const lbl = el('span',null,'Data');
    const date = el('input'); date.type='date'; date.value = it.date || todayISO();
    date.addEventListener('change',e=>{ it.date = e.target.value; saveAndRefresh(sid); });
    dateWrap.append(lbl,date);

    // delete → PIN ogni volta
    const del = el('button','icon-btn btn-danger','🗑'); del.type='button';
    del.addEventListener('click', async ()=>{
      if(!(await requirePin())) return;
      s.items.splice(idx,1);
      if(s.items.length===0) s.items.push(makeItem());
      saveAndRefresh(sid);
    });

    row.append(resp,note,scoreBox,dateWrap,del);
    details.appendChild(row);
  });

  card.appendChild(details);
  // late style
  card.classList.toggle('late', s.items.some(it=>it.late));
  return card;
}

function inputText(ph,val){ const i=el('input'); i.type='text'; i.placeholder=ph; i.value=val||''; return i; }
function el(tag,cls,txtOrAttrs){
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  if(typeof txtOrAttrs==='string'){ n.textContent=txtOrAttrs; }
  else if(typeof txtOrAttrs==='object' && txtOrAttrs){ Object.entries(txtOrAttrs).forEach(([k,v])=>n.setAttribute(k,v)); }
  return n;
}

/* ---------- Compute ---------- */
function saveAndRefresh(sid){
  computeSectionValue(sid);
  updateGlobalKpis();
  renderChecklist(); // re-render per badge/chips/stile ritardo
}

/* Regola RITARDO:
   - in ritardo se Data < oggi (confronto locale) */
function computeSectionValue(sid){
  const s = STATE.sections[sid];
  const scores = s.items.map(i=>i.score);
  const val = scores.length ? Math.round((scores.reduce((a,b)=>a+b,0) / (5*scores.length))*100) : 0;
  s.value = val;

  const today = toLocalDate(todayISO());
  s.items.forEach(it=>{
    const d = toLocalDate(it.date || todayISO());
    it.late = (d < today); // solo data antecedente
  });
}

function updateGlobalKpis(){
  ['s1','s2','s3','s4','s5'].forEach(computeSectionValue);

  const values = ['s1','s2','s3','s4','s5'].map(k=>STATE.sections[k].value);
  const avg = values.length? Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;
  const lateCount = Object.values(STATE.sections).reduce((n,s)=> n + s.items.filter(i=>i.late).length, 0);

  UI.avgKpi.textContent = `${avg}%`;
  UI.lateKpi.textContent = String(lateCount);

  // chips + badge + stile ritardo
  Object.entries(STATE.sections).forEach(([sid,s])=>{
    const chip = UI.chipsRow.querySelector(`.chip.${sid}`);
    if(chip) chip.textContent = `${s.key} ${s.value}%`;
    const b = document.getElementById(`badge-${sid}`);
    if(b) b.textContent = `Valore: ${s.value}%`;
    const card = document.getElementById(`card-${sid}`);
    if(card) card.classList.toggle('late', s.items.some(i=>i.late));
  });

  buildChart();
  updateLatePills();
}

/* ---------- Toggle details ---------- */
UI.toggleAll.addEventListener('click',()=>{
  const all = UI.sList.querySelectorAll('details');
  const someOpen = Array.from(all).some(d=>d.open);
  all.forEach(d=> d.open = !someOpen);
});

/* ---------- Late pills ---------- */
function updateLatePills(){
  UI.latePills.innerHTML = '';
  Object.entries(STATE.sections).forEach(([sid,s])=>{
    const count = s.items.filter(i=>i.late).length;
    if(count>0){
      const pill = document.createElement('button');
      pill.className = `pill ${sid}`;
      pill.textContent = `${s.key} in ritardo (${count})`;
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
      data: [...vals, late? (late/5)*100 : 0],
      backgroundColor: [...bars, COLORS.s2],
      borderRadius: 8,
    }]
  };

  const labelsPlugin = {
    id:'valueLabels',
    afterDatasetsDraw(chart){
      const {ctx} = chart;
      ctx.save();
      ctx.font = '600 12px system-ui';
      ctx.textAlign='center';
      ctx.fillStyle = '#1f2937';
      chart.getDatasetMeta(0).data.forEach((bar,i)=>{
        const raw = data.datasets[0].data[i];
        const text = i<5 ? `${raw}%` : String(Math.round((raw/100)*5));
        ctx.fillText(text, bar.x, bar.y - 6);
      });
      ctx.restore();
    }
  };

  const opts = {
    responsive:true,
    maintainAspectRatio:false,
    layout:{padding:{top:30,bottom:24,left:8,right:8}},
    scales:{
      y:{beginAtZero:true,max:100,grid:{color:'#eef1f8'}},
      x:{grid:{display:false}}
    },
    plugins:{ legend:{display:false}, tooltip:{enabled:true} }
  };

  if(STATE.chart) STATE.chart.destroy();
  STATE.chart = new Chart(ctx,{type:'bar',data,options:opts,plugins:[labelsPlugin]});
}

/* ---------- PIN per azione ---------- */
async function requirePin(){
  const p = prompt('Inserisci PIN');
  if(p===null) return false;
  if(p===PIN_CODE) return true;
  alert('PIN errato');
  return false;
}
UI.lockBtnTop.addEventListener('click', requirePin); // mostra solo il prompt (voluto)
UI.lockBtnChk.addEventListener('click', requirePin);

/* ---------- Export (protetto da PIN) ---------- */
UI.exportBtn.addEventListener('click', async ()=>{
  if(!(await requirePin())) return;
  const payload = {
    channel: STATE.chName,
    updatedAt: new Date().toISOString(),
    sections: Object.fromEntries(Object.entries(STATE.sections).map(([sid,s])=>[
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
  showPage('home');
});
