/** =========================
 *  CONFIGURAZIONE GENERALE
 *  ========================= */
const CONFIG = {
  AREA: "Rettifica",            // ← per Montaggio imposta "Montaggio"
  CHANNEL_DEFAULT: "CH 24",
  DEFAULT_PIN: "6170",          // PIN di fabbrica, poi sovrascrivibile offline
};

const COLORS = {
  s1: "#7c3aed", // viola
  s2: "#ef4444", // rosso
  s3: "#f59e0b", // giallo
  s4: "#10b981", // verde
  s5: "#2563eb", // blu
};

/** Punti interattivi (solo come NOTE, non aggiornano il punteggio della scheda) */
const INFO_POINTS = {
  s1: [
    "L'area pedonale è libera da ostacoli e pericoli di inciampo.",
    "Nessun materiale/attrezzo non identificato sul pavimento.",
    "Solo materiali/strumenti necessari; il resto è rimosso.",
    "Solo materiale necessario per il lavoro in corso.",
    "Documenti/visualizzazioni necessari, aggiornati, in buono stato.",
    "Definiti team e processo etichetta rossa; processo attivo.",
    "Lavagna 5S aggiornata (piano, foto prima/dopo, audit).",
    "Evidenze che garantiscono la sostenibilità di 1S.",
    "5S/1S compresi dal team; responsabilità definite.",
    "Tutti i membri partecipano alle attività dell'area."
  ],
  s2: [
    "Niente di non necessario presente nella zona.",
    "Articoli/attrezzature di sicurezza marcati e accessibili.",
    "Interruttori/uscite d'emergenza visibili e liberi.",
    "Stazioni qualità definite e organizzate.",
    "SWC (scarto senza compromessi) seguito.",
    "Posizioni prefissate per utenze/strumenti/pulizia con indicatori.",
    "Posizioni definite per contenitori/rifiuti/oli con identificazione.",
    "WIP/accettati/rifiutati/quarantena ben identificati.",
    "MP/componenti con posizioni designate e identificazione.",
    "Layout con demarcazioni, corsie e aree DPI definito.",
    "File/documenti identificati e organizzati al punto d'uso.",
    "Miglioramenti: one-touch, poka-yoke, ergonomia, PoU.",
    "Piano/controllo periodico a garanzia della 2S.",
    "2S e 5S ben compresi; responsabilità definite.",
    "Partecipazione del team alle attività 5S."
  ],
  s3: [
    "Mantenute le condizioni create da 2S.",
    "Pulizie regolari; applicate correzioni/miglioramenti.",
    "Pavimenti/pareti/scale puliti: assenza di oli/chip/scarti.",
    "Segnaletica di qualità e sicurezza pulita e leggibile.",
    "Documenti protetti da sporco/usura.",
    "Illuminazione e ventilazione in ordine e pulite.",
    "Fonti di sporco identificate e note.",
    "Piani d'azione per eliminare/mitigare la fonte di sporco.",
    "Miglioramenti per prevenire la ricomparsa dello sporco.",
    "Riciclo rifiuti attivo; corretta differenziazione.",
    "Demarcazioni rese permanenti.",
    "Routine 3S in checklist; controllo periodico in atto.",
    "3S e 5S compresi; responsabilità definite.",
    "Partecipazione del team 3S/5S."
  ],
  s4: [
    "Visual management per cogliere anomalia/capacità a colpo d'occhio.",
    "Colori/segni standard per lubrificazioni, tubi, valvole.",
    "Standard 5S consolidati e aggiornati; usati per training.",
    "Schede/istruzioni 5S integrate nella gestione quotidiana."
  ],
  s5: [
    "Tutti (anche i nuovi) formati sugli standard 5S e coinvolti.",
    "5S è abitudine: standard seguiti da tutti con continuità.",
    "Layered audit eseguiti con programma strutturato.",
    "Foto prima/dopo presenti e mantenute come riferimento.",
    "Obiettivi e risultati 5S esposti e monitorati."
  ],
};

/** ==============
 *  STORAGE UTILS
 *  ============== */
