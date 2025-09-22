
/* SKF 5S v1k core */
(function(){
  const COLORS = {
    '1S':'#7e57c2','2S':'#ef5350','3S':'#f7b32b','4S':'#43a047','5S':'#2f6df6','LATE':'#ef5350'
  };
  const DEF = [
    { key:'1S', title:'Selezionare', color:COLORS['1S'], info:'Eliminare il superfluo.' },
    { key:'2S', title:'Sistemare',   color:COLORS['2S'], info:'Un posto per tutto e tutto al suo posto.' },
    { key:'3S', title:'Splendere',   color:COLORS['3S'], info:'Pulire e prevenire lo sporco.' },
    { key:'4S', title:'Standardizzare', color:COLORS['4S'], info:'Regole e segnali chiari.' },
    { key:'5S', title:'Sostenere',   color:COLORS['5S'], info:'Abitudine e miglioramento continuo.' },
  ];

  const KEY = (ch)=>`skf5s_${ch}`;
  const LOCK_KEY = (ch)=>`skf5s_${ch}_locked`;

  function load(ch){
    const raw = localStorage.getItem(KEY(ch));
    if(raw) try { return JSON.parse(raw) } catch(e){}
    // default dataset
    const data = { ch, items:{ '1S':[], '2S':[], '3S':[], '4S':[], '5S':[] } };
    localStorage.setItem(KEY(ch), JSON.stringify(data));
    return data;
  }
  function save(ch,data){ localStorage.setItem(KEY(ch), JSON.stringify(data)); }

  function mean(arr){
    if(!arr.length) return 0;
    let sum=0,c=0;
    arr.forEach(v=>{ if(typeof v==='number') {sum+=v;c++;} });
    return c? Math.round((sum/c)*100)/100 : 0;
  }
  function pctFromScores(items){
    if(!items.length) return 0;
    const v = mean(items.map(x=>Number(x.score||0)));
    return Math.round((v/5)*100);
  }
  function lateCount(data){
    const today = new Date().toISOString().slice(0,10);
    let n=0; DEF.forEach(d=>{
      data.items[d.key].forEach(x=>{ if(x.due && x.due<today && Number(x.score||0)<5) n++; });
    });
    return n;
  }
  function firstLateS(data){
    const today = new Date().toISOString().slice(0,10);
    for(const d of DEF){
      const hit = data.items[d.key].find(x=>x.due && x.due<today && Number(x.score||0)<5);
      if(hit) return d.key;
    }
    return null;
  }
  function avgAll(data){
    const arr=[]; DEF.forEach(d=>{
      const a=pctFromScores(data.items[d.key]); arr.push(a);
    });
    if(!arr.length) return 0;
    return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
  }

  function ensurePin(ok){
    const pin = window.__PIN__ || '2424';
    const v = prompt('Inserisci PIN');
    if(v===pin){ ok(); }
    else if(v!==null){ alert('PIN errato'); }
  }

  // Home
  function initHome(){
    const ch='CH24';
    const data=load(ch);
    // Build simple bar chart
    const wrap=document.getElementById('chart');
    wrap.innerHTML='';
    const barwrap=document.createElement('div'); barwrap.className='barwrap';
    const labels=[];
    DEF.forEach(d=>{
      const val=pctFromScores(data.items[d.key]);
      const bar=document.createElement('div'); bar.className='bar'; bar.style.background=d.color; bar.style.height=(val*1.6)+'px';
      const lab=document.createElement('label'); lab.textContent=val+'%'; lab.style.color=d.color;
      const cap=document.createElement('span'); cap.textContent=d.key;
      bar.appendChild(lab); bar.appendChild(cap); barwrap.appendChild(bar);
      labels.push({name:d.key,val, color:d.color});
    });
    // Late
    const late=lateCount(data);
    const lateBar=document.createElement('div'); lateBar.className='bar'; lateBar.style.background=COLORS.LATE; lateBar.style.height=(Math.min(late,100)*1.6)+'px';
    const lateLab=document.createElement('label'); lateLab.textContent=late; lateLab.style.color=COLORS.LATE;
    const lateCap=document.createElement('span'); lateCap.textContent='Ritardi';
    lateBar.appendChild(lateLab); lateBar.appendChild(lateCap); barwrap.appendChild(lateBar);
    wrap.appendChild(barwrap);

    // legend (optional small)
    const leg=document.createElement('div'); leg.className='legend';
    labels.forEach(l=>{
      const b=document.createElement('span'); b.className='badge'; b.innerHTML=`<i style="background:${l.color}"></i>${l.name}: ${l.val}%`;
      leg.appendChild(b);
    });
    const b2=document.createElement('span'); b2.className='badge'; b2.innerHTML=`<i style="background:${COLORS.LATE}"></i>Ritardi: ${late}`;
    leg.appendChild(b2);
    wrap.appendChild(leg);

    // late CTA
    const lkey = firstLateS(data);
    const lateCta=document.getElementById('lateCta');
    if(lkey){
      const link=document.getElementById('lateLink');
      link.href='checklist.html#'+lkey;
      lateCta.hidden=false;
    } else {
      lateCta.hidden=true;
    }
  }

  // Checklist
  function initChecklist(ch){
    const state={ch, data:load(ch)};
    const locked = localStorage.getItem(LOCK_KEY(ch))==='1';
    const btnLock=document.getElementById('btnLock');
    btnLock.textContent = locked? '🔒' : '🔓';

    btnLock.addEventListener('click',()=>{
      ensurePin(()=>{
        const cur = localStorage.getItem(LOCK_KEY(ch))==='1';
        localStorage.setItem(LOCK_KEY(ch), cur?'0':'1');
        btnLock.textContent = cur? '🔓':'🔒';
        render();
      });
    });

    document.getElementById('btnToggle').addEventListener('click',()=>{
      document.querySelectorAll('.section .body').forEach(b=>{
        b.open = !b.open;
      });
    });

    function addItem(key){
      const it={title:'', resp:'', notes:'', score:0, due:''};
      state.data.items[key].push(it);
      save(ch,state.data); render();
    }
    function delItem(key, idx){
      ensurePin(()=>{
        state.data.items[key].splice(idx,1);
        save(ch,state.data); render();
      });
    }
    function setScore(key, idx, val){
      state.data.items[key][idx].score = val;
      save(ch,state.data); renderSummary();
    }

    function renderSummary(){
      const srow=document.getElementById('summaryRow');
      srow.innerHTML='';
      DEF.forEach(d=>{
        const pct=pctFromScores(state.data.items[d.key]);
        const chip=document.createElement('div'); chip.className=`sumchip s${d.key[0]}`;
        chip.innerHTML=`${d.key} <span class="pct">${pct}%</span>`;
        srow.appendChild(chip);
      });
      // KPI
      document.getElementById('kAvg').textContent = avgAll(state.data) + '%';
      document.getElementById('kLate').textContent = lateCount(state.data);
      // highlight overdue sections
      const today = new Date().toISOString().slice(0,10);
      DEF.forEach(d=>{
        const sec=document.getElementById('sec_'+d.key);
        const hasLate = state.data.items[d.key].some(x=>x.due && x.due<today && Number(x.score||0)<5);
        sec.classList.toggle('overdue', hasLate);
      });
    }

    function render(){
      const sections=document.getElementById('sections');
      sections.innerHTML='';
      const isLocked = localStorage.getItem(LOCK_KEY(ch))==='1';

      DEF.forEach(d=>{
        const sec=document.createElement('div'); sec.className='section'; sec.id='sec_'+d.key;
        sec.innerHTML=`
          <div class="secHead">
            <div class="secColor" style="background:${d.color}"></div>
            <strong>${d.key} — ${d.title}</strong>
            <span class="secAvg" id="avg_${d.key}">Media: 0%</span>
            <button class="icon s${d.key[0]} info" title="Info">i</button>
            <button class="plus add" title="Aggiungi">+</button>
          </div>
          <details class="body" ${location.hash.slice(1)===d.key?'open':''}></details>
        `;
        const body=sec.querySelector('.body');

        // add items
        const arr=state.data.items[d.key];
        if(!arr.length) arr.push({title:'', resp:'', notes:'', score:0, due:''});
        arr.forEach((it,idx)=>{
          const item=document.createElement('div'); item.className='item';
          item.innerHTML=`
            <input type="text" placeholder="Titolo voce..." value="${it.title||''}" ${isLocked?'disabled':''}>
            <input type="text" placeholder="Responsabile..." value="${it.resp||''}" ${isLocked?'disabled':''}>
            <textarea placeholder="Note..." ${isLocked?'disabled':''}>${it.notes||''}</textarea>
            <div class="row">
              <div class="score">
                ${[0,1,3,5].map(v=>`<button ${isLocked?'disabled':''} data-v="${v}" class="${Number(it.score||0)===v?'active':''}">${v}</button>`).join('')}
              </div>
              <input type="date" value="${it.due||''}" ${isLocked?'disabled':''}>
              <button class="btn trash" ${isLocked?'disabled':''}>🗑️</button>
            </div>
          `;
          const [inpTitle, inpResp, taNotes] = item.querySelectorAll('input[type=text], textarea');
          const dateInput = item.querySelector('input[type=date]');
          const scoreBtns = item.querySelectorAll('.score button');
          const trash = item.querySelector('.trash');

          inpTitle.addEventListener('input', e=>{ it.title=e.target.value; save(ch,state.data); });
          inpResp.addEventListener('input', e=>{ it.resp=e.target.value; save(ch,state.data); });
          taNotes.addEventListener('input', e=>{ it.notes=e.target.value; save(ch,state.data); });
          dateInput.addEventListener('change', e=>{ it.due=e.target.value; save(ch,state.data); renderSummary(); });

          scoreBtns.forEach(btn=>{
            btn.addEventListener('click', ()=>{
              setScore(d.key, idx, Number(btn.dataset.v));
            });
          });
          trash.addEventListener('click', ()=> delItem(d.key, idx));

          body.appendChild(item);
        });

        // avg per section
        const avg=pctFromScores(state.data.items[d.key]);
        sec.querySelector('#avg_'+d.key).textContent = `Media: ${avg}%`;

        // buttons
        sec.querySelector('.add').addEventListener('click', ()=>{
          ensurePin(()=>addItem(d.key));
        });
        sec.querySelector('.info').addEventListener('click', ()=>{
          const dlg=document.getElementById('dlgInfo');
          const body=document.getElementById('dlgInfoBody');
          body.innerHTML=`<div style="padding:10px"><div class="pill s${d.key[0]}" style="display:inline-block">${d.key} — ${d.title}</div><p style="margin-top:10px">${d.info}</p></div>`;
          dlg.showModal();
        });

        sections.appendChild(sec);
      });

      document.getElementById('dlgClose').onclick=()=>document.getElementById('dlgInfo').close();
      renderSummary();
    }

    render();
  }

  window.SKF5S = { initHome, initChecklist };
})();
