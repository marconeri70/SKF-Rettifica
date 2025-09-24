/** CONFIG */
const CONFIG = {
  PIN: "6170",
  CHANNEL_DEFAULT: "CH 24",
  AREA: "Rettifica"       // cambia in "Montaggio" per l'altra app
};

const COLORS = { s1:"#7c3aed", s2:"#ef4444", s3:"#f59e0b", s4:"#10b981", s5:"#2563eb" };

/** INFO – punti cliccabili (niente duplicazioni numeriche nel testo salvato) */
const INFO_POINTS = {
  s1:[
    "L'area pedonale è libera da ostacoli e pericoli di inciampo.",
    "Nessun materiale o attrezzo non identificato sul pavimento.",
    "Solo materiali/strumenti necessari presenti; il resto è rimosso.",
    "Solo materiale necessario per il lavoro in corso.",
    "Documenti e visualizzazioni necessari, aggiornati e in buono stato.",
    "Definiti team e processo etichetta rossa; processo attivo.",
    "Lavagna 5S aggiornata (piano, foto prima/dopo, audit).",
    "Evidenze per garantire la sostenibilità di 1S.",
    "5S/1S compresi dal team; responsabilità definite.",
    "Tutti i membri partecipano alle attività dell’area."
  ],
  s2:[
    "Area/team definiti; comprensione 5S e dettaglio 1S.",
    "Nessun oggetto non necessario nella zona.",
    "Sicurezza: articoli segnalati e accessibili.",
    "Uscite e interruttori d’emergenza visibili e accessibili.",
    "Stazioni qualità definite e ordinate (strumenti, master...).",
    "Scarto senza compromessi (SWC) rispettato.",
    "Posizioni prefissate per utenze/strumenti/pulizia con indicatori.",
    "Posizioni per bidoni/rifiuti/oli con identificazione chiara.",
    "WIP/accettate/rifiutate/quarantena con posizioni e segnaletica.",
    "Materie prime/componenti con posizioni e identificazione.",
    "Layout con confini/corsie e zone DPI.",
    "Documenti al punto di utilizzo e ordinati.",
    "Miglioramenti: one-touch, Poka-Yoke, ergonomia.",
    "Piano di sostenibilità 2S (check periodico).",
    "2S compresa dal team; ruoli chiari; partecipazione di tutti."
  ],
  s3:[
    "Assenza di cose inutili in zona.",
    "Miglioramenti 2S mantenuti.",
    "Verifiche periodiche e azioni correttive attuate.",
    "Team comprende bene 1S/2S.",
    "Pavimenti/pareti puliti; assenza oli/trucioli/imballi.",
    "Cartelli di sicurezza/qualità puliti e leggibili.",
    "Documenti in buono stato e protetti.",
    "Illuminazione/ventilazione/clima in ordine.",
    "Fonti di sporco identificate e note al team.",
    "Piani d’azione per eliminare o contenere la fonte.",
    "Esecuzione coerente delle azioni pianificate.",
    "Miglioramenti per prevenire lo sporco (eliminazione cause).",
    "Riciclo attivo con corretta differenziazione.",
    "Demarcazioni rese permanenti.",
    "Routine di pulizia e check 5S aggiornati e sostenibili.",
    "5S & 3S compresi; partecipazione attiva del team."
  ],
  s4:[
    "Visual management & allarmi visivi per anomalie a colpo d’occhio.",
    "Colori/segni standard per lubrificazione, tubi, valvole ecc.",
    "Standard 5S consolidati e aggiornati (training e guida).",
    "Istruzioni/controlli 5S integrati nella gestione quotidiana."
  ],
  s5:[
    "Formazione 5S a tutti, inclusi i nuovi, con coinvolgimento.",
    "5S come abitudine e standard rispettati.",
    "Layered audit con programma definito.",
    "Foto prima/dopo mantenute come riferimento.",
    "Obiettivi e attestati 5S ben esposti."
  ]
};

