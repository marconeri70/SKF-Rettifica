/* ========== Stato base ========== */
const COLORS = { S1:'#7e57c2', S2:'#ef5350', S3:'#f6b23f', S4:'#43a047', S5:'#1976d2', LATE:'#e53935' };
const SINFO = {
  S1:{name:'1S — Selezionare', text:"Eliminare il superfluo.", color:COLORS.S1},
  S2:{name:'2S — Sistemare', text:"Un posto per tutto e tutto al suo posto.", color:COLORS.S2},
  S3:{name:'3S — Splendere', text:"Pulire e prevenire lo sporco.", color:COLORS.S3},
  S4:{name:'4S — Standardizzare', text:"Regole e segnali chiari.", color:COLORS.S4},
  S5:{name:'5S — Sostenere', text:"Abitudine e miglioramento continuo.", color:COLORS.S5},
};

const LSKEY = 'skf5s_ch24_v1';
const PIN = {
  CODE: '2468',      // <-- imposta qui il PIN
  _resolver: null,
  ask(){
    return new Promise(res=>{
      this._resolver = res;
      const dlg = document.getElementById('pinModal');
      document.getElementById('pinInput').value='';
      dlg.showModal();
    });
  },
  close(ok){
    const dlg = document.getElementById('pinModal');
    dlg.close();
    if(this._resolver){ this._resolver(ok); this._resolver=null; }
  }
};
document.getElementById('pinForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const val = document.getElementById('pinInput').value.trim();
  PIN.close(val===PIN.CODE);
});

const STATE = loadState() || makeDefaultState();
STATE.chName = 'CH 24 — Rettifica';

/* ========== Routing molto semplice ========== */
const app = document.getElementById('app');
const nav = document.getElementById('navActions');
function route(){
  nav.innerHTML='';
  const hash = location.hash || '#/';
  if(hash.startsWith('#/checklist')){
    renderChecklist();
  }else{
    renderHome();
  }
}
window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', route);

/* ========== Helpers ========== */
function makeDefaultState(){
  const today = toISO(new Date());
  const mk = ()=>({ title:'', who:'', notes:'', date:today, score:0 });
  return {
    sections:{
      S1:[mk()], S2:[mk()], S3:[mk()], S4:[mk()], S5:[mk()],
    }
  };
}
function toISO(d){ return new Date(d).toISOString().slice(0,10); }
function saveState(){ localStorage.setItem(LSKEY, JSON.stringify(STATE)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem(LSKEY)); }catch{ return null; } }
function scoreToPct(s){ return s===5?100: s===3?60: s===1?20:0; }
function avg(arr){ return arr.length? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0; }
function isLate(isoDate){
  const today = toISO(new Date());
  if(!isoDate) return true;
  return isoDate < today; // ieri o precedente => ritardo
}
function openInfo(title, text, color){
  const dlg = document.getElementById('infoModal');
  document.getElementById('infoTitle').textContent=title;
  const p = document.getElementById('infoText'); p.textContent=text;
  dlg.querySelector('.info-card').style.borderTop = `6px solid ${color}`;
  dlg.showModal();
}

/* ========== Calcoli KPI ========== */
function computeKPIs(){
  const byS = {};
  let lateCount = 0;
  for(const k of Object.keys(STATE.sections)){
    const items = STATE.sections[k];
    const pcts = items.map(x=>scoreToPct(x.score));
    byS[k] = pcts.length ? Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length) : 0;
    items.forEach(x=>{ if(isLate(x.date)) lateCount++; });
  }
  const overall = Math.round(avg(Object.values(byS)));
  return { byS, overall, lateCount };
}

