(function(){
var d=document,P='/assets/pieces.svg#',root=d.documentElement;
function isDark(){return root.classList.contains('dark')}
function applyTheme(dark){root.classList.toggle('dark',!!dark);localStorage.setItem('tema',dark?'dark':'light')}
d.querySelectorAll('.theme-btn').forEach(function(b){b.onclick=function(){applyTheme(!isDark())}});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){if(!localStorage.getItem('tema'))applyTheme(e.matches)});

/* reading preferences (Aa) */
var curSize=localStorage.getItem('ba:reading-size')||'m';
function applyReadingSize(sz){
  curSize=sz;
  root.setAttribute('data-reading-size',sz);
  localStorage.setItem('ba:reading-size',sz);
  d.querySelectorAll('.read-pref-opt').forEach(function(b){
    b.classList.toggle('active',b.dataset.size===sz);
  });
}
applyReadingSize(curSize);
var prefBox=d.querySelector('.read-pref');
var prefBtn=d.getElementById('read-pref-toggle');
if(prefBtn&&prefBox){
  prefBtn.addEventListener('click',function(e){
    e.stopPropagation();
    var isOpen=prefBox.classList.toggle('open');
    prefBtn.setAttribute('aria-expanded',isOpen?'true':'false');
  });
  d.addEventListener('click',function(e){
    if(!e.target.closest('.read-pref')){
      prefBox.classList.remove('open');
      prefBtn.setAttribute('aria-expanded','false');
    }
  });
  d.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&prefBox.classList.contains('open')){
      prefBox.classList.remove('open');
      prefBtn.setAttribute('aria-expanded','false');
      prefBtn.focus();
    }
  });
}
d.addEventListener('click',function(e){
  var opt=e.target.closest('.read-pref-opt');
  if(opt&&opt.dataset.size){
    applyReadingSize(opt.dataset.size);
  }
});

/* El lateral permanece visible; las preferencias antiguas de plegado ya no se aplican. */
root.classList.remove('focus-mode');
var desktopNav=matchMedia('(min-width:768px)');
function paintNavigation(){
  var side=d.getElementById('site-sidebar');if(side)side.inert=!desktopNav.matches;
}
desktopNav.addEventListener('change',paintNavigation);paintNavigation();
/* Diálogos: gesto solo en el tirador móvil; la cabecera y el cierre son estables. */
var phoneDialog=matchMedia('(max-width:767px)');
function dialogViewport(){
  if(phoneDialog.matches&&window.visualViewport){root.style.setProperty('--dialog-viewport-height',window.visualViewport.height+'px');root.style.setProperty('--dialog-bottom',Math.max(0,innerHeight-window.visualViewport.height-window.visualViewport.offsetTop)+'px');}
  else{root.style.removeProperty('--dialog-viewport-height');root.style.removeProperty('--dialog-bottom');}
}
if(window.visualViewport){visualViewport.addEventListener('resize',dialogViewport);visualViewport.addEventListener('scroll',dialogViewport);}
window.addEventListener('resize',dialogViewport);dialogViewport();
function sheet(dlg){var sh=dlg.querySelector('.sheet-in'),handle=dlg.querySelector('.grab'),closing=null,y0=null,dy=0;
  function reset(){y0=null;dy=0;sh.style.transform='';}
  function close(){if(!dlg.open||closing)return;reset();dlg.classList.add('out');closing=setTimeout(function(){closing=null;dlg.classList.remove('out');dlg.close();},matchMedia('(prefers-reduced-motion:reduce)').matches?0:180);}
  dlg.closeSheet=close;dlg.querySelectorAll('[data-close]').forEach(function(b){b.onclick=close;});
  dlg.addEventListener('click',function(e){if(e.target===dlg)close();});
  dlg.addEventListener('cancel',function(e){e.preventDefault();close();});
  dlg.addEventListener('close',function(){clearTimeout(closing);closing=null;dlg.classList.remove('out');reset();});
  phoneDialog.addEventListener('change',reset);
  if(handle){
    handle.addEventListener('touchstart',function(e){if(phoneDialog.matches){y0=e.touches[0].clientY;dy=0;}},{passive:true});
    handle.addEventListener('touchmove',function(e){if(y0===null||!phoneDialog.matches)return;dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform='translateY('+dy+'px)';},{passive:true});
    handle.addEventListener('touchend',function(){if(y0===null)return;var dismiss=dy>90;reset();if(dismiss)close();});
    handle.addEventListener('touchcancel',reset);
  }
}
function openSheet(dlg){d.querySelectorAll('dialog[open]').forEach(function(x){x.close();});dlg.showModal();var si=dlg.querySelector('.sheet-in');if(si)si.focus({preventScroll:true});var c=dlg.querySelector('.cur,.mv.on');if(c)c.scrollIntoView({block:'center'});if(dlg.id==='search'){q.focus();load();}}
d.querySelectorAll('dialog.sheet').forEach(sheet);
d.addEventListener('click',function(e){var b=e.target.closest('[data-open]');if(b){var t=d.getElementById(b.dataset.open);if(t)openSheet(t);}});
/* Resultado global de acciones: texto seguro, foco contenido y retorno al control anterior. */
var alertDialog=d.getElementById('app-alert'),alertReturn=null;
window.baAlert=function(options){
  if(!alertDialog)return;
  var value=typeof options==='string'?{message:options}:options||{};
  alertReturn=d.activeElement;
  alertDialog.querySelector('[data-alert-title]').textContent=value.title||'Aviso';
  alertDialog.querySelector('[data-alert-message]').textContent=value.message||'';
  alertDialog.dataset.tone=['success','error'].indexOf(value.tone)>=0?value.tone:'info';
  openSheet(alertDialog);
  alertDialog.querySelector('[data-alert-confirm]').focus({preventScroll:true});
};
alertDialog&&alertDialog.addEventListener('close',function(){if(alertReturn&&alertReturn.isConnected)alertReturn.focus({preventScroll:true});alertReturn=null;});
d.querySelectorAll('[data-alert-preview]').forEach(function(button){button.addEventListener('click',function(){window.baAlert({title:'Aviso de ejemplo',message:'La acción terminó y puedes continuar.',tone:'success'});});});
var nav=d.querySelector('.nav'),idxS=d.getElementById('idx');
if(idxS){nav.classList.add('has-idx');nav.addEventListener('click',function(e){if(!e.target.closest('a,button,[data-open]'))openSheet(idxS);});
  var nt=nav.querySelector('.nav-t');if(nt)nt.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openSheet(idxS);}});}
