/* ===================== SKF 5S – app.js (v7.17.10) =========================
   - Etichette grafico più chiare (no overlap, CH più in basso)
   - Pillole 1S–5S sopra la linea: cliccabili → focus sulla sezione
   - Scheda con 5 sezioni fisse (descrizioni ufficiali)
   - Fix responsive pulsante "Elimina voce"
=========================================================================== */
const VERSION='v7.17.11';
const STORE='skf.5s.v7.17';
const CHART_STORE=STORE+'.chart';
const POINTS=[0,1,3,5];

/* Descrizioni ufficiali */
const DESCR = {
  "1S":"Eliminare ciò che non serve. Rimuovi tutto ciò che è inutile e crea un'area di lavoro essenziale, ordinata e sicura.",
  "2S":"Ogni cosa al suo posto. Organizza gli strumenti e i materiali in modo che siano facili da trovare, usare e riporre.",
  "3S":"Pulire è ispezionare. Mantieni pulito il posto di lavoro e, mentre lo pulisci, cerca e risolvi le cause dello sporco o dei problemi.",
  "4S":"Rendere l'ordine una routine. Stabilisci regole e standard visivi chiari (come etichette e colori) che tutti devono seguire.",
  "5S":"Non smettere mai di migliorare. Rendi le prime 4S un'abitudine quotidiana per tutti e promuovi il miglioramento continuo."
};

/* Voci di default (una per S come punto di partenza; espandibili) */
const DEFAULT_VOCI = {
  "1S":[{t:"Selezione del necessario",d:DESCR["1S"],p:0,resp:"",due:"",note:""}],
  "2S":[{t:"Organizzazione posto di lavoro",d:DESCR["2S"],p:0,resp:"",due:"",note:""}],
  "3S":[{t:"Pulizia e ispezione",d:DESCR["3S"],p:0,resp:"",due:"",note:""}],
  "4S":[{t:"Standard visivi e regole",d:DESCR["4S"],p:0,resp:"",due:"",note:""}],
  "5S":[{t:"Sostenere e migliorare",d:DESCR["5S"],p:0,resp:"",due:"",note:""}]
};

/* Utils */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const todayISO=()=>new Date().toISOString().slice(0,10);
const isOverdue=d=>d && new Date(d+'T23:59:59')<new Date();
const pct=n=>Math.round((n||0)*100)+'%';
const nextCH=()=>{
  const nums=(state.areas||[]).map(a=>((a.line||'').match(/^CH\s*(\d+)/i)||[])[1]).filter(Boolean).map(n=>+n).sort((a,b)=>a-b);
  const last=nums.length?nums[nums.length-1]:1; return `CH ${last+1}`;
};

/* State helpers */
function makeSectorSet(){return JSON.parse(JSON.stringify(DEFAULT_VOCI));}
function makeArea(line){return{line,sectors:{Rettifica:makeSectorSet(),Montaggio:makeSectorSet()}};}
function load(){try{const raw=localStorage.getItem(STORE);return raw?JSON.parse(raw):{areas:[makeArea('CH 2')]}}catch{return{areas:[makeArea('CH 2')]}}}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function loadChartPref(){try{return JSON.parse(localStorage.getItem(CHART_STORE))||{zoom:1,stacked:false,scroll:0}}catch{return{zoom:1,stacked:false,scroll:0}}}
function saveChartPref(){localStorage.setItem(CHART_STORE,JSON.stringify(chartPref))}

/* State */
let state=load();
let ui={q:'',line:'ALL',sector:'ALL',onlyLate:false};
let chartPref=loadChartPref();
const highlightKeys=new Set();

/* DOM */
const elAreas=$('#areas'), elLineFilter=$('#lineFilter'), elQ=$('#q'), elOnlyLate=$('#onlyLate');
const tplArea=$('#tplArea'), tplItem=$('#tplItem');
const elKpiAreas=$('#kpiAreas'), elKpiScore=$('#kpiScore'), elKpiLate=$('#kpiLate');
const sectorSelect=$('#sectorFilter');

