/* ===================== SKF 5S - app.js (v7.16.0 - Rettifica) ========================= */
const VERSION = 'v7.16.0-Rettifica';
const STORE = 'skf.5s.v7.10.3-rettifica';
const POINTS = [0, 1, 3, 5];

/* --- Voci di Rettifica --- */
const VOC_1S = [{
  t: "Zona pedonale pavimento",
  d: "Area pedonale libera da ostacoli e pericoli di inciampo"
}, {
  t: "Zona di lavoro (pavimento, macchina)",
  d: "Solo il necessario per l’ordine in corso"
}, {
  t: "Materiali",
  d: "Materiale non necessario rimosso/segregato"
}, {
  t: "Informazioni",
  d: "Documenti necessari e in buono stato"
}, {
  t: "Processo di etichettatura",
  d: "Gestione etichette rosse / scarti definita"
}, {
  t: "Piano per sostenere il risultato",
  d: "Lavagna 5S, foto prima/dopo, azioni, punteggi, SPL"
}];
const VOC_2S = [{
  t: "1-S Stato",
  d: "Team e area definiti, 1S mantenuta"
}, {
  t: "Sicurezza",
  d: "Dispositivi/attrezzature identificati e accessibili"
}, {
  t: "Qualità",
  d: "Postazioni qualità ordinate e chiare"
}, {
  t: "Documenti",
  d: "Documenti al punto d’uso e aggiornati"
}, {
  t: "Concetti",
  d: "Ergonomia, punto d’uso, zero sprechi/confusione"
}, {
  t: "Posizioni prefissate",
  d: "Sagome/posti fissi: facile capire cosa manca"
}, {
  t: "Visual Management di base",
  d: "Linee/etichette/colori minimi attivi"
}];
const VOC_3S = [{
  t: "1-S Stato",
  d: "1S mantenuta"
}, {
  t: "2-S Stato",
  d: "2S mantenuta"
}, {
  t: "Pulizia",
  d: "Aree e macchine pulite (anche punti difficili)"
}, {
  t: "Misure preventive",
  d: "Cause di sporco/perdite rimosse alla radice"
}, {
  t: "Pulire è routine",
  d: "Routine con responsabilità e frequenze"
}, {
  t: "Standard di pulizia",
  d: "Standard e checklist visibili e seguiti"
}];
const VOC_4S = [{
  t: "Aree di passaggio",
  d: "Nessun deposito/ostacolo; pavimento libero"
}, {
  t: "Area di lavoro",
  d: "Solo il necessario per l’ordine corrente"
}, {
  t: "Materiali",
  d: "Materiali corretti e identificati"
}, {
  t: "Informazione",
  d: "Info necessarie e in buono stato"
}, {
  t: "Visual Management",
  d: "Indicatori visivi efficaci in routine"
}, {
  t: "Posizioni prefissate",
  d: "Prelievo/rimessa facili e immediati"
}, {
  t: "Standard lavoro & check",
  d: "SPL/istruzioni/checklist visibili e usate"
}, {
  t: "Etichette e colori",
  d: "Etichette chiare, codici colore coerenti"
}, {
  t: "Marcature tubi/valvole",
  d: "Tubi/valvole marcati (colori standard)"
}, {
  t: "Segnaletica a terra",
  d: "Linee/campiture presenti e mantenute"
}, {
  t: "Punti di ispezione",
  d: "Chiari i punti e cosa controllare"
}, {
  t: "Single Point Lessons",
  d: "SPL aggiornate e usate"
}, {
  t: "Standard & documentazione",
  d: "Documentazione aggiornata/disponibile"
}, {
  t: "Kanban & scorte",
  d: "Consumabili in visual management (min/max)"
}, {
  t: "Misure preventive",
  d: "Anomalie risolte alla radice"
}];
const VOC_5S = [{
  t: "Ognuno & ogni giorno",
  d: "Tutti formati e coinvolti sugli standard"
}, {
  t: "Miglioramento continuo",
  d: "Evidenza prima/dopo; standard aggiornati"
}];

/* --- Elementi UI --- */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const elAreasSection = $('#areas');
const elGlobalScore = $('#globalScore');
const tplArea = $('#tplArea');
const tplItem = $('#tplItem');