/* search */
var q=d.getElementById('q'),res=d.getElementById('results'),idx;
function load(){if(!idx)fetch('/search.json').then(function(r){return r.json()}).then(function(j){idx=j;q.oninput()})}
var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')};
if(q)q.oninput=function(){var v=norm(q.value.trim());res.innerHTML='';if(!idx||v.length<3)return;idx.filter(function(e){return norm(e.t+' '+e.x).indexOf(v)>=0}).slice(0,25).forEach(function(e){var li=d.createElement('li');li.innerHTML='<a class="row" href="'+e.u+'"><span class="row-b"><span class="row-t"></span><span class="row-s"></span></span></a>';li.querySelector('.row-t').textContent=e.t;li.querySelector('.row-s').textContent=e.d;res.appendChild(li)})};
/* progress reading */
var prog=d.getElementById('prog'),ly=scrollY,tk=false;
function onS(){var y=scrollY;if(Math.abs(y-ly)>6){d.body.classList.toggle('navhide',y>ly&&y>120);ly=y}
  var h=d.documentElement.scrollHeight-innerHeight;if(prog)prog.style.transform='scaleX('+(h>0?Math.min(1,y/h):0)+')';tk=false}
addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(onS)}},{passive:true});onS();
/* localStorage reading position for Continuar / Seguir leyendo */
try{var key='ba:pos',map=JSON.parse(localStorage.getItem(key)||'{}'),art=d.querySelector('[data-chapter]');
  ['peones','caballo','alfil','torre'].forEach(function(piece){
    var old=piece+'/basico',next='guias/'+piece+'-basico',entry=map[old];
    if(entry){
      entry.u=entry.u.replace('/'+old+'/', '/'+next+'/');
      if(!map[next]||entry.at>map[next].at)map[next]=entry;
      delete map[old];
    }
  });
  localStorage.setItem(key,JSON.stringify(map));
  if(art){var parts=location.pathname.split('/').filter(Boolean),h1=d.querySelector('h1');if(parts.length>=2){map[parts[0]+'/'+parts[1]]={u:location.pathname,at:Date.now(),t:h1?h1.textContent:'',d:art.getAttribute('data-doc')||''};localStorage.setItem(key,JSON.stringify(map))}}
  d.querySelectorAll('[data-continue]').forEach(function(a){var slug=(a.getAttribute('href')||'').split('/').filter(Boolean).slice(0,2).join('/');
    if(map[slug]){a.textContent='Continuar';a.setAttribute('href',map[slug].u)}});
  var sg=d.getElementById('seguir'),last=Object.keys(map).map(function(k){return map[k]}).filter(function(v){return v.t}).sort(function(a,b){return b.at-a.at})[0];
  if(sg&&last){var c=sg.querySelector('[data-seguir]');c.querySelector('.card-t').textContent=last.t;c.querySelector('.card-s').textContent=last.d;c.querySelector('.btn').setAttribute('href',last.u);sg.hidden=false}}catch(e){}
