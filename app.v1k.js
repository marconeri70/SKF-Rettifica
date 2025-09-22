/* ===== SKF 5S v1k (CH24) ===== */
const SKF5S = (()=>{

  // --- constants
  const COLORS = { '1S':'#7E57C2','2S':'#EF5350','3S':'#F4B400','4S':'#2ECC71','5S':'#1E88E5', LATE:'#EF5350' };
  const KEY = 'skf5s:CH24:v1k';

  // --- data helpers
  const defaultState = ()=>({
    locked:false,
    s:[
      {id:'1S',name:'Selezionare',color:COLORS['1S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'2S',name:'Sistemare',  color:COLORS['2S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'3S',name:'Splendere',  color:COLORS['3S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'4S',name:'Standardizzare',color:COLORS['4S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'5S',name:'Sostenere',  color:COLORS['5S'],items:[{resp:'',notes:'',date:'',score:0}]},
    ]
  });
  const load = ()=>{ try{ return JSON.parse(localStorage.getItem(KEY)) || defaultState(); }catch{ return defaultState(); } };
  const save = s => localStorage.setItem(KEY, JSON.stringify(s));

  // --- calc
  const pct = s => {
    if(!s.items.length) return 0;
    const sum = s.items.reduce((a,b)=>a + Number(b.score||0), 0);
    return Math.round((sum/(s.items.length*5))*100) || 0;
  };
  const isLateItem = it => it.date && new Date(it.date) < new Date() && Number(it.score||0) < 5;
  const lateCount = state => state.s.reduce((acc,sez)=> acc + sez.items.filter(isLateItem).length, 0);

  // --- PIN
  const askPIN = (msg='Inserisci PIN') => {
    const pin = window.__PIN__ || '2424';
    const v = prompt(msg);
    if(v===null) return false;
    if(v!==pin){ alert('PIN errato'); return false; }
    return true;
  };

  // --- HOME (SVG chart to avoid overlap)
  function initHome(){
    const state = load();
    const perS = state.s.map(x=>({id:x.id, name:x.name, color:x.color, p:pct(x), late:x.items.filter(isLateItem).length}));
    const lateAll = lateCount(state);

    // draw chart (SVG, with padded labels)
    const wrap = document.getElementById('chart');
    wrap.innerHTML = '';
    const W = wrap.clientWidth || 640, H = wrap.clientHeight || 280;
    const PAD = {t:16, r:16, b:60, l:28};
    const n = 6; // 5S + Ritardi
    const bw = (W-PAD.l-PAD.r)/n * 0.58, gap = (W-PAD.l-PAD.r)/n * 0.42;
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
    wrap.appendChild(svg);

    const data = [...perS.map(s=>({label:s.id, val:s.p, color:s.color, isLate:false})), {label:'Ritardi', val:lateAll, color:COLORS.LATE, isLate:true}];

    // light grid only at 0/50/100 to keep clean
    [0,50,100].forEach(y=>{
      const gy = PAD.t + (H-PAD.t-PAD.b)*(1-y/100);
      const line=document.createElementNS(svgNS,'line');
      line.setAttribute('x1', PAD.l); line.setAttribute('x2', W-PAD.r);
      line.setAttribute('y1', gy);    line.setAttribute('y2', gy);
      line.setAttribute('stroke', '#eef2f7'); svg.appendChild(line);
      const t=document.createElementNS(svgNS,'text');
      t.setAttribute('x', PAD.l-4); t.setAttribute('y', gy+4); t.setAttribute('text-anchor','end');
      t.setAttribute('fill', '#7b8796'); t.setAttribute('font-size','11'); t.textContent = y;
      svg.appendChild(t);
    });

    data.forEach((d,i)=>{
      const x = PAD.l + i*((W-PAD.l-PAD.r)/n) + gap/2;
      const maxH = (H-PAD.t-PAD.b);
      const h = Math.min(maxH, maxH*(Math.max(0, d.val)/100));
      const y = PAD.t + (maxH - h);

      const rect = document.createElementNS(svgNS,'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', bw); rect.setAttribute('height', h);
      rect.setAttribute('rx', 6); rect.setAttribute('fill', d.color);
      svg.appendChild(rect);

      const label = document.createElementNS(svgNS,'text');
      label.setAttribute('x', x + bw/2); label.setAttribute('y', Math.max(PAD.t+12, y-6));
      label.setAttribute('text-anchor','middle'); label.setAttribute('fill','#2a3446'); label.setAttribute('font-weight','800');
      label.textContent = d.isLate ? d.val : (Math.round(d.val)+'%');
      svg.appendChild(label);

      const name = document.createElementNS(svgNS,'text');
      name.setAttribute('x', x + bw/2); name.setAttribute('y', H-PAD.b+18);
      name.setAttribute('text-anchor','middle'); name.setAttribute('fill','#49566a'); name.setAttribute('font-size','12');
      name.textContent = d.label; svg.appendChild(name);
    });

    // legend
    const legend = document.getElementById('legend'); legend.innerHTML='';
    perS.forEach(s=>{
      const el = document.createElement('div');
      el.innerHTML = `<span class="dot" style="background:${s.color}"></span> ${s.id}: <b>${s.p}%</b>`;
      legend.appendChild(el);
    });
    const l = document.createElement('div');
    l.innerHTML = `<span class="dot" style="background:${COLORS.LATE}"></span> Ritardi: <b>${lateAll}</b>`;
    legend.appendChild(l);

    // CTA: “Vai alla S in ritardo: <S>”
    const worst = perS.reduce((a,b)=> (b.late>a.late?b:a), {late:0});
    const cta = document.getElementById('ctaLate');
    cta.innerHTML = '';
    if(worst.late>0){
      const a = document.createElement('a');
      a.className='btn primary';
      a.href = `checklist.html#${worst.id}`;
      a.textContent = `Vai alla S in ritardo: ${worst.id}`;
      cta.appendChild(a);
    }
  }

  // --- CHECKLIST
  function initChecklist(){
    const state = load();
    const chips = document.getElementById('chips');
    const sections = document.getElementById('sections');
    const kAvg = document.getElementById('kAvg');
    const kLate = document.getElementById('kLate');
    const lockBtn = document.getElementById('lockBtn');
    const toggleAll = document.getElementById('toggleAll');

    function updateKPIs(){
      const avg = Math.round(state.s.reduce((a,b)=> a + pct(b), 0)/state.s.length) || 0;
      kAvg.textContent = avg + '%';
      kLate.textContent = lateCount(state);
    }

    function renderChips(){
      chips.innerHTML = '';
      state.s.forEach(sez=>{
        const c = document.createElement('div');
        c.className = 'chip';
        c.style.background = sez.color;
        c.textContent = `${sez.id} ${pct(sez)}%`;
        if(sez.items.some(isLateItem)) c.style.boxShadow = '0 0 0 3px var(--late-border) inset';
        c.onclick = ()=> document.getElementById(sez.id).scrollIntoView({behavior:'smooth', block:'start'});
        chips.appendChild(c);
      });
    }

    function makeSection(sez){
      const card = document.createElement('article');
      card.className = 's-card';
      card.id = sez.id;
      if(sez.items.some(isLateItem)) card.classList.add('late');

      // header
      const head = document.createElement('div');
      head.className = 's-head';
      head.innerHTML = `
        <div class="s-title" style="color:${sez.color}">${sez.id} — ${sez.name}</div>
        <div class="s-avg">Media: ${pct(sez)}%</div>
        <button class="icon-btn info" title="Info">i</button>
        <button class="icon-btn add" title="Aggiungi (+PIN)">＋</button>
      `;
      card.appendChild(head);

      // info dialog
      head.querySelector('.info').onclick = ()=>{
        const dlg = document.getElementById('dlgInfo');
        document.getElementById('dlgTitle').innerHTML = `<span class="pill" style="background:${sez.color}">${sez.id} — ${sez.name}</span>`;
        const map = {
          '1S':'Eliminare il superfluo.',
          '2S':'Un posto per tutto e tutto al suo posto.',
          '3S':'Pulire e prevenire lo sporco.',
          '4S':'Regole e segnali chiari.',
          '5S':'Abitudine e miglioramento continuo.'
        };
        document.getElementById('dlgBody').textContent = map[sez.id] || '';
        dlg.showModal();
        document.getElementById('dlgClose').onclick = ()=> dlg.close();
      };

      // add with PIN (duplica ultima voce)
      head.querySelector('.add').onclick = ()=>{
        if(!askPIN('PIN per aggiungere una voce')) return;
        const last = sez.items[sez.items.length-1] || {resp:'',notes:'',date:'',score:0};
        sez.items.push({...last});
        save(state); renderAll();
      };

      // details toggle row + body
      const toggle = document.createElement('div');
      toggle.className = 'details-toggle';
      toggle.innerHTML = `<span>▼</span><span>Dettagli</span>`;
      let open = true;
      toggle.onclick = ()=>{
        open = !open;
        toggle.firstChild.textContent = open ? '▼' : '▶';
        body.style.display = open ? 'block' : 'none';
      };
      card.appendChild(toggle);

      const body = document.createElement('div');
      body.className = 'details';
      card.appendChild(body);

      // items
      const locked = state.locked;
      if(!sez.items.length) sez.items.push({resp:'',notes:'',date:'',score:0});
      sez.items.forEach((it, idx)=>{
        const row1 = document.createElement('div'); row1.className = 'row';
        row1.innerHTML = `
          <div class="full">
            <label>Responsabile / Operatore</label>
            <input type="text" placeholder="Inserisci il nome..." value="${it.resp||''}" ${locked?'disabled':''}>
          </div>
          <div class="full">
            <label>Note</label>
            <textarea placeholder="Note..." ${locked?'disabled':''}>${it.notes||''}</textarea>
          </div>
          <div class="full">
            <label>Data</label>
            <input type="date" value="${it.date||''}" ${locked?'disabled':''}>
          </div>
          <div class="full">
            <div class="score">
              ${[0,1,3,5].map(v=>`<button class="${Number(it.score||0)===v?'active':''}" ${locked?'disabled':''} data-score="${v}">${v}</button>`).join('')}
              <button class="icon-btn del" ${locked?'disabled':''} title="Elimina (+PIN)">🗑</button>
            </div>
          </div>
        `;
        // wire events (scoped so non si blocca niente)
        const [inpResp, taNotes, inpDate] = row1.querySelectorAll('input[type=text], textarea, input[type=date]');
        inpResp.oninput = e=>{ it.resp = e.target.value; save(state); };
        taNotes.oninput = e=>{ it.notes = e.target.value; save(state); };
        inpDate.onchange = e=>{ it.date = e.target.value; save(state); renderAll(); };

        row1.querySelectorAll('button[data-score]').forEach(btn=>{
          btn.onclick = ()=>{
            it.score = Number(btn.dataset.score);
            row1.querySelectorAll('button[data-score]').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            save(state); renderAll();
          };
        });
        row1.querySelector('.del').onclick = ()=>{
          if(!askPIN('PIN per eliminare la voce')) return;
          sez.items.splice(idx,1);
          if(!sez.items.length) sez.items.push({resp:'',notes:'',date:'',score:0});
          save(state); renderAll();
        };

        body.appendChild(row1);
      });

      return card;
    }

    function renderAll(){
      // KPIs + chips
      updateKPIs(); renderChips();

      // sections
      sections.innerHTML = '';
      state.s.forEach(sez=>{
        sections.appendChild(makeSection(sez));
      });

      // deep-link per “Vai alla S in ritardo: X”
      if(location.hash){
        const id = location.hash.slice(1);
        const t = document.getElementById(id);
        if(t) t.scrollIntoView({behavior:'smooth', block:'start'});
      }

      // apply lock UI
      applyLockUI();
    }

    function applyLockUI(){
      lockBtn.textContent = state.locked ? '🔓' : '🔒';
      // (inputs e bottoni già disabilitati se locked al render)
    }

    // toggle all (azzurro, funziona sempre: chiude se aperte, apre se chiuse)
    let allOpen = true;
    toggleAll.onclick = ()=>{
      const toggles = document.querySelectorAll('.details-toggle');
      allOpen = !allOpen;
      toggles.forEach(tg=>{
        const body = tg.nextElementSibling;
        body.style.display = allOpen ? 'block' : 'none';
        tg.firstChild.textContent = allOpen ? '▼' : '▶';
      });
    };

    // lock with PIN
    lockBtn.onclick = ()=>{
      if(!askPIN(state.locked ? 'PIN per sbloccare' : 'PIN per bloccare')) return;
      state.locked = !state.locked; save(state); applyLockUI();
    };

    // first paint
    renderAll();
  }

  return { initHome, initChecklist };
})();
