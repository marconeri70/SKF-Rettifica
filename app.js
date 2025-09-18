/* ===================== SKF 5S – app.js (v7.18.5 - Final) ========================= */
const VERSION = 'v7.18.5-Final';
const STORE = 'skf.5s.v7.10.3';
const CHART_STORE = STORE + '.chart';
const POINTS = [0, 1, 3, 5];

/* --- Voci di esempio --- */
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

const VOC = {
  '1S': VOC_1S,
  '2S': VOC_2S,
  '3S': VOC_3S,
  '4S': VOC_4S,
  '5S': VOC_5S
};

const S_DESCRIPTIONS = {
  '1S': {
    title: '1S — Separare',
    desc: 'Eliminare ciò che non serve. Rimuovi tutto ciò che è inutile e crea un\'area di lavoro essenziale, ordinata e sicura.'
  },
  '2S': {
    title: '2S — Sistemare',
    desc: 'Ogni cosa al suo posto. Organizza gli strumenti e i materiali in modo che siano facili da trovare, usare e riporre.'
  },
  '3S': {
    title: '3S — Splendere',
    desc: 'Pulire è ispezionare. Mantieni pulito il posto di lavoro e, mentre lo pulisci, cerca e risolvi le cause dello sporco o dei problemi.'
  },
  '4S': {
    title: '4S — Standardizzare',
    desc: 'Rendere l\'ordine una routine. Stabilisci regole e standard visivi chiari (come etichette e colori) che tutti devono seguire.'
  },
  '5S': {
    title: '5S — Sostenere',
    desc: 'Non smettere mai di migliorare. Rendi le prime 4S un\'abitudine quotidiana per tutti e promuovi il miglioramento continuo.'
  }
};

const S_COLORS = {
  '1S': getComputedStyle(document.documentElement).getPropertyValue('--c1'),
  '2S': getComputedStyle(document.documentElement).getPropertyValue('--c2'),
  '3S': getComputedStyle(document.documentElement).getPropertyValue('--c3'),
  '4S': getComputedStyle(document.documentElement).getPropertyValue('--c4'),
  '5S': getComputedStyle(document.documentElement).getPropertyValue('--c5'),
};

/* --- Elementi UI --- */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const elAreasSection = $('#areas');
const elGlobalScore = $('#globalScore');
const elChart = document.getElementById('chart');
const elChartSection = $('.chart-section');
const tplArea = $('#tplArea');
const tplItem = $('#tplItem');
const popup = $('#infoPopup');
const popupTitle = $('#popupTitle');
const popupDesc = $('#popupDesc');
const closePopupBtn = $('.close-popup');

const itemPopup = $('#itemPopup');
const itemPopupTitle = $('#itemPopupTitle');
const itemPopupDesc = $('#itemPopupDesc');
const closeItemPopupBtn = $('.close-popup-item');

let data = [];
let myChart; // Variabile per l'istanza del grafico

/* ==================== Logica ==================== */
function loadState() {
  try {
    const d = localStorage.getItem(STORE);
    if (d) data = JSON.parse(d);
    if (data.length === 0) addNewArea('');
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

function getGlobalScoreByS() {
  const scoresByS = {
    '1S': {
      totalScore: 0,
      totalCount: 0
    },
    '2S': {
      totalScore: 0,
      totalCount: 0
    },
    '3S': {
      totalScore: 0,
      totalCount: 0
    },
    '4S': {
      totalScore: 0,
      totalCount: 0
    },
    '5S': {
      totalScore: 0,
      totalCount: 0
    }
  };

  data.forEach(area => {
    for (const s in VOC) {
      area.scores[s] = area.scores[s] || {};
      VOC[s].forEach((item, i) => {
        const itemScore = area.scores[s][i] || {
          v: 0
        };
        scoresByS[s].totalScore += itemScore.v;
        scoresByS[s].totalCount++;
      });
    }
  });

  const finalScores = {};
  for (const s in scoresByS) {
    const {
      totalScore,
      totalCount
    } = scoresByS[s];
    finalScores[s] = totalCount > 0 ? Math.round((totalScore / (totalCount * 5)) * 100) : 0;
  }
  return finalScores;
}

function getGlobalScore() {
  const scoresByS = getGlobalScoreByS();
  let totalScore = 0;
  let totalCount = 0;
  for (const s in scoresByS) {
    totalScore += scoresByS[s];
    totalCount++;
  }
  return totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
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

function showInfoPopup(s) {
  popupTitle.textContent = S_DESCRIPTIONS[s].title;
  popupDesc.textContent = S_DESCRIPTIONS[s].desc;
  popup.classList.add('visible');
}

function hideInfoPopup() {
  popup.classList.remove('visible');
}

function showItemPopup(title, desc) {
  itemPopupTitle.textContent = title;
  itemPopupDesc.textContent = desc;
  itemPopup.classList.add('visible');
}

function hideItemPopup() {
  itemPopup.classList.remove('visible');
}

/* ... codice precedente ... */

function drawChart() {
  const scores = getGlobalScoreByS();
  const labels = Object.keys(scores);
  const dataPoints = Object.values(scores);
  const backgroundColors = labels.map(s => S_COLORS[s]);

  if (!elChart || labels.length === 0) {
    if (myChart) myChart.destroy();
    elChartSection.style.display = 'none';
    return;
  }
  elChartSection.style.display = 'block';

  if (myChart) {
    myChart.data.labels = labels;
    myChart.data.datasets[0].data = dataPoints;
    myChart.data.datasets[0].backgroundColor = backgroundColors;
    myChart.update();
  } else {
    const ctx = elChart.getContext('2d');
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Punteggio 5S',
          data: dataPoints,
          backgroundColor: backgroundColors,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              display: false
            },
            ticks: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (value) => `${value}%`,
            color: 'black'
          }
        }
      }
    });
  }
}

