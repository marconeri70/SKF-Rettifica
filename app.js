/** ===========================
 *  CONFIG (puoi sovrascrivere da <script> prima di app.js con window.CONFIG)
 *  =========================== */
const DEFAULT_CONFIG = {
  PIN: "6170",                // PIN predefinito (puoi cambiarlo poi dal lucchetto)
  CHANNEL_DEFAULT: "CH 24",   // Canale di default (es. CH 24)
  AREA: "Rettifica"           // Nome area (Rettifica o Montaggio)
};
const CONFIG = Object.assign({}, DEFAULT_CONFIG, (window.CONFIG || {}));

/** Colori corporate per le 5S (usati ovunque, inclusi grafico e badge) */
const COLORS = {
  s1: "#7c3aed", // viola
  s2: "#ef4444", // rosso
  s3: "#f59e0b", // giallo
  s4: "#10b981", // verde
  s5: "#2563eb"  // blu
};

/** Testi INFO con punti numerati (1)(2)... — verranno convertiti in chip cliccabili */
const INFO_TEXT = {
  s1: "(1) L'area pedonale è esente da congestione/ostacoli (area libera) e da pericoli di inciampo. (2) Nel pavimento non sono stati trovati materiali, strumenti, materiali di consumo non identificati. (3) Nell'area sono presenti solo i materiali di consumo, gli strumenti, le attrezzature, i mobili necessari. Tutti gli elementi non necessari sono stati rimossi o contrassegnati per la rimozione. (4) Nell'area è presente solo il materiale necessario per il lavoro in corso; materiali obsoleti o non necessari vengono rimossi. (5) Documenti/espositori/visualizzazioni necessari e pertinenti sono presenti e in buone condizioni. (6) Area etichetta rossa, processo e team sono definiti. (7) Il processo del tag rosso funziona. (8) Esiste una lavagna 5S con piano, foto prima&dopo, punteggi audit e SPL. (9) Esistono prove che 1S sia sostenibile (lista di controllo/piano periodico). (10) Il concetto 5S & 1S è compreso e le responsabilità sono definite. (11) Tutti i membri sono coinvolti.",
  s2: "(1) Area/team definiti; membri comprendono 5S e 1S. (2) Niente di non necessario in zona. (3) Articoli/attrezzature di sicurezza chiaramente contrassegnati e accessibili. (4) Interruttori/uscite d'emergenza visibili e accessibili. (5) Stazioni qualità ben definite (strumenti, master...). (6) Scarto senza compromessi seguito. (7) Posizioni prefissate con identificazione e min/max per utenze, strumenti, pulizia, consumabili. (8) Posizioni definite per bidoni/contenitori/oli con indicatori chiari. (9) WIP/accettati/rifiutati/quarantena con posizioni designate e identificazione. (10) Materie prime/pack/componenti con posizioni designate e identificazione. (11) Layout con confini/corridoi/pedonali/carrelli e aree DPI definito. (12) File/documenti identificati e organizzati al punto d'uso. (13) Miglioramenti con one-touch, Poka-Yoke, ergonomia. (14) Prove di sostenibilità 2S (checklist/piano). (15) 5S e 2S compresi; responsabilità definite. (16) Tutti i membri partecipano.",
  s3: "(1) Non si trovano cose inutili in zona. (2) I miglioramenti 2S sono mantenuti. (3) Verifiche regolari; deviazioni corrette. (4) Area/team definiti; 5S, 1S e 2S compresi. (5) Pavimenti/scale/pareti puliti e privi di sporco, oli, trucioli, imballi ecc. (6) Segnali/avvertenze/etichette puliti e leggibili. (7) Documenti in buono stato e protetti. (8) Luci/ventilazioni/aria condizionata funzionanti e pulite. (9) Fonti di sporco identificate e note. (10) Piani d'azione per contenere/eliminare lo sporco. (11) Azioni eseguite secondo piano. (12) Miglioramenti per ridurre pulizie e eliminare alla fonte. (13) Riciclaggio attivo; smistamento corretto. (14) Demarcazioni permanenti (pavimento/posizioni). (15) Prove di sostenibilità 3S (routine pulizia/checklist/piano). (16) 5S e 3S compresi; responsabilità definite; partecipazione.",
  s4: "(1) Allarmi/management visivo per abnormalità e capacità (Min/Max, imballi, scorte, componenti). (2) Colori/segni standard per lubrificazione, tubi, valvole ecc., mappati e mantenuti. (3) Standard 5S consolidati e aggiornati; usati per training e guida miglioramento. (4) Schede/istruzioni 5S integrate nella gestione e attività quotidiane.",
  s5: "(1) Tutti (inclusi i nuovi) sono formati sugli standard 5S e coinvolti. (2) 5S è un'abitudine; standard seguiti da tutti. (3) Layered audit secondo programma definito. (4) Foto prima/dopo mantenute come riferimento. (5) Obiettivi 5S esposti."
};