/* Toc: abierto en computador, plegado en teléfono */
if(matchMedia('(min-width:1440px)').matches)d.querySelectorAll('[data-toc]').forEach(function(t){t.open=true});
/* boards */
function Game(fig){
  var N=JSON.parse(fig.querySelector('script').textContent),b=fig.querySelector('.board'),now=fig.querySelector('.now'),strip=fig.querySelector('.strip'),dlg=fig.querySelector('dialog'),sheetNote=dlg&&dlg.querySelector('.now'),flip=fig.dataset.orientation==='black',cur=0,sq={},mvs={},shown='';
  fig.querySelectorAll('.moves .mv').forEach(function(m){mvs[m.dataset.i]=m;m.onclick=function(){go(+m.dataset.i);if(!matchMedia('(max-width:767px)').matches)dlg.closeSheet()}});
  function draw(){b.innerHTML='';sq={};for(var r=0;r<8;r++)for(var f=0;f<8;f++){var R=flip?r:7-r,F=flip?7-f:f,e=d.createElement('div');e.className='sq'+((R+F)%2?'':' d');e.dataset.sq='abcdefgh'[F]+(R+1);
    if(r===7)e.insertAdjacentHTML('beforeend','<span class="cr f">'+'abcdefgh'[F]+'</span>');if(f===0)e.insertAdjacentHTML('beforeend','<span class="cr r">'+(R+1)+'</span>');sq['abcdefgh'[F]+(R+1)]=e;b.appendChild(e)}set()}
  function line(){var p=[],i=cur;while(i>0){p.unshift(i);i=N[i][1]}i=N[cur][4];while(i>=0){p.push(i);i=N[i][4]}return p}
  function drawStrip(){if(!strip)return;var p=line(),k=p.join(',');if(k!==shown){shown=k;strip.innerHTML='';p.forEach(function(i,j){var c=d.createElement('button');c.type='button';c.className='chip';c.dataset.i=i;c.innerHTML=(N[i][5].indexOf('…')<0||j===0?'<i>'+N[i][5]+'</i>':'')+N[i][6];c.onclick=function(){go(i)};strip.appendChild(c)})}
    var on=null;strip.querySelectorAll('.chip').forEach(function(c){var t=+c.dataset.i===cur;c.classList.toggle('on',t);if(t)on=c});strip.scrollTo({left:on?on.offsetLeft-strip.clientWidth/2+on.offsetWidth/2:0,behavior:'smooth'})}
  function set(){var before=window.baBoardUI&&window.baBoardUI.snapshot(b);var n=N[cur];for(var k in sq){var s=sq[k],p=s.querySelector('svg');if(p)p.remove();s.classList.toggle('hl',k===n[2]||k===n[3])}
    n[0].split(' ')[0].split('/').forEach(function(row,i){var f=0;for(var c of row){if(c>='1'&&c<='8'){f+=+c;continue}sq['abcdefgh'[f]+(8-i)].insertAdjacentHTML('beforeend','<svg viewBox="0 0 40 40"><use href="'+P+(c===c.toUpperCase()?'w':'b')+c.toLowerCase()+'"/></svg>');f++}});
    if(window.baBoardUI)window.baBoardUI.animate(b,before);
    for(var i in mvs)mvs[i].classList.toggle('on',+i===cur);drawStrip();inl();
    if(now||sheetNote){var m=mvs[cur],html='';if(m){var comments=fig.querySelectorAll('.moves .cm[data-for="'+cur+'"]');html='<span class="s">'+m.innerHTML+'</span>'+Array.from(comments,function(c){return c.innerHTML}).join(' ')}if(now)now.innerHTML=html;if(sheetNote)sheetNote.innerHTML=html}}
  /* PC: lista de jugadas al lado del tablero; mantiene a la vista la jugada actual y su comentario */
  function inl(){if(!dlg||dlg.open||!dlg.offsetParent)return;var box=dlg.querySelector('.moves'),m=mvs[cur];if(!box)return;if(!m){box.scrollTop=0;return}var c=m.nextElementSibling,end=m.offsetTop+m.offsetHeight;if(c&&c.classList.contains('cm'))end=c.offsetTop+c.offsetHeight;var t=box.scrollTop,h=box.clientHeight;if(m.offsetTop<t+8)box.scrollTo({top:m.offsetTop-8,behavior:'smooth'});else if(end>t+h-8)box.scrollTo({top:Math.min(m.offsetTop-8,end-h+8),behavior:'smooth'})}
  function go(i){if(i<0||i>=N.length)return;cur=i;set()}
  function act(a){if(a==='next')go(N[cur][4]);else if(a==='prev')go(N[cur][1]);else if(a==='first')go(0);else if(a==='last'){var i=cur;while(N[i][4]>=0)i=N[i][4];go(i)}else if(a==='flip'){flip=!flip;draw()}else if(a==='moves')openSheet(dlg)}
  fig.querySelectorAll('[data-a]').forEach(function(x){x.onclick=function(){act(x.dataset.a)}});
  var x0=null;b.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
  b.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;act(Math.abs(dx)>40&&dx>0?'prev':'next');x0=null});
  fig.tabIndex=0;fig.addEventListener('keydown',function(e){if(e.key==='ArrowRight')act('next');if(e.key==='ArrowLeft')act('prev')});
  var ply=+fig.dataset.ply||0;draw();while(ply-->0&&N[cur][4]>=0)go(N[cur][4]);
}
d.querySelectorAll('figure.game').forEach(Game);
window.baGame=Game; /* lo reutiliza Táctica a ciegas para «Ver tablero» */

/* ——— Chess Training Engine (Reverse-engineered & enhanced) ——— */
var files = 'abcdefgh';
var allSquares = [];
for (var f = 0; f < 8; f++) {
  for (var r = 1; r <= 8; r++) {
    allSquares.push(files[f] + r);
  }
}
function isWhite(sq) {
  var c = sq.charCodeAt(0) - 96;
  var r = parseInt(sq.charAt(1), 10);
  return (c + r) % 2 !== 0;
}
function getKnightMoves(sq) {
  var c = sq.charCodeAt(0) - 96, r = parseInt(sq.charAt(1), 10);
  var deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  var res = [];
  deltas.forEach(function(d) {
    var nc = c + d[0], nr = r + d[1];
    if (nc >= 1 && nc <= 8 && nr >= 1 && nr <= 8) {
      res.push(files[nc - 1] + nr);
    }
  });
  return res;
}
function getTwoKnightMoves(sq) {
  var m1 = getKnightMoves(sq);
  var set = {};
  m1.forEach(function(s) {
    getKnightMoves(s).forEach(function(s2) {
      if (s2 !== sq) set[s2] = true;
    });
  });
  return Object.keys(set);
}
function getPieceMoves(type, sq) {
  var c = sq.charCodeAt(0) - 96, r = parseInt(sq.charAt(1), 10);
  var res = [];
  if (type === 'R') {
    for (var i = 1; i <= 8; i++) {
      if (i !== c) res.push(files[i - 1] + r);
      if (i !== r) res.push(files[c - 1] + i);
    }
  } else if (type === 'B') {
    for (var i = 1; i <= 8; i++) {
      if (i !== c) {
        var d1 = i - c;
        if (r + d1 >= 1 && r + d1 <= 8) res.push(files[i - 1] + (r + d1));
        if (r - d1 >= 1 && r - d1 <= 8) res.push(files[i - 1] + (r - d1));
      }
    }
  } else if (type === 'N') {
    res = getKnightMoves(sq);
  }
  return res;
}
function drawHelpBoard(boardEl, highlights) {
  if (!boardEl) return;
  boardEl.innerHTML = '';
  var sqMap = {};
  for (var r = 0; r < 8; r++) {
    for (var f = 0; f < 8; f++) {
      var R = 7 - r, F = f;
      var sqName = files[F] + (R + 1);
      var e = d.createElement('div');
      e.className = 'sq' + ((R + F) % 2 ? '' : ' d');
      if (r === 7) e.insertAdjacentHTML('beforeend', '<span class="cr f">' + files[F] + '</span>');
      if (f === 0) e.insertAdjacentHTML('beforeend', '<span class="cr r">' + (R + 1) + '</span>');
      sqMap[sqName] = e;
      boardEl.appendChild(e);
    }
  }
  if (highlights) {
    highlights.forEach(function(h) {
      var cell = sqMap[h.sq];
      if (cell) {
        if (h.cls) cell.classList.add(h.cls);
        if (h.piece) {
          cell.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 40 40"><use href="' + P + 'w' + h.piece.toLowerCase() + '"/></svg>');
        }
      }
    });
  }
}

