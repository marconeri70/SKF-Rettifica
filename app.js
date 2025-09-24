/** =========================
 *  CONFIG (personalizza qui)
 *  =========================
 *  Per creare "Rettifica" o "Montaggio", cambia AREA e CHANNEL_DEFAULT.
 *  PIN iniziale modificabile anche offline dal dialog (serve il PIN attuale).
 */
const CONFIG = {
  PIN: "6170",
  CHANNEL_DEFAULT: "CH 24",
  AREA: "Rettifica"      // <- metti "Montaggio" nella versione Montaggio
};

const COLORS = {
  s1: "#7c3aed", s2: "#ef4444", s3: "#f59e0b", s4: "#10b981", s5: "#2563eb",
};

/** Testi INFO: ogni chiave s1..s5 è un array di punti cliccabili */
const INFO_POINTS = {
  s1: [
    "L'area pedonale è libera da ostacoli e pericoli di inciampo.",
    "Nel pavimento non ci sono materiali o attrezzi non identificati.",
    "Sono presenti solo materiali/strumenti necessari; il resto è rimosso.",
    "Presente solo il materiale necessario per il lavoro in corso.",
    "Documenti/visualizzazioni necessari e aggiornati.",
    "Definiti team e processo per etichetta rossa.",
    "Processo etichetta rossa funzionante.",
    "Lavagna 5S aggiornata (piano, foto prima/dopo, audit).",
    "Evidenze per garantire la sostenibilità di 1S.",
    "5S & 1S compresi dal team e responsabilità definite.",
    "Coinvolgimento di tutti i membri nelle attività dell’area."
  ],
  s2: [
    "Area/team definiti; comprensione 5S e dettaglio 1S.",
    "Nessun oggetto non necessario nella zona.",
    "Sicurezza: articoli/attrezzature ben segnalati e accessibili.",
    "Uscite e interruttori d’emergenza visibili e accessibili.",
    "Stazioni qualità definite e ordinate (strumenti, master...).",
    "Scarto senza compromessi (SWC) seguito.",
    "Posizioni prefissate per utenze, strumenti, pulizia ecc.",
    "Posizioni per bidoni/rifiuti/oli con identificazione chiara.",
    "WIP/accettate/rifiutate/quarantena con posizioni e segnaletica.",
    "Materie prime/componenti con posizioni e identificazione.",
    "Layout iniziale con confini, corsie e zone DPI.",
    "Documenti archiviati al punto di utilizzo e ordinati.",
    "Miglioramenti: one-touch, Poka-Yoke, ergonomia.",
    "Piano per sostenibilità 2S (check periodico).",
    "2S compresa dal team, ruoli chiari; tutti partecipano."
  ],
  s3: [
    "Assenza di cose inutili in zona.",
    "Miglioramenti 2S mantenuti.",
    "Verifiche periodiche e attuazione deviazioni.",
    "Team comprende bene 1S/2S.",
    "Pavimenti/pareti puliti; assenza oli/trucioli/imballi.",
    "Cartelli di sicurezza/qualità puliti e leggibili.",
    "Documenti in buone condizioni e protetti.",
    "Luci/ventilazione condizionamento in ordine.",
    "Fonti di sporco identificate e note al team.",
    "Piani d’azione per eliminare/limitare la fonte.",
    "Esecuzione coerente delle azioni pianificate.",
    "Miglioramenti per prevenire la pulizia (elimina cause).",
    "Riciclo attivo con corretta differenziazione.",
    "Demarcazioni rese permanenti.",
    "Routine di pulizia e check 5S aggiornati e sostenibili.",
    "5S & 3S compresi; partecipazione attiva del team."
  ],
  s4: [
    "Visual management & allarmi visivi per anomalie a colpo d’occhio.",
    "Colori/segni standard per lubrificazione, tubi, valvole ecc.",
    "Standard 5S consolidati e aggiornati (training & guida).",
    "Istruzioni/controlli 5S integrati nel management quotidiano."
  ],
  s5: [
    "Formazione 5S a tutti, inclusi i nuovi, con coinvolgimento.",
    "5S come abitudine consolidata e standard rispettati.",
    "Layered audit con programma definito e strutturato.",
    "Foto prima/dopo come riferimento mantenute visibili.",
    "Obiettivi e attestati 5S ben esposti."
  ]
};

/* ============================
 * Storage helpers
 * ============================ */