const storageKey = (k) => `skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/** PIN persistente (cambiabile offline) */
function loadPin() {
  return localStorage.getItem(storageKey("PIN")) ?? CONFIG.DEFAULT_PIN;
}
function savePin(newPin) {
  localStorage.setItem(storageKey("PIN"), newPin);
}

/** =========
 *  PWA SW
 *  ========= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

/** =======
 *  STATO
 *  ======= */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  // punteggi 0/1/3/5 → visualizzati come 0/20/60/100%
  points: { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0 },
  notes:  { s1: "", s2: "", s3: "", s4: "", s5: "" },
  dates:  { s1: null, s2: null, s3: null, s4: null, s5: null }
});

/** ==============
 *  TITOLI / UI
 *  ============== */
function refreshTitles() {
  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = `${state.channel} — ${CONFIG.AREA}`;
}

/** ===========
 *  DIALOG PIN
 *  =========== */
function openPinDialog() {
  const dlg = document.getElementById("pinDialog");
  if (!dlg) return;

  const pinInput = document.getElementById("pinInput");
  const chInput  = document.getElementById("channelInput");
  const new1     = document.getElementById("newPin1");
  const new2     = document.getElementById("newPin2");
  document.getElementById("pinCancel").onclick = () => dlg.close();

  pinInput.value = "";
  chInput.value = state.channel ?? CONFIG.CHANNEL_DEFAULT;
  new1.value = ""; new2.value = "";

  document.getElementById("pinConfirmBtn").onclick = () => {
    const current = loadPin();
    if (pinInput.value !== current) { alert("PIN errato"); return; }

    // aggiorna CH
    state.channel = chInput.value.trim() || CONFIG.CHANNEL_DEFAULT;
    setJSON(storageKey("state"), state);
    refreshTitles();

    // cambio PIN opzionale
    if (new1.value || new2.value) {
      if (new1.value !== new2.value) { alert("I PIN nuovi non coincidono"); return; }
      if (!/^\d{4,8}$/.test(new1.value)) { alert("PIN: 4-8 cifre"); return; }
      savePin(new1.value);
      alert("PIN aggiornato.");
    }
    dlg.close();
  };

  dlg.showModal();
}

/** ==========
 *  HOME PAGE
 *  ========== */
let chart;
function renderChart() {
  const canvas = document.getElementById("progressChart");
  if (!canvas) return;

  const vals = ["s1","s2","s3","s4","s5"].map(k => (state.points[k] ?? 0) * 20);
  const delayed = Object.keys(state.dates).filter(k => isLate(k)).length;

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1S","2S","3S","4S","5S","Ritardi"],
      datasets: [{
        data: [...vals, delayed],
        backgroundColor: [COLORS.s1, COLORS.s2, COLORS.s3, COLORS.s4, COLORS.s5, "#ef4444"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          beginAtZero: true, max: 100,
          grid: { display: false },
          ticks: { callback: v => v + "%" }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });

  // pulsanti S in ritardo
  const late = [];
  ["s1","s2","s3","s4","s5"].forEach((k, i) => { if (isLate(k)) late.push({k, label: `${i+1}S in ritardo`}); });
  const box = document.getElementById("lateBtns");
  if (box) {
    box.innerHTML = "";
    late.forEach(({k, label}) => {
      const b = document.createElement("button");
      b.className = `late-btn ${k}`;
      b.textContent = label;
      b.style.borderColor = COLORS[k];
      b.onclick = () => { window.location.href = `checklist.html#sheet-${k}`; };
      box.appendChild(b);
    });
  }
}