function setupGenericTrainer(vt, cfg) {
  if (!vt) return;
  var timeSheet = d.getElementById('time-sheet');
  var timeBtn = d.getElementById('tr-time-btn');
  var timeLabel = d.getElementById('tr-time-label');
  var timerEl = d.getElementById('tr-timer');
  var okEl = d.getElementById('tr-ok');
  var errEl = d.getElementById('tr-err');
  var arenaEl = d.getElementById('tr-arena');
  var fbEl = d.getElementById('tr-feedback');
  var choicesEl = d.getElementById('tr-choices');
  var pauseBtn = d.getElementById('tr-pause');
  var resetBtn = d.getElementById('tr-reset');

  /* Modal de resumen final */
  var summaryDlg = d.getElementById('tr-summary-dialog');
  var modalAcc = d.getElementById('tr-modal-acc');
  var modalSubtitle = d.getElementById('tr-modal-subtitle');
  var modalOk = d.getElementById('tr-modal-ok');
  var modalErr = d.getElementById('tr-modal-err');
  var modalStreak = d.getElementById('tr-modal-streak');
  var modalSpeed = d.getElementById('tr-modal-speed');
  var modalTime = d.getElementById('tr-modal-time');
  var modalTotal = d.getElementById('tr-modal-total');
  var againBtn = d.getElementById('tr-again');

  /* Modal de ayuda con tablero al fallar */
  var helpDlg = d.getElementById('tr-help-dialog');
  var helpBoardEl = d.getElementById('tr-help-board');
  var helpTitle = d.getElementById('tr-help-title');
  var helpDesc = d.getElementById('tr-help-desc');
  var helpNote = d.getElementById('tr-help-note');
  var helpContinue = d.getElementById('tr-help-continue');
  var helpSettingBtn = d.getElementById('tr-help-setting');

  var helpEnabled = localStorage.getItem('trainer_help_board') === 'true';

  function updateHelpUI() {
    if (helpSettingBtn) {
      helpSettingBtn.classList.toggle('on', helpEnabled);
      helpSettingBtn.setAttribute('aria-pressed', helpEnabled ? 'true' : 'false');
    }
  }
  updateHelpUI();

  function toggleHelp() {
    helpEnabled = !helpEnabled;
    localStorage.setItem('trainer_help_board', helpEnabled ? 'true' : 'false');
    updateHelpUI();
  }
  if (helpSettingBtn) helpSettingBtn.onclick = toggleHelp;
  var activeSquaresSet={};
  allSquares.forEach(function(square){activeSquaresSet[square]=true;});

  var dur = 300;
  var timeRemaining = 300;
  var timeElapsed = 0;
  var timerId = null;
  var fbTimer = null;
  var isRunning = false;
  var isPaused = false;
  var currentQuestion = null;
  var ok = 0;
  var err = 0;
  var streak = 0;
  var maxStreak = 0;

  var durLabels = { '180': '3 min', '300': '5 min', '600': '10 min', '900': '15 min', '0': 'Eterno (∞)' };

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function updateTimerDisp() {
    if (!timerEl) return;
    if (dur === 0) {
      timerEl.textContent = fmtTime(timeElapsed);
      timerEl.classList.remove('warn');
    } else {
      timerEl.textContent = fmtTime(timeRemaining);
      timerEl.classList.toggle('warn', timeRemaining <= 30 && timeRemaining > 0);
    }
  }

  function updateStats() {
    if (okEl) okEl.textContent = ok;
    if (errEl) errEl.textContent = err;
  }

  function updateSessionView() {
    var active = isRunning && !isPaused;
    vt.dataset.state = active ? 'running' : (isPaused ? 'paused' : 'ready');
    vt.querySelector('[data-session-title]').textContent = isPaused ? 'En pausa' : 'Listo para practicar';
    vt.querySelector('[data-session-description]').textContent = isPaused
      ? 'El reloj está detenido.'
      : 'Pulsa Iniciar para ver el ejercicio. El reloj empieza entonces.';
    Array.prototype.forEach.call(arenaEl.children, function(el) {
      if (el === fbEl) return;
      el.inert = !active;
      if (active) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });
    choicesEl.inert = !active;
    choicesEl.setAttribute('aria-hidden', active ? 'false' : 'true');
    if (pauseBtn) {
      pauseBtn.textContent = active ? 'Pausar' : (isPaused ? 'Reanudar' : 'Iniciar');
      pauseBtn.classList.toggle('btn-primary', !active);
      pauseBtn.classList.toggle('btn-outline', active);
      pauseBtn.disabled = false;
    }
  }

  function pauseSession() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    if (fbTimer) clearTimeout(fbTimer);
    arenaEl.classList.remove('arena-ok', 'arena-bad');
    fbEl.className = 'trainer-feedback';
    fbEl.textContent = 'En pausa. Pulsa Reanudar para continuar.';
    updateSessionView();
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    isPaused = false;
    if (pauseBtn) pauseBtn.textContent = 'Pausar';
    timerId = setInterval(function() {
      if (isPaused) return;
      if (dur === 0) {
        timeElapsed++;
        updateTimerDisp();
      } else {
        timeRemaining--;
        updateTimerDisp();
        if (timeRemaining <= 0) finish();
      }
    }, 1000);
  }

  function nextQ() {
    currentQuestion = cfg.generate(activeSquaresSet);
    cfg.render(currentQuestion, arenaEl, choicesEl);
  }

  function answer(val) {
    if (!isRunning || isPaused || !currentQuestion) return;

    var res = cfg.check(currentQuestion, val);
    d.dispatchEvent(new CustomEvent('ba-practice-score',{detail:{attempts:1,correct:res.correct?1:0}}));
    if (fbTimer) clearTimeout(fbTimer);

    if (res.correct) {
      ok++;
      streak++;
      if (streak > maxStreak) maxStreak = streak;
      if (arenaEl) {
        arenaEl.classList.remove('arena-bad');
        arenaEl.classList.add('arena-ok');
      }
      fbEl.className = 'trainer-feedback ok';
      fbEl.textContent = '¡Correcto!';
      fbTimer = setTimeout(function() {
        if (arenaEl) arenaEl.classList.remove('arena-ok');
        fbEl.textContent = '';
      }, 400);
      updateStats();
      nextQ();
    } else {
      err++;
      streak = 0;
      updateStats();
      if (arenaEl) {
        arenaEl.classList.remove('arena-ok');
        arenaEl.classList.add('arena-bad');
      }
      fbEl.className = 'trainer-feedback bad';
      fbEl.textContent = res.message || 'Incorrecto';

      if (helpEnabled && cfg.explain && helpDlg && helpBoardEl) {
        var wasRunning = isRunning && !isPaused;
        if (wasRunning) pauseSession();
        var exp = cfg.explain(currentQuestion, val);
        if (helpTitle) helpTitle.textContent = exp.title || 'Casilla incorrecta';
        if (helpDesc) helpDesc.innerHTML = exp.desc || '';
        if (helpNote) helpNote.innerHTML = exp.note || '';
        drawHelpBoard(helpBoardEl, exp.highlights);
        openSheet(helpDlg);
        if (helpContinue) helpContinue.focus();

        var resumed = false;
        function resumeFromHelp() {
          if (resumed) return;
          resumed = true;
          if (helpDlg.open) {
            if (typeof helpDlg.closeSheet === 'function') helpDlg.closeSheet();
            else if (helpDlg.close) helpDlg.close();
          }
          if (wasRunning) isPaused = false;
          if (arenaEl) arenaEl.classList.remove('arena-bad');
          fbEl.textContent = '';
          fbEl.className = 'trainer-feedback';
          nextQ();
          updateSessionView();
        }

        if (helpContinue) helpContinue.onclick = resumeFromHelp;
        helpDlg.onclose = resumeFromHelp;
      } else {
        fbTimer = setTimeout(function() {
          if (arenaEl) arenaEl.classList.remove('arena-bad');
          fbEl.textContent = '';
          fbEl.className = 'trainer-feedback';
        }, 750);
        nextQ();
      }
    }
  }

  function finish() {
    clearInterval(timerId);
    timerId = null;
    isRunning = false;
    isPaused = false;
    if (fbTimer) clearTimeout(fbTimer);
    updateSessionView();
    vt.dataset.state = 'finished';
    vt.querySelector('[data-session-title]').textContent = 'Sesión completada';
    vt.querySelector('[data-session-description]').textContent = 'Revisa tu resultado o reinicia para volver a entrenar.';
    if (pauseBtn) { pauseBtn.textContent = 'Sesión finalizada'; pauseBtn.disabled = true; }
    fbEl.className = 'trainer-feedback';
    fbEl.textContent = 'Sesión finalizada. Pulsa Reiniciar para empezar otra.';
    var total = ok + err;
    var acc = total > 0 ? Math.round((ok / total) * 100) : 0;
    var timeUsed = dur > 0 ? dur : timeElapsed;
    var speed = total > 0 ? (timeUsed / total).toFixed(1) : '-';

    if (modalAcc) modalAcc.textContent = acc + '%';
    if (modalOk) modalOk.textContent = ok;
    if (modalErr) modalErr.textContent = err;
    if (modalStreak) modalStreak.textContent = maxStreak;
    if (modalSpeed) modalSpeed.textContent = speed === '-' ? '-' : speed + 's';
    if (modalTime) modalTime.textContent = fmtTime(timeUsed);
    if (modalTotal) modalTotal.textContent = total;

    if (modalSubtitle) {
      if (acc >= 90 && total >= 8) modalSubtitle.textContent = '¡Extraordinaria visión táctica!';
      else if (acc >= 75) modalSubtitle.textContent = '¡Gran precisión en el tablero!';
      else if (total > 0) modalSubtitle.textContent = '¡Buen entrenamiento, sigue mejorando!';
      else modalSubtitle.textContent = 'Sesión finalizada';
    }

    if (summaryDlg) {
      openSheet(summaryDlg);
    }
  }

  function reset() {
    clearInterval(timerId);
    timerId = null;
    isRunning = false;
    isPaused = false;
    if (fbTimer) clearTimeout(fbTimer);
    if (arenaEl) {
      arenaEl.classList.remove('arena-ok');
      arenaEl.classList.remove('arena-bad');
    }
    ok = 0;
    err = 0;
    streak = 0;
    maxStreak = 0;
    timeRemaining = dur;
    timeElapsed = 0;
    updateStats();
    updateTimerDisp();
    updateSessionView();
    fbEl.className = 'trainer-feedback';
    fbEl.textContent = 'Pulsa Iniciar para ver el ejercicio.';
    if (summaryDlg && summaryDlg.open) {
      if (typeof summaryDlg.closeSheet === 'function') summaryDlg.closeSheet();
      else if (summaryDlg.close) summaryDlg.close();
    }
    if (helpDlg && helpDlg.open) {
      if (typeof helpDlg.closeSheet === 'function') helpDlg.closeSheet();
      else if (helpDlg.close) helpDlg.close();
    }
    if (typeof cfg.onReset === 'function') {
      cfg.onReset();
    }
    currentQuestion = null;
  }

  if (againBtn) againBtn.onclick = reset;

  if (timeSheet) {
    timeSheet.querySelectorAll('button[data-dur]').forEach(function(btn) {
      btn.onclick = function() {
        timeSheet.querySelectorAll('button[data-dur]').forEach(function(b) { b.classList.remove('cur'); });
        btn.classList.add('cur');
        dur = parseInt(btn.dataset.dur, 10);
        if (timeLabel) timeLabel.textContent = durLabels[btn.dataset.dur] || (dur ? (dur / 60) + ' min' : 'Eterno');
        if (typeof timeSheet.closeSheet === 'function') timeSheet.closeSheet();
        else if (timeSheet.close) timeSheet.close();
        reset();
      };
    });
  }

  if (timeBtn) {
    timeBtn.addEventListener('click', function() {
      if (isRunning && !isPaused) {
        pauseSession();
      }
    });
  }

  choicesEl.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    btn.blur();
    var val = btn.dataset.choice || btn.dataset.val || btn.textContent.trim();
    answer(val);
  });

  if (pauseBtn) {
    pauseBtn.onclick = function() {
      if (!isRunning) {
        nextQ();
        startTimer();
      } else if (isPaused) {
        isPaused = false;
      } else {
        pauseSession();
        return;
      }
      fbEl.className = 'trainer-feedback';
      fbEl.textContent = '';
      updateSessionView();
    };
  }

  window.baPracticeTrainer={pause:pauseSession,resume:function(){if(!isRunning){dur=0;helpEnabled=false;nextQ();startTimer();}else isPaused=false;fbEl.className='trainer-feedback';fbEl.textContent='';updateSessionView();}};

  if (resetBtn) {
    resetBtn.onclick = function() {
      reset();
      resetBtn.blur();
    };
  }

  d.addEventListener('keydown', function(e) {
    if (!vt || e.target.closest('input,textarea')) return;
    if (helpDlg && helpDlg.open) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (helpContinue) helpContinue.click();
      }
      return;
    }
    if (summaryDlg && summaryDlg.open) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (againBtn) againBtn.click();
      }
      return;
    }
    if (cfg.keyMap) {
      var val = cfg.keyMap(e);
      if (val) {
        e.preventDefault();
        answer(val);
      }
    }
  });

  reset();
  vt._finish = finish;
}

