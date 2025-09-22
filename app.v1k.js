/* SKF 5S Single-CH • v1k */
const KEY = 'skf.5s.v1k';
const $  = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const pct = v => `${Math.round(v)}%`;

let state = { areas: [] };
try{ const raw = localStorage.getItem(KEY); if(raw){ const p=JSON.parse(raw); if(p && Array.isArray(p.areas)) state=p; } }catch(e){}

const CFG  = { areaName:'CH 2', fixedSector:'Rettifica' };
let role   = 'worker'; // diventa 'supervisor' con PIN

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
  const map = {'1S':'.score-1S','2S':'.score-2S','3S':'.score-3S','4S':'.score-4S','5S':'.score-5S'};
  Object.entries(map).forEach(([S,sel])=>{ const el = $(sel,node); if(el) el.textContent = pct(kpis.byS[S]||0); });
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

  // comprimi per area (delegato)
  elAreas.addEventListener('click', e=>{
    const b = e.target.closest('.collapse'); if(!b) return;
    const panels = b.closest('.area').querySelector('.panels');
    panels.classList.toggle('collapsed');
  });

  // popup info (delegato)
  document.addEventListener('click', e=>{
    const btn = e.target.closest('button.info.big'); if(!btn) return;
    const panel = btn.closest('.panel');
    const title = panel.querySelector('.pill')?.textContent || 'Info';
    const map = {
      '1S':'Eliminare ciò che non serve.',
      '2S':'Un posto per tutto e tutto al suo posto.',
      '3S':'Pulire è ispezionare; prevenire lo sporco.',
      '4S':'Regole e segnali visivi chiari.',
      '5S':'Abitudine e miglioramento continuo.'
    };
    const S = panel.dataset.s || '';
    const msg = map[S] || '';
    const dlg = $('#infoDlg');
    dlg.querySelector('.modal').innerHTML = `<h3>${title}</h3><p>${msg}</p><form method="dialog" style="margin-top:12px;text-align:right"><button class="btn">Chiudi</button></form>`;
    dlg.showModal();
  });
}

// Lock con PIN per attivare cancellazioni/modifiche testo
function setupLock(){
  const btn = $('#btnLock');
  if(!btn) return;
  const setUi = ()=>{ btn.textContent = role==='supervisor'?'🔓':'🔒'; document.body.classList.toggle('edit-unlocked', role==='supervisor'); }
  setUi();
  btn.addEventListener('click', ()=>{
    if(role==='supervisor'){ role='worker'; setUi(); return; }
    const pin = prompt('Inserisci PIN supervisore'); 
    if(pin==='2468'){ role='supervisor'; setUi(); } else { alert('PIN errato'); }
  });
}

window.addEventListener('load', ()=>{
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
  normalizeState();
  setupLock();
  render();
});
