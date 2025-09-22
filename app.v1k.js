/* SKF 5S Single-CH • v1k-CH24 (no <template>) */
const KEY = 'skf.5s.v1k';
const CFG = { areaName: 'CH 24', fixedSector: 'Rettifica' };

const $  = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const pct = v => `${Math.round(v)}%`;

let role = 'worker';
let state = { areas: [] };

try{ const raw=localStorage.getItem(KEY); if(raw){ const p=JSON.parse(raw); if(p&&Array.isArray(p.areas)) state=p; } }catch(e){}

function makeSectorSet(){ return {'1S':[], '2S':[], '3S':[], '4S':[], '5S':[]}; }
function makeArea(line){ return { line, activeSector: CFG.fixedSector, sectors: { Rettifica: makeSectorSet(), Montaggio: makeSectorSet() } }; }

function normalizeState(){
  if(!state || !Array.isArray(state.areas)) state = {areas:[]};
  if(state.areas.length===0) state.areas.push(makeArea(CFG.areaName));
  if(state.areas.length>1) state.areas=[state.areas[0]];
  const a = state.areas[0];
  a.line = CFG.areaName;
  if(!a.activeSector) a.activeSector = CFG.fixedSector;
  if(!a.sectors) a.sectors = {Rettifica:makeSectorSet(),Montaggio:makeSectorSet()};
  const sec=CFG.fixedSector;
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    const arr=(((a.sectors||{})[sec]||{})[S]);
    if(!Array.isArray(arr)) a.sectors[sec][S]=[{t:'',val:0,resp:'',due:'',note:''}];
    else if(arr.length===0) arr.push({t:'',val:0,resp:'',due:'',note:''});
  });
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

function computeArea(area, sector){
  const byS={'1S':0,'2S':0,'3S':0,'4S':0,'5S':0};
  let total=0,sum=0,late=0,now=Date.now();
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    const arr=(((area.sectors||{})[sector]||{})[S]||[]);
    if(arr.length===0){byS[S]=0;return;}
    let s=0;
    arr.forEach(it=>{
      const v=Math.max(0,Math.min(5,parseInt(it.val||0,10)||0));
      s+=v; sum+=v; total+=5;
      const due=it.due?Date.parse(it.due):NaN;
      if(!isNaN(due)&&due<now&&v<5) late++;
    });
    byS[S]=Math.round((s/(arr.length*5))*100);
  });
  const score = total?Math.round((sum/total)*100):0;
  const domS  = Object.entries(byS).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';
  return {byS,score,late,domS};
}

function render(){
  normalizeState();
  const a = state.areas[0], sector=CFG.fixedSector;
  const kpis = computeArea(a,sector);

  // header KPI
  $('#kpiScore').textContent = pct(kpis.score);
  $('#kpiLate').textContent  = kpis.late;

  // area HTML
  const byS = kpis.byS;
  const Slabel = {'1S':'Selezionare','2S':'Sistemare','3S':'Splendere','4S':'Standardizzare','5S':'Sostenere'};
  const headerHtml = `
    <header class="area-hd">
      <div class="score">
        <span class="score-pill s1"><b>1S</b> <span class="score-1S">${pct(byS['1S'])}</span></span>
        <span class="score-pill s2"><b>2S</b> <span class="score-2S">${pct(byS['2S'])}</span></span>
        <span class="score-pill s3"><b>3S</b> <span class="score-3S">${pct(byS['3S'])}</span></span>
        <span class="score-pill s4"><b>4S</b> <span class="score-4S">${pct(byS['4S'])}</span></span>
        <span class="score-pill s5"><b>5S</b> <span class="score-5S">${pct(byS['5S'])}</span></span>
      </div>
      <div class="sum">
        <span class="badge">Punteggio: <b class="score-val">${pct(kpis.score)}</b></span>
        <span class="badge">Predominante: <b class="doms">${kpis.domS}</b></span>
        <button class="btn ghost collapse">Comprimi / Espandi</button>
      </div>
    </header>
  `;

  const panelsHtml = ['1S','2S','3S','4S','5S'].map(S=>{
    const arr=(((a.sectors||{})[sector]||{})[S]||[]);
    const itemsHtml = arr.map(it=>{
      const v = parseInt(it.val||0,10)||0;
      const isLate = it.due && !isNaN(Date.parse(it.due)) && Date.parse(it.due)<Date.now() && v<5;
      return `
        <div class="item${isLate?' late':''}">
          <div class="item-hd">
            <input class="txt" placeholder="Titolo voce…" value="${(it.t||'').replace(/"/g,'&quot;')}">
            <div class="points-dots">
              <button class="dot ${v===0?'on':''}" data-d="dot" data-s="${S}" data-val="0">0</button>
              <button class="dot ${v===1?'on':''}" data-d="dot" data-s="${S}" data-val="1">1</button>
              <button class="dot ${v===3?'on':''}" data-d="dot" data-s="${S}" data-val="3">3</button>
              <button class="dot ${v===5?'on':''}" data-d="dot" data-s="${S}" data-val="5">5</button>
            </div>
          </div>
          <div class="item-row">
            <input class="resp" placeholder="Responsabile" value="${(it.resp||'').replace(/"/g,'&quot;')}">
            <input class="due" type="date" value="${it.due||''}">
            <input class="note" placeholder="Note…" value="${(it.note||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="item-actions"><button class="del danger" data-d="del" data-s="${S}">Elimina voce</button></div>
        </div>
      `;
    }).join('');
    return `
      <section class="panel" data-s="${S}">
        <h4 class="pill s${S[0]}">${S} — ${Slabel[S]}</h4><button class="info big" data-d="info">i</button>
        <div class="items" data-s="${S}">${itemsHtml}</div>
        <button class="btn add" data-d="add" data-s="${S}">+ Voce</button>
      </section>`;
  }).join('');

  $('#areas').innerHTML = `<article class="area">${headerHtml}<div class="panels">${panelsHtml}</div></article>`;

  // evidenza pannelli in ritardo
  $$('.panel').forEach(p=>{
    const S=p.dataset.s; const arr=(((a.sectors||{})[sector]||{})[S]||[]);
    const hasLate = arr.some(it=>it.due && !isNaN(Date.parse(it.due)) && Date.parse(it.due)<Date.now() && (parseInt(it.val||0,10)||0)<5);
    p.classList.toggle('late', hasLate);
  });
}

