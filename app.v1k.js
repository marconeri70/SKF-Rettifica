/* ===== SKF 5S v1k (CH24) ===== */
const SKF5S = (()=>{

  // --- constants
  const COLORS = { '1S':'#7E57C2','2S':'#EF5350','3S':'F4B400','4S':'#2ECC71','5S':'#1E88E5', LATE:'#EF5350' };
  const KEY = 'skf5s:CH24:v1k';
  const CH  = 'CH24';
  const AREA= 'Rettifica';
  const VERSION='v1k';

  // --- data helpers
  const defaultState = ()=>({
    locked:false,
    s:[
      {id:'1S',name:'Selezionare',color:COLORS['1S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'2S',name:'Sistemare',  color:COLORS['2S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'3S',name:'Splendere',  color:COLORS['3S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'4S',name:'Standardizzare',color:COLORS['4S'],items:[{resp:'',notes:'',date:'',score:0}]},
      {id:'5S',name:'Sostenere',  color:COLORS['5S'],items:[{resp:'',notes:'',date:'',score:0}]}
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

  // --- UTILS
  const cssVar  = v => getComputedStyle(document.documentElement).getPropertyValue(v);
  const colorVarFor = id => ({'1S':'--s1','2S':'--s2','3S':'--s3','4S':'--s4','5S':'--s5'}[id]||'--s5');
  const todayISO = ()=> new Date().toISOString();

  // --- HOME (SVG bar chart + Ritardi multipli + Export)
  function initHome(){
    const state = load();
    const perS = state.s.map(x=>({id:x.id, name:x.name, color:x.color, p:pct(x), late:x.items.filter(isLateItem).length}));
    const lateAll = lateCount(state);

    // draw chart (SVG, con label non sovrapposte)
    const wrap = document.getElementById('chart');
    const legend = document.getElementById('legend');
    wrap.innerHTML = ''; legend.innerHTML = '';
    const W = wrap.clientWidth || 640, H = wrap.clientHeight || 280;
    const PAD = {t:16, r:16, b:60, l:28};
    const n = 6; // 5S + Ritardi
    const bw = (W-PAD.l-PAD.r)/n * 0.58, gap = (W-PAD.l-PAD.r)/n * 0.42;
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
    wrap.appendChild(svg);

    const data = [...perS.map(s=>({label:s.id, val:s.p, color:s.color, isLate:false})), {label:'Ritardi', val:lateAll, color:cssVar('--late-border')||'#EF5350', isLate:true}];

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
    perS.forEach(s=>{
      const el = document.createElement('div');
      el.innerHTML = `<span class="dot" style="background:${s.color}"></span> ${s.id}: <b>${s.p}%</b>`;
      legend.appendChild(el);
    });
    const l = document.createElement('div');
    l.innerHTML = `<span class="dot" style="background:#EF5350"></span> Ritardi: <b>${lateAll}</b>`;
    legend.appendChild(l);

    // CTA MULTIPLE: “1S in ritardo”, “3S in ritardo”, ecc.
    const ctaWrap = document.getElementById('ctaLate');
    ctaWrap.innerHTML = '';
    perS.filter(s=>s.late>0).forEach(s=>{
      const a = document.createElement('a');
      a.className='btn';
      a.href = `checklist.html#${s.id}`;
      a.textContent = `${s.id} in ritardo (${s.late})`;
      ctaWrap.appendChild(a);
    });

    // EXPORT JSON per Supervisore (PIN)
    const btnExport = document.getElementById('btnExport');
    if(btnExport){
      btnExport.onclick = ()=>{
        if(!askPIN('PIN per esportare')) return;
        const payload = buildSupervisorPayload(state);
        const name = `skf5s_${CH}_${AREA}_${new Date().toISOString().slice(0,10)}.json`;
        downloadJSON(payload, name);
      };
    }
  }

  // Payload compatibile “Supervisore”
  function buildSupervisorPayload(state){
    const per = state.s.map(s=>({ id:s.id, name:s.name, pct: pct(s), late: s.items.filter(isLateItem).length }));
    return {
      app: "skf5s",
      version: VERSION,
      ch: CH,
      area: AREA,
      updatedAt: todayISO(),
      kpis: {
        avg: Math.round(per.reduce((a,b)=>a+b.pct,0)/per.length) || 0,
        late: lateCount(state),
        perS: per
      },
      data: state.s.map(s=>({
        id: s.id,
        name: s.name,
        items: s.items.map(it=>({
          resp: it.resp||"",
          notes: it.notes||"",
          date: it.date||"",
          score: Number(it.score||0)
        }))
      }))
    };
  }

  function downloadJSON(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  // --- CHECKLIST (apertura S da hash)
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
        c.onclick = ()=> openSection(sez.id, true);
        chips.appendChild(c);
      });
    }

    function openSection(id, scroll){
      const sec = document.getElementById(id);
      if(!sec) return;
      const toggle = sec.querySelector('.details-toggle');
      const body   = sec.querySelector('.details');
      // forza apertura
      body.style.display = 'block';
      if(toggle && toggle.firstChild) toggle.firstChild.textContent = '▼';
      if(scroll) sec.scrollIntoView({behavior:'smooth', block:'start'});
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

      // details toggle + body
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
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = `
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

        // events
        const [inpResp, taNotes, inpDate] = row.querySelectorAll('input[type=text], textarea, input[type=date]');
        inpResp.oninput = e=>{ it.resp=e.target.value; save(state); };
        taNotes.oninput = e=>{ it.notes=e.target.value; save(state); };
        inpDate.onchange= e=>{ it.date=e.target.value; save(state); renderAll(); };

        row.querySelectorAll('button[data-score]').forEach(btn=>{
          btn.onclick = ()=>{
            it.score = Number(btn.dataset.score);
            row.querySelectorAll('button[data-score]').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            save(state); renderAll();
          };
        });
        row.querySelector('.del').onclick = ()=>{
          if(!askPIN('PIN per eliminare la voce')) return;
          sez.items.splice(idx,1);
          if(!sez.items.length) sez.items.push({resp:'',notes:'',date:'',score:0});
          save(state); renderAll();
        };

        body.appendChild(row);
      });

      return card;
    }

    function renderAll(){
      // KPIs + chips
      updateKPIs(); renderChips();

      // sections
      sections.innerHTML = '';
      state.s.forEach(sez=> sections.appendChild(makeSection(sez)));

      // deep-link (apre davvero la S)
      if(location.hash){
        openSection(location.hash.slice(1), true);
      }

      applyLockUI();
    }

    // toggle all (azzurro, chiude/apre sempre)
    let allOpen = true;
    document.getElementById('toggleAll').onclick = ()=>{
      allOpen = !allOpen;
      document.querySelectorAll('.details-toggle').forEach(tg=>{
        const body = tg.nextElementSibling;
        body.style.display = allOpen ? 'block' : 'none';
        tg.firstChild.textContent = allOpen ? '▼' : '▶';
      });
    };

    // lock with PIN
    function applyLockUI(){
      document.getElementById('lockBtn').textContent = state.locked ? '🔓' : '🔒';
    }
    document.getElementById('lockBtn').onclick = ()=>{
      if(!askPIN(state.locked?'PIN per sbloccare':'PIN per bloccare')) return;
      state.locked = !state.locked; save(state); applyLockUI(); renderAll();
    };

    renderAll();
  }

  return { initHome, initChecklist };
})();