let ui = {
  line: ''
};
let data = [];
const VOC = {
  '1S': VOC_1S,
  '2S': VOC_2S,
  '3S': VOC_3S,
  '4S': VOC_4S,
  '5S': VOC_5S
};

/* ==================== Logica ==================== */

function loadState() {
  try {
    const d = localStorage.getItem(STORE);
    if (d) data = JSON.parse(d);
    if (data.length === 0) {
      addNewArea('Rettifica');
    }
    render();
  } catch (e) {
    console.error('Errore nel caricamento', e)
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE, JSON.stringify(data));
  } catch (e) {
    console.error('Errore nel salvataggio', e)
  }
}

function getAreaScore(area) {
  let totalScore = 0,
    totalCount = 0;
  for (const s in VOC) {
    area.scores[s] = area.scores[s] || {};
    for (const i in VOC[s]) {
      const item = area.scores[s][i] || {
        v: 0
      };
      totalScore += item.v;
      totalCount++;
    }
  }
  return totalCount > 0 ? Math.round((totalScore / (totalCount * 5)) * 100) : 0;
}

function getGlobalScore() {
  if (data.length === 0) return 0;
  let totalScore = 0,
    totalCount = 0;
  data.forEach(area => {
    for (const s in VOC) {
      area.scores[s] = area.scores[s] || {};
      for (const i in VOC[s]) {
        const item = area.scores[s][i] || {
          v: 0
        };
        totalScore += item.v;
        totalCount++;
      }
    }
  });
  return totalCount > 0 ? Math.round((totalScore / (totalCount * 5)) * 100) : 0;
}

function addNewArea(line = '') {
  const newArea = {
    line,
    id: Date.now(),
    scores: {}
  };
  data.push(newArea);
  saveState();
  render();
}

function deleteArea(areaId) {
  if (!confirm('Sei sicuro di voler eliminare questa area?')) return;
  data = data.filter(a => a.id !== areaId);
  saveState();
  render();
}

function render() {
  const areas = data; // Mostra tutte le aree
  elAreasSection.innerHTML = '';
  areas.forEach(area => {
    const areaEl = tplArea.content.cloneNode(true);
    const areaCard = areaEl.querySelector('.area');
    areaCard.id = `area-${area.id}`;

    const lineInput = areaCard.querySelector('.area-line');
    lineInput.value = area.line;
    lineInput.addEventListener('input', () => {
      area.line = lineInput.value.trim();
      saveState();
    });

    areaCard.querySelector('.delete').addEventListener('click', () => {
      deleteArea(area.id);
    });

    const tabs = areaCard.querySelectorAll('.tab');
    tabs.forEach(tab => {
      const s = tab.dataset.s;
      const panel = areaCard.querySelector(`.panel[data-s="${s}"]`);
      const sScore = area.scores[s] || {};
      const sTotalCount = VOC[s].length;
      const sScoreValue = Object.values(sScore).reduce((a, b) => a + (b.v || 0), 0);
      const sScorePercent = sTotalCount > 0 ? Math.round((sScoreValue / (sTotalCount * 5)) * 100) : 0;
      tab.querySelector('.badge-s').textContent = `${sScorePercent}%`;

      VOC[s].forEach((item, i) => {
        const itemEl = tplItem.content.cloneNode(true);
        const itemCard = itemEl.querySelector('.item');
        if (!area.scores[s]) {
          area.scores[s] = {};
        }
        const itemData = area.scores[s][i] || {};
        itemData.v = itemData.v || 0;

        itemCard.querySelector('.txt').value = item.t;
        const dots = itemCard.querySelectorAll('.dot');
        dots.forEach(dot => {
          if (dot.dataset.val == itemData.v) dot.classList.add('active');
          dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            itemData.v = parseInt(dot.dataset.val, 10);
            area.scores[s][i] = itemData;
            saveState();
            render();
          });
        });
        panel.appendChild(itemEl);
      });
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        areaCard.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        panel.classList.add('active');
      });
    });
    elAreasSection.appendChild(areaEl);
  });
  elGlobalScore.textContent = `${getGlobalScore()}%`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
});