/* ============================
 *  STORAGE helpers
 * ============================ */
const storageKey = (k)=>`skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k,d)=>{ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
const getPin = ()=> localStorage.getItem(storageKey("pin")) || CONFIG.PIN;
const setPin = (p)=> localStorage.setItem(storageKey("pin"), String(p||""));

/* ============================
 *  PWA Service Worker
 * ============================ */
// Helper robusto per scaricare JSON (funziona anche su iOS/Safari)
function downloadJSON(filename, obj) {
  const json = JSON.stringify(obj, null, 2);
  // Fallback per Safari/iOS: apri in nuova tab se il download diretto è bloccato
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  try {
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
  } catch (e) {
    // Fallback assoluto: data URL (alcuni Safari vecchi)
    const data = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    if (isSafari) {
      window.open(data, "_blank");
    } else {
      const a = document.createElement("a");
      a.href = data;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", ()=> navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

/* ============================
 *  STATO
 * ============================ */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  points: { s1:0, s2:0, s3:0, s4:0, s5:0 },
  notes:  { s1:"", s2:"", s3:"", s4:"", s5:"" },
  dates:  { s1:null, s2:null, s3:null, s4:null, s5:null }
});

/* ============================
 *  UI – Titoli dinamici
 * ============================ */
function refreshTitles(){
  const chartTitle = document.getElementById("chartTitle");
  const pageTitle  = document.getElementById("pageTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;
  if (pageTitle)  pageTitle.textContent  = `${state.channel} — ${CONFIG.AREA}`;
}

/* ============================
 *  DIALOG PIN / Canale / Cambio PIN
 * ============================ */
function openPinDialog(){
  const dlg = document.getElementById("pinDialog");
  if (!dlg) return;

  // Reset campi
  const pinInput  = document.getElementById("pinInput");
  const chInput   = document.getElementById("channelInput");
  const newPin1   = document.getElementById("newPin1");
  const newPin2   = document.getElementById("newPin2");
  pinInput.value = "";
  chInput.value  = state.channel ?? CONFIG.CHANNEL_DEFAULT;
  if (newPin1) newPin1.value = "";
  if (newPin2) newPin2.value = "";

  dlg.showModal();

  const confirm = document.getElementById("pinConfirmBtn");
  const cancel  = document.getElementById("pinCancel");

  const onConfirm = ()=>{
    const current = pinInput.value;
    if (current !== getPin()){
      alert("PIN errato");
      return;
    }

    // Salva CH
    state.channel = (chInput.value || "").trim() || CONFIG.CHANNEL_DEFAULT;
    setJSON(storageKey("state"), state);

    // Cambio PIN (opzionale)
    if (newPin1 && newPin2 && (newPin1.value || newPin2.value)){
      if (newPin1.value.length < 3){
        alert("Il nuovo PIN deve avere almeno 3 cifre.");
        return;
      }
      if (newPin1.value !== newPin2.value){
        alert("I due PIN non coincidono.");
        return;
      }
      setPin(newPin1.value);
      alert("PIN aggiornato.");
    }

    refreshTitles();
    dlg.close();
  };
  const onCancel = ()=> dlg.close();

  confirm.onclick = onConfirm;
  cancel.onclick  = onCancel;
}

/* ============================
 *  HOME
 * ============================ */
function setupHome(){
  refreshTitles();
  renderChart();

  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);
  document.getElementById("exportBtn")?.addEventListener("click", ()=>{
    // per esportare serve PIN ogni volta
    const p = prompt("Inserisci PIN per esportare");
    if (p !== getPin()) return;

    const payload = {
      area: CONFIG.AREA,
      channel: state.channel,
      at: new Date().toISOString(),
      points: state.points,
      notes: state.notes,
      dates: state.dates
    };
    const fname = `SKF-5S-${CONFIG.AREA}-${state.channel.replace(/\s+/g,'_')}.json`;
    downloadJSON(fname, payload);
  });
}

/* ============================
 *  CHECKLIST (seconda pagina)
 * ============================ */
function setupChecklist(){
  refreshTitles();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  // badge riassuntivi cliccabili
  const summary = document.getElementById("summaryBadges");
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

  // Comprimi/Espandi tutte
  document.getElementById("toggleAll")?.addEventListener("click", ()=>{
    document.querySelectorAll(".s-details").forEach(det=> det.open = !det.open);
  });

  // Rendering schede
  const wrap = document.getElementById("sheets");
  const defs = [
    {k:"s1", name:"1S — Selezionare",    color:COLORS.s1},
    {k:"s2", name:"2S — Sistemare",      color:COLORS.s2},
    {k:"s3", name:"3S — Splendere",      color:COLORS.s3},
    {k:"s4", name:"4S — Standardizzare", color:COLORS.s4},
    {k:"s5", name:"5S — Sostenere",      color:COLORS.s5}
  ];
  const todayStr = ()=> new Date().toISOString().slice(0,10);

  defs.forEach(({k,name,color})=>{
    const val  = state.points[k] ?? 0;
    const late = isLate(k);

    const card = document.createElement("article");
    card.className = "sheet" + (late ? " late":"");
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
            <button class="icon danger del" title="Cancella valori">🗑</button>
          </div>
        </div>
      </details>
    `;
    wrap.appendChild(card);
  });

  // Gestione punteggi
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

  // Data → ritardo
  wrap.addEventListener("change",(e)=>{
    const inp = e.target.closest('input[type="date"][data-date]');
    if(!inp) return;
    const k = inp.dataset.date;
    state.dates[k] = inp.value;
    setJSON(storageKey("state"), state);
    updateStatsAndLate();
  });

  // Elimina (serve PIN ogni volta)
  wrap.addEventListener("click",(e)=>{
    const del = e.target.closest(".del");
    if(!del) return;
    const p = prompt("Inserisci PIN per eliminare");
    if (p !== getPin()) return;
    const k = del.closest(".sheet").id.replace("sheet-","");
    state.points[k]=0; state.notes[k]=""; state.dates[k]=null;
    setJSON(storageKey("state"), state);
    del.closest(".sheet").querySelectorAll(".points button").forEach(b=>b.classList.remove("active"));
    del.closest(".sheet").querySelector(".s-value").textContent="Valore: 0%";
    del.closest(".sheet").querySelector('textarea').value="";
    del.closest(".sheet").querySelector('input[type="date"]').value=new Date().toISOString().slice(0,10);
    updateStatsAndLate();
  });

  // Info → chips interattivi che appendono alle note
  wrap.addEventListener("click",(e)=>{
    const infoBtn = e.target.closest(".info");
    if(!infoBtn) return;
    openInfo(infoBtn.dataset.k);
  });

  document.getElementById("infoCloseBtn")?.addEventListener("click", ()=> {
    document.getElementById("infoDialog").close();
  });

  updateStatsAndLate();
}