/* 1. Color de casilla */
(function() {
  var deck = [];
  var lastPoolKey = '';
  var lastPicked = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  setupGenericTrainer(d.getElementById('vision-trainer'), {
    initialHint: 'Toca un color para iniciar',
    onReset: function() {
      deck = [];
      lastPicked = null;
      lastPoolKey = '';
    },
    generate: function(poolSet) {
      var pool = poolSet ? Object.keys(poolSet).filter(function(k) { return poolSet[k]; }) : [];
      if (!pool || pool.length === 0) pool = allSquares;

      var poolKey = pool.slice().sort().join(',');
      // Si el conjunto de casillas activas cambió o se agotó la baraja actual:
      if (poolKey !== lastPoolKey || deck.length === 0) {
        lastPoolKey = poolKey;
        deck = shuffle(pool.slice());

        // Si la primera casilla del nuevo ciclo coincide con la última jugada,
        // la intercambiamos con otra para asegurar que nunca se repita consecutivamente
        if (deck.length > 1 && deck[deck.length - 1] === lastPicked) {
          var swapIdx = Math.floor(Math.random() * (deck.length - 1));
          var tmp = deck[deck.length - 1];
          deck[deck.length - 1] = deck[swapIdx];
          deck[swapIdx] = tmp;
        }
      }

      var nextSq = deck.pop();
      lastPicked = nextSq;
      return nextSq;
    },
    render: function(sq, arena) {
      var el = arena.querySelector('#tr-sq');
      if (el) {
        el.textContent = sq;
        el.classList.add('pop');
        setTimeout(function() { el.classList.remove('pop'); }, 120);
      }
    },
    check: function(sq, choice) {
      var white = isWhite(sq);
      var correct = (choice === 'white' && white) || (choice === 'black' && !white);
      return {
        correct: correct,
        message: 'Incorrecto'
      };
    },
    explain: function(sq, choice) {
      var white = isWhite(sq);
      return {
        title: 'Casilla ' + sq.toUpperCase(),
        desc: 'La casilla <b>' + sq + '</b> es <b>' + (white ? 'blanca' : 'negra') + '</b>.',
        note: 'Tu respuesta: ' + (choice === 'white' ? 'Blanca' : 'Negra'),
        highlights: [{ sq: sq, cls: 'hl-ok' }]
      };
    },
    keyMap: function(e) {
      var k = e.key.toLowerCase();
      if (k === 'b' || e.key === 'ArrowLeft') return 'white';
      if (k === 'n' || e.key === 'ArrowRight') return 'black';
    }
  });
})();