function render() {
  elAreasSection.innerHTML = '';
  data.forEach(area => {
    const areaEl = tplArea.content.cloneNode(true);
    const areaCard = areaEl.querySelector('.area');
    areaCard.id = `area-${area.id}`;

    const lineInput = areaCard.querySelector('.area-line');
    lineInput.value = area.line;
    lineInput.addEventListener('input', () => {
      area.line = lineInput.value.trim();
      saveState();
      drawChart();
    });

    areaCard.querySelector('.delete').addEventListener('click', () => {
      deleteArea(area.id);
    });

    areaCard.querySelector('.collapse-btn').addEventListener('click', () => {
      areaCard.classList.toggle('collapsed');
      const icon = areaCard.querySelector('.collapse-btn');
      icon.textContent = areaCard.classList.contains('collapsed') ? '▶️' : '🔽';
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
      tab.classList.add(`s-${s.toLowerCase()}`);

      const infoBtn = document.createElement('button');
      infoBtn.textContent = 'ⓘ';
      infoBtn.className = 'info-s';
      infoBtn.title = `Spiegazione ${s}`;
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showInfoPopup(s);
      });
      tab.appendChild(infoBtn);

      VOC[s].forEach((item, i) => {
        const itemEl = tplItem.content.cloneNode(true);
        const itemCard = itemEl.querySelector('.item');
        if (!area.scores[s]) {
          area.scores[s] = {};
        }
        const itemData = area.scores[s][i] || {};
        itemData.v = itemData.v || 0;

        itemCard.querySelector('.txt').value = item.t;
        const infoItemBtn = itemCard.querySelector('.info-item');
        infoItemBtn.addEventListener('click', () => {
          showItemPopup(item.t, item.d);
        });

        const dots = itemCard.querySelectorAll('.dot');
        dots.forEach(dot => {
          if (dot.dataset.val == itemData.v) dot.classList.add('active');
          dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            itemData.v = parseInt(dot.dataset.val, 10);
            area.scores[s][i] = itemData;
            saveState();

            const areaScoreByS = getAreaScoreByS(area);
            areaCard.querySelector('.score-1S').textContent = `${areaScoreByS['1S']}%`;
            areaCard.querySelector('.score-2S').textContent = `${areaScoreByS['2S']}%`;
            areaCard.querySelector('.score-3S').textContent = `${areaScoreByS['3S']}%`;
            areaCard.querySelector('.score-4S').textContent = `${areaScoreByS['4S']}%`;
            areaCard.querySelector('.score-5S').textContent = `${areaScoreByS['5S']}%`;
            elGlobalScore.textContent = `${getGlobalScore()}%`;
            drawChart();
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
  drawChart();
}

function getAreaScoreByS(area) {
  const scoresByS = {};
  for (const s in VOC) {
    const sScore = area.scores[s] || {};
    const sTotalCount = VOC[s].length;
    const sScoreValue = Object.values(sScore).reduce((a, b) => a + (b.v || 0), 0);
    scoresByS[s] = sTotalCount > 0 ? Math.round((sScoreValue / (sTotalCount * 5)) * 100) : 0;
  }
  return scoresByS;
}

/* Event Listeners */
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  $('#btnNewArea').addEventListener('click', () => addNewArea());
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#btnTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    $('#btnTheme').textContent = isDark ? '🌞 Tema' : '🌙 Tema';
  });

  closePopupBtn.addEventListener('click', hideInfoPopup);
  window.addEventListener('click', (event) => {
    if (event.target === popup) hideInfoPopup();
  });

  closeItemPopupBtn.addEventListener('click', hideItemPopup);
  window.addEventListener('click', (event) => {
    if (event.target === itemPopup) hideItemPopup();
  });

  window.addEventListener('resize', () => drawChart());
});