const storageKey = (k)=>`skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))??d; }catch{ return d; } };
const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

const getPin = ()=> localStorage.getItem(storageKey("pin")) || CONFIG.PIN;
const setPin = (p)=> localStorage.setItem(storageKey("pin"), String(p||""));

/* ============================
 * PWA Service Worker
 * ============================ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", ()=> navigator.serviceWorker.register("sw.js"));
}

/* ============================
 * Stato
 * ============================ */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  points: { s1:0, s2:0, s3:0, s4:0, s5:0 },
  notes:  { s1:"", s2:"", s3:"", s4:"", s5:"" },
  dates:  { s1:null, s2:null, s3:null, s4:null, s5:null }
});

/* ============================
 * Util
 * ============================ */
function todayStr(){ return new Date().toISOString().slice(0,10); }

/* Download robusto JSON (anche Safari/iOS) */
function downloadJSON(filename, obj) {
  const json = JSON.stringify(obj, null, 2);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  try {
    const blob = new Blob([json], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.rel="noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
  } catch(e){
    const data = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    if (isSafari) window.open(data,"_blank");
    else {
      const a=document.createElement("a");
      a.href=data; a.download=filename;
      document.body.appendChild(a); a.click(); a.remove();
    }
  }
}

/* ============================
 * PIN dialog
 * ============================ */
function refreshTitles(){
  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = `${state.channel} — ${CONFIG.AREA}`;

  const pageTitleH1 = document.getElementById("pageTitleH1");
  if (pageTitleH1) pageTitleH1.textContent = `${state.channel} — ${CONFIG.AREA}`;
}

function openPinDialog(){
  const dlg = document.getElementById("pinDialog");
  if (!dlg) return;
  dlg.showModal();

  const pinInput = document.getElementById("pinInput");
  const chInput  = document.getElementById("channelInput");
  const newPin1  = document.getElementById("newPin1");
  const newPin2  = document.getElementById("newPin2");
  pinInput.value = "";
  chInput.value  = state.channel ?? CONFIG.CHANNEL_DEFAULT;
  if (newPin1) newPin1.value="";
  if (newPin2) newPin2.value="";

  const confirm = document.getElementById("pinConfirmBtn");
  const cancel  = document.getElementById("pinCancel");

  const onConfirm = ()=>{
    const ok = pinInput.value === getPin();
    if (!ok) { alert("PIN errato"); return; }
    state.channel = chInput.value.trim() || CONFIG.CHANNEL_DEFAULT;
    // cambio PIN (opzionale)
    if (newPin1 && newPin2 && (newPin1.value || newPin2.value)){
      if (newPin1.value.length < 3){ alert("Il nuovo PIN deve avere almeno 3 cifre."); return; }
      if (newPin1.value !== newPin2.value){ alert("I due PIN non coincidono."); return; }
      setPin(newPin1.value);
      alert("PIN aggiornato.");
    }
    setJSON(storageKey("state"), state);
    refreshTitles();
    dlg.close();
  };
  const onCancel = ()=> dlg.close();

  confirm.onclick = onConfirm;
  cancel.onclick  = onCancel;
}

/* ============================
 * Home
 * ============================ */
function setupHome(){
  refreshTitles();
  renderChart();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  // Export con PIN
  document.getElementById("exportBtn")?.addEventListener("click", ()=>{
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
 * Checklist
 * ============================ */
function setupChecklist(){
  refreshTitles();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  const summary = document.getElementById("summaryBadges");
  ["s1","s2","s3","s4","s5"].forEach(k=>{
    const v = state.points[k] ?? 0;
    const b = document.createElement("button");
    b.className = `s-badge ${k}`;
    b.textContent = `${k.toUpperCase()} ${v*20}%`;
    b.addEventListener("click", ()=> document.getElementById(`sheet-${k}`)?.scrollIntoView({behavior:"smooth"}));
    summary.appendChild(b);
  });

  document.getElementById("toggleAll").addEventListener("click", ()=>{
    const list = document.querySelectorAll(".s-details");
    const openCount = Array.from(list).filter(d=>d.open).length;
    list.forEach(d=> d.open = openCount===0);
  });

  const wrap = document.getElementById("sheets");
  const defs = [
    {k:"s1", name:"1S — Selezionare",   color:COLORS.s1},
    {k:"s2", name:"2S — Sistemare",     color:COLORS.s2},
    {k:"s3", name:"3S — Splendere",     color:COLORS.s3},
    {k:"s4", name:"4S — Standardizzare",color:COLORS.s4},
    {k:"s5", name:"5S — Sostenere",     color:COLORS.s5},
  ];

  wrap.innerHTML = "";
  defs.forEach(({k,name,color})=>{
    const val = state.points[k] ?? 0;
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
          <input class="who" placeholder="Inserisci il nome..." value="">
        </label>

        <label class="field">
          <span>Note</span>
          <textarea class="note" rows="3" placeholder="Note...">${state.notes[k]??""}</textarea>
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
            <button class="icon danger del" title="Elimina (PIN)">🗑</button>
          </div>
        </div>
      </details>
    `;
    wrap.appendChild(card);
  });

  // Punteggi
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

  // Note persistenti
  wrap.addEventListener("input",(e)=>{
    const ta = e.target.closest(".note");
    if(!ta) return;
    const k = ta.closest(".sheet").id.replace("sheet-","");
    state.notes[k] = ta.value; setJSON(storageKey("state"), state);
  });

  // Date → ritardo
  wrap.addEventListener("change",(e)=>{
    const inp = e.target.closest('input[type="date"][data-date]');
    if(!inp) return;
    const k = inp.dataset.date;
    state.dates[k] = inp.value;
    setJSON(storageKey("state"), state);
    updateStatsAndLate();
  });

  // Elimina con PIN
  wrap.addEventListener("click",(e)=>{
    const del = e.target.closest(".del");
    if(!del) return;
    if (prompt("Inserisci PIN per eliminare") !== getPin()) return;
    const k = del.closest(".sheet").id.replace("sheet-","");
    state.points[k]=0; state.notes[k]=""; state.dates[k]=todayStr();
    setJSON(storageKey("state"), state);
    del.closest(".sheet").querySelectorAll(".points button").forEach(b=>b.classList.remove("active"));
    del.closest(".sheet").querySelector(".s-value").textContent="Valore: 0%";
    del.closest(".sheet").querySelector('.note').value="";
    del.closest(".sheet").querySelector('input[type="date"]').value=todayStr();
    updateStatsAndLate();
  });

  // Info modal
  wrap.addEventListener("click",(e)=>{
    const infoBtn = e.target.closest(".info");
    if(!infoBtn) return;
    openInfo(infoBtn.dataset.k);
  });

  // Chiudi info
  document.getElementById("infoCloseBtn").addEventListener("click", ()=> {
    document.getElementById("infoDialog").close();
  });

  updateStatsAndLate();
}

