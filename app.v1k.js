const KEY='skf.5s.v1k'; const CFG={areaName:'CH 24',fixedSector:'Rettifica'};
let role='worker'; let state={areas:[]};

function makeSector(){return{'1S':[],'2S':[],'3S':[],'4S':[],'5S':[]};}
function normalize(){
  if(!state.areas.length) state.areas.push({line:CFG.areaName,activeSector:CFG.fixedSector,sectors:{Rettifica:makeSector()}});
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function load(){try{state=JSON.parse(localStorage.getItem(KEY))||{areas:[]}}catch(e){state={areas:[]}};normalize();}
function pct(v){return `${Math.round(v)}%`;}

function compute(area){
  const sec=area.sectors[CFG.fixedSector],now=Date.now();
  let total=0,sum=0,late=0,byS={};
  Object.keys(sec).forEach(S=>{
    const arr=sec[S]; if(!arr.length){byS[S]=0;return;}
    let s=0;
    arr.forEach(it=>{
      const v=parseInt(it.val||0,10)||0; s+=v; sum+=v; total+=5;
      if(it.due&&Date.parse(it.due)<now&&v<5) late++;
    });
    byS[S]=Math.round((s/(arr.length*5))*100);
  });
  return{byS,score:total?Math.round(sum/total*100):0,late};
}

function render(){
  const a=state.areas[0],sec=a.sectors[CFG.fixedSector],kpi=compute(a);
  document.getElementById('kpiScore').textContent=pct(kpi.score);
  document.getElementById('kpiLate').textContent=kpi.late;

  const Slabel={'1S':'Selezionare','2S':'Sistemare','3S':'Splendere','4S':'Standardizzare','5S':'Sostenere'};
  const map={'1S':'Eliminare ciò che non serve.','2S':'Un posto per tutto.','3S':'Pulire e prevenire.','4S':'Regole e segnali chiari.','5S':'Miglioramento continuo.'};

  let html='';
  Object.keys(sec).forEach(S=>{
    const arr=sec[S];
    let items=arr.map((it,idx)=>{
      const v=parseInt(it.val||0,10)||0, late=it.due&&Date.parse(it.due)<Date.now()&&v<5;
      return `<div class="item${late?' late':''}">
        <input class="txt" value="${it.t||''}" placeholder="Titolo voce">
        <div class="dots">${[0,1,3,5].map(n=>`<button data-s="${S}" data-idx="${idx}" data-val="${n}" class="dot${v===n?' on':''}">${n}</button>`).join('')}</div>
        <input class="resp" value="${it.resp||''}" placeholder="Responsabile">
        <input type="date" class="due" value="${it.due||''}">
        <input class="note" value="${it.note||''}" placeholder="Note">
      </div>`;
    }).join('');
    if(!items) items='';
    html+=`<section class="panel ${arr.some(it=>it.due&&Date.parse(it.due)<Date.now()&&(parseInt(it.val||0)<5))?'late':''}" data-s="${S}">
      <h4 class="pill ${S.toLowerCase()}">${S} — ${Slabel[S]}</h4>
      <button class="info pill ${S.toLowerCase()}" data-info="${S}">i</button>
      <div class="items">${items}</div>
      ${role==='supervisor'?`<button data-add="${S}" class="btn add">+ Voce</button>`:''}
    </section>`;
  });
  document.getElementById('areas').innerHTML=html;

  // bind
  document.querySelectorAll('.dot').forEach(b=>b.onclick=e=>{
    const S=b.dataset.s,idx=b.dataset.idx,val=parseInt(b.dataset.val);
    state.areas[0].sectors[CFG.fixedSector][S][idx].val=val; save(); render();
  });
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{
    state.areas[0].sectors[CFG.fixedSector][b.dataset.add].push({t:'',val:0,resp:'',due:'',note:''});
    save(); render();
  });
  document.querySelectorAll('[data-info]').forEach(b=>b.onclick=()=>{
    const S=b.dataset.info; const dlg=document.getElementById('infoDlg');
    dlg.querySelector('.modal').innerHTML=`<h3 class="pill ${S.toLowerCase()}">${S}</h3><p>${map[S]}</p><form method="dialog"><button class="btn">Chiudi</button></form>`;
    dlg.showModal();
  });
  document.querySelectorAll('.item input').forEach(inp=>inp.onchange=e=>{
    const item=inp.closest('.item'),panel=inp.closest('.panel'),S=panel.dataset.s,idx=[...item.parentNode.children].indexOf(item);
    const obj=state.areas[0].sectors[CFG.fixedSector][S][idx];
    if(inp.classList.contains('txt')) obj.t=inp.value;
    if(inp.classList.contains('resp')) obj.resp=inp.value;
    if(inp.classList.contains('due')) obj.due=inp.value;
    if(inp.classList.contains('note')) obj.note=inp.value;
    save(); render();
  });
}

document.getElementById('btnLock').onclick=()=>{
  if(role==='supervisor'){role='worker';} else { if(prompt('PIN?')==='2468') role='supervisor'; }
  render();
};

load(); render();
