/** =========================================================
 *  SKF 5S – APP JS (Rettifica/Montaggio compatibile)
 *  - Popup “i” con scroll + chip interattivi che appendono alle Note
 *  - Duplica scheda con “+” previa richiesta PIN (duplica visiva)
 *  - Ritardi calcolati dalla data (oggi escluso → se data < oggi = ritardo)
 *  - PIN per cambio CH dall’icona lucchetto o Export
 *  - Grafico con colonna “Ritardi” e pulsanti “S in ritardo”
 *  - PWA Service Worker (sw.js)
 *  - Tutto configurabile via CONFIG e INFO_TEXT
 *  ========================================================= */

/** ========== CONFIGURAZIONE ==========
 *  Modifica qui per canale, area e PIN
 */
const CONFIG = {
  PIN: "6170",                 // PIN per azioni protette
  CHANNEL_DEFAULT: "CH 24",    // canale di default (es. CH 24)
  AREA: "Montaggio"            // Area mostrata nei titoli (Montaggio/Rettifica)
};

// Colori istituzionali per le 5S
const COLORS = {
  s1: "#7c3aed", // viola
  s2: "#ef4444", // rosso
  s3: "#f59e0b", // giallo
  s4: "#10b981", // verde
  s5: "#2563eb"  // blu
};

/** ========== TESTI INFO ==========
 *  Ogni S ha un testo lungo. I punti (1) (2) ... verranno
 *  trasformati in chip cliccabili nel popup.
 *
 *  Inserisci qui i testi aggiornati (puoi usare \n liberamente).
 */
