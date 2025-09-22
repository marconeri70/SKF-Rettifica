/* ======= Config & Stato ======= */
const COLORS = { S1:'#7e57c2', S2:'#ef5350', S3:'#f6b23f', S4:'#43a047', S5:'#1976d2', LATE:'#e53935' };
const SINFO = {
  S1:{name:'1S — Selezionare', text:"Eliminare il superfluo.", color:COLORS.S1},
  S2:{name:'2S — Sistemare', text:"Un posto per tutto e tutto al suo posto.", color:COLORS.S2},
  S3:{name:'3S — Splendere', text:"Pulire e prevenire lo sporco.", color:COLORS.S3},
  S4:{name:'4S — Standardizzare', text:"Regole e segnali chiari.", color:COLORS.S4},
  S5:{name:'5S — Sostenere', text:"Abitudine e miglioramento continuo.", color:COLORS.S5},
};
const LSKEY = 'skf5s_ch24_v1';
const STATE = loadState() || makeDefaultState();
STATE.chName = 'CH 24 — Rettifica';

/* ======= PIN ogni azione protetta ======= */
const PIN = {
  CODE: '2468', // <-- imposta qui
  _resolver:null,
  ask(){ return new Promise(res=>{ this._resolver=res; pinModal.showModal(); pinInput.value=''; }); },
  close(ok){ pinModal.close(); this._resolver?.(ok); this._resolver=null; }
};
pinForm.addEventListener('submit', e=>{ e.preventDefault(); PIN.close(pinInput.value.trim()===PIN.CODE); });

/* ======= Utils ======= */
function makeDefaultState(){
  const today = toISO(new Date());
  const mk = ()=>({ title:'', who:'', notes:'', date:today, score:0 });
  return { sections:{ S1:[mk()], S2:[mk()], S3:[mk()], S4:[mk()], S5:[mk()] } };
}
function toISO(d){ return new Date(d).toISOString().slice(0,10); }
function saveState(){ localStorage.setItem(LSKEY, JSON.stringify(STATE)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem(LSKEY)); }catch{ return null; } }
function scoreToPct(s){ return s===5?100: s===3?60: s===1?20:0; }
function avg(arr){ return arr.length? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0; }
function isLate(iso){ const t=toISO(new Date()); return !iso || iso < t; }

/* ======= KPI ======= */
function computeKPIs(){
  const byS={}; let lateCount=0;
  for(const k of Object.keys(STATE.sections)){
    const items = STATE.sections[k];
    byS[k] = items.length ? Math.round(avg(items.map(x=>scoreToPct(x.score)))) : 0;
    items.forEach(x=>{ if(isLate(x.date)) lateCount++; });
  }
  const overall = Math.round(avg(Object.values(byS)));
  return { byS, overall, lateCount };
}

/* ======= Routing ======= */
const app = document.getElementById('app');
const nav = document.getElementById('navActions');
window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', route);
function route(){
  nav.innerHTML='';
  const h = location.hash || '#/';
  if(h.startsWith('#/checklist')) renderChecklist();
  else renderHome();
}

/* ======= HOME ======= */
function renderHome(){
  app.innerHTML='';
  nav.innerHTML = `<a class="btn primary" href="#/checklist">Vai alla checklist →</a>`;

  // Hero 5S
  const hero = document.createElement('section');
  hero.className='card section';
  hero.innerHTML = `
    <div class="hero">
      <img src="./assets/5s-hero.png" alt="5S">
      <div>
        <h2 class="h2">Cosa è 5S</h2>
        <ul style="margin:0;padding-left:18px">
          ${Object.values(SINFO).map(s=>(
            `<li><span class="pill" style="background:${s.color}">${s.name.split(' — ')[0]}</span> — ${s.text}</li>`
          )).join('')}
        </ul>
      </div>
    </div>`;
  app.append(hero);

  // Grafico
  const wrap = document.createElement('section');
  wrap.className='card section';
  wrap.innerHTML = `
    <h3 class="h3">Andamento ${STATE.chName}</h3>
    <div class="chart"><canvas id="chart" class="canvas"></canvas></div>
    <div class="row pills" id="latePills"></div>
    <div style="margin-top:12px"><button id="exportBtn" class="btn primary">Esporta dati per Supervisore (PIN)</button></div>
  `;
  app.append(wrap);

  const k = computeKPIs();
  drawChart(k.byS, k.lateCount);
  fillLatePills();

  document.getElementById('exportBtn').onclick = async ()=>{
    const ok = await PIN.ask(); if(!ok) return;
    const payload = { ch:STATE.chName, createdAt:new Date().toISOString(), sections:STATE.sections };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`SKF-5S-${STATE.chName.replaceAll(' ','_')}.json`; a.click();
  };

  function fillLatePills(){
    const box=document.getElementById('latePills'); box.innerHTML='';
    const lateByS={}; for(const k of Object.keys(STATE.sections)){ lateByS[k]=STATE.sections[k].filter(x=>isLate(x.date)).length; }
    Object.entries(lateByS).forEach(([k,n])=>{
      if(n>0){
        const btn=document.createElement('button'); const idx=k[1];
        btn.className='btn small'; btn.style.borderColor=SINFO[k].color; btn.style.color=SINFO[k].color;
        btn.textContent=`${idx}S in ritardo (${n})`;
        btn.onclick=()=>{ location.hash='#/checklist'; setTimeout(()=>scrollToSection(k),200); };
        box.append(btn);
      }
    });
  }
}