/* ============================
 *  Ritardi
 * ============================ */
function isLate(k){
  const d = state.dates[k];
  if(!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const chosen = new Date(d); chosen.setHours(0,0,0,0);
  // è in ritardo se la data immessa è prima di oggi
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

  // Se siamo in home, ridisegniamo il grafico per aggiornare “Ritardi”
  if (document.getElementById("progressChart")) renderChart();
}

/* ============================
 *  INFO dialog con CHIP interattivi
 * ============================ */
function openInfo(k){
  const dlg  = document.getElementById("infoDialog");
  const box  = document.getElementById("infoText");
  const title= document.getElementById("infoTitle");
  if (!dlg || !box) return;

  title.textContent = `${k.toUpperCase()} — Info`;
  box.innerHTML = "";

  const raw = INFO_TEXT[k] || "";
  const chips = document.createElement("div");
  chips.className = "info-chips";

  // Estrai punti nel formato (1) testo ... (2) testo ...
  const re = /\((\d+)\)\s*([^()]+?)(?=(\(\d+\)|$))/g;
  let m, any=false;
  while ((m = re.exec(raw)) !== null){
    any = true;
    const n = m[1];
    const t = m[2].trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "info-chip";
    btn.innerHTML = `<span class="n" style="background:${COLORS[k]||'#0a57d5'}">${n}</span><span>${t}</span>`;
    btn.addEventListener("click", ()=>{
      // appende il testo alla textarea note della rispettiva S
      const ta = document.querySelector(`#sheet-${k} textarea`);
      if (!ta) return;
      const prefix = ta.value.trim() ? "\n• " : "• ";
      ta.value = ta.value.trim() + (ta.value.trim() ? "\n" : "") + `• ${t}`;
      state.notes[k] = ta.value;
      setJSON(storageKey("state"), state);
    });
    chips.appendChild(btn);
  }

  if (any) box.appendChild(chips);
  dlg.querySelector(".modal-box").style.borderTop = `6px solid ${COLORS[k]||'#0a57d5'}`;
  dlg.showModal();
}

/* ============================
 *  GRAFICO (senza griglie) + pulsanti “in ritardo”
 * ============================ */
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
      scales:{
        y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"}, grid:{display:false}}, // senza linee
        x:{ticks:{maxRotation:0}, grid:{display:false}}                              // senza linee
      }
    }
  });

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

/* ============================
 *  ROUTER
 * ============================ */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshTitles();
  const page = document.body.dataset.page;
  if (page==="home")      setupHome();
  if (page==="checklist") setupChecklist();
});