const INFO_TEXT = {
  s1: "(1) L'area pedonale è esente da congestione/ostacoli (area libera) e da pericoli di inciampo. (2). Nel pavimento non sono stati trovati materiali, strumenti, materiali di consumo non identificati. (3). Nell'area sono presenti solo i materiali di consumo, gli strumenti, le attrezzature, i mobili necessari. Tutti gli elementi non necessari (non richiesti o richiesti con una frequenza molto minore) sono stati rimossi o contrassegnati per la rimozione. (4). Nell'area è presente solo il materiale necessario per il lavoro in corso. Materiali obsoleti o non necessari, l'inventario viene rimosso. (ad es. Buono/ Rilavorazione/ Scarto, nessuna possibilità di confusione,viene conservato solo un materiale in esecuzione). (5) Nell'area sono presenti in buone condizioni solo i documenti, gli espositori, le visualizzazioni, le bacheche, i poster necessari e pertinenti per il lavoro in corso. (6) Sono definiti l'area etichetta rossa, il processo e il team. (7) Il processo del tag rosso funziona bene. (8) Lavagna 5S esiste per mostrare il piano, i miglioramenti fatti (Foto Prima & Dopo), punteggio audit, SPL ed è gestito bene. (9) Esistono prove per garantire che 1S sia sostenibile in quest'area (lista di controllo/piano per lo smistamento periodico/piano per l'audit periodico). (10) Il concetto generale di 5S & 1S in dettaglio è ben compreso dai membri e la responsabilità è definita. (11) Tutti i membri sono coinvolti e partecipano all'attività nella loro area.",
  s2: "(1) Area, team sono definiti e i membri comprendono 5-S complessivi e dettagli di 1-S. (2) Nessuna cosa non necessaria si trova nella zona. (3) Tutti gli articoli/attrezzature relative alla sicurezza sono chiaramente contrassegnati e facilmente accessibili. (4) Tutti gli interruttori di emergenza, le uscite di emergenza sono altamente visibili, facilmente accessibili. (5) Tutte le stazioni di qualità ben definite e organizzate (strumenti di misurazione, master ecc.). (6) Lo scarto senza compromessi (SWC) è rigorosamente seguito (7) Esiste una posizione prefissata per utenze, strumenti, materiali per la pulizia, infissi, materiali di consumo e attrezzature mobili con identificazione e indicatore (quantità minima/massima). (8) Le posizioni sono definite per bidoni, contenitori, bidoni dei rifiuti, oli con identificazione e indicatore chiari. (9) Tutto il  WIP, le parti accettate, le parti rifiutate, le parti in quarantena hanno posizioni designate e una chiara identificazione nell'area. (10) Tutte le materie prime, i materiali di imballaggio dei componenti hanno posizioni designate e una chiara identificazione. (11) Viene creato il layout iniziale che evidenzia i confini, i corridoi, le corsie pedonali, le corsie dei carrelli elevatori, tutte le posizioni per gli articoli necessari, i materiali, l'area riservata che richiede dispositivi di protezione individuale (DPI) (tutti gli articoli diversi da macchine e accessori) (12) Tutti i file, i documenti sono chiaramente identificati e organizzati nel punto di utilizzo. (13) I miglioramenti sono realizzati seguendo i concetti: raccolti con un solo tocco, prova di errore, punto di utilizzo, ergonomia per eliminare la confusione di cose e ridurre l'affaticamento. (14) Esistono prove per garantire che le 2S siano sostenibili in quest'area (lista di controllo/Piano per il controllo periodico) (15).Il concetto di 5S e 2S complessivi in ​​dettaglio è ben compreso dai membri e la responsabilità è definita. (16)Tutti i membri sono coinvolti e partecipano al 5S.",
  s3: "(1) Non si tovano cose inutili in zona. (2) 2-S i migliramenti sono ben mantenuti. (3) Le verifiche automatiche vengono eseguite regolarmente e le deviazioni, i miglioramenti vengono attuati. (4) L'area, la squadra è definita, i membri capiscono bene 5S in generale e i dettagli di 1-S, 2-S. (5) Pavimenti, scale, pareti sono puliti e privi di sporco, detriti, olio, grasso, liquido di raffreddamento, bagliore, trucioli, componenti, parti, hardware, scatole vuote, materiale di imballaggio ecc. (6) Tutti i segnali, le avvertenze, le etichette, ecc. relativi alla sicurezza e alla qualità sono puliti, posizionati correttamente e di facile lettura. (7) Tutti i documeni in buone condizioni e documenti regolarmente usati sono protetti per prevenire sprco e danni. (8) Tutte le luci, i vantilazioni e l'aria condizionata in perfette condizioni e pulite. (9) Tutte le fonti sporche sono identificate, documentate e note a tutti i membri. (10) Esistono piani d'azione per eliminare/contenere la fonte di sporco. (11). Le azioni vengono eseguite secondo il piano. (12) Vengono apportati miglioramenti per migliorare e prevenire la pulizia utilizzando concetti come (meno tappa) e l'eliminazione della fonte di sporco (13) Il sistema di riciclaggio dei rifiuti è attivo e i rifiuti vengono smistati nel cestino giusto. (14) Tutte le demarcazioni sono rese permanenti - Marcatura a pavimento e marcatura di tutte le posizioni. (15) Esistono prove per garantire che le 3S siano sostenibili in quest'area (routine di pulizia stabilite e aggiornate nella checklist delle 5S, Piano per il controllo periodico). (15) Il concetto di 5S e 3S complessivi in ​​dettaglio è ben compreso dai membri e la responsabilità è definita. (16) Tutti i membri sono coinvolti e partecipano a 5S.",
  s4: "(1) Tecniche di allarmi visivi & management visivo sono stati realizzati per determinare facilmente anormalità & capacità (Gestire a prima vista) incluso tecniche di  rifornimento (Min/Max) livelli, materiale da imballaggio, forniture di magazzino e componenti. (2) Colori & segni standard per lubrificazione, tubi, valvole ecc. sono realizzati & mantenuti. Tabelli display sono mappati & processo è stabilito per garantire solo informazione attuale è disponibile. (3) Standard 5S (consolidando tutte le condizioni 5S raggiunte) è sviluppato e regolarmente aggiornato. Questo viene usato come materiale training per dipendenti nuovi & libro di guida per miglioramento continuo. (4) Schede di controllo, istruzioni 5S sono integrati con managemet quotidiano & attività quotidiane.",
  s5: "(1) Ognuno (incluso dipendente nuovo) viene formato sugli standard 5S ed è coinvolto. (2) Le attività 5S sono un abitudine, tutti membri &  tutti gli standard  sono seguiti da tutti con coinvolgimento totale. (3) Vengono eseguiti layered audit mediante un programma ben definiti e strutturato. (4) Esistono foto prima/dopo di postazioni che hanno subito dei miglioramenti e devono essere mantenute come a riferimento di foto. (5) Attestati e obiettivi delle 5s sono messi in evidenza"
};

