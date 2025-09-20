/* SKF 5S Single-CH • v1k */
const VERSION = 'v1k';
const KEY = 'skf.5s.v1k';

// utils
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const pct = v => `${Math.round(v)}%`;

// state
let state = { areas: [] };
try{
  const raw = localStorage.getItem(KEY);
  if(raw){ const parsed = JSON.parse(raw); if(parsed && Array.isArray(parsed.areas)) state = parsed; }
}catch(e){ state = {areas: []}; }

// single-CH config
const CFG = { areaName:'CH 2', fixedSector:'Rettifica' };
let role = 'worker'; // or 'supervisor'

// building blocks
function makeSectorSet(){ return {'1S':[], '2S':[], '3S':[], '4S':[], '5S':[]}; }
function makeArea(line){ return { line, activeSector:'Rettifica', sectors:{ Rettifica: makeSectorSet(), Montaggio: makeSectorSet() } }; }

function normalizeState(){
  if(!state || !Array.isArray(state.areas)) state = {areas:[]};
  if(!state.areas.length) state.areas.push(makeArea(CFG.areaName));
  if(state.areas.length>1) state.areas = [state.areas[0]];
  const a = state.areas[0];
  a.line = CFG.areaName;
  if(!a.activeSector) a.activeSector = CFG.fixedSector;
  if(!a.sectors) a.sectors = {Rettifica:makeSectorSet(),Montaggio:makeSectorSet()};
  // assicurati almeno 1 voce per S, così compaiono i pallini
  const sec = CFG.fixedSector;
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    if(!Array.isArray(a.sectors[sec][S])) a.sectors[sec][S] = [];
    if(a.sectors[sec][S].length===0) a.sectors[sec][S].push({t:'',val:0,resp:'',due:'',note:''});
  });
}

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

// scoring
function computeArea(area, sector='Rettifica'){
  const byS = {'1S':0,'2S':0,'3S':0,'4S':0,'5S':0};
  let total=0, sum=0, late=0, now=Date.now();
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    const arr = (((area.sectors||{})[sector]||{})[S]||[]);
    if(!arr.length){ byS[S]=0; return; }
    let s=0;
    arr.forEach(it=>{
      const v = Math.max(0,Math.min(5,parseInt(it.val||0,10)||0));
      s += v; sum += v; total += 5;
      const due = it.due ? Date.parse(it.due) : NaN;
      if(!isNaN(due) && due < now && v < 5) late++;
    });
    byS[S] = Math.round((s/(arr.length*5))*100);
  });
  const score = total ? Math.round((sum/total)*100) : 0;
  // predominante: S con max %
  const domS = Object.entries(byS).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';
  return { byS, score, late, domS };
}

// render
function render(){
  normalizeState();
  const a = state.areas[0];
  const sector = CFG.fixedSector;
  const kpis = computeArea(a,sector);

  const elAreas = $('#areas');
  if(!elAreas) return;
  elAreas.innerHTML = '';

  const tpl = $('#tplArea');
  const node = tpl.content.cloneNode(true);
  // valori percentuali
  $$('.score-pill', node).forEach(p=>{
    const S = p.dataset.s;
    const el = $('.score-'+S, p);
    if(el) el.textContent = pct(kpis.byS[S]||0);
  });
  const sv = $('.score-val', node); if(sv) sv.textContent = pct(kpis.score);
  const dm = $('.doms', node); if(dm) dm.textContent = kpis.domS;

  // monta items per ogni S
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    const wrap = $(`.panel[data-s="${S}"] .items`, node);
    const arr = (((a.sectors||{})[sector]||{})[S]||[]);
    arr.forEach((it,idx)=>{
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `
        <div class="item-hd">
          <input class="txt" placeholder="Titolo voce…" value="${it.t||''}">
          <div class="points-dots">
            <button class="dot" data-val="0">0</button>
            <button class="dot" data-val="1">1</button>
            <button class="dot" data-val="3">3</button>
            <button class="dot" data-val="5">5</button>
          </div>
        </div>
        <div class="item-row">
          <input class="resp" placeholder="Responsabile" value="${it.resp||''}">
          <input class="due" type="date" value="${it.due||''}">
          <input class="note" placeholder="Note…" value="${it.note||''}">
        </div>
        <div class="item-actions"><button class="del danger">Elimina voce</button></div>
      `;
      // evidenzia dot corrente
      $$('.dot', item).forEach(d=>{
        if(parseInt(d.dataset.val,10)==(parseInt(it.val||0,10)||0)) d.classList.add('on');
      });
      // handlers
      item.addEventListener('click', e=>{
        const d = e.target.closest('.dot');
        if(d){
          it.val = parseInt(d.dataset.val,10)||0;
          save(); render();
        }
        const del = e.target.closest('.del');
        if(del){
          if(role!=='supervisor'){ e.preventDefault(); return; }
          arr.splice(idx,1); save(); render();
        }
      });
      item.querySelector('.txt').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.t=ev.target.value; save(); });
      item.querySelector('.resp').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.resp=ev.target.value; save(); });
      item.querySelector('.due').addEventListener('change', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.due=ev.target.value; save(); render(); });
      item.querySelector('.note').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.note=ev.target.value; save(); });

      wrap.appendChild(item);
    });
  });

  elAreas.appendChild(node);

  // KPI top
  const elScore = $('#kpiScore'); if(elScore) elScore.textContent = pct(kpis.score);
  const elLate  = $('#kpiLate');  if(elLate)  elLate.textContent  = kpis.late;

  // comprimi/espandi
  document.addEventListener('click', e=>{
    const b = e.target.closest('.collapse'); if(!b) return;
    const panels = b.closest('.area').querySelector('.panels');
    panels.classList.toggle('collapsed');
  }, {once:true});
}

// PIN (facoltativo, solo per sbloccare +Voce/elimina)
$('#btnLock')?.addEventListener('click', ()=>{
  const pin = prompt('PIN supervisore');
  if(pin==='2468'){ role='supervisor'; document.body.classList.add('edit-unlocked'); }
  else alert('PIN errato');
});

// aggiungi voce (solo se sbloccato)
document.addEventListener('click', e=>{
  const b = e.target.closest('.add-item'); if(!b) return;
  if(role!=='supervisor'){ e.preventDefault(); return; }
  const panel = b.closest('.panel');
  const S = panel?.dataset?.s || '1S';
  const a = state.areas[0];
  const sec = CFG.fixedSector;
  const arr = (((a.sectors||{})[sec]||{})[S]||[]);
  arr.push({t:'',val:0,resp:'',due:'',note:''});
  save(); render();
});

// tema
$('#btnTheme')?.addEventListener('click', ()=>{
  document.documentElement.classList.toggle('dark');
});

// avvio
window.addEventListener('load', ()=>{
  // forza single-CH CH2 Rettifica
  normalizeState();
  render();
});
