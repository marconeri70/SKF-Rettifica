/** ===================== CONFIG ===================== */
const CONFIG = {
  PIN: "6170",                 // PIN iniziale (cambiabile offline)
  CHANNEL_DEFAULT: "CH 24",
  AREA: "Rettifica"            // ← cambia in "Rettifica" nella repo Rettifica
};

const COLORS = { s1:"#7c3aed", s2:"#ef4444", s3:"#f59e0b", s4:"#10b981", s5:"#2563eb" };

/** TESTI INFO (adatta liberamente) */
const INFO_TEXT = {
  s1: "(1) L'area pedonale è esente da congestione/ostacoli (area libera) e da pericoli di inciampo. (2) Nel pavimento non sono stati trovati materiali, strumenti, materiali di consumo non identificati. (3) Nell'area sono presenti solo i materiali di consumo, gli strumenti, le attrezzature, i mobili necessari. (4) Nell'area è presente solo il materiale necessario per il lavoro in corso. (5) Nell'area sono presenti in buone condizioni solo i documenti, gli espositori e le visualizzazioni necessari. (6) Definiti area etichetta rossa, processo e team. (7) Processo del tag rosso funzionante. (8) Lavagna 5S aggiornata (piano, prima/dopo, punteggio, SPL). (9) Evidenze che 1S è sostenibile (checklist/piani/audit). (10) 5S & 1S compresi; responsabilità definite. (11) Tutti i membri partecipano.",
  s2: "(1) Area e team definiti; comprensione 5S e 1S. (2) Niente oggetti non necessari. (3) Sicurezza identificata e accessibile. (4) Interruttori/uscite emergenza accessibili. (5) Stazioni qualità organizzate. (6) SWC seguito. (7) Posizioni prefissate (min/max) per utenze/strumenti/pulizie/consumabili. (8) Posizioni e identificazioni per bidoni/rifiuti/oli. (9) WIP/OK/KO/Quarantena con posizioni e identificazioni. (10) Materie prime/imballi con posizioni e ID. (11) Layout con confini, corsie, posizioni, aree DPI. (12) Documenti identificati al punto d’uso. (13) Miglioramenti one-touch/poka-yoke/ergonomia. (14) Evidenze di sostenibilità 2S. (15) 5S/2S compresi; responsabilità chiare. (16) Tutti partecipano.",
  s3: "(1) Nessun oggetto inutile. (2) Miglioramenti 2S mantenuti. (3) Verifiche regolari con azioni. (4) Team comprende 5S, 1S, 2S. (5) Pavimenti/pareti/scale puliti. (6) Segnaletica pulita e leggibile. (7) Documenti in buono stato e protetti. (8) Illuminazione/ventilazione/aria condizionata in efficienza. (9) Fonti di sporco identificate. (10) Piani per eliminare/contenere la fonte. (11) Azioni secondo piano. (12) Migliorie per prevenire lo sporco. (13) Riciclo rifiuti attivo. (14) Demarcazioni permanenti. (15) Evidenze sostenibilità 3S. (16) 5S/3S compresi; tutti partecipano.",
  s4: "(1) Visual management per anomalie/capacità (Min/Max, imballi, magazzino, componenti). (2) Standard colori per lubrificazioni/tubi/valvole; display aggiornati. (3) Standard 5S consolidati e aggiornati per training/guida. (4) Schede/istruzioni 5S integrate nel DMS quotidiano.",
  s5: "(1) Tutti formati e coinvolti sugli standard 5S. (2) 5S come abitudine. (3) Layered audit su programma. (4) Foto prima/dopo come riferimento. (5) Obiettivi/risultati 5S esposti."
};