/* ======= Canvas chart (con colonna “Ritardi”) ======= */
function drawChart(byS, lateCount){
  const c=document.getElementById('chart');
  const dpr=window.devicePixelRatio||1;
  const W=c.clientWidth,H=c.clientHeight; c.width=W*dpr; c.height=H*dpr;
  const g=c.getContext('2d'); g.scale(dpr,dpr); g.clearRect(0,0,W,H);

  const labels=['1S','2S','3S','4S','5S','Ritardi'];
  const cols=[COLORS.S1,COLORS.S2,COLORS.S3,COLORS.S4,COLORS.S5,COLORS.LATE];
  const vals=[byS.S1||0,byS.S2||0,byS.S3||0,byS.S4||0,byS.S5||0,lateCount||0];

  const pad={top:28,right:20,bottom:52,left:40};
  const cw=W-pad.left-pad.right, ch=H-pad.top-pad.bottom, max=100;

  // assi
  g.strokeStyle='#e5e7eb'; g.lineWidth=1;
  g.beginPath(); g.moveTo(pad.left,pad.top); g.lineTo(pad.left,pad.top+ch); g.lineTo(pad.left+cw,pad.top+ch); g.stroke();

  const bw = cw/(vals.length*1.7), gap=bw*.7;

  vals.forEach((v,i)=>{
    const x=pad.left+i*(bw+gap)+gap/2;
    // scala: per “Ritardi” disegna in scala 0..100 (se è basso resta una barretta)
    const val = i===5 ? Math.min(100,v) : v;
    const h=Math.round(ch*(val/max));
    const y=pad.top+ch-h;

    g.fillStyle=cols[i]; g.fillRect(x,y,bw,h);

    g.font='600 12px system-ui'; g.textAlign='center';
    // etichetta (percentuale o numero)
    g.fillStyle='#111827';
    const text=i===5 ? String(v) : `${v}%`;
    const inside = h>22;
    g.fillText(text, x+bw/2, inside ? (y+16) : (y-6));

    g.fillStyle='#374151';
    g.fillText(labels[i], x+bw/2, pad.top+ch+18);
  });
}