/** ========== STORAGE helper ========== */
const storageKey = (k) => `skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/** ========== PWA Service Worker ========== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

/** ========== STATO ========== */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  points: { s1:0, s2:0, s3:0, s4:0, s5:0 },
  notes:  { s1:"", s2:"", s3:"", s4:"", s5:"" },
  dates:  { s1:null, s2:null, s3:null, s4:null, s5:null }
});

/** ========== PIN dialog (lucchetto / export) ========== */
function openPinDialog(){
  const dlg = document.getElementById("pinDialog");
  if (!dlg) return;

  // reset campi
  const pinInput = document.getElementById("pinInput");
  const chInput  = document.getElementById("channelInput");
  pinInput.value = "";
  chInput.value  = state.channel ?? CONFIG.CHANNEL_DEFAULT;

  // hook bottoni
  const confirm = document.getElementById("pinConfirmBtn");
  const cancel  = document.getElementById("pinCancel");

  const onConfirm = () => {
    const ok = pinInput.value === CONFIG.PIN;
    if (!ok) { alert("PIN errato"); return; }
    state.channel = chInput.value.trim() || CONFIG.CHANNEL_DEFAULT;
    setJSON(storageKey("state"), state);
    refreshTitles();
    dlg.close();
  };

  const onCancel  = () => dlg.close();

  confirm.onclick = onConfirm;
  cancel.onclick  = onCancel;

  dlg.showModal();
}

/** ========== Utility titoli dinamici ========== */
function refreshTitles(){
  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = `${state.channel} — ${CONFIG.AREA}`;
}

/** ========== HOME (prima pagina) ========== */
function setupHome(){
  refreshTitles();
  renderChart();

  // lucchetto per cambiare CH (e per export protetto)
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);
  document.getElementById("exportBtn")?.addEventListener("click", openPinDialog);
}

/** ========== CHECKLIST (seconda pagina) ========== */
function setupChecklist(){
  refreshTitles();

  // lucchetto per cambio CH
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  // badge riassuntivi cliccabili → scroll alla S
  const summary = document.getElementById("summaryBadges");
  if (summary) {
    summary.innerHTML = "";
    ["s1","s2","s3","s4","s5"].forEach(k=>{
      const v = state.points[k] ?? 0;
      const el = document.createElement("button");
      el.className = `s-badge ${k}`;
      el.textContent = `${k.toUpperCase()} ${v*20}%`;
      el.addEventListener("click", ()=> {
        document.getElementById(`sheet-${k}`)?.scrollIntoView({behavior:"smooth", block:"start"});
      });
      summary.appendChild(el);
    });
  }

  // comprimi / espandi tutte
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
    card.className = "sheet" + (late ? " late" : "");
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
          <div class="row">
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

  // punteggi (delegato)
  wrap.addEventListener("click",(e)=>{
    const btn = e.target.closest(".points button");
    if(!btn) return;
    const k = btn.dataset.k;
    const p = Number(btn.dataset.p);
    state.points[k] = p;
    setJSON(storageKey("state"), state);
    document.querySelectorAll(`.points button[data-k="${k}"]`)
      .forEach(b=>b.classList.toggle("active", Number(b.dataset.p)===p));
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

  // elimina con PIN
  wrap.addEventListener("click",(e)=>{
    const del = e.target.closest(".del");
    if(!del) return;
    if (prompt("Inserisci PIN per eliminare") !== CONFIG.PIN) return;
    const k = del.closest(".sheet").id.replace("sheet-","");
    state.points[k]=0; state.notes[k]=""; state.dates[k]=null;
    setJSON(storageKey("state"), state);
    del.closest(".sheet").querySelectorAll(".points button").forEach(b=>b.classList.remove("active"));
    del.closest(".sheet").querySelector(".s-value").textContent="Valore: 0%";
    del.closest(".sheet").querySelector('textarea').value="";
    del.closest(".sheet").querySelector('input[type="date"]').value=new Date().toISOString().slice(0,10);
    updateStatsAndLate();
  });

  // info “i”
  wrap.addEventListener("click",(e)=>{
    const infoBtn = e.target.closest(".info");
    if(!infoBtn) return;
    openInfo(infoBtn.dataset.k);
  });

  // chiudi popup info
  document.getElementById("infoCloseBtn")?.addEventListener("click", ()=> {
    const d = document.getElementById("infoDialog");
    if (d?.open) d.close();
  });

  // clic fuori dal box → chiudi
  document.getElementById("infoDialog")?.addEventListener("click", (e) => {
    const dlg = e.currentTarget;
    const box = dlg.querySelector(".modal-box");
    if (!box.contains(e.target)) dlg.close();
  });

  // "+" → PIN e duplicazione visiva
  wrap.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add");
    if (!addBtn) return;

    if (prompt("Inserisci PIN per aggiungere") !== CONFIG.PIN) return;

    const card = addBtn.closest(".sheet");
    if (!card) return;

    const clone = card.cloneNode(true);
    const title = clone.querySelector(".s-title");
    if (title) title.textContent = title.textContent + " (copia)";
    clone.id = card.id + "-copy-" + Math.floor(Math.random()*10000);
    card.after(clone);
  });

  updateStatsAndLate();
}

/** ========== RITARDI & STATISTICHE ========== */
function isLate(k){
  const d = state.dates[k];
  if(!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const chosen = new Date(d); chosen.setHours(0,0,0,0);
  return chosen < today;
}

function updateStatsAndLate(){
  // media % sul totale S con voto assegnato (0,1,3,5 → convertito *20)
  const arr = Object.values(state.points);
  const avg = arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*20) : 0;
  document.getElementById("avgScore")?.replaceChildren(document.createTextNode(`${avg}%`));

  // conteggio ritardi
  const lateList = Object.keys(state.dates).filter(k=> isLate(k));
  document.getElementById("lateCount")?.replaceChildren(document.createTextNode(String(lateList.length)));

  // evidenzia schede in ritardo
  ["s1","s2","s3","s4","s5"].forEach(k=>{
    document.getElementById(`sheet-${k}`)?.classList.toggle("late", isLate(k));
  });
}

/** ========== INFO POPUP ========== */
// Converte il testo lungo in array di punti dai (1) (2) ...
function parseNumbered(text) {
  return text.split(/\(\d+\)\s*/).map(s => s.trim()).filter(Boolean);
}

let currentInfoKey = null; // s1..s5 del popup aperto

function openInfo(k){
  currentInfoKey = k;

  const dlg   = document.getElementById("infoDialog");
  const box   = dlg.querySelector(".modal-box");
  const title = document.getElementById("infoTitle");
  const body  = document.getElementById("infoText");   // contenitore scorrevole

  title.textContent = `${k.toUpperCase()} — Info`;
  box.style.borderTop = `6px solid ${COLORS[k] || '#0a57d5'}`;

  const items = parseNumbered(INFO_TEXT[k] ?? "");
  const chips = document.createElement("div");
  chips.className = "info-chips";

  const list = document.createElement("ol");
  list.style.margin = "0 0 10px 22px";
  list.style.padding = "0";

  items.forEach((t, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "info-chip";
    b.dataset.text = t;
    b.innerHTML = `<span class="n" style="background:${COLORS[k]}">${idx+1}</span><span>${t}</span>`;
    chips.appendChild(b);

    const li = document.createElement("li");
    li.textContent = t;
    list.appendChild(li);
  });

  body.innerHTML = "";
  body.appendChild(chips);
  body.appendChild(list);

  // delega click: appende alle Note della S corrente e salva
  const onChipClick = (e) => {
    const chip = e.target.closest(".info-chip");
    if (!chip) return;
    const txt = chip.dataset.text || "";
    const ta = document.querySelector(`#sheet-${currentInfoKey} textarea`);
    if (!ta) return;
    const prefix = ta.value && !ta.value.endsWith("\n") ? "\n" : "";
    ta.value = `${ta.value}${prefix}- ${txt}`;
    state.notes[currentInfoKey] = ta.value;
    setJSON(storageKey("state"), state);
  };
  chips.addEventListener("click", onChipClick, { once: true }); // una volta per apertura

  dlg.showModal();
}