/** ===================== STORAGE ===================== */
const storageKey = (k)=>`skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))??d; }catch{ return d; } };
const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

/** PIN persistente offline */
function getStoredPin(){
  const saved = localStorage.getItem(storageKey("pin"));
  return saved ?? CONFIG.PIN;
}
function setStoredPin(newPin){
  localStorage.setItem(storageKey("pin"), newPin);
}

/** ===================== PWA SW ===================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", ()=> navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

/** ===================== STATO ===================== */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  points: { s1:0, s2:0, s3:0, s4:0, s5:0 },
  notes:  { s1:"", s2:"", s3:"", s4:"", s5:"" },
  dates:  { s1:null, s2:null, s3:null, s4:null, s5:null }
});

/** ===================== PIN / CANALE dialog ===================== */
function openPinDialog(){
  const dlg = document.getElementById("pinDialog");
  if (!dlg) return;

  const pinInput = document.getElementById("pinInput");
  const chInput  = document.getElementById("channelInput");
  const newPin1  = document.getElementById("newPin1");
  const newPin2  = document.getElementById("newPin2");

  chInput.value = state.channel ?? CONFIG.CHANNEL_DEFAULT;
  pinInput.value = ""; newPin1.value = ""; newPin2.value = "";

  const confirm = document.getElementById("pinConfirmBtn");
  const cancel  = document.getElementById("pinCancel");

  confirm.onclick = ()=>{
    const current = pinInput.value;
    const realPin = getStoredPin();

    if (current !== realPin) { alert("PIN errato"); return; }

    // salva CH
    state.channel = chInput.value.trim() || CONFIG.CHANNEL_DEFAULT;
    setJSON(storageKey("state"), state);
    refreshTitles();

    // cambio PIN opzionale
    if (newPin1.value || newPin2.value){
      if (newPin1.value !== newPin2.value) { alert("I due PIN non coincidono"); return; }
      if (!/^\d{4,8}$/.test(newPin1.value)) { alert("Il PIN deve essere 4-8 cifre"); return; }
      setStoredPin(newPin1.value);
      alert("PIN aggiornato nel dispositivo.");
    }

    dlg.close();
  };

  cancel.onclick = ()=> dlg.close();
  dlg.showModal();
}

/** ===================== TITOLI ===================== */
function refreshTitles(){
  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;
  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = `${state.channel} — ${CONFIG.AREA}`;
}

/** ===================== HOME ===================== */
function setupHome(){
  refreshTitles();
  renderChart();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);
  document.getElementById("exportBtn")?.addEventListener("click", openPinDialog);
}

/** ===================== CHECKLIST ===================== */
function setupChecklist(){
  refreshTitles();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  // badge riassuntivi
  const summary = document.getElementById("summaryBadges");
  if (summary){
    summary.innerHTML="";
    ["s1","s2","s3","s4","s5"].forEach(k=>{
      const v = state.points[k] ?? 0;
      const el = document.createElement("button");
      el.className = `s-badge ${k}`;
      el.textContent = `${k.toUpperCase()} ${v*20}%`;
      el.addEventListener("click", ()=> {
        document.getElementById(`sheet-${k}`)?.scrollIntoView({behavior:"smooth",block:"start"});
      });
      summary.appendChild(el);
    });
  }

  document.getElementById("toggleAll")?.addEventListener("click", ()=>{
    document.querySelectorAll(".s-details").forEach(det=> det.open = !det.open);
  });

  const wrap = document.getElementById("sheets");
  if (!wrap) return;

  const defs = [
    {k:"s1", name:"1S — Selezionare",   color:COLORS.s1},
    {k:"s2", name:"2S — Sistemare",     color:COLORS.s2},
    {k:"s3", name:"3S — Splendere",     color:COLORS.s3},
    {k:"s4", name:"4S — Standardizzare",color:COLORS.s4},
    {k:"s5", name:"5S — Sostenere",     color:COLORS.s5},
  ];

  const todayStr = ()=> new Date().toISOString().slice(0,10);

  wrap.innerHTML = "";
  defs.forEach(({k,name,color})=>{
    const val  = state.points[k] ?? 0;
    const late = isLate(k);

    const card = document.createElement("article");
    card.className = "sheet" + (late?" late":"");
    card.id = `sheet-${k}`;
    card.innerHTML = `
      <div class="sheet-head">
        <span class="s-color" style="background:${color}"></span>
        <h3 class="s-title" style="color:${color}">${name}</h3>
        <span class="s-value">Valore: ${(val*20)}%</span>
        <button class="icon info" aria-label="Info" data-k="${k}">i</button>
        <button class="icon add" aria-label="Duplica">+</button>
      </div>

      <details class="s-details" open>
        <summary>▼ Dettagli</summary>

        <label class="field">
          <span>Responsabile / Operatore</span>
          <input placeholder="Inserisci il nome..." value="">
        </label>

        <label class="field">
          <span>Note</span>
          <textarea rows="3" placeholder="Note...">${state.notes[k]??""}</textarea>
        </label>

        <div class="field">
          <span>Data</span>
          <div style="display:flex;gap:10px;align-items:center">
            <input type="date" value="${state.dates[k]??todayStr()}" data-date="${k}">
            <div class="points">
              ${[0,1,3,5].map(p=>`
                <button data-k="${k}" data-p="${p}" class="${val===p?'active':''}">${p}</button>
              `).join("")}
            </div>
            <button class="icon danger del" title="Elimina">🗑</button>
          </div>
        </div>
      </details>
    `;
    wrap.appendChild(card);
  });

  // punteggi
  wrap.addEventListener("click",(e)=>{
    const btn = e.target.closest(".points button");
    if(!btn) return;
    const k = btn.dataset.k;
    const p = Number(btn.dataset.p);
    state.points[k] = p;
    setJSON(storageKey("state"), state);
    document.querySelectorAll(`.points button[data-k="${k}"]`).forEach(b=>b.classList.toggle("active", Number(b.dataset.p)===p));
    document.querySelector(`#sheet-${k} .s-value`).textContent = `Valore: ${p*20}%`;
    updateStatsAndLate();
  });

  // date → ritardo
  wrap.addEventListener("change",(e)=>{
    const inp = e.target.closest('input[type="date"][data-date]');
    if(!inp) return;
    const k = inp.dataset.date;
    state.dates[k] = inp.value;
    setJSON(storageKey("state"), state);
    updateStatsAndLate();
  });

  // elimina (PIN)
  wrap.addEventListener("click",(e)=>{
    const del = e.target.closest(".del");
    if(!del) return;
    if (prompt("Inserisci PIN per eliminare") !== getStoredPin()) return;
    const k = del.closest(".sheet").id.replace("sheet-","");
    state.points[k]=0; state.notes[k]=""; state.dates[k]=null;
    setJSON(storageKey("state"), state);
    del.closest(".sheet").querySelectorAll(".points button").forEach(b=>b.classList.remove("active"));
    del.closest(".sheet").querySelector(".s-value").textContent="Valore: 0%";
    del.closest(".sheet").querySelector('textarea').value="";
    del.closest(".sheet").querySelector('input[type="date"]').value=new Date().toISOString().slice(0,10);
    updateStatsAndLate();
  });

  // info
  wrap.addEventListener("click",(e)=>{
    const infoBtn = e.target.closest(".info");
    if(!infoBtn) return;
    openInfo(infoBtn.dataset.k);
  });

  document.getElementById("infoCloseBtn")?.addEventListener("click", ()=>{
    const d = document.getElementById("infoDialog");
    if (d?.open) d.close();
  });

  document.getElementById("infoDialog")?.addEventListener("click", (e)=>{
    const dlg = e.currentTarget;
    const box = dlg.querySelector(".modal-box");
    if (!box.contains(e.target)) dlg.close();
  });

  // “+” → duplica (PIN)
  wrap.addEventListener("click",(e)=>{
    const add = e.target.closest(".add");
    if(!add) return;
    if (prompt("Inserisci PIN per aggiungere") !== getStoredPin()) return;
    const card = add.closest(".sheet");
    const clone = card.cloneNode(true);
    const t = clone.querySelector(".s-title");
    if (t) t.textContent += " (copia)";
    clone.id = card.id + "-copy-" + Math.floor(Math.random()*10000);
    card.after(clone);
  });

  updateStatsAndLate();
}