/* ============================
 * Ritardo
 * ============================ */
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
  const lateList = Object.keys(state.dates).filter(k=> isLate(k));
  document.getElementById("avgScore")?.replaceChildren(document.createTextNode(`${avg}%`));
  document.getElementById("lateCount")?.replaceChildren(document.createTextNode(String(lateList.length)));
  ["s1","s2","s3","s4","s5"].forEach(k=>{
    document.getElementById(`sheet-${k}`)?.classList.toggle("late", isLate(k));
  });
  renderChart(); // aggiorna home se aperta in stessa sessione
}

/* ============================
 * Info modal con punti cliccabili
 * ============================ */
function openInfo(k){
  const points = INFO_POINTS[k] || [];
  const dlg = document.getElementById("infoDialog");
  const title = document.getElementById("infoTitle");
  const content = document.getElementById("infoContent");

  title.textContent = `${k.toUpperCase()} — Info`;
  content.innerHTML = `
    <ol class="points-list">
      ${points.map((t,i)=>`
        <li>
          <button type="button" class="pointline" data-k="${k}" data-text="${encodeURIComponent(t)}">
            ${i+1}. ${t}
          </button>
        </li>`).join("")}
    </ol>
    <p class="muted">Tocca un punto per inserirlo nelle <b>Note</b> della scheda.</p>
  `;
  // click su un punto → aggiungi alle note della S corrente
  content.addEventListener("click", onPointClick, { once:true });
  dlg.querySelector(".modal-box").style.borderTop = `6px solid ${COLORS[k]||'#0a57d5'}`;
  dlg.showModal();
}

function onPointClick(e){
  const btn = e.target.closest(".pointline");
  if(!btn) return;
  const k = btn.dataset.k;
  const text = decodeURIComponent(btn.dataset.text);
  const note = document.querySelector(`#sheet-${k} .note`);
  if (note){
    note.value = (note.value ? note.value + "\n" : "") + "- " + text;
    note.dispatchEvent(new Event("input", {bubbles:true}));
  }
}

/* ============================
 * Chart
 * ============================ */
let chart;
function renderChart(){
  const ctx = document.getElementById("progressChart");
  if(!ctx) return;
  const vals = ["s1","s2","s3","s4","s5"].map(k=> (state.points[k]??0)*20 );
  const delayed = Object.keys(state.dates).filter(k=> isLate(k)).length;

  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type:"bar",
    data:{
      labels:["1S","2S","3S","4S","5S","Ritardi"],
      datasets:[{
        data:[...vals, delayed ? Math.min(delayed*20,100) : 0],
        backgroundColor:["#7c3aed","#ef4444","#f59e0b","#10b981","#2563eb","#ef4444"]
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{enabled:true},
        datalabels:false
      },
      scales:{
        y:{beginAtZero:true,max:100, grid:{display:false}, ticks:{callback:v=>v+"%"}},
        x:{grid:{display:false}, ticks:{maxRotation:0}}
      }
    }
  });

  // Pulsanti “in ritardo”
  const late = [];
  ["s1","s2","s3","s4","s5"].forEach((k,i)=>{ if(isLate(k)) late.push({k, label:`${i+1}S in ritardo`}); });
  const box = document.getElementById("lateBtns");
  if (box){
    box.innerHTML = "";
    late.forEach(({k,label})=>{
      const b = document.createElement("button");
      b.className = `late-btn ${k}`;
      b.textContent = label;
      b.addEventListener("click", ()=> { window.location.href = `checklist.html#sheet-${k}`; });
      box.appendChild(b);
    });
  }
}

/* ============================
 * Router
 * ============================ */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshTitles();
  if (document.body.dataset.page==="home") setupHome();
  if (document.body.dataset.page==="checklist") setupChecklist();
});