/* ======= CHECKLIST ======= */
function renderChecklist(){
  app.innerHTML='';
  nav.innerHTML=`<a class="btn" href="#/">← Indietro</a>`;

  const k = computeKPIs();
  const head=document.createElement('section');
  head.className='section';
  head.innerHTML = `
    <h2 class="h2">${STATE.chName}</h2>
    <div class="kpis">
      <div class="kpi card"><h4>Punteggio medio</h4><div class="val" id="avgVal">${k.overall}%</div></div>
      <div class="kpi card"><h4>Azioni in ritardo</h4><div class="val" id="lateVal">${k.lateCount}</div></div>
    </div>
    <div class="row" style="margin-top:12px">
      ${[1,2,3,4,5].map(i=>{
        const key='S'+i, pct=k.byS[key]||0, col=SINFO[key].color;
        return `<button class="badge" style="color:${col}" onclick="scrollToSection('${key}')">${i}S ${pct}%</button>`;
      }).join('')}
      <button id="toggleAll" class="btn primary">Comprimi / Espandi</button>
    </div>
  `;
  app.append(head);

  const acc=document.createElement('div'); acc.className='accordion';
  Object.keys(SINFO).forEach(k=> acc.append(buildPanel(k)) );
  app.append(acc);

  document.getElementById('toggleAll').onclick=()=>{
    document.querySelectorAll('.details').forEach(d=> d.open=!d.open);
  };

  refreshKPIs();

  function buildPanel(k){
    const info=SINFO[k], items=STATE.sections[k];
    const panel=document.createElement('section'); panel.className='panel'; panel.id=`panel-${k}`;

    const pct = Math.round(avg(items.map(x=>scoreToPct(x.score))));
    const head=document.createElement('div'); head.className='head';
    head.innerHTML=`
      <div class="title">
        <span class="colorchip ${k.toLowerCase()}c" style="background:${info.color}"></span>
        <span class="s-title" style="color:${info.color}">${info.name}</span>
      </div>
      <div class="row">
        <span class="meta">Valore: <b id="meta-${k}">${pct}%</b></span>
        <button class="i-btn" title="Info" style="color:${info.color}">i</button>
        <button class="i-btn plus" title="Duplica riga" style="color:${info.color}" id="add-${k}">+</button>
      </div>
    `;
    panel.append(head);

    const det=document.createElement('details'); det.className='details'; det.open=true;
    items.forEach((it,idx)=> det.append(buildRow(k,idx,it,info)) );
    panel.append(det);

    head.querySelector('.i-btn').onclick=()=> openInfo(info.name, info.text, info.color);
    head.querySelector(`#add-${k}`).onclick=async ()=>{
      const ok=await PIN.ask(); if(!ok) return;
      const today=toISO(new Date());
      STATE.sections[k].push({ title:'', who:'', notes:'', date:today, score:0 });
      saveState(); rerender(k,panel); refreshKPIs();
    };

    applyLate(panel,k);
    return panel;
  }

  function buildRow(k,idx,it,info){
    const wrap=document.createElement('div'); wrap.className='section'; wrap.style.border='1px dashed var(--ring)'; wrap.style.borderRadius='12px';

    const fields=document.createElement('div'); fields.className='row-fields';
    fields.innerHTML=`
      <input class="input" placeholder="Responsabile / Operatore" value="${it.who||''}" />
      <textarea class="input" placeholder="Note...">${it.notes||''}</textarea>
    `;
    const inpWho=fields.children[0], inpNotes=fields.children[1];

    const ctr=document.createElement('div'); ctr.className='controls';
    const score=document.createElement('div'); score.className='score';
    [0,1,3,5].forEach(s=>{
      const b=document.createElement('button'); b.className='sc'+(it.score===s?' active':''); b.textContent=String(s);
      b.onclick=()=>{ it.score=s; saveState(); score.querySelectorAll('.sc').forEach(x=>x.classList.remove('active')); b.classList.add('active'); updateMeta(k); refreshKPIs(); };
      score.append(b);
    });

    const dateCell=document.createElement('div'); dateCell.className='datecell';
    const d=document.createElement('input'); d.type='date'; d.value=it.date||toISO(new Date());
    const del=document.createElement('button'); del.className='btn small danger'; del.textContent='🗑';
    dateCell.append(d,del);

    ctr.append(score,dateCell);
    wrap.append(fields,ctr);

    // events
    inpWho.oninput=()=>{ it.who=inpWho.value; saveState(); };
    inpNotes.oninput=()=>{ it.notes=inpNotes.value; saveState(); };
    d.onchange=()=>{ it.date=d.value; saveState(); applyLate(document.getElementById(`panel-${k}`),k); refreshKPIs(); };

    del.onclick=async ()=>{ const ok=await PIN.ask(); if(!ok) return;
      STATE.sections[k].splice(idx,1);
      if(STATE.sections[k].length===0){ const today=toISO(new Date()); STATE.sections[k].push({title:'',who:'',notes:'',date:today,score:0}); }
      saveState(); rerender(k,document.getElementById(`panel-${k}`)); refreshKPIs();
    };

    return wrap;
  }

  function updateMeta(k){
    const pct=Math.round(avg(STATE.sections[k].map(x=>scoreToPct(x.score))));
    const el=document.querySelector(`#meta-${k}`); if(el) el.textContent=`${pct}%`;
  }
  function rerender(k,panel){
    const info=SINFO[k];
    const det=document.createElement('details'); det.className='details'; det.open=true;
    STATE.sections[k].forEach((it,idx)=> det.append(buildRow(k,idx,it,info)) );
    panel.querySelector('.details').replaceWith(det);
    updateMeta(k); applyLate(panel,k);
  }
  function applyLate(panel,k){
    const late=STATE.sections[k].some(x=>isLate(x.date));
    panel.classList.toggle('late', late);
  }
  function refreshKPIs(){
    const kk=computeKPIs();
    document.getElementById('avgVal').textContent=`${kk.overall}%`;
    document.getElementById('lateVal').textContent=`${kk.lateCount}`;
    [...document.querySelectorAll('.badge')].forEach((el,i)=>{ const key='S'+(i+1); el.textContent=`${i+1}S ${kk.byS[key]||0}%`; });
    Object.keys(SINFO).forEach(key=> applyLate(document.getElementById(`panel-${key}`),key) );
  }
}

/* ======= Scroll helper ======= */
function scrollToSection(k){
  const el=document.getElementById(`panel-${k}`); if(!el) return;
  el.querySelector('.details').open=true;
  el.scrollIntoView({behavior:'smooth',block:'start'});
}
