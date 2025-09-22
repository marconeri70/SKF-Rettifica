// ====== SKF 5S v1k — app ======

// ---------- utils ----------
const STORAGE_KEY = "skf5s:ch24";
const todayISO = () => new Date().toISOString().slice(0,10);
const qs = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
const fmtPerc = n => `${Math.round(n)}%`;

// ---------- data ----------
const DEFAULT_DATA = {
  s1:[{title:"",resp:"",note:"",score:0,due:""}],
  s2:[{title:"",resp:"",note:"",score:0,due:""}],
  s3:[{title:"",resp:"",note:"",score:0,due:""}],
  s4:[{title:"",resp:"",note:"",score:0,due:""}],
  s5:[{title:"",resp:"",note:"",score:0,due:""}],
  locked:false
};

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : DEFAULT_DATA;
    // merge per sicurezza
    return {...DEFAULT_DATA, ...obj};
  }catch{
    return structuredClone(DEFAULT_DATA);
  }
}
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function avgScore(arr){ if(!arr.length) return 0; return arr.reduce((a,b)=>a+(+b.score||0),0)/(arr.length*5)*100;}
function delayed(arr){ return arr.filter(v=>v.due && v.due < todayISO() && (+v.score||0)<5).length; }
function totalAvg(d){ return (avgScore(d.s1)+avgScore(d.s2)+avgScore(d.s3)+avgScore(d.s4)+avgScore(d.s5))/5; }
function totalDelayed(d){ return delayed(d.s1)+delayed(d.s2)+delayed(d.s3)+delayed(d.s4)+delayed(d.s5); }

// ---------- HOME ----------
(function initHome(){
  if(!document.body.classList.contains("page-home")) return;
  const data = loadData();

  const canvas = document.getElementById("mainChart");
  if(canvas && window.Chart){
    new Chart(canvas, {
      type:"bar",
      data:{
        labels:["Punteggio medio","Azioni in ritardo"],
        datasets:[{
          label:"",
          data:[Math.round(totalAvg(data)), totalDelayed(data)],
          backgroundColor:["#005BAC","#EF5350"]
        }]
      },
      options:{
        plugins:{legend:{display:false}},
        scales:{ y:{beginAtZero:true,grid:{display:false}}, x:{grid:{display:false}} }
      }
    });
  }
})();