/** ===================== RITARDI & STATS ===================== */
function isLate(k){
  const d = state.dates[k];
  if(!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const chosen = new Date(d); chosen.setHours(0,0,0,0);
  return chosen < today;
}
function updateStatsAndLate(){
  const arr = Object.values(state.points);
  const avg = arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*20) : 0;
  document.getElementById("avgScore")?.replaceChildren(document.createTextNode(`${avg}%`));

  const lateList = Object.keys(state.dates).filter(k=> isLate(k));
  document.getElementById("lateCount")?.replaceChildren(document.createTextNode(String(lateList.length)));

  ["s1","s2","s3","s4","s5"].forEach(k=>{
    document.getElementById(`sheet-${k}`)?.classList.toggle("late", isLate(k));
  });
}

/** ===================== INFO POPUP ===================== */
function parseNumbered(text){
  return text.split(/\(\d+\)\s*/).map(s=>s.trim()).filter(Boolean);
}
let currentInfoKey = null;

function openInfo(k){
  currentInfoKey = k;
  const dlg = document.getElementById("infoDialog");
  const box = dlg.querySelector(".modal-box");
  const title = document.getElementById("infoTitle");
  const body = document.getElementById("infoText");

  title.textContent = `${k.toUpperCase()} — Info`;
  box.style.borderTop = `6px solid ${COLORS[k]||'#0a57d5'}`;

  // SOLO punti interattivi (niente lista duplicata)
  const items = parseNumbered(INFO_TEXT[k] ?? "");
  const chips = document.createElement("div");
  chips.className = "info-chips";
  chips.addEventListener("click",(e)=>{
    const chip = e.target.closest(".info-chip");
    if(!chip) return;
    const txt = chip.dataset.text || "";
    const ta = document.querySelector(`#sheet-${currentInfoKey} textarea`);
    if(!ta) return;
    const prefix = ta.value && !ta.value.endsWith("\n") ? "\n" : "";
    ta.value = `${ta.value}${prefix}- ${txt}`;
    state.notes[currentInfoKey] = ta.value;
    setJSON(storageKey("state"), state);
  });

  chips.innerHTML = "";
  items.forEach((t,i)=>{
    const b = document.createElement("button");
    b.type="button"; b.className="info-chip"; b.dataset.text=t;
    b.innerHTML = `<span class="n" style="background:${COLORS[k]}">${i+1}</span><span>${t}</span>`;
    chips.appendChild(b);
  });

  body.innerHTML="";
  body.appendChild(chips);

  dlg.showModal();
}

