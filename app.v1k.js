document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("mainChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Punteggio medio", "Azioni in ritardo"],
        datasets: [{
          data: [70, 2],
          backgroundColor: ["#005BAC", "#e74c3c"]
        }]
      },
      options: {scales: {y: {beginAtZero:true, grid:{display:false}}}}
    });
  }

  const checklistContainer = document.getElementById("sSections");
  if (checklistContainer) {
    const sections = [
      {id:"s1", label:"1S — Selezionare", color:"s1", desc:"Eliminare ciò che non serve."},
      {id:"s2", label:"2S — Sistemare", color:"s2", desc:"Un posto per tutto."},
      {id:"s3", label:"3S — Splendere", color:"s3", desc:"Pulire e prevenire lo sporco."},
      {id:"s4", label:"4S — Standardizzare", color:"s4", desc:"Regole e segnali chiari."},
      {id:"s5", label:"5S — Sostenere", color:"s5", desc:"Disciplina e miglioramento continuo."}
    ];
    sections.forEach(s => {
      const div = document.createElement("div");
      div.className = "card " + s.color;
      div.innerHTML = `<h3>${s.label} <button class="infoBtn ${s.color}">i</button></h3>
        <p>${s.desc}</p>
        <label>Titolo voce <input type="text"></label>
        <label>Responsabile <input type="text"></label>
        <label>Note <input type="text"></label>
        <div><button>0</button><button>1</button><button>3</button><button>5</button></div>`;
      checklistContainer.appendChild(div);
    });
  }
});