// ---------- CHECKLIST ----------
(function initChecklist(){
  if(!document.body.classList.contains("page-checklist")) return;

  const meta = {
    s1:{name:"1S — Selezionare", color:"s1", info:"Eliminare ciò che non serve. Rimuovi ciò che è inutile e crea un'area di lavoro essenziale, ordinata e sicura."},
    s2:{name:"2S — Sistemare",  color:"s2", info:"Un posto per tutto e tutto al suo posto. Etichette e posizioni chiare."},
    s3:{name:"3S — Splendere",  color:"s3", info:"Pulire e prevenire lo sporco. Rimuovere le cause dello sporco."},
    s4:{name:"4S — Standardizzare", color:"s4", info:"Regole e segnali visivi chiari. Procedure e checklist."},
    s5:{name:"5S — Sostenere",  color:"s5", info:"Disciplina e miglioramento continuo. Audit regolari e formazione."}
  };

  const state = loadData();
  const wrap = qs("#sSections");
  const kpiAvg = qs("#avgScore");
  const kpiDelay = qs("#delayedCount");

  function updateKPIs(){
    kpiAvg.textContent   = fmtPerc(totalAvg(state));
    kpiDelay.textContent = String(totalDelayed(state));
  }

  function makeRow(key, idx, row){
    const r = document.createElement("div");
    r.className = "row";
    r.innerHTML = `
      <input placeholder="Titolo voce..." value="${row.title||""}">
      <select>
        <option value="">Responsabile…</option>
        <option ${row.resp==="Rettifica"?"selected":""}>Rettifica</option>
        <option ${row.resp==="Montaggio"?"selected":""}>Montaggio</option>
        <option ${row.resp==="Magazzino"?"selected":""}>Magazzino</option>
      </select>
      <input placeholder="Note…" value="${row.note||""}">
      <div class="score-btns" style="grid-column:1/-1">
        ${[0,1,3,5].map(s=>`<button class="score ${row.score==s?"active":""}" data-s="${s}">${s}</button>`).join("")}
        <input type="date" style="margin-left:auto" value="${row.due||""}">
        <button class="icon-btn del" title="Elimina voce">🗑</button>
      </div>`;

    const [t,sel,note] = r.querySelectorAll("input,select,input");
    t.addEventListener("input", e=>{ state[key][idx].title = e.target.value; saveData(state); });
    sel.addEventListener("change",e=>{ state[key][idx].resp = e.target.value; saveData(state); });
    note.addEventListener("input",e=>{ state[key][idx].note = e.target.value; saveData(state); });

    r.querySelectorAll("button.score").forEach(b=>{
      b.addEventListener("click", ()=>{
        r.querySelectorAll("button.score").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        state[key][idx].score = +b.dataset.s;
        saveData(state); render(); // refresh per badge e late
      });
    });
    r.querySelector('input[type="date"]').addEventListener("change",(e)=>{
      state[key][idx].due = e.target.value; saveData(state); render();
    });
    r.querySelector("button.del").addEventListener("click", ()=>{
      state[key].splice(idx,1);
      if(state[key].length===0) state[key].push({title:"",resp:"",note:"",score:0,due:""});
      saveData(state); render();
    });
    return r;
  }

  function makeCard(key){
    const m = meta[key];
    const card = document.createElement("article");
    card.className = "s-card card";
    card.dataset.key = key;

    const head = document.createElement("div");
    head.className = "s-head";
    head.innerHTML = `
      <div class="s-title ${m.color}">${m.name}</div>
      <div class="s-actions">
        <span class="badge">Media: ${fmtPerc(avgScore(state[key]))}</span>
        <button class="icon-btn info ${m.color}" data-key="${key}" title="Info">i</button>
        <button class="icon-btn add" data-key="${key}" title="Aggiungi voce">＋</button>
      </div>`;
    card.appendChild(head);

    state[key].forEach((row,idx)=> card.appendChild(makeRow(key,idx,row)));

    if(delayed(state[key])>0) card.classList.add("late"); else card.classList.remove("late");
    return card;
  }

  function render(){
    wrap.innerHTML = "";
    ["s1","s2","s3","s4","s5"].forEach(k=> wrap.appendChild(makeCard(k)));
    updateKPIs();
    applyLockUI();
  }

  // info dialog
  const dlg = qs("#infoDialog"), infoTitle = qs("#infoTitle"), infoBody = qs("#infoBody");
  qs("#infoClose").addEventListener("click", ()=>dlg.close());
  document.addEventListener("click",(e)=>{
    const info = e.target.closest(".icon-btn.info");
    if(info){ const key = info.dataset.key; const m = meta[key];
      infoTitle.innerHTML = `<span class="pill ${m.color}">${m.name}</span>`;
      infoBody.textContent = m.info; dlg.showModal();
    }
    const add = e.target.closest(".icon-btn.add");
    if(add){ const key = add.dataset.key;
      state[key].push({title:"",resp:"",note:"",score:0,due:""});
      saveData(state); render();
    }
  });

  // comprimi / espandi
  let collapsed=false;
  qs("#toggleAll").addEventListener("click", ()=>{
    collapsed = !collapsed;
    qsa(".s-card .row").forEach(r=> r.style.display = collapsed?"none":"grid");
  });

  // lock
  const lockBtn = qs("#lockBtn");
  function applyLockUI(){
    document.body.dataset.locked = state.locked ? "1" : "0";
    lockBtn.setAttribute("aria-pressed", String(state.locked));
    lockBtn.textContent = state.locked ? "🔒" : "🔓";
    qsa(".s-card .row input, .s-card .row select, .s-card .row button.score, .icon-btn.add, .icon-btn.del")
      .forEach(el => { el.disabled = !!state.locked; });
  }
  lockBtn.addEventListener("click", ()=>{
    state.locked = !state.locked; saveData(state); applyLockUI();
  });

  render();
})();

// ---------- service worker ----------
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}