/* 2. Mismo color */
setupGenericTrainer(d.getElementById('same-color-trainer'), {
  initialHint: '¿Tienen el mismo color?',
  generate: function() {
    var s1 = allSquares[Math.floor(Math.random() * allSquares.length)];
    var isW1 = isWhite(s1);
    var wantSame = Math.random() < 0.5;
    var candidates = allSquares.filter(function(s) {
      return s !== s1 && (isWhite(s) === isW1) === wantSame;
    });
    var s2 = candidates[Math.floor(Math.random() * candidates.length)];
    return { s1: s1, s2: s2, same: isW1 === isWhite(s2) };
  },
  render: function(q, arena) {
    arena.querySelector('#tr-sq1').textContent = q.s1;
    arena.querySelector('#tr-sq2').textContent = q.s2;
  },
  check: function(q, choice) {
    var isYes = (choice === 'yes');
    var correct = (isYes === q.same);
    var c1 = isWhite(q.s1) ? 'blanca' : 'negra';
    var c2 = isWhite(q.s2) ? 'blanca' : 'negra';
    return {
      correct: correct,
      message: '✕ ' + q.s1 + ' (' + c1 + ') y ' + q.s2 + ' (' + c2 + ')'
    };
  },
  explain: function(q, choice) {
    var c1 = isWhite(q.s1) ? 'blanca' : 'negra';
    var c2 = isWhite(q.s2) ? 'blanca' : 'negra';
    return {
      title: q.s1.toUpperCase() + ' y ' + q.s2.toUpperCase(),
      desc: '<b>' + q.s1 + '</b> es ' + c1 + ' y <b>' + q.s2 + '</b> es ' + c2 + '.',
      note: q.same ? 'Ambas son del <b>mismo color</b>.' : 'Tienen <b>colores distintos</b>.',
      highlights: [{ sq: q.s1, cls: 'hl-ok' }, { sq: q.s2, cls: 'hl-ok' }]
    };
  },
  keyMap: function(e) {
    var k = e.key.toLowerCase();
    if (k === 's' || e.key === 'ArrowLeft') return 'yes';
    if (k === 'n' || e.key === 'ArrowRight') return 'no';
  }
});