/* Tema */
const btnTheme=$('#btnTheme');
if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark');
btnTheme?.addEventListener('click',()=>{
  const root=document.documentElement;
  root.classList.toggle('dark');
  localStorage.setItem('theme',root.classList.contains('dark')?'dark':'light');
});

/* Toolbar */
$('#btnNewArea')?.addEventListener('click',()=>{
  const proposal=nextCH();
  const line=(prompt('Nuova linea? (es. CH 3)',proposal)||proposal).trim();
  if(!line) return;
  state.areas.push(makeArea(line)); save(); render();
});
$('#btnExport')?.addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`SKF_5S_${todayISO()}.json`});
  document.body.appendChild(a); a.click(); a.remove();
});
$('#fileImport')?.addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{ state=JSON.parse(await f.text()); save(); render(); }catch{ alert('File non valido'); }
});
$('#btnPrint')?.addEventListener('click',()=>window.print());

function setSegBtn(sel){['#btnAll','#btnFgr','#btnAsm'].forEach(s=>$(s)?.classList.remove('active')); $(sel)?.classList.add('active');}
$('#btnAll')?.addEventListener('click',()=>{ui.sector='ALL'; setSegBtn('#btnAll'); sectorSelect.value='ALL'; render();});
$('#btnFgr')?.addEventListener('click',()=>{ui.sector='Rettifica'; setSegBtn('#btnFgr'); sectorSelect.value='Rettifica'; render();});
$('#btnAsm')?.addEventListener('click',()=>{ui.sector='Montaggio'; setSegBtn('#btnAsm'); sectorSelect.value='Montaggio'; render();});
sectorSelect?.addEventListener('change',()=>{
  ui.sector=sectorSelect.value;
  if(ui.sector==='ALL') setSegBtn('#btnAll');
  if(ui.sector==='Rettifica') setSegBtn('#btnFgr');
  if(ui.sector==='Montaggio') setSegBtn('#btnAsm');
  render();
});

elQ?.addEventListener('input',()=>{ui.q=elQ.value; render();});
elOnlyLate?.addEventListener('change',()=>{ui.onlyLate=elOnlyLate.checked; render();});
$('#btnClearFilters')?.addEventListener('click',()=>{
  ui={q:'',line:'ALL',sector:'ALL',onlyLate:false};
  elQ.value=''; elOnlyLate.checked=false; elLineFilter.value='ALL'; setSegBtn('#btnAll'); sectorSelect.value='ALL'; render();
});
elLineFilter?.addEventListener('change',()=>{ui.line=elLineFilter.value; render();});

$('#zoomIn')?.addEventListener('click',()=>{chartPref.zoom=Math.min(2.5, +(chartPref.zoom+0.1).toFixed(2)); saveChartPref(); drawChart();});
$('#zoomOut')?.addEventListener('click',()=>{chartPref.zoom=Math.max(0.6, +(chartPref.zoom-0.1).toFixed(2)); saveChartPref(); drawChart();});
$('#toggleStacked')?.addEventListener('change',e=>{chartPref.stacked=e.target.checked; saveChartPref(); drawChart();});

$('#btnCollapseAll')?.addEventListener('click',()=>{$$('.area').forEach(a=>a.classList.add('collapsed'));});
$('#btnExpandAll')?.addEventListener('click',()=>{$$('.area').forEach(a=>a.classList.remove('collapsed'));});

/* Render */

