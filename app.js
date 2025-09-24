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
        y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"}, grid:{display:false}},   // ← niente linee
        x:{ticks:{maxRotation:0}, grid:{display:false}}                                // ← niente linee
      }
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