/* 3. Misma diagonal */
setupGenericTrainer(d.getElementById('same-diag-trainer'), {
  initialHint: '¿Están en la misma diagonal?',
  generate: function() {
    var s1 = allSquares[Math.floor(Math.random() * allSquares.length)];
    var c1 = s1.charCodeAt(0) - 96, r1 = parseInt(s1.charAt(1), 10);
    var wantDiag = Math.random() < 0.5;
    var diagList = allSquares.filter(function(s) {
      if (s === s1) return false;
      var c2 = s.charCodeAt(0) - 96, r2 = parseInt(s.charAt(1), 10);
      return Math.abs(c1 - c2) === Math.abs(r1 - r2);
    });
    var nonDiagList = allSquares.filter(function(s) {
      if (s === s1) return false;
      var c2 = s.charCodeAt(0) - 96, r2 = parseInt(s.charAt(1), 10);
      return Math.abs(c1 - c2) !== Math.abs(r1 - r2);
    });
    var s2 = (wantDiag && diagList.length) ? diagList[Math.floor(Math.random() * diagList.length)] : nonDiagList[Math.floor(Math.random() * nonDiagList.length)];
    var c2 = s2.charCodeAt(0) - 96, r2 = parseInt(s2.charAt(1), 10);
    return { s1: s1, s2: s2, onDiag: Math.abs(c1 - c2) === Math.abs(r1 - r2) };
  },
  render: function(q, arena) {
    arena.querySelector('#tr-sq1').textContent = q.s1;
    arena.querySelector('#tr-sq2').textContent = q.s2;
  },
  check: function(q, choice) {
    var isYes = (choice === 'yes');
    var correct = (isYes === q.onDiag);
    return {
      correct: correct,
      message: q.onDiag ? '✕ Sí están en diagonal' : '✕ No están en diagonal'
    };
  },
  explain: function(q, choice) {
    var c1 = q.s1.charCodeAt(0) - 96, r1 = parseInt(q.s1.charAt(1), 10);
    var c2 = q.s2.charCodeAt(0) - 96, r2 = parseInt(q.s2.charAt(1), 10);
    var same = Math.abs(c1 - c2) === Math.abs(r1 - r2);
    var hl = [{ sq: q.s1, cls: 'hl-ok' }, { sq: q.s2, cls: 'hl-ok' }];
    if (same) {
      var stepC = (c2 - c1) / Math.abs(c2 - c1);
      var stepR = (r2 - r1) / Math.abs(r2 - r1);
      var currC = c1 + stepC, currR = r1 + stepR;
      while (currC !== c2) {
        hl.push({ sq: files[currC - 1] + currR, cls: 'hl-path' });
        currC += stepC;
        currR += stepR;
      }
    }
    return {
      title: q.s1.toUpperCase() + ' · ' + q.s2.toUpperCase(),
      desc: same ? '<b>Sí</b> comparten la misma diagonal.' : '<b>No</b> están en la misma diagonal.',
      note: same ? 'Diagonal ' + q.s1 + '–' + q.s2 : 'Diferencia de columnas y filas no coincide',
      highlights: hl
    };
  },
  keyMap: function(e) {
    var k = e.key.toLowerCase();
    if (k === 's' || e.key === 'ArrowLeft') return 'yes';
    if (k === 'n' || e.key === 'ArrowRight') return 'no';
  }
});

/* 4. Casilla simétrica */
setupGenericTrainer(d.getElementById('sister-square-trainer'), {
  initialHint: '¿Cuál es su casilla simétrica?',
  generate: function() {
    var s = allSquares[Math.floor(Math.random() * allSquares.length)];
    var c = s.charCodeAt(0) - 96, r = parseInt(s.charAt(1), 10);
    var sister = files[8 - c] + (9 - r);
    var distractors = [];
    var alt1 = files[c - 1] + (9 - r);
    var alt2 = files[8 - c] + r;
    if (alt1 !== sister && alt1 !== s) distractors.push(alt1);
    if (alt2 !== sister && alt2 !== s) distractors.push(alt2);
    while (distractors.length < 3) {
      var rand = allSquares[Math.floor(Math.random() * allSquares.length)];
      if (rand !== sister && rand !== s && distractors.indexOf(rand) < 0) distractors.push(rand);
    }
    var opts = [sister, distractors[0], distractors[1], distractors[2]].sort(function() { return Math.random() - 0.5; });
    return { s: s, sister: sister, opts: opts };
  },
  render: function(q, arena, choices) {
    arena.querySelector('#tr-sq').textContent = q.s;
    var btns = choices.querySelectorAll('button');
    btns.forEach(function(btn, i) {
      btn.textContent = q.opts[i];
      btn.dataset.val = q.opts[i];
    });
  },
  check: function(q, choice) {
    var correct = (choice === q.sister);
    return {
      correct: correct,
      message: '✕ La simétrica de ' + q.s + ' es ' + q.sister
    };
  },
  explain: function(q, choice) {
    var hl = [{ sq: q.s, cls: 'hl-path' }, { sq: q.sister, cls: 'hl-ok' }];
    if (choice && choice !== q.sister) hl.push({ sq: choice, cls: 'hl-bad' });
    return {
      title: 'Simétrica de ' + q.s.toUpperCase(),
      desc: 'La casilla simétrica de <b>' + q.s + '</b> es <b>' + q.sister.toUpperCase() + '</b>.',
      note: 'Rotación central (180°): ' + q.s + ' ↔ ' + q.sister,
      highlights: hl
    };
  },
  keyMap: function(e) {
    var i = parseInt(e.key, 10) - 1;
    if (i >= 0 && i < 4) {
      var btn = d.getElementById('tr-opt-' + i);
      if (btn) return btn.dataset.val;
    }
  }
});

