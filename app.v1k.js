/* SKF 5S – CH 24 Rettifica (BUILD v1k) */

const PIN = "2468"; // cambia qui il PIN per azioni protette

// Colori ufficiali S
const S_COLORS = {
  "1S": "#7E57C2",
  "2S": "#EF5350",
  "3S": "#F6B73C",
  "4S": "#2E7D32",
  "5S": "#3F51B5"
};

// Stato
const storeKey = "skf5s-ch24";
const state = loadState() || seed();

function seed(){
  return {
    chName: "CH 24 — Rettifica",
    sections: [
      { key:"1S", name:"Selezionare", items:[blankItem()], color:S_COLORS["1S"] },
      { key:"2S", name:"Sistemare",    items:[blankItem()], color:S_COLORS["2S"] },
      { key:"3S", name:"Splendere",    items:[blankItem()], color:S_COLORS["3S"] },
      { key:"4S", name:"Standardizzare", items:[blankItem()], color:S_COLORS["4S"] },
      { key:"5S", name:"Sostenere",    items:[blankItem()], color:S_COLORS["5S"] },
    ],
    locked: true
  };
}
function blankItem(){
  return { title:"", notes:"", resp:"", score:0, date: todayStr() };
}
function todayStr(){
  const d=new Date(); return d.toISOString().slice(0,10);
}
function saveState(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem(storeKey)); }catch{ return null; }}

// Router
window.addEventListener("hashchange", render);
window.addEventListener("load", render);

function render(){
  const app = document.getElementById("app");
  const nav = document.getElementById("topNav");
  const route = location.hash.replace("#","") || "/";
  if(route === "/" || route.startsWith("/home")){
    nav.innerHTML = `<a class="btn ghost" href="#/checklist">Vai alla checklist →</a>`;
    app.innerHTML = homeView();
    buildHomeChart();
    wireHome();
  }else{
    nav.innerHTML = "";
    app.innerHTML = checklistView();
    wireChecklist();
    scrollIfTarget();
  }
}

/* ---------- HOME ---------- */
function homeView(){
  const { chName } = state;
  const sums = computeSummary();

  const lateChips = sums.lateList.length
    ? `<div class="chips" id="lateChips">
        ${sums.lateList.map(s => 
          `<button class="chip click s${s.key[0]}" data-goto="${s.key}">
            ${s.key} in ritardo (${s.count})
          </button>`).join("")}
      </div>`
    : `<div class="small">Nessuna sezione in ritardo.</div>`;

  return `
    <section class="card hero">
      <img src="assets/5s-hero.png" alt="5S" />
      <div>
        <h2 style="margin:4px 0 10px">Cosa è 5S</h2>
        <div class="legend">
          <span class="l"><span class="dot" style="background:${S_COLORS["1S"]}"></span> <strong>1S Selezionare</strong> — Eliminare il superfluo.</span>
          <span class="l"><span class="dot" style="background:${S_COLORS["2S"]}"></span> <strong>2S Sistemare</strong> — Un posto per tutto e tutto al suo posto.</span>
          <span class="l"><span class="dot" style="background:${S_COLORS["3S"]}"></span> <strong>3S Splendere</strong> — Pulire e prevenire lo sporco.</span>
          <span class="l"><span class="dot" style="background:${S_COLORS["4S"]}"></span> <strong>4S Standardizzare</strong> — Regole e segnali chiari.</span>
          <span class="l"><span class="dot" style="background:${S_COLORS["5S"]}"></span> <strong>5S Sostenere</strong> — Abitudine e miglioramento continuo.</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 style="margin-top:0">Andamento ${chName}</h2>
      <canvas id="bar"></canvas>
      <div class="legend" style="margin-top:8px">
        ${["1S","2S","3S","4S","5S"].map(k => 
          `<span class="l"><span class="dot" style="background:${S_COLORS[k]}"></span>${k}: ${sums[k]}%</span>`
        ).join("")}
        <span class="l"><span class="dot" style="background:#e11d48"></span>Ritardi: ${sums.lateTotal}</span>
      </div>
      <hr class="sep"/>
      <div><strong>Sezioni in ritardo</strong></div>
      ${lateChips}
      <div style="margin-top:12px">
        <button class="btn ghost" id="exportBtn">Esporta dati per Supervisore (PIN)</button>
      </div>
    </section>
  `;
}