/** ========== GRAFICO (HOME) + Pulsanti "S in ritardo" ========== */
let chart;
function renderChart(){
  const ctx = document.getElementById("progressChart");
  if(!ctx || typeof Chart === "undefined") return;

  const vals = ["s1","s2","s3","s4","s5"].map(k=> (state.points[k]??0)*20 );
  const delayedN = Object.keys(state.dates).filter(k=> isLate(k)).length;

  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type:"bar",
    data:{
      labels:["1S","2S","3S","4S","5S","Ritardi"],
      datasets:[{
        data:[...vals, delayedN],
        backgroundColor:[COLORS.s1,COLORS.s2,COLORS.s3,COLORS.s4,COLORS.s5,"#ef4444"]
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{ display:false },
        tooltip:{ enabled:true },
        datalabels: undefined
      },
      scales:{
        y:{ beginAtZero:true, max:100, ticks:{ callback:v=>v+"%" } },
        x:{ ticks:{ maxRotation:0 } }
      }
    }
  });

  // Pulsanti “S in ritardo”
  const late = [];
  ["s1","s2","s3","s4","s5"].forEach((k,i)=>{ if(isLate(k)) late.push({k, label:`${i+1}S in ritardo`}); });
  const box = document.getElementById("lateBtns");
  if (box) {
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

/** ========== ROUTER ========== */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshTitles();

  const page = document.body.dataset.page;
  if (page === "home")      setupHome();
  if (page === "checklist") setupChecklist();
});