/* ========== HOME ========== */
function renderHome(){
  app.innerHTML = '';
  nav.innerHTML = `<a class="btn primary" href="#/checklist">Vai alla checklist →</a>`;

  // Hero 5S
  const heroCard = document.createElement('section');
  heroCard.className='card section';
  heroCard.innerHTML = `
    <div class="hero">
      <img src="./assets/5s-hero.png" alt="5S" onerror="this.style.display='none'">
      <div>
        <h2 class="h2">Cosa è 5S</h2>
        <ul style="margin:0;padding-left:18px">
          ${Object.values(SINFO).map(s=>(
            `<li><span class="pill" style="background:${s.color}">${s.name.split(' — ')[0]}</span> — ${s.text}</li>`
          )).join('')}
        </ul>
      </div>
    </div>`;
  app.append(heroCard);

  // Chart + ritardi
  const chartCard = document.createElement('section');
  chartCard.className='card section';
  chartCard.innerHTML = `
    <h3 class="h3">Andamento ${STATE.chName}</h3>
    <div class="chart"><canvas id="chart" class="canvas"></canvas></div>
    <div class="row pills" id="latePills"></div>
    <div style="margin-top:12px"><button id="exportBtn" class="btn primary">Esporta dati per Supervisore (PIN)</button></div>
  `;
  app.append(chartCard);

  const { byS, lateCount } = computeKPIs();
  drawChart(byS);
  fillLatePills();

  // Export (PIN ogni volta)
  document.getElementById('exportBtn').onclick = async ()=>{
    const ok = await PIN.ask();
    if(!ok) return;
    const payload = {
      ch: STATE.chName,
      createdAt: new Date().toISOString(),
      sections: STATE.sections
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SKF-5S-${STATE.chName.replaceAll(' ','_')}.json`;
    a.click();
  };

  function fillLatePills(){
    const box = document.getElementById('latePills');
    box.innerHTML='';
    const lateByS = {};
    for(const k of Object.keys(STATE.sections)){
      lateByS[k] = STATE.sections[k].filter(x=>isLate(x.date)).length;
    }
    Object.entries(lateByS).forEach(([k,n])=>{
      if(n>0){
        const btn = document.createElement('button');
        const sidx = k[1]; // 1..5
        btn.className='btn small';
        btn.style.borderColor = SINFO[k].color;
        btn.style.color = SINFO[k].color;
        btn.textContent = `${sidx}S in ritardo (${n})`;
        btn.onclick = ()=>{ location.hash = '#/checklist'; setTimeout(()=>scrollToSection(k),200); };
        box.append(btn);
      }
    });
  }
}

/* ========== CHART CANVAS ========== */
function drawChart(byS){
  const c = document.getElementById('chart');
  const dpr = window.devicePixelRatio||1;
  const W = c.clientWidth, H = c.clientHeight;
  c.width = W*dpr; c.height = H*dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);

  const labels = ['1S','2S','3S','4S','5S'];
  const cols = [COLORS.S1,COLORS.S2,COLORS.S3,COLORS.S4,COLORS.S5];
  const vals = [byS.S1||0,byS.S2||0,byS.S3||0,byS.S4||0,byS.S5||0];
  const pad = {top:26,right:20,bottom:48,left:40};
  const cw = W-pad.left-pad.right;
  const ch = H-pad.top-pad.bottom;
  const max = 100;

  // Assi
  ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top+ch); ctx.lineTo(pad.left+cw, pad.top+ch); ctx.stroke();

  const bw = cw/ (vals.length*1.7);
  const gap = bw*0.7;

  vals.forEach((v,i)=>{
    const x = pad.left + i*(bw+gap) + gap/2;
    const h = Math.round(ch * (v/max));
    const y = pad.top + ch - h;

    // Barra
    ctx.fillStyle = cols[i];
    ctx.fillRect(x, y, bw, h);

    // Etichetta % sempre dentro con padding
    ctx.fillStyle = '#111827'; ctx.font='600 12px system-ui'; ctx.textAlign='center';
    const labelY = h>22 ? (y+16) : (y-6);
    ctx.fillText(`${v}%`, x+bw/2, h>22? (y+16) : (y-6));

    // Nome S
    ctx.fillStyle='#374151'; ctx.font='600 12px system-ui';
    ctx.fillText(labels[i], x+bw/2, pad.top+ch+18);
  });
}

/* ========== CHECKLIST ========== */
function renderChecklist(){
  app.innerHTML = '';
  nav.innerHTML = `<a class="btn" href="#/">← Indietro</a>`;

  const kpis = computeKPIs();

  // Header
  const head = document.createElement('section');
  head.className='section';
  head.innerHTML = `
    <h2 class="h2">${STATE.chName}</h2>
    <div class="kpis">
      <div class="kpi card"><h4>Punteggio medio</h4><div class="val" id="avgVal">${kpis.overall}%</div></div>
      <div class="kpi card"><h4>Azioni in ritardo</h4><div class="val" id="lateVal">${kpis.lateCount}</div></div>
    </div>
    <div class="row" style="margin-top:12px">
      ${[1,2,3,4,5].map(i=>{
        const k='S'+i; const p=kpis.byS[k]||0; const col=SINFO[k].color;
        return `<button class="badge" style="color:${col}" onclick="scrollToSection('${k}')">${i}S ${p}%</button>`;
      }).join('')}
      <button id="toggleAll" class="btn primary">Comprimi / Espandi</button>
    </div>
  `;
  app.append(head);

  // Accordion 5S
  const acc = document.createElement('div');
  acc.className='accordion';
  Object.keys(SINFO).forEach(key=> acc.append(buildSectionPanel(key)) );
  app.append(acc);

  document.getElementById('toggleAll').onclick = ()=>{
    document.querySelectorAll('.details').forEach(d=>{
      d.open = !d.open;
    });
  };

  refreshKPIs();

  function buildSectionPanel(k){
    const info = SINFO[k];
    const items = STATE.sections[k];
    const panel = document.createElement('section');
    panel.className='panel';
    panel.id = `panel-${k}`;

    const lastPct = Math.round(avg(items.map(x=>scoreToPct(x.score))));
    const head = document.createElement('div');
    head.className='head';
    head.innerHTML = `
      <div class="title">
        <span class="colorchip ${k.toLowerCase()}c" style="background:${info.color}"></span>
        <span>${info.name}</span>
      </div>
      <div class="row">
        <span class="meta">Valore: <b id="meta-${k}">${lastPct}%</b></span>
        <button class="i-btn" title="Info" style="color:${info.color}">i</button>
        <button class="i-btn plus" title="Duplica riga" style="color:${info.color}" id="add-${k}">+</button>
      </div>
    `;
    panel.append(head);

    const det = document.createElement('details');
    det.className='details'; det.open=true;

    // righe
    items.forEach((it,idx)=> det.append(buildRow(k, idx, it, info)) );

    panel.append(det);

    // Info
    head.querySelector('.i-btn').onclick = ()=> openInfo(info.name, info.text, info.color);
    // Add (PIN ogni volta)
    head.querySelector(`#add-${k}`).onclick = async ()=>{
      const ok = await PIN.ask(); if(!ok) return;
      const today = toISO(new Date());
      const newRow = { title:'', who:'', notes:'', date:today, score:0 };
      STATE.sections[k].push(newRow);
      saveState();
      rerenderSection(k, panel);
      refreshKPIs();
    };

    applyLateStyle(panel, k); // evidenzia bordo se ci sono ritardi
    return panel;
  }

  function rerenderSection(k, panel){
    const info = SINFO[k];
    const det = document.createElement('details');
    det.className='details'; det.open=true;
    STATE.sections[k].forEach((it,idx)=> det.append(buildRow(k, idx, it, info)) );
    panel.querySelector('.details').replaceWith(det);
    const pct = Math.round(avg(STATE.sections[k].map(x=>scoreToPct(x.score))));
    panel.querySelector(`#meta-${k}`).textContent = `${pct}%`;
    applyLateStyle(panel, k);
  }

  function buildRow(k, idx, it, info){
    const wrap = document.createElement('div');
    wrap.className='section';
    wrap.style.border='1px dashed var(--ring)'; wrap.style.borderRadius='12px';

    const fields = document.createElement('div');
    fields.className='row-fields';
    fields.innerHTML = `
      <input class="input" placeholder="Responsabile / Operatore" value="${it.who||''}" />
      <textarea placeholder="Note..." class="input">${it.notes||''}</textarea>
    `;
    const inpWho = fields.children[0], inpNotes = fields.children[1];

    const ctr = document.createElement('div');
    ctr.className='controls';
    const scoreBox = document.createElement('div');
    scoreBox.className='score';
    [0,1,3,5].forEach(s=>{
      const b=document.createElement('button');
      b.className='sc'+(it.score===s?' active':''); b.textContent=String(s);
      b.onclick = ()=>{
        it.score=s; saveState(); b.parentNode.querySelectorAll('.sc').forEach(x=>x.classList.remove('active')); b.classList.add('active');
        refreshKPIs(); document.querySelector(`#meta-${k}`).textContent = `${Math.round(avg(STATE.sections[k].map(x=>scoreToPct(x.score))))}%`;
      };
      scoreBox.append(b);
    });

    const dateBox = document.createElement('div');
    dateBox.className='datecell';
    const dIn = document.createElement('input');
    dIn.type='date'; dIn.value = it.date || toISO(new Date());
    const del = document.createElement('button'); del.className='btn small danger'; del.textContent='🗑';
    dateBox.append(dIn, del);

    ctr.append(scoreBox, dateBox);
    wrap.append(fields, ctr);

    // listeners
    inpWho.oninput = ()=>{ it.who=inpWho.value; saveState(); };
    inpNotes.oninput=()=>{ it.notes=inpNotes.value; saveState(); };
    dIn.onchange = ()=>{ it.date = dIn.value; saveState(); applyLateStyle(document.getElementById(`panel-${k}`), k); refreshKPIs(); };

    // delete with PIN always
    del.onclick = async ()=>{
      const ok = await PIN.ask(); if(!ok) return;
      STATE.sections[k].splice(idx,1);
      if(STATE.sections[k].length===0){
        const today = toISO(new Date());
        STATE.sections[k].push({ title:'', who:'', notes:'', date:today, score:0 });
      }
      saveState(); rerenderSection(k, document.getElementById(`panel-${k}`)); refreshKPIs();
    };

    return wrap;
  }

  function applyLateStyle(panel, k){
    const late = STATE.sections[k].some(x=>isLate(x.date));
    panel.classList.toggle('late', late);
  }

  function refreshKPIs(){
    const k = computeKPIs();
    document.getElementById('avgVal').textContent = `${k.overall}%`;
    document.getElementById('lateVal').textContent = `${k.lateCount}`;
    // chip riepilogo
    [...document.querySelectorAll('.badge')].forEach((el,i)=>{
      const key='S'+(i+1); el.textContent = `${i+1}S ${k.byS[key]||0}%`;
    });
    // bordo ritardo per ogni pannello
    Object.keys(SINFO).forEach(key=>{
      applyLateStyle(document.getElementById(`panel-${key}`), key);
    });
  }
}

/* scroll helper */
function scrollToSection(k){
  const el = document.getElementById(`panel-${k}`);
  if(!el) return;
  el.querySelector('.details').open = true;
  el.scrollIntoView({behavior:'smooth', block:'start'});
}