function computeSummary(){
  const r = { "1S":0,"2S":0,"3S":0,"4S":0,"5S":0, lateTotal:0, lateList:[] };
  state.sections.forEach(sec=>{
    const percent = sectionValue(sec); // valore attuale
    r[sec.key] = percent;
    const lateCnt = sec.items.filter(it => isLate(it)).length;
    if(lateCnt>0){
      r.lateTotal += lateCnt;
      r.lateList.push({key:sec.key,count:lateCnt});
    }
  });
  return r;
}
function sectionValue(sec){
  if(!sec.items.length) return 0;
  // “Valore”: media semplice dei punteggi (0/1/3/5) trasformata in %
  const avg = sec.items.reduce((a,b)=>a+Number(b.score||0),0) / sec.items.length;
  return Math.round((avg/5)*100);
}
function isLate(it){
  return (it.score||0) < 5 && it.date && it.date < todayStr();
}

function buildHomeChart(){
  const ctx = document.getElementById("bar");
  const sums = computeSummary();
  const data = [sums["1S"],sums["2S"],sums["3S"],sums["4S"],sums["5S"], sums.lateTotal>0? (sums.lateTotal*5) : 0];
  const labels = ["1S","2S","3S","4S","5S","Ritardi"];
  const colors = [S_COLORS["1S"],S_COLORS["2S"],S_COLORS["3S"],S_COLORS["4S"],S_COLORS["5S"], "#ef4444"];

  Chart.register(ChartDataLabels);
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{ data, backgroundColor: colors, borderRadius:6 }]},
    options:{
      responsive:true,
      plugins:{
        legend:{ display:false },
        datalabels:{
          anchor:'end', align:'end', offset:-2, formatter:(v,ctx)=>{
            if(ctx.dataIndex===5) return v>0 ? String(v) : "";
            return `${v}%`;
          },
          font:{ weight:'800' }
        },
        tooltip:{enabled:false}
      },
      scales:{
        x: { grid:{ display:false } },
        y: { grid:{ color:'#f1f5f9' }, beginAtZero:true, max:100, ticks:{ stepSize:20 } }
      }
    }
  });
}