/* Storage */
const storageKey = (k)=>`skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))??d; }catch{ return d; } };
const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

const getPin = ()=> localStorage.getItem(storageKey("pin")) || CONFIG.PIN;
const setPin = (p)=> localStorage.setItem(storageKey("pin"), String(p||""));

/* SW */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", ()=> navigator.serviceWorker.register("sw.js"));
}

/* Stato */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  // supporto “schede duplicate” per ogni S: array di items
  items: {
    s1:[{points:0, note:"", date:null}],
    s2:[{points:0, note:"", date:null}],
    s3:[{points:0, note:"", date:null}],
    s4:[{points:0, note:"", date:null}],
    s5:[{points:0, note:"", date:null}]
  }
});

/* Util */
const todayStr = ()=> new Date().toISOString().slice(0,10);

/* Download JSON robusto */
function downloadJSON(filename, obj){
  const json = JSON.stringify(obj,null,2);
  try{
    const blob = new Blob([json],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=filename; a.rel="noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch{
    const url="data:application/json;charset=utf-8,"+encodeURIComponent(json);
    const a=document.createElement("a"); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove();
  }
}

/* Titoli */
function refreshTitles(){
  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;
  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = `${state.channel} — ${CONFIG.AREA}`;
  const pageTitleH1 = document.getElementById("pageTitleH1");
  if (pageTitleH1) pageTitleH1.textContent = `${state.channel} — ${CONFIG.AREA}`;
}

/* PIN dialog */
function openPinDialog(){
  const dlg = document.getElementById("pinDialog");
  if(!dlg) return;
  dlg.showModal();

  const pinInput = document.getElementById("pinInput");
  const chInput  = document.getElementById("channelInput");
  const newPin1  = document.getElementById("newPin1");
  const newPin2  = document.getElementById("newPin2");
  pinInput.value=""; chInput.value=state.channel;

  const okBtn = document.getElementById("pinConfirmBtn");
  const cancel= document.getElementById("pinCancel");

  okBtn.onclick = ()=>{
    if(pinInput.value!==getPin()){ alert("PIN errato"); return; }
    state.channel = chInput.value.trim() || CONFIG.CHANNEL_DEFAULT;
    if(newPin1.value || newPin2.value){
      if(newPin1.value!==newPin2.value){ alert("I due PIN non coincidono"); return; }
      if(newPin1.value.length<3){ alert("PIN troppo corto"); return; }
      setPin(newPin1.value); alert("PIN aggiornato");
    }
    setJSON(storageKey("state"),state);
    refreshTitles();
    dlg.close();
  };
  cancel.onclick = ()=> dlg.close();
}

/* HOME */
function setupHome(){
  refreshTitles();
  renderChart();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  document.getElementById("exportBtn")?.addEventListener("click", ()=>{
    const p = prompt("Inserisci PIN per esportare");
    if(p!==getPin()) return;
    const payload = {
      area: CONFIG.AREA,
      channel: state.channel,
      at: new Date().toISOString(),
      items: state.items
    };
    const fname = `SKF-5S-${CONFIG.AREA}-${state.channel.replace(/\s+/g,'_')}.json`;
    downloadJSON(fname, payload);
  });
}

/* CHECKLIST */
function setupChecklist(){
  refreshTitles();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  // badge riassunto
  const summary = document.getElementById("summaryBadges");
  ["s1","s2","s3","s4","s5"].forEach(k=>{
    const perc = averagePercent(k);
    const b = document.createElement("button");
    b.className = `s-badge ${k}`;
    b.textContent = `${k.toUpperCase()} ${perc}%`;
    b.addEventListener("click", ()=> document.getElementById(`sheet-${k}`)?.scrollIntoView({behavior:"smooth"}));
    summary.appendChild(b);
  });

  document.getElementById("toggleAll").addEventListener("click", ()=>{
    const list = document.querySelectorAll(".s-details");
    const openCount = Array.from(list).filter(d=>d.open).length;
    list.forEach(d=> d.open = openCount===0);
  });

  renderSheets();
  updateStatsAndLate();
}

function renderSheets(){
  const wrap = document.getElementById("sheets");
  wrap.innerHTML="";
  const defs = [
    {k:"s1", name:"1S — Selezionare",   color:COLORS.s1},
    {k:"s2", name:"2S — Sistemare",     color:COLORS.s2},
    {k:"s3", name:"3S — Splendere",     color:COLORS.s3},
    {k:"s4", name:"4S — Standardizzare",color:COLORS.s4},
    {k:"s5", name:"5S — Sostenere",     color:COLORS.s5},
  ];

  defs.forEach(({k,name,color})=>{
    const items = state.items[k];
    const late  = items.some(it=>isLate(it.date));
    const card  = document.createElement("article");
    card.className = "sheet"+(late?" late":"");
    card.id = `sheet-${k}`;
    card.innerHTML = `
      <div class="sheet-head">
        <span class="s-color" style="background:${color}"></span>
        <h3 class="s-title" style="color:${color}">${name}</h3>
        <span class="s-value">Valore: ${averagePercent(k)}%</span>
        <button class="icon info" aria-label="Info" data-k="${k}">i</button>
        <button class="icon add" aria-label="Duplica" data-k="${k}">+</button>
      </div>
    `;
    const list = document.createElement("div");
    items.forEach((it,idx)=> list.appendChild(renderItem(k, idx, it)));
    card.appendChild(list);
    wrap.appendChild(card);
  });

  // deleghe
  wrap.onclick = (e)=>{
    // punteggi
    const pbtn = e.target.closest(".points button");
    if(pbtn){
      const {k, idx, p} = pbtn.dataset;
      const item = state.items[k][+idx];
      item.points = +p;
      saveAndRefresh(k);
      return;
    }
    // elimina
    const del = e.target.closest(".del");
    if(del){
      if(prompt("PIN per eliminare")!==getPin()) return;
      const {k, idx} = del.dataset;
      state.items[k].splice(+idx,1);
      if(state.items[k].length===0) state.items[k].push({points:0,note:"",date:todayStr()});
      saveAndRefresh(k);
      return;
    }
    // info
    const info = e.target.closest(".info");
    if(info){ openInfo(info.dataset.k); return; }

    // duplica scheda
    const plus = e.target.closest(".add");
    if(plus){
      if(prompt("PIN per aggiungere")!==getPin()) return;
      const k = plus.dataset.k;
      state.items[k].push({points:0,note:"",date:todayStr()});
      saveAndRefresh(k, /*scroll*/true);
    }
  };

  wrap.oninput = (e)=>{
    const ta = e.target.closest(".note");
    if(ta){
      const {k, idx} = ta.dataset;
      state.items[k][+idx].note = ta.value;
      setJSON(storageKey("state"), state);
      return;
    }
  };

  wrap.onchange = (e)=>{
    const d = e.target.closest('input[type="date"]');
    if(d){
      const {k, idx} = d.dataset;
      state.items[k][+idx].date = d.value;
      saveAndRefresh(k);
    }
  };
}

function renderItem(k, idx, it){
  const div = document.createElement("details");
  div.className="s-details";
  div.open = true;
  div.innerHTML = `
    <summary>▼ Dettagli</summary>
    <label class="field"><span>Responsabile / Operatore</span>
      <input class="who" placeholder="Inserisci il nome..." value="">
    </label>
    <label class="field"><span>Note</span>
      <textarea class="note" rows="3" placeholder="Note..." data-k="${k}" data-idx="${idx}">${it.note||""}</textarea>
    </label>
    <div class="field">
      <span>Data</span>
      <div style="display:flex;gap:10px;align-items:center">
        <input type="date" value="${it.date||todayStr()}" data-k="${k}" data-idx="${idx}">
        <div class="points">
          ${[0,1,3,5].map(p=>`<button data-k="${k}" data-idx="${idx}" data-p="${p}" class="${it.points===p?'active':''}">${p}</button>`).join("")}
        </div>
        <button class="icon danger del" title="Elimina (PIN)" data-k="${k}" data-idx="${idx}">🗑</button>
      </div>
    </div>
  `;
  return div;
}

function averagePercent(k){
  const items = state.items[k];
  if(!items || !items.length) return 0;
  const avg = items.reduce((a,b)=>a+(b.points||0),0)/items.length;
  return Math.round(avg*20);
}

function isLate(dateStr){
  if(!dateStr) return false;
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return d < t;
}

function saveAndRefresh(k, scroll){
  setJSON(storageKey("state"), state);
  // aggiorna card S
  const card = document.getElementById(`sheet-${k}`);
  if(card){
    card.querySelector(".s-value").textContent = `Valore: ${averagePercent(k)}%`;
    const late = state.items[k].some(it=>isLate(it.date));
    card.classList.toggle("late", late);
  }
  updateStatsAndLate();
  if(scroll) card?.scrollIntoView({behavior:"smooth"});
}

/* INFO – con punteggio */
/* INFO – con voti che restano attivi e riportati solo in note */
function openInfo(k){
  const dlg=document.getElementById("infoDialog");
  const content=document.getElementById("infoContent");
  const points=INFO_POINTS[k]||[];
  content.innerHTML=`<ol>${
    points.map((t,i)=>`
      <li>
        <div class="pointline" data-text="${encodeURIComponent(t)}">
          ${i+1}. ${t}
          <div class="points">
            ${[0,1,3,5].map(p=>`<button data-p="${p}">${p}</button>`).join("")}
          </div>
          <div class="note-mini"></div>
        </div>
      </li>`).join("")
  }</ol>`;
  content.onclick=(e)=>{
    const btn=e.target.closest("button[data-p]");
    if(!btn)return;
    const val=+btn.dataset.p;
    const line=btn.closest(".pointline");
    line.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const text=decodeURIComponent(line.dataset.text);
    // aggiungi nota visiva sotto
    line.querySelector(".note-mini").textContent=`Assegnato voto: ${val}`;
    // append alle note della S
    const first=state.items[k][0];
    const toAdd=`[${val}] ${text}`;
    if(!first.note?.includes(toAdd)){
      first.note=(first.note?first.note+"\n":"")+toAdd;
    }
    setJSON(storageKey("state"),state);
  };
  dlg.showModal();
}
document.getElementById("infoCloseBtn").onclick=()=>document.getElementById("infoDialog").close();

/* CHART */
let chart;
function renderChart(){
  const ctx = document.getElementById("progressChart");
  if(!ctx) return;

  const vals = ["s1","s2","s3","s4","s5"].map(k=> averagePercent(k) );
  const delayedCount = ["s1","s2","s3","s4","s5"]
    .reduce((n,k)=> n + state.items[k].some(it=>isLate(it.date)) ,0);

  if(chart) chart.destroy();
  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:["1S","2S","3S","4S","5S","Ritardi"],
      datasets:[{
        data:[...vals, Math.min(delayedCount*20,100)],
        backgroundColor:["#7c3aed","#ef4444","#f59e0b","#10b981","#2563eb","#ef4444"]
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false},tooltip:{enabled:true}},
      scales:{
        y:{beginAtZero:true,max:100,grid:{display:false},ticks:{callback:v=>v+"%"}},
        x:{grid:{display:false},ticks:{maxRotation:0}}
      }
    }
  });

  const box = document.getElementById("lateBtns");
  if(box){
    box.innerHTML="";
    ["s1","s2","s3","s4","s5"].forEach((k,i)=>{
      if(state.items[k].some(it=>isLate(it.date))){
        const b=document.createElement("button");
        b.className=`late-btn ${k}`; b.textContent=`${i+1}S in ritardo`;
        b.onclick=()=> location.href=`checklist.html#sheet-${k}`;
        box.appendChild(b);
      }
    });
  }
}

/* KPI */
function updateStatsAndLate(){
  const all = ["s1","s2","s3","s4","s5"].flatMap(k=> state.items[k]);
  const avg = all.length ? Math.round(all.reduce((a,b)=>a+(b.points||0),0)/all.length*20) : 0;
  const late = all.filter(it=>isLate(it.date)).length;
  document.getElementById("avgScore")?.replaceChildren(document.createTextNode(`${avg}%`));
  document.getElementById("lateCount")?.replaceChildren(document.createTextNode(String(late)));
  renderChart();
}

/* Router */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshTitles();
  if(document.body.dataset.page==="home") setupHome();
  if(document.body.dataset.page==="checklist") setupChecklist();
});