// Event delegation unico sul contenitore
document.addEventListener('click', e=>{
  const areas = $('#areas'); if(!areas) return;

  // collapse
  if(e.target.closest('.collapse')){
    const panels = areas.querySelector('.panels');
    panels.classList.toggle('collapsed'); return;
  }

  // info popup
  if(e.target.dataset.d === 'info'){
    const panel = e.target.closest('.panel'); const S=panel.dataset.s;
    const map = {
      '1S':'Eliminare ciò che non serve.',
      '2S':'Un posto per tutto e tutto al suo posto.',
      '3S':'Pulire è ispezionare; prevenire lo sporco.',
      '4S':'Regole e segnali visivi chiari.',
      '5S':'Abitudine e miglioramento continuo.'
    };
    const dlg = $('#infoDlg');
    dlg.querySelector('.modal').innerHTML =
      `<h3>${panel.querySelector('.pill')?.textContent||S}</h3><p>${map[S]||''}</p><form method="dialog" style="margin-top:12px;text-align:right"><button class="btn">Chiudi</button></form>`;
    dlg.showModal(); return;
  }

  // dot (0/1/3/5)
  if(e.target.dataset.d === 'dot'){
    const S=e.target.dataset.s; const val=parseInt(e.target.dataset.val,10)||0;
    const a=state.areas[0]; const arr=(((a.sectors||{})[CFG.fixedSector]||{})[S]||[]);
    const itemEl = e.target.closest('.item');
    const idx = Array.from(itemEl.parentNode.children).indexOf(itemEl);
    if(arr[idx]){ arr[idx].val = val; save(); render(); }
    return;
  }

  // +Voce
  if(e.target.dataset.d === 'add'){
    if(role!=='supervisor') return;
    const S=e.target.dataset.s; const a=state.areas[0];
    (((a.sectors||{})[CFG.fixedSector]||{})[S]||[]).push({t:'',val:0,resp:'',due:'',note:''});
    save(); render(); return;
  }

  // Elimina voce
  if(e.target.dataset.d === 'del'){
    if(role!=='supervisor') return;
    const S=e.target.dataset.s; const a=state.areas[0];
    const arr=(((a.sectors||{})[CFG.fixedSector]||{})[S]||[]);
    const itemEl = e.target.closest('.item');
    const idx = Array.from(itemEl.parentNode.children).indexOf(itemEl);
    if(idx>-1){ arr.splice(idx,1); save(); render(); }
    return;
  }
});

// input (titolo/resp/due/note)
document.addEventListener('input', e=>{
  const item = e.target.closest('.item'); if(!item) return;
  const panel = e.target.closest('.panel'); const S=panel.dataset.s;
  const a=state.areas[0]; const arr=(((a.sectors||{})[CFG.fixedSector]||{})[S]||[]);
  const idx = Array.from(item.parentNode.children).indexOf(item);
  const it = arr[idx]; if(!it) return;
  if(role!=='supervisor'){ e.target.blur(); return; }
  if(e.target.classList.contains('txt'))  it.t   = e.target.value;
  if(e.target.classList.contains('resp')) it.resp= e.target.value;
  if(e.target.classList.contains('due')){ it.due = e.target.value; render(); }
  if(e.target.classList.contains('note')) it.note= e.target.value;
  save();
});

// PIN/lock
function setupLock(){
  const btn=$('#btnLock'); if(!btn) return;
  const setUi=()=>{ btn.textContent = role==='supervisor'?'🔓':'🔒'; document.body.classList.toggle('edit-unlocked', role==='supervisor'); };
  setUi();
  btn.addEventListener('click', ()=>{
    if(role==='supervisor'){ role='worker'; setUi(); return; }
    const pin=prompt('Inserisci PIN supervisore');
    if(pin==='2468'){ role='supervisor'; setUi(); } else { alert('PIN errato'); }
  });
}

window.addEventListener('load', ()=>{
  // rimuove vecchi SW che potrebbero bloccare aggiornamenti
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
  }
  render();
  setupLock();
});