function wireHome(){
  // Vai alle schede in ritardo
  const late = document.getElementById("lateChips");
  if(late){
    late.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-goto]");
      if(!btn) return;
      const key = btn.dataset.goto;
      location.hash = "#/checklist?goto="+encodeURIComponent(key);
    });
  }
  // Export protetto
  document.getElementById("exportBtn").addEventListener("click", ()=>{
    askPin(()=> {
      const blob = new Blob([JSON.stringify(state)], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "skf-5s-ch24.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });
}

/* ---------- CHECKLIST ---------- */
function checklistView(){
  const { chName, locked } = state;
  const sums = computeSummary();
  const late = sums.lateList.map(l=>l.key);

  const kpi = `
    <div class="kpi-row">
      <div class="kpi"><div class="k">Punteggio medio</div><div class="v">${Math.round((sums["1S"]+sums["2S"]+sums["3S"]+sums["4S"]+sums["5S"])/5)}%</div></div>
      <div class="kpi"><div class="k">Azioni in ritardo</div><div class="v">${sums.lateTotal}</div></div>
    </div>`;

  const chips = `
    <div class="chips" id="chips">
      ${state.sections.map(s => 
        `<button class="chip click s${s.key[0]}" data-goto="${s.key}">
          ${s.key} ${sectionValue(s)}%
        </button>`).join("")}
      <button class="btn primary" id="toggleAll">Comprimi / Espandi</button>
    </div>`;

  const cards = state.sections.map(sec=>{
    const val = sectionValue(sec);
    const isLateSec = sec.items.some(isLate);
    return `
      <div class="cardS ${isLateSec?'late':''}" id="sec-${sec.key}">
        <div class="head">
          <div class="swatch sw${sec.key[0]}"></div>
          <div class="title">${sec.key} — ${sec.name}</div>
          <div class="h-actions">
            <span class="tag val">Valore: ${val}%</span>
            <button class="iconbtn info" title="Spiegazione" data-info="${sec.key}">i</button>
            <button class="iconbtn add" title="Duplica voce" data-add="${sec.key}">+</button>
          </div>
        </div>

        <details class="details" open>
          <summary>Dettagli</summary>
          ${sec.items.map((it,idx)=> itemControls(sec.key, idx, it)).join("")}
        </details>
      </div>
    `;
  }).join("");

  return `
    <div class="chips" style="justify-content:space-between;">
      <a class="btn ghost" href="#/">← Indietro</a>
      <h2 style="margin:0">${chName}</h2>
      <button class="iconbtn lock" id="lockBtn" title="${locked?'Sblocco con PIN':'Blocca'}">🔒</button>
    </div>

    ${kpi}

    <section class="card">
      ${chips}
    </section>

    ${cards}
  `;
}

function itemControls(key, idx, it){
  const sClass = "s"+key[0];
  return `
    <div class="card" style="padding:12px;border:1px dashed var(--outline);border-radius:12px;margin-top:10px">
      <div class="controls">
        <input type="text" placeholder="Responsabile / Operatore" value="${escapeHtml(it.resp)}" data-bind="resp" data-key="${key}" data-idx="${idx}" ${state.locked?'disabled':''}/>
        <textarea placeholder="Note..." data-bind="notes" data-key="${key}" data-idx="${idx}" ${state.locked?'disabled':''}>${escapeHtml(it.notes)}</textarea>
        <div class="score">
          ${[0,1,3,5].map(v =>
            `<button class="${sClass} ${Number(it.score)===v?'active':''}" data-score="${v}" data-key="${key}" data-idx="${idx}" ${state.locked?'disabled':''}>${v}</button>`
          ).join("")}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="date" value="${it.date||todayStr()}" data-bind="date" data-key="${key}" data-idx="${idx}" ${state.locked?'disabled':''}/>
          <button class="iconbtn del" title="Elimina voce" data-del="${key}" data-idx="${idx}" ${state.locked?'disabled':''}>🗑</button>
        </div>
      </div>
    </div>
  `;
}

function wireChecklist(){
  // lock / unlock
  document.getElementById("lockBtn").onclick = ()=>{
    if(state.locked){
      askPin(()=>{ state.locked=false; saveState(); render(); });
    }else{
      state.locked=true; saveState(); render();
    }
  };

  // chips navigate
  document.getElementById("chips").addEventListener("click",(e)=>{
    const btn = e.target.closest("[data-goto]");
    if(!btn) return;
    const id = "sec-"+btn.dataset.goto;
    document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  });

  // toggle all
  document.getElementById("toggleAll").onclick = ()=>{
    document.querySelectorAll(".details").forEach(d=> d.open = !d.open);
  };

  // info popup
  document.querySelectorAll("[data-info]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key = btn.dataset.info;
      const map = {
        "1S":"Eliminare ciò che non serve.",
        "2S":"Un posto per tutto e tutto al suo posto.",
        "3S":"Pulire e prevenire lo sporco.",
        "4S":"Regole e segnali visivi chiari.",
        "5S":"Disciplina e miglioramento continuo."
      };
      alert(`${key} — ${map[key]}`);
    });
  });

  // add voice (PIN)
  document.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      askPin(()=>{
        const key = btn.dataset.add;
        const sec = state.sections.find(s=>s.key===key);
        sec.items.push(blankItem());
        saveState(); render();
      });
    });
  });

  // delete voice (PIN)
  document.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      askPin(()=>{
        const key = btn.dataset.del;
        const idx = Number(btn.dataset.idx);
        const sec = state.sections.find(s=>s.key===key);
        sec.items.splice(idx,1);
        if(!sec.items.length) sec.items.push(blankItem());
        saveState(); render();
      });
    });
  });

  // bind inputs
  document.querySelectorAll("[data-bind]").forEach(el=>{
    el.addEventListener("input", ()=>{
      const key = el.dataset.key, idx = Number(el.dataset.idx);
      const sec = state.sections.find(s=>s.key===key);
      sec.items[idx][el.dataset.bind] = el.value;
      saveState();
      // aggiorna solo header e KPI
      rerenderHeaderBits();
    });
  });

  // score buttons – non devono “bloccare” le altre schede
  document.querySelectorAll("[data-score]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key = btn.dataset.key, idx = Number(btn.dataset.idx), val = Number(btn.dataset.score);
      const sec = state.sections.find(s=>s.key===key);
      sec.items[idx].score = val;
      saveState();
      // refresh stile dei pulsanti della riga
      btn.parentElement.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      rerenderHeaderBits(); // aggiorna KPI/valori/ritardi
      // ricolora card se in ritardo
      const card = document.getElementById("sec-"+key);
      if(sec.items.some(isLate)) card.classList.add("late"); else card.classList.remove("late");
    });
  });
}

function rerenderHeaderBits(){
  // Aggiorna chips e tag “Valore” senza ricaricare tutto
  state.sections.forEach(sec=>{
    const val = sectionValue(sec);
    const chip = document.querySelector(`.chip[data-goto="${sec.key}"]`);
    if(chip) chip.innerHTML = `${sec.key} ${val}%`;
    const card = document.getElementById("sec-"+sec.key);
    card?.querySelector(".tag.val").replaceChildren(document.createTextNode(`Valore: ${val}%`));
  });
}

function scrollIfTarget(){
  const q = new URLSearchParams(location.hash.split("?")[1]||"");
  const goto = q.get("goto");
  if(goto){
    const el = document.getElementById("sec-"+goto);
    el?.scrollIntoView({behavior:"smooth",block:"start"});
  }
}

/* -------- Utils -------- */
function askPin(ok){
  const p = prompt("Inserisci PIN");
  if(p===PIN) ok();
  else alert("PIN errato");
}
function escapeHtml(s=""){ return s.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
