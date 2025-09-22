/* SKF 5S Single-CH • v1k */
const KEY = 'skf.5s.v1k';
const $  = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const pct = v => `${Math.round(v)}%`;

let state = { areas: [] };
try{ const raw = localStorage.getItem(KEY); if(raw){ const p=JSON.parse(raw); if(p && Array.isArray(p.areas)) state=p; } }catch(e){}

const CFG  = { areaName:'CH 2', fixedSector:'Rettifica' };
let role   = 'worker'; // 'supervisor' se vuoi poi aggiungere un PIN

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
  const sec = CFG.fixedSector;
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    if(!Array.isArray(a.sectors[sec][S])) a.sectors[sec][S] = [];
    if(a.sectors[sec][S].length===0) a.sectors[sec][S].push({t:'',val:0,resp:'',due:'',note:''});
  });
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

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
  const domS  = Object.entries(byS).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';
  return { byS, score, late, domS };
}

function render(){
  normalizeState();
  const a = state.areas[0];
  const sector = CFG.fixedSector;
  const kpis = computeArea(a,sector);

  const elAreas = $('#areas'); if(!elAreas) return;
  elAreas.innerHTML = '';
  const tpl = $('#tplArea');
  const node = tpl.content.cloneNode(true);

  // percentuali top
  $$('.score-pill', node).forEach(p=>{
    const c = p.classList.contains('s1')?'1S':p.classList.contains('s2')?'2S':p.classList.contains('s3')?'3S':p.classList.contains('s4')?'4S':'5S';
    const el = $('.score-'+c, node);
    if(el) el.textContent = pct(kpis.byS[c]||0);
  });
  $('.score-val', node).textContent = pct(kpis.score);
  $('.doms', node).textContent      = kpis.domS;

  // crea items per ogni S
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    const panel = $(`.panel[data-s="${S}"]`, node);
    const wrap  = panel.querySelector('.items');
    const arr   = (((a.sectors||{})[sector]||{})[S]||[]);
    let hasLate = false;

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

      // dot attivo
      $$('.dot', item).forEach(d=>{
        if(parseInt(d.dataset.val,10)==(parseInt(it.val||0,10)||0)) d.classList.add('on');
      });

      // ritardo
      const past = it.due ? Date.parse(it.due) : NaN;
      const isLate = !isNaN(past) && past < Date.now() && (parseInt(it.val||0,10) || 0) < 5;
      if(isLate){ item.classList.add('late'); hasLate = true; }

      // handlers
      item.addEventListener('click', e=>{
        const d = e.target.closest('.dot');
        if(d){ it.val = parseInt(d.dataset.val,10)||0; save(); render(); }
        const del = e.target.closest('.del');
        if(del){ if(role!=='supervisor'){ e.preventDefault(); return; } arr.splice(idx,1); save(); render(); }
      });
      item.querySelector('.txt').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.t=ev.target.value; save(); });
      item.querySelector('.resp').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.resp=ev.target.value; save(); });
      item.querySelector('.due').addEventListener('change', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.due=ev.target.value; save(); render(); });
      item.querySelector('.note').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.note=ev.target.value; save(); });

      wrap.appendChild(item);
    });

    if(hasLate) panel.classList.add('late'); else panel.classList.remove('late');
  });

  elAreas.appendChild(node);

  // KPI top
  $('#kpiScore').textContent = pct(kpis.score);
  $('#kpiLate').textContent  = kpis.late;

  // comprimi per area
  elAreas.addEventListener('click', e=>{
    const b = e.target.closest('.collapse'); if(!b) return;
    const panels = b.closest('.area').querySelector('.panels');
    panels.classList.toggle('collapsed');
  });
}

window.addEventListener('load', ()=>{
  // (se avevi SW in passato) evita cache testarde
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
  normalizeState();
  render();
});
