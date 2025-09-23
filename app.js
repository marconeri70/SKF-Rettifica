/** CONFIGURAZIONE SPECIFICA RETTIFICA */
const CONFIG = {
  PIN: "6170",
  CHANNEL_DEFAULT: "CH 24",
  AREA: "Rettifica"
};

const COLORS = {
  s1: "#7c3aed", s2: "#ef4444", s3: "#f59e0b", s4: "#10b981", s5: "#2563eb",
};

const INFO_TEXT = {
  s1: "Eliminare ciò che non serve. Rimuovi superfluo e crea area di lavoro essenziale, ordinata e sicura.",
  s2: "Un posto per tutto e tutto al suo posto. Riduci gli sprechi di ricerca.",
  s3: "Pulizia, prevenzione dello sporco e cause radice.",
  s4: "Standard visivi, regole chiare e audit regolari.",
  s5: "Sostenere: disciplina, abitudine e miglioramento continuo."
};

/** STORAGE helpers */
const storageKey = (k)=>`skf5s:${CONFIG.AREA}:${k}`;
const getJSON = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))??d; }catch{ return d; } };
const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

/** PWA SW */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", ()=> navigator.serviceWorker.register("sw.js"));
}

/** Stato */
let state = getJSON(storageKey("state"), {
  channel: CONFIG.CHANNEL_DEFAULT,
  points: { s1:0, s2:0, s3:0, s4:0, s5:0 },
  notes: { s1:"", s2:"", s3:"", s4:"", s5:"" },
  dates: { s1:null, s2:null, s3:null, s4:null, s5:null }
});

/** PIN dialog */
function openPinDialog(){
  const dlg = document.getElementById("pinDialog");
  if (!dlg) return;
  dlg.showModal();

  const pinInput = document.getElementById("pinInput");
  const chInput  = document.getElementById("channelInput");
  pinInput.value = "";
  chInput.value  = state.channel ?? CONFIG.CHANNEL_DEFAULT;

  const confirm = document.getElementById("pinConfirmBtn");
  const cancel  = document.getElementById("pinCancel");

  const onConfirm = ()=>{
    const ok = pinInput.value === CONFIG.PIN;
    if (!ok) { alert("PIN errato"); return; }
    state.channel = chInput.value.trim() || CONFIG.CHANNEL_DEFAULT;
    setJSON(storageKey("state"), state);
    refreshTitles();
    dlg.close();
  };
  const onCancel = ()=> dlg.close();

  confirm.onclick = onConfirm;
  cancel.onclick  = onCancel;
}

function refreshTitles(){
  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) chartTitle.textContent = `Andamento ${state.channel} — ${CONFIG.AREA}`;
  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = `${state.channel} — ${CONFIG.AREA}`;
}

/** Home */
function setupHome(){
  refreshTitles();
  renderChart();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);
  document.getElementById("exportBtn")?.addEventListener("click", openPinDialog);
}

/** Checklist */
function setupChecklist(){
  refreshTitles();
  document.getElementById("lockBtn")?.addEventListener("click", openPinDialog);

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

  document.getElementById("toggleAll").addEventListener("click", ()=>{
    document.querySelectorAll(".s-details").forEach(det=> det.open = !det.open);
  });

  const wrap = document.getElementById("sheets");
  const defs = [
    {k:"s1", name:"1S — Selezionare",   color:COLORS.s1},
    {k:"s2", name:"2S — Sistemare",     color:COLORS.s2},
    {k:"s3", name:"3S — Splendere",     color:COLORS.s3},
    {k:"s4", name:"4S — Standardizzare",color:COLORS.s4},
    {k:"s5", name:"5S — Sostenere",     color:COLORS.s5},
  ];

  const todayStr = ()=> new Date().toISOString().slice(0,10);

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
            <button class="icon danger del">🗑</button>
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

  // info
  wrap.addEventListener("click",(e)=>{
    const infoBtn = e.target.closest(".info");
    if(!infoBtn) return;
    openInfo(infoBtn.dataset.k);
  });

  document.getElementById("infoCloseBtn").addEventListener("click", ()=> {
    document.getElementById("infoDialog").close();
  });

  updateStatsAndLate();
}

/** Ritardi */
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

/** Info */
function openInfo(k){
  const dlg = document.getElementById("infoDialog");
  document.getElementById("infoTitle").textContent = `${k.toUpperCase()} — Info`;
  document.getElementById("infoText").textContent = INFO_TEXT[k] ?? "";
  dlg.querySelector(".modal-box").style.borderTop = `6px solid ${COLORS[k]||'#0a57d5'}`;
  dlg.showModal();
}

/** Grafico + pulsanti “in ritardo” */
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
        data:[...vals, delayed],
        backgroundColor:["#7c3aed","#ef4444","#f59e0b","#10b981","#2563eb","#ef4444"]
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{display:false}, tooltip:{enabled:true} },
      scales:{ y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"}}, x:{ticks:{maxRotation:0}} }
    }
  });

  const late = [];
  ["s1","s2","s3","s4","s5"].forEach((k,i)=>{ if(isLate(k)) late.push({k, label:`${i+1}S in ritardo`}); });
  const box = document.getElementById("lateBtns");
  box.innerHTML = "";
  late.forEach(({k,label})=>{
    const b = document.createElement("button");
    b.className = `late-btn ${k}`;
    b.textContent = label;
    b.addEventListener("click", ()=> { window.location.href = `checklist.html#sheet-${k}`; });
    box.appendChild(b);
  });
}

/** Router */
document.addEventListener("DOMContentLoaded", ()=>{
  refreshTitles();
  if (document.body.dataset.page==="home") setupHome();
  if (document.body.dataset.page==="checklist") setupChecklist();
});