function exportForSupervisor() {
  const pinOk = prompt("Inserisci PIN per esportare") === loadPin();
  if (!pinOk) return;

  const payload = {
    area: CONFIG.AREA,
    channel: state.channel,
    updatedAt: new Date().toISOString(),
    points: state.points,
    notes: state.notes,
    dates: state.dates,
    avg: averageScore(),
    late: Object.keys(state.dates).filter(k => isLate(k))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${CONFIG.AREA}-${state.channel.replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function setupHome() {
  refreshTitles();
  renderChart();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);
  document.getElementById("exportBtn")?.addEventListener("click", exportForSupervisor);
}

/** =============
 *  CHECKLIST PAGE
 *  ============= */
function todayStr() { return new Date().toISOString().slice(0,10); }
function isLate(k) {
  const d = state.dates[k];
  if (!d) return false;
  const t = new Date(); t.setHours(0,0,0,0);
  const c = new Date(d); c.setHours(0,0,0,0);
  return c < t;
}
function averageScore() {
  const arr = Object.values(state.points);
  return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*20) : 0;
}

function updateStatsAndLate() {
  const avg = averageScore();
  const lateCount = Object.keys(state.dates).filter(k => isLate(k)).length;
  const avgEl = document.getElementById("avgScore");
  const lateEl = document.getElementById("lateCount");
  if (avgEl)  avgEl.textContent  = `${avg}%`;
  if (lateEl) lateEl.textContent = String(lateCount);

  ["s1","s2","s3","s4","s5"].forEach(k => {
    document.getElementById(`sheet-${k}`)?.classList.toggle("late", isLate(k));
  });

  // aggiorna grafico in home se aperto in altra tab/frame
  try { renderChart(); } catch {}
}

function setupChecklist() {
  refreshTitles();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

  // Badge riassuntivi cliccabili
  const summary = document.getElementById("summaryBadges");
  if (summary) {
    summary.innerHTML = "";
    ["s1","s2","s3","s4","s5"].forEach((k,i)=>{
      const v = state.points[k] ?? 0;
      const btn = document.createElement("button");
      btn.className = `s-badge ${k}`;
      btn.textContent = `${i+1}S ${v*20}%`;
      btn.onclick = () => document.getElementById(`sheet-${k}`)?.scrollIntoView({behavior:"smooth", block:"start"});
      summary.appendChild(btn);
    });
  }

  document.getElementById("toggleAll")?.addEventListener("click", ()=>{
    document.querySelectorAll(".s-details").forEach(d => d.open = !d.open);
  });

  // Crea le 5 schede
  const wrap = document.getElementById("sheets");
  if (wrap) {
    wrap.innerHTML = "";
    const defs = [
      {k:"s1", name:"1S — Selezionare",    color:COLORS.s1},
      {k:"s2", name:"2S — Sistemare",      color:COLORS.s2},
      {k:"s3", name:"3S — Splendere",      color:COLORS.s3},
      {k:"s4", name:"4S — Standardizzare", color:COLORS.s4},
      {k:"s5", name:"5S — Sostenere",      color:COLORS.s5},
    ];

    defs.forEach(({k,name,color})=>{
      const val = state.points[k] ?? 0;
      const card = document.createElement("article");
      card.className = "sheet" + (isLate(k) ? " late" : "");
      card.id = `sheet-${k}`;
      card.innerHTML = `
        <div class="sheet-head">
          <span class="s-color" style="background:${color}"></span>
          <h3 class="s-title" style="color:${color}">${name}</h3>
          <span class="s-value">Valore: ${val*20}%</span>
          <button class="icon info" data-k="${k}" aria-label="Info">i</button>
          <button class="icon add"  data-k="${k}" aria-label="Duplica">+</button>
        </div>
        <details class="s-details" open>
          <summary>▼ Dettagli</summary>
          <label class="field">
            <span>Responsabile / Operatore</span>
            <input id="resp-${k}" placeholder="Inserisci il nome..." />
          </label>
          <label class="field">
            <span>Note</span>
            <textarea id="note-${k}" rows="3" placeholder="Note...">${state.notes[k]??""}</textarea>
          </label>
          <div class="field">
            <span>Data</span>
            <div class="row">
              <input type="date" value="${state.dates[k] ?? todayStr()}" data-date="${k}">
              <div class="points">
                ${[0,1,3,5].map(p=>`<button data-k="${k}" data-p="${p}" class="${val===p?'active':''}">${p}</button>`).join("")}
              </div>
              <button class="icon danger del" title="Pulisci scheda">🗑</button>
            </div>
          </div>
        </details>
      `;
      wrap.appendChild(card);
    });

    // Eventi dinamici
    wrap.addEventListener("click", (e)=>{
      // punteggio scheda
      const pb = e.target.closest(".points button");
      if (pb) {
        const k = pb.dataset.k;
        const p = Number(pb.dataset.p);
        state.points[k] = p;
        setJSON(storageKey("state"), state);
        // attiva selezione
        document.querySelectorAll(`.points button[data-k="${k}"]`).forEach(b => b.classList.toggle("active", Number(b.dataset.p)===p));
        document.querySelector(`#sheet-${k} .s-value`).textContent = `Valore: ${p*20}%`;
        updateStatsAndLate();
        return;
      }
      // info popup
      const info = e.target.closest(".info");
      if (info) { openInfo(info.dataset.k); return; }
      // elimina (con PIN)
      const del = e.target.closest(".del");
      if (del) {
        if (prompt("Inserisci PIN per pulire la scheda") !== loadPin()) return;
        const k = del.closest(".sheet").id.replace("sheet-","");
        state.points[k]=0; state.notes[k]=""; state.dates[k]=todayStr();
        setJSON(storageKey("state"), state);
        document.getElementById(`note-${k}`).value = "";
        del.closest(".sheet").querySelectorAll(`.points button`).forEach(b=>b.classList.remove("active"));
        document.querySelector(`#sheet-${k} .s-value`).textContent = "Valore: 0%";
        del.closest(".sheet").querySelector('input[type="date"]').value = state.dates[k];
        updateStatsAndLate();
      }
    });

    // cambio data → ritardo
    wrap.addEventListener("change",(e)=>{
      const inp = e.target.closest('input[type="date"][data-date]');
      if (!inp) return;
      const k = inp.dataset.date;
      state.dates[k] = inp.value;
      setJSON(storageKey("state"), state);
      updateStatsAndLate();
    });
  }

  updateStatsAndLate();
}

/** ==================
 *  POPUP INFO (NOTE)
 *  ================== */
function openInfo(k) {
  const dlg = document.getElementById("infoDialog");
  const title = document.getElementById("infoTitle");
  const content = document.getElementById("infoContent");
  title.textContent = `${k.toUpperCase()} — Info`;
  const pts = INFO_POINTS[k] ?? [];
  const square = (p)=> {
    // 0,1,3,5 → pos 0..3
    const map = {0:0,1:1,3:2,5:3};
    const pos = map[p] ?? 0;
    return "□ □ □ □".split(" ").map((s,i)=> i===pos ? "■" : "□").join(" ");
  };
  content.innerHTML = `
    <ol>
      ${pts.map((t,i)=>`
        <li>
          <div class="pointline" data-text="${encodeURIComponent(t)}">
            ${i+1}. ${t}
            <div class="points">
              ${[0,1,3,5].map(p=>`<button data-p="${p}">${p}</button>`).join("")}
            </div>
            <div class="note-mini"></div>
          </div>
        </li>
      `).join("")}
    </ol>
  `;
  // clic sui voti → resta attivo + aggiunge nota (solo testo) nella scheda, non cambia punteggio scheda
  content.onclick = (e)=>{
    const btn = e.target.closest("button[data-p]");
    if (!btn) return;
    const p = Number(btn.dataset.p);
    const line = btn.closest(".pointline");
    line.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const txt = decodeURIComponent(line.dataset.text);
    line.querySelector(".note-mini").textContent = `${square(p)}  Voto: ${p}`;
    // append nelle NOTE della scheda
    const textarea = document.querySelector(`#note-${k}`);
    if (textarea) {
      const toAdd = `[${p}] ${txt}`;
      const now = textarea.value || "";
      if (!now.split("\n").includes(toAdd)) {
        textarea.value = now ? now + "\n" + toAdd : toAdd;
        state.notes[k] = textarea.value;
        setJSON(storageKey("state"), state);
      }
    }
  };
  document.getElementById("infoCloseBtn").onclick = () => dlg.close();
  dlg.showModal();
}

/** ========
 *  ROUTER
 *  ======== */
document.addEventListener("DOMContentLoaded", () => {
  refreshTitles();
  if (document.body.dataset.page === "home")      setupHome();
  if (document.body.dataset.page === "checklist") setupChecklist();
});