/** ===================== GRAFICO HOME ===================== */
let chart;
function renderChart(){
  const ctx = document.getElementById("progressChart");
  if(!ctx || typeof Chart==="undefined") return;

  const vals = ["s1","s2","s3","s4","s5"].map(k=> (state.points[k]??0)*20 );
  const delayed = Object.keys(state.dates).filter(k=> isLate(k)).length;

  if(chart) chart.destroy();
  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:["1S","2S","3S","4S","5S","Ritardi"],
      datasets:[{
        data:[...vals, delayed],
        backgroundColor:[COLORS.s1,COLORS.s2,COLORS.s3,COLORS.s4,COLORS.s5,"#ef4444"]
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{display:false}, tooltip:{enabled:true} },
      scales:{ y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"}}, x:{ticks:{maxRotation:0}} }
    }
  });

  // Pulsanti “S in ritardo”
  const box = document.getElementById("lateBtns");
  if (!box) return;
  box.innerHTML = "";
  ["s1","s2","s3","s4","s5"].forEach((k,i)=>{
    if (isLate(k)){
      const b = document.createElement("button");
      b.className = `late-btn ${k}`;
      b.textContent = `${i+1}S in ritardo`;
      b.addEventListener("click", ()=> location.href = `checklist.html#sheet-${k}`);
      box.appendChild(b);
    }
  });
}

/** ===================== ROUTER ===================== */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshTitles();
  const page = document.body.dataset.page;
  if (page==="home")      setupHome();
  if (page==="checklist") setupChecklist();
});
