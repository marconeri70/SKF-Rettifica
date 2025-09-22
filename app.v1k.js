
      // ritardo
      const past = it.due ? Date.parse(it.due) : NaN;
      const isLate = !isNaN(past) && past < Date.now() && (parseInt(it.val||0,10) || 0) < 5;
      if(isLate){ item.classList.add('late'); hasLate = true; }

      // handlers
      item.addEventListener('click', e=>{
        const d = e.target.closest('.dot');
        if(d){ it.val = parseInt(d.dataset.val,10)||0; save(); render(); }
        const del = e.target.closest('.del');
        if(del){ if(role!=='supervisor'){ e.preventDefault(); return; } arr.splice(idx,1); save(); render(); }
      });
      item.querySelector('.txt').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.t=ev.target.value; save(); });
      item.querySelector('.resp').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.resp=ev.target.value; save(); });
      item.querySelector('.due').addEventListener('change', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.due=ev.target.value; save(); render(); });
      item.querySelector('.note').addEventListener('input', ev=>{ if(role!=='supervisor'){ev.target.blur(); return;} it.note=ev.target.value; save(); });

      wrap.appendChild(item);
    });

    if(hasLate) panel.classList.add('late'); else panel.classList.remove('late');
  });

  elAreas.appendChild(node);

  // KPI top
  $('#kpiScore').textContent = pct(kpis.score);
  $('#kpiLate').textContent  = kpis.late;

  // comprimi per area (delegato)
  elAreas.addEventListener('click', e=>{
    const b = e.target.closest('.collapse'); if(!b) return;
    const panels = b.closest('.area').querySelector('.panels');
    panels.classList.toggle('collapsed');
  });

  // popup info (delegato)
  document.addEventListener('click', e=>{
    const btn = e.target.closest('button.info.big'); if(!btn) return;
    const panel = btn.closest('.panel');
    const title = panel.querySelector('.pill')?.textContent || 'Info';
    const map = {
      '1S':'Eliminare ciò che non serve.',
      '2S':'Un posto per tutto e tutto al suo posto.',
      '3S':'Pulire è ispezionare; prevenire lo sporco.',
      '4S':'Regole e segnali visivi chiari.',
      '5S':'Abitudine e miglioramento continuo.'
    };
    const S = panel.dataset.s || '';
    const msg = map[S] || '';
    const dlg = $('#infoDlg');
    dlg.querySelector('.modal').innerHTML = `<h3>${title}</h3><p>${msg}</p><form method="dialog" style="margin-top:12px;text-align:right"><button class="btn">Chiudi</button></form>`;
    dlg.showModal();
  });
}

// Lock con PIN per attivare cancellazioni/modifiche testo
function setupLock(){
  const btn = $('#btnLock');
  if(!btn) return;
  const setUi = ()=>{ btn.textContent = role==='supervisor'?'🔓':'🔒'; document.body.classList.toggle('edit-unlocked', role==='supervisor'); }
  setUi();
  btn.addEventListener('click', ()=>{
    if(role==='supervisor'){ role='worker'; setUi(); return; }
    const pin = prompt('Inserisci PIN supervisore'); 
    if(pin==='2468'){ role='supervisor'; setUi(); } else { alert('PIN errato'); }
  });
}

window.addEventListener('load', ()=>{
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  }
  normalizeState();
  setupLock();
  render();
});