// === Info popup (global, single) ===
const infoDlg=document.getElementById('infoDlg');
function openInfo(title,text){
  if(!infoDlg) return;
  infoDlg.querySelector('#infoTitle').textContent = title||'';
  infoDlg.querySelector('#infoBody').textContent  = text||'';
  try{ infoDlg.showModal(); }catch(e){}
}
function themeInfoBy(panel){
  if(!infoDlg) return;
  infoDlg.className=''; // reset
  const s=(panel?.getAttribute('data-s')||'').slice(0,2).toLowerCase();
  if(s) infoDlg.classList.add(s);
}
document.addEventListener('click',(ev)=>{
  const btn = ev.target.closest('.info');
  if(!btn) return;
  const panel = btn.closest('.panel');
  const title = panel?.querySelector('h4')?.textContent?.trim() || btn.getAttribute('aria-label') || 'Dettagli';
  const descEl = panel?.querySelector('.s-desc') || panel?.querySelector('.desc');
  const body = descEl?descEl.textContent.trim():'';
  themeInfoBy(panel);
  openInfo(title, body);
});
function render(){
  const hv=document.querySelector('#appVersion'); if(hv) hv.textContent=''; document.querySelector('#appVersionFooter')?.replaceChildren(VERSION);
  refreshLineFilter();

  sectorSelect.value=ui.sector;
  if(ui.sector==='ALL') setSegBtn('#btnAll');
  if(ui.sector==='Rettifica') setSegBtn('#btnFgr');
  if(ui.sector==='Montaggio') setSegBtn('#btnAsm');

  const list=filteredAreas();
  elAreas.innerHTML='';
  list.forEach(a=>elAreas.appendChild(renderArea(a)));
  updateDashboard(list);
  drawChart(list);
  buildLineButtons(list);
}
function refreshLineFilter(){
  const lines=Array.from(new Set(state.areas.map(a=>(a.line||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
  elLineFilter.innerHTML=`<option value="ALL">Linea: Tutte</option>` + lines.map(l=>`<option value="${l}">${l}</option>`).join('');
  if(!lines.includes(ui.line)) ui.line='ALL'; elLineFilter.value=ui.line;
}
function filteredAreas(){
  const q=(ui.q||'').toLowerCase();
  const secs=ui.sector==='ALL'?['Rettifica','Montaggio']:[ui.sector];
  return state.areas.filter(a=>{
    if(ui.line!=='ALL' && (a.line||'').trim()!==ui.line) return false;
    if(!q && !ui.onlyLate) return true;
    let ok=false;
    secs.forEach(sec=>['1S','2S','3S','4S','5S'].forEach(S=>(a.sectors[sec][S]||[]).forEach(it=>{
      if(ui.onlyLate && !isOverdue(it.due)) return;
      if(!q){ ok=true; return; }
      const bag=`${it.t||''} ${it.note||''} ${it.resp||''}`.toLowerCase();
      if(bag.includes(q)) ok=true;
    })));
    return ok;
  });
}
function computeByS(area,sector){
  const secs=sector==='ALL'?['Rettifica','Montaggio']:[sector];
  const perS={"1S":{s:0,m:0},"2S":{s:0,m:0},"3S":{s:0,m:0},"4S":{s:0,m:0},"5S":{s:0,m:0}};
  let sum=0,max=0;
  secs.forEach(sec=>['1S','2S','3S','4S','5S'].forEach(S=>(area.sectors[sec][S]||[]).forEach(it=>{
    perS[S].s+=(+it.p||0); perS[S].m+=5; sum+=(+it.p||0); max+=5;
  })));
  const byS={}; Object.keys(perS).forEach(S=>byS[S]=perS[S].m?perS[S].s/perS[S].m:0);
  const domKey=Object.keys(byS).reduce((a,b)=> byS[a]>=byS[b]?a:b,null);
  const dom=(domKey && byS[domKey]>0)?domKey:'—';
  return {score:max?sum/max:0,byS,dom};
}

function hasLateByS(area, sector){
  const secs = sector==='ALL'?['Rettifica','Montaggio']:[sector];
  const res = {"1S":false,"2S":false,"3S":false,"4S":false,"5S":false};
  secs.forEach(sec=>['1S','2S','3S','4S','5S'].forEach(S=>{
    (area.sectors[sec][S]||[]).forEach(it=>{ if(isOverdue(it.due)) res[S]=true; });
  }));
  return res;
}

function renderArea(area){
  const node=tplArea.content.cloneNode(true).firstElementChild;
  const area_line=$('.area-line',node);
  area_line.value=area.line||'';
  area_line.addEventListener('input',()=>{area.line=area_line.value; save(); render();});
  const sectorBtns=$$('.sec',node);
  sectorBtns.forEach(btn=>{
    btn.classList.toggle('active',area.activeSector===btn.dataset.sector);
    btn.addEventListener('click',()=>{
      area.activeSector=btn.dataset.sector; save(); render();
      const areaNode=btn.closest('.area');
      areaNode.classList.remove('collapsed');
      areaNode.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
  const deleteBtn=$('.delete-area',node);
  deleteBtn.addEventListener('click',()=>{
    if(!confirm(`Vuoi davvero eliminare la linea ${area.line}?`)) return;
    state.areas=state.areas.filter(a=>a.line!==area.line); save(); render();
  });
  const collapseBtn=$('.collapse',node);
  collapseBtn.addEventListener('click',()=>{node.classList.toggle('collapsed');});
  const itemsHost=$$('.items',node);
  const secPanels=$$('.panel',node);
  secPanels.forEach(p=>{
    p.classList.toggle('active',p.dataset.s===area.activeSector);
    const host=$('.items',p);
    const S=p.dataset.s;
    (area.sectors[area.activeSector][S]||[]).forEach((it,idx)=>{
      host.appendChild(renderItem(area,area.activeSector,S,it,idx));
    });
    const addBtn=$('.add-item',p);
    addBtn?.addEventListener('click',()=>{
      area.sectors[area.activeSector][S].push(DEFAULT_VOCI[S][0]); save(); render();
    });
  });
  const pills=$$('.score-pill',node);
  pills.forEach(p=>{
    p.addEventListener('click',e=>{
      const panel=node.querySelector(`.panel[data-s="${e.currentTarget.dataset.s}"]`);
      if(!panel) return;
      panel.scrollIntoView({behavior:'smooth'});
    });
  });
  refreshScores(node,area,area.activeSector);
  if(ui.q || ui.onlyLate) node.classList.remove('collapsed');
  return node;
}
function refreshScores(areaNode,area,sector){
  const {score,byS,dom}=computeByS(area,sector);
  $('.score-val',areaNode).textContent=pct(score);
  $('.doms',areaNode).textContent=dom;
  const pills=$$('.score-pill',areaNode);
  const lateMap = hasLateByS(area, sector);
  pills.forEach(p=>{
    const S=p.dataset.s;
    $('.score-'+S,p).textContent=pct(byS[S]);
    if(byS[S]===0) p.classList.remove('has-score'); else p.classList.add('has-score');
    p.classList.toggle('late', !!lateMap[S]);
  });
}
function renderItem(area,sector,S,it,idx){
  const frag=document.createDocumentFragment();
  const node=tplItem.content.cloneNode(true).firstElementChild;
  const onChange=()=>refreshScores(node.closest('.area'),area,sector);
  const txt=$('.txt',node), resp=$('.resp',node), note=$('.note',node), due=$('.due',node);
  const dots=$$('.dot',node);
  const desc=Object.assign(document.createElement('div'),{className:'item-desc'});
  desc.innerHTML=`<b>${it.t||'(senza titolo)'}</b><br>${it.d||''}`;
  txt.value=it.t||''; resp.value=it.resp||''; note.value=it.note||''; due.value=it.due||'';
  const syncDots=()=>{ dots.forEach(d=> d.classList.toggle('active', +d.dataset.val === (+it.p||0))); };
  syncDots();
  node.classList.toggle('late',isOverdue(it.due));
  txt.addEventListener('input',()=>{it.t=txt.value; desc.innerHTML=`<b>${it.t||'(senza titolo)'}</b><br>${it.d||''}`; save();});
  resp.addEventListener('input',()=>{it.resp=resp.value; save();});
  note.addEventListener('input',()=>{it.note=note.value; save();});
  due.addEventListener('change',()=>{it.due=due.value; save(); node.classList.toggle('late',isOverdue(it.due)); onChange?.();});
  dots.forEach(d=> d.addEventListener('click',()=>{
    it.p=+d.dataset.val; syncDots(); save(); onChange?.();
  }));
  $('.info',node).addEventListener('click',()=>{/* handled globally */});
  $('.del',node).addEventListener('click',()=>{
    const arr=area.sectors[sector][S]; arr.splice(idx,1); save(); render();
  });
  node.addEventListener('click',e=>{
    if(e.target.classList.contains('dot')) node.classList.remove('highlight');
  });
  $('.info',node).addEventListener('click',()=> node.classList.remove('highlight'));
  frag.appendChild(node);
  frag.appendChild(desc);
  return frag;
}

/* KPI / Late */
function overallStats(list){
  const secs=ui.sector==='ALL'?['Rettifica','Montaggio']:[ui.sector];
  let sum=0,max=0,late=0;
  (list||filteredAreas()).forEach(a=>{
    secs.forEach(sec=>['1S','2S','3S','4S','5S'].forEach(S=>(a.sectors[sec][S]||[]).forEach(it=>{
      sum+=(+it.p||0); max+=5;
      if(isOverdue(it.due)) late++;
    })));
  });
  return {score:max?sum/max:0,late};
}
function updateDashboard(list){
  const {score,late}=overallStats(list);
  elKpiAreas.textContent=(list||filteredAreas()).length;
  elKpiScore.textContent=pct(score);
  elKpiLate.textContent=late;
  renderLateList(list);
}
function renderLateList(list){
  const host=$('#lateList');
  host.innerHTML='';
  highlightKeys.clear();
  const secs=ui.sector==='ALL'?['Rettifica','Montaggio']:[ui.sector];
  const arr=[];
  (list||filteredAreas()).forEach(a=>{
    secs.forEach(sec=>['1S','2S','3S','4S','5S'].forEach(S=>(a.sectors[sec][S]||[]).forEach((it,idx)=>{
      if(isOverdue(it.due)){
        arr.push({area:a,sector:sec,S,item:it,idx});
      }
    })));
  });
  if(arr.length){
    host.style.display='block';
    const ul=document.createElement('ul');
    arr.forEach(it=>{
      const li=document.createElement('li');
      li.innerHTML=`<a href="#" data-line="${it.area.line}" data-s="${it.S}" data-idx="${it.idx}">${it.area.line||'—'} — ${it.item.t||'—'}</a>`;
      li.addEventListener('click',e=>{
        e.preventDefault();
        const line=e.target.dataset.line;
        const S=e.target.dataset.s;
        const card=[...document.querySelectorAll('.area')].find(x=>x.querySelector('.area-line')?.value.trim()===line.trim());
        const item=card?.querySelector(`.panel[data-s="${S}"] .item:nth-child(${+e.target.dataset.idx+1})`);
        item?.scrollIntoView({behavior:'smooth',block:'center'});
        item?.classList.add('highlight','flash');
        setTimeout(()=>item?.classList.remove('flash'),1300);
      });
      ul.appendChild(li);
    });
    host.appendChild(ul);
  } else host.style.display='none';
}
/* Chart */
let myChart, elChart, elChartSection, scroller;
const S_COLORS = {'1S':'#8b6ad8','2S':'#ff5a5f','3S':'#f2b731','4S':'#2dbE6d','5S':'#2f7ef6'};
function getGlobalScoreByS(){
  const secs=ui.sector==='ALL'?['Rettifica','Montaggio']:[ui.sector];
  const scores={};
  secs.forEach(sec=>{
    ['1S','2S','3S','4S','5S'].forEach(S=>{
      let sum=0,max=0;
      state.areas.forEach(a=>(a.sectors[sec][S]||[]).forEach(it=>{sum+=(+it.p||0);max+=5;}));
      if(max) scores[S] = (scores[S]||0) + sum/max;
    });
  });
  Object.keys(scores).forEach(S=>scores[S]=Math.round(scores[S]/secs.length*100));
  return scores;
}
function getScoresByLine(list){
  const secs=ui.sector==='ALL'?['Rettifica','Montaggio']:[ui.sector];
  const labels=list.map(a=>a.line||'');
  const datasets={};
  ['1S','2S','3S','4S','5S'].forEach(S=>{
    datasets[S] = {
      label:S,
      backgroundColor:S_COLORS[S],
      data:list.map(a=>{
        let sum=0,max=0;
        secs.forEach(sec=>(a.sectors[sec][S]||[]).forEach(it=>{sum+=(+it.p||0);max+=5;}));
        return max?Math.round(sum/max*100):0;
      })
    };
  });
  return {labels,datasets:Object.values(datasets)};
}
function drawChart(list){
  elChart=$('#chartAreas');
  elChartSection=elChart?.closest('.dashboard');
  scroller=$('.chart-scroll');
  if(!elChart || (list||[]).length===0) { if(myChart) myChart.destroy(); return; }
  const groups=list.map(a=>{
    const {byS}=computeByS(a,'ALL');
    return {line:a.line,scores:byS};
  });

  const allScores={}; Object.keys(groups[0]?.scores||[]).forEach(S=>allScores[S]=0);
  groups.forEach(g=>Object.keys(g.scores).forEach(S=>allScores[S]+=(g.scores[S]||0)));
  const totalScores=Object.keys(allScores).reduce((a,b)=>a+(allScores[b]||0),0);
  const globalScore=Math.round(totalScores*100/Object.keys(allScores).length/groups.length);
  $('#kpiScore').textContent=pct(globalScore/100);

  const colors=['#8b6ad8','#ff5a5f','#f2b731','#2dbE6d','#2f7ef6'];
  const data=groups.map(g=>Object.values(g.scores).map(s=>Math.round(s*100)));
  const labels=groups.map(g=>g.line);
  if(!myChart){
    const ctx=elChart.getContext('2d');
    myChart=new Chart(ctx,{
      type:'bar',
      data:{
        labels:labels,
        datasets:[
          {label:'1S',data:data.map(d=>d[0]),backgroundColor:colors[0]},
          {label:'2S',data:data.map(d=>d[1]),backgroundColor:colors[1]},
          {label:'3S',data:data.map(d=>d[2]),backgroundColor:colors[2]},
          {label:'4S',data:data.map(d=>d[3]),backgroundColor:colors[3]},
          {label:'5S',data:data.map(d=>d[4]),backgroundColor:colors[4]},
        ]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{
          x:{stacked:true,grid:{display:false}},
          y:{stacked:true,beginAtZero:true,max:100,grid:{display:false},ticks:{display:false}},
        },
        plugins:{
          legend:{display:true,position:'bottom'},
          tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw}%`}},
          datalabels:{
            display:true,
            color:'#fff',
            formatter:(value,context)=>{
              const s=context.dataset.label;
              const h=context.chart.getDatasetMeta(context.datasetIndex).data[context.dataIndex].height;
              const inside=h>15;
              if(value>0 && inside) return s; else if(value>0) return s;
              return '';
            }
          }
        },
        animation:{
          onComplete(){ if(scroller) scroller.scrollLeft=chartPref.scroll; }
        }
      }
    });
  } else {
    myChart.data.labels=labels;
    myChart.data.datasets.forEach((ds,i)=>ds.data=data.map(d=>d[i]));
    myChart.options.scales.x.stacked=chartPref.stacked;
    myChart.update();
  }
  const elInnerChart=$('.chart-inner');
  if(elInnerChart) elInnerChart.style.width=`${Math.max(300, groups.length*50*chartPref.zoom)}px`;
  
  if(myChart?.plugins?.datalabels) {
    myChart.options.plugins.datalabels.display=!chartPref.stacked;
    myChart.update();
  }
}
/* Line buttons */
function buildLineButtons(list){
  const host=$('#areasList'); host.innerHTML='';
  const bAll=document.createElement('button'); bAll.className='line-btn'+(ui.line==='ALL'?' active':''); bAll.textContent='Tutte';
  bAll.addEventListener('click',()=>{ui.line='ALL'; elLineFilter.value='ALL'; render(); window.scrollTo({top:host.offsetTop,behavior:'smooth'});});
  host.appendChild(bAll);
  (list||filteredAreas()).forEach(a=>{
    const b=document.createElement('button'); b.className='line-btn'+(ui.line===(a.line||'')?' active':''); b.textContent=a.line||'—';
    b.addEventListener('click',()=>{ui.line=a.line||''; elLineFilter.value=ui.line; render(); setTimeout(()=>{const card=[...document.querySelectorAll('.area')].find(x=>x.querySelector('.area-line')?.value.trim()===(a.line||'').trim()); card?.scrollIntoView({behavior:'smooth',block:'start'});},0);});
    host.appendChild(b);
  });
}
/* Events */
window.addEventListener('orientationchange',()=>setTimeout(()=>drawChart(),250));
window.addEventListener('resize',()=>drawChart());
window.addEventListener('load',()=>requestAnimationFrame(()=>render()));