/* 5. Ruta de caballo en 2 */
setupGenericTrainer(d.getElementById('two-knights-trainer'), {
  initialHint: '¿Conecta un caballo en 2 jugadas?',
  generate: function() {
    var s1 = allSquares[Math.floor(Math.random() * allSquares.length)];
    var reachableList = getTwoKnightMoves(s1);
    var unreachableList = allSquares.filter(function(s) {
      return s !== s1 && reachableList.indexOf(s) < 0;
    });
    var wantYes = Math.random() < 0.5;
    var s2 = (wantYes && reachableList.length) ? reachableList[Math.floor(Math.random() * reachableList.length)] : unreachableList[Math.floor(Math.random() * unreachableList.length)];
    var can = reachableList.indexOf(s2) >= 0;
    return { s1: s1, s2: s2, can: can };
  },
  render: function(q, arena) {
    arena.querySelector('#tr-sq1').textContent = q.s1;
    arena.querySelector('#tr-sq2').textContent = q.s2;
  },
  check: function(q, choice) {
    var isYes = (choice === 'yes');
    var correct = (isYes === q.can);
    return {
      correct: correct,
      message: q.can ? '✕ Sí conectan en 2 jugadas' : '✕ No conectan en 2 jugadas'
    };
  },
  explain: function(q, choice) {
    var m1 = getKnightMoves(q.s1);
    var inter = null;
    for (var i = 0; i < m1.length; i++) {
      var m2 = getKnightMoves(m1[i]);
      if (m2.indexOf(q.s2) >= 0) { inter = m1[i]; break; }
    }
    var hl = [{ sq: q.s1, cls: 'hl-ok' }, { sq: q.s2, cls: 'hl-ok' }];
    if (inter) hl.push({ sq: inter, cls: 'hl-path' });
    return {
      title: 'Caballo: ' + q.s1.toUpperCase() + ' ➜ ' + q.s2.toUpperCase(),
      desc: q.can ? '<b>Sí</b> conectan en 2 jugadas: ' + q.s1 + ' ➜ ' + inter + ' ➜ ' + q.s2 : '<b>No</b> pueden conectarse en 2 jugadas.',
      note: q.can ? 'Casilla puente: ' + inter : 'Un caballo en 2 saltos siempre cae en casilla del mismo color',
      highlights: hl
    };
  },
  keyMap: function(e) {
    var k = e.key.toLowerCase();
    if (k === 's' || e.key === 'ArrowLeft') return 'yes';
    if (k === 'n' || e.key === 'ArrowRight') return 'no';
  }
});

/* 6. Casilla de encuentro */
setupGenericTrainer(d.getElementById('colliding-pieces-trainer'), {
  initialHint: '¿En qué casilla coinciden en 1 jugada?',
  generate: function() {
    var pieceTypes = [{ t: 'R', sym: '♖' }, { t: 'B', sym: '♗' }, { t: 'N', sym: '♘' }];
    var attempts = 0, p1, p2, s1, s2, shared = [];
    while (shared.length === 0 && attempts < 50) {
      attempts++;
      p1 = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
      p2 = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
      s1 = allSquares[Math.floor(Math.random() * allSquares.length)];
      s2 = allSquares[Math.floor(Math.random() * allSquares.length)];
      if (s1 === s2) continue;
      var m1 = getPieceMoves(p1.t, s1);
      var m2 = getPieceMoves(p2.t, s2);
      shared = m1.filter(function(sq) { return m2.indexOf(sq) >= 0; });
    }
    var target = shared[Math.floor(Math.random() * shared.length)];
    var distractors = [];
    while (distractors.length < 3) {
      var rand = allSquares[Math.floor(Math.random() * allSquares.length)];
      if (rand !== target && distractors.indexOf(rand) < 0) distractors.push(rand);
    }
    var opts = [target, distractors[0], distractors[1], distractors[2]].sort(function() { return Math.random() - 0.5; });
    return {
      t1: p1.t, s1: s1, p1Display: p1.sym + ' ' + s1,
      t2: p2.t, s2: s2, p2Display: p2.sym + ' ' + s2,
      target: target, opts: opts
    };
  },
  render: function(q, arena, choices) {
    arena.querySelector('#tr-p1').textContent = q.p1Display;
    arena.querySelector('#tr-p2').textContent = q.p2Display;
    var btns = choices.querySelectorAll('button');
    btns.forEach(function(btn, i) {
      btn.textContent = q.opts[i];
      btn.dataset.val = q.opts[i];
    });
  },
  check: function(q, choice) {
    var correct = (choice === q.target);
    return {
      correct: correct,
      message: '✕ Coinciden en ' + q.target
    };
  },
  explain: function(q, choice) {
    var pNames = { 'R': 'Torre', 'B': 'Alfil', 'N': 'Caballo' };
    var hl = [
      { sq: q.s1, cls: 'hl-path', piece: q.t1 },
      { sq: q.s2, cls: 'hl-path', piece: q.t2 },
      { sq: q.target, cls: 'hl-ok' }
    ];
    if (choice && choice !== q.target) hl.push({ sq: choice, cls: 'hl-bad' });
    return {
      title: 'Casilla de encuentro: ' + q.target.toUpperCase(),
      desc: pNames[q.t1] + ' (' + q.s1 + ') y ' + pNames[q.t2] + ' (' + q.s2 + ') convergen en <b>' + q.target.toUpperCase() + '</b>.',
      note: 'Ambas piezas dominan ' + q.target + ' en 1 jugada.',
      highlights: hl
    };
  },
  keyMap: function(e) {
    var i = parseInt(e.key, 10) - 1;
    if (i >= 0 && i < 4) {
      var btn = d.getElementById('tr-opt-' + i);
      if (btn) return btn.dataset.val;
    }
  }
});
})();


