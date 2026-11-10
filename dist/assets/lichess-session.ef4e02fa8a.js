/* Sesión de Lichess en el navegador: OAuth2 con PKCE, sin secreto ni servidor.
   El permiso se guarda en localStorage (ba:lichess) y se revoca con DELETE /api/token. */
(function () {
  var KEY = 'ba:lichess';
  var isCallback = new URLSearchParams(location.search).has('code');
  var PKCE = 'ba:lichess:pkce';
  var CLIENT = 'biblioteca-ajedrez-mh.web.app';
  var SCOPES = 'puzzle:read puzzle:write board:play challenge:read challenge:write';
  var ORIGIN = 'https://lichess.org';
  var painted = false;

  function redirectUri() { return location.origin + '/cuenta/'; }
  var RETURN = 'ba:lichess:return';
  function cleanReturnPath(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f]/.test(value)) return '/entrenamiento/';
    try {
      var url = new URL(value, location.origin);
      var activity = url.pathname === '/' || url.pathname === '/biblioteca/' || url.pathname === '/jugar/' || ['/entrenamiento/', '/libros/', '/guias/', '/esquemas-de-pensamiento/'].some(function (prefix) { return url.pathname.startsWith(prefix); });
      if (url.origin !== location.origin || !activity) return '/entrenamiento/';
      return url.pathname + url.search + url.hash;
    } catch (e) { return '/entrenamiento/'; }
  }
  function returnPath() {
    var from = new URLSearchParams(location.search).get('volver');
    if (!from && location.pathname.indexOf('/cuenta') === 0) { try { from = sessionStorage.getItem(RETURN); } catch (e) {} }
    return cleanReturnPath(from || location.pathname + location.search);
  }

  function b64url(buf) {
    var bytes = new Uint8Array(buf), s = '', i;
    for (i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function randomVerifier() {
    var a = new Uint8Array(48);
    crypto.getRandomValues(a);
    return b64url(a);
  }
  function challengeOf(verifier) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(b64url);
  }
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }
  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { sessionStorage.removeItem(PKCE); } catch (e) {}
  }
  function query(obj) {
    return Object.keys(obj).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }).join('&');
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = {}, s = read(), body = opts.body, k;
    if (opts.headers) for (k in opts.headers) headers[k] = opts.headers[k];
    if (s && s.token) headers.Authorization = 'Bearer ' + s.token;
    if (opts.json != null) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json); }
    else if (opts.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      var sp = new URLSearchParams();
      Object.keys(opts.form).forEach(function (key) {
        var v = opts.form[key];
        if (v != null && v !== '') sp.set(key, String(v));
      });
      body = sp;
    }
    return fetch(ORIGIN + path, { method: opts.method || 'GET', headers: headers, body: body, signal: opts.signal }).then(function (res) {
      if (res.status === 401 && s && s.token) {
        clear(); paint();
        var err = new Error('La sesión con Lichess caducó. Entra otra vez.');
        err.status = 401;
        throw err;
      }
      return res;
    });
  }
  function readError(res) {
    return res.text().then(function (t) {
      try {
        var j = JSON.parse(t), e = j.error || j;
        if (typeof e === 'string') return e;
        if (Array.isArray(e)) return e.join(' ');
        return Object.keys(e).map(function (k) { return [].concat(e[k]).join(' '); }).join(' ');
      } catch (e2) { return (t || '').slice(0, 200) || ('Error ' + res.status); }
    }).catch(function () { return 'Error ' + res.status; });
  }
  function ndjson(res, onLine) {
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
    function pump() {
      return reader.read().then(function (step) {
        if (step.done) {
          if (buf.trim()) { try { onLine(JSON.parse(buf.trim())); } catch (e) {} }
          return;
        }
        buf += dec.decode(step.value, { stream: true });
        var i;
        while ((i = buf.indexOf('\n')) >= 0) {
          var line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line) continue;
          try { onLine(JSON.parse(line)); } catch (e) {}
        }
        return pump();
      });
    }
    return pump();
  }
  function paint() {
    var s = read(), on = !!(s && s.token && s.id);
    document.querySelectorAll('[data-lichess-user]').forEach(function (el) { el.textContent = on && s.username ? s.username : ''; });
    document.querySelectorAll('[data-lichess-out]').forEach(function (el) { el.hidden = on; });
    document.querySelectorAll('[data-lichess-in]').forEach(function (el) { el.hidden = !on; });
    document.querySelectorAll('[data-training-entry]').forEach(function (el) { el.href = '/entrenamiento/'; });
    var profile = document.getElementById('cuenta-profile');
    if (profile && on && s.username) profile.href = ORIGIN + '/@/' + encodeURIComponent(s.username);
    var rating = document.getElementById('cuenta-rating');
    if (rating) rating.textContent = on ? (typeof s.puzzleRating === 'number' ? 'Rating de puzzles: ' + s.puzzleRating : 'Aún no hay rating de puzzles en la cuenta.') : '';
    document.querySelectorAll('[data-account-link]').forEach(function (el) { el.href = '/cuenta/?volver=' + encodeURIComponent(returnPath()); });
    document.querySelectorAll('[data-account-return]').forEach(function (el) { el.href = returnPath(); });
    document.querySelectorAll('[data-settings-link]').forEach(function (el) { el.href = '/configuracion/?volver=' + encodeURIComponent(returnPath()); });
    document.querySelectorAll('[data-settings-return]').forEach(function (el) {
      var from = new URLSearchParams(location.search).get('volver');
      if (!from) return;
      el.href = cleanReturnPath(from); el.setAttribute('aria-label', 'Volver a mi actividad');
      var label = el.querySelector('.lbl-trunc'); if (label) label.textContent = 'Volver';
    });
    if (location.pathname.indexOf('/cuenta') === 0) {
      var back = document.querySelector('.back'), target = returnPath();
      var title = target.startsWith('/jugar/') ? 'Partidas' : target.startsWith('/entrenamiento/lichess/') ? 'Táctica' : target.startsWith('/entrenamiento/practicar/') ? 'Práctica libre' : target.startsWith('/entrenamiento/') ? 'Entrenamiento' : 'Biblioteca';
      if (back) {
        back.href = target; back.setAttribute('aria-label', 'Volver a ' + title);
        var label = back.querySelector('.lbl-trunc'); if (label) label.textContent = title;
      }
    }

    if (painted) document.dispatchEvent(new CustomEvent('ba-lichess'));
    painted = true;
    if (window.baTrainingAPI) window.baTrainingAPI.paint();
  }
  function setRating(n) {
    var s = read();
    if (!s || typeof n !== 'number' || isNaN(n)) return;
    s.puzzleRating = Math.round(n);
    write(s);
    paint();
  }
  function say(t) { var box = document.getElementById('cuenta-msg') || document.querySelector('[data-login-status]'); if (box) box.textContent = t; }
  function login() {
    if (!window.crypto || !crypto.subtle) { say('El acceso de Lichess necesita una página segura (https) o localhost.'); return; }
    var verifier = randomVerifier(), state = randomVerifier();
    try { sessionStorage.setItem(PKCE, JSON.stringify({ verifier: verifier, state: state, createdAt: Date.now() })); sessionStorage.setItem(RETURN, returnPath()); }
    catch (e) { say('Este navegador no deja guardar la sesión de acceso.'); return; }
    return challengeOf(verifier).then(function (codeChallenge) {
      location.assign(ORIGIN + '/oauth?' + query({
        response_type: 'code',
        client_id: CLIENT,
        redirect_uri: redirectUri(),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        scope: SCOPES,
        state: state
      }));
    }).catch(function () { say('No se pudo preparar el acceso. Inténtalo de nuevo.'); });
  }
  function logout() {
    var s = read();
    var done = function () { clear(); paint(); say('Lichess desconectado de este navegador.'); };
    if (!s || !s.token) { done(); return Promise.resolve(); }
    return fetch(ORIGIN + '/api/token', { method: 'DELETE', headers: { Authorization: 'Bearer ' + s.token } }).then(function (res) {
      done();
      if (!res.ok && res.status !== 401) say('Cuenta desconectada aquí. No se pudo confirmar la revocación del permiso en Lichess.');
    }, function () { done(); say('Cuenta desconectada aquí. No se pudo confirmar la revocación del permiso en Lichess.'); });
  }
  function storeUser(user, token) {
    var prev = read() || {};
    var puzzle = user.perfs && user.perfs.puzzle;
    if (!write({
      token: token || prev.token,
      username: user.username,
      id: user.id,
      puzzleRating: puzzle && typeof puzzle.rating === 'number' ? puzzle.rating : null,
      obtainedAt: prev.obtainedAt || Date.now()
    })) say('Este navegador no deja guardar la sesión.');
  }
  function refreshAccount() {
    return api('/api/account').then(function (res) {
      if (!res.ok) throw new Error('account');
      return res.json();
    }).then(function (user) { storeUser(user); });
  }
  function handleCallback() {
    var path = location.pathname.replace(/\/$/, '');
    if (path !== '/cuenta') return Promise.resolve();
    var params = new URLSearchParams(location.search);
    var code = params.get('code'), err = params.get('error');
    if (!code && !err) return Promise.resolve();
    var pkce = null;
    try { pkce = JSON.parse(sessionStorage.getItem(PKCE) || 'null'); } catch (e) {}
    try { sessionStorage.removeItem(PKCE); } catch (e) {}
    history.replaceState(null, '', location.pathname);
    if (err) { say(err === 'access_denied' ? 'Cancelaste el acceso en Lichess.' : 'Lichess no completó el acceso.'); return Promise.resolve(); }
    if (!pkce || pkce.state !== params.get('state') || !pkce.createdAt || Date.now() - pkce.createdAt > 15 * 60 * 1000) { say('La sesión de acceso no coincide. Vuelve a entrar.'); return Promise.resolve(); }
    var body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('code_verifier', pkce.verifier);
    body.set('redirect_uri', redirectUri());
    body.set('client_id', CLIENT);
    return fetch(ORIGIN + '/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }).then(function (res) {
      if (!res.ok) return readError(res).then(function () { throw new Error('token'); });
      return res.json();
    }).then(function (data) {
      if (!data.access_token) throw new Error('token');
      if (!write({ token: data.access_token, obtainedAt: Date.now() })) throw new Error('storage');
      return refreshAccount();
    }).then(function () {
      say('Cuenta conectada. Volviendo a tu actividad…');
      var target = '/entrenamiento/';
      try { target = cleanReturnPath(sessionStorage.getItem(RETURN)); sessionStorage.removeItem(RETURN); } catch (e) {}
      try { if ((sessionStorage.getItem('ba:library-link') || sessionStorage.getItem('ba:library-legacy'))) target = '/cuenta/?volver=' + encodeURIComponent(target); } catch (e) {}
      location.replace(target);
      return true;
    }).catch(function () {
      clear();
      say('No se pudo completar el acceso. Inténtalo de nuevo.');
    });
  }
  function needsAccount() {
    var p = location.pathname;
    return p.indexOf('/cuenta') === 0 || p.indexOf('/entrenamiento/') === 0 || p.indexOf('/jugar') === 0;
  }
  function boot() {
    var callback = location.pathname.indexOf('/cuenta') === 0 && new URLSearchParams(location.search).has('code');
    if (callback) {
      say('Conectando con Lichess…');
      document.querySelectorAll('[data-lichess-login]').forEach(function (button) { button.disabled = true; });
    }
    document.querySelectorAll('[data-routine-loading]').forEach(function (el) { el.hidden = false; });
    return handleCallback().then(function (connected) {
      if (connected) return;
      var s = read();
      if (s && s.token && needsAccount()) return refreshAccount().catch(function () {});
    }).then(function () { paint(); document.querySelectorAll('[data-lichess-login]').forEach(function (button) { button.disabled = false; }); });
  }
  document.querySelectorAll('[data-lichess-login]').forEach(function (b) { b.addEventListener('click', login); });
  document.querySelectorAll('[data-lichess-logout]').forEach(function (b) { b.addEventListener('click', function () { logout(); }); });
  window.addEventListener('storage', function (event) { if (event.key === KEY) paint(); });
  window.baLichess = { isCallback: isCallback, cleanReturnPath: cleanReturnPath, returnPath: returnPath, read: read, api: api, login: login, logout: logout, paint: paint, ndjson: ndjson, readError: readError, setRating: setRating, origin: ORIGIN, ready: boot() };
})();
