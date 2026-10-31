/* ============================================================
   Progress Tracker
   Self-editable per-problem columns on the category quick-index:
     · time  — how long the problem took (free text, e.g. "25m")
     · date  — last attempted (native date picker)
     · diff  — my own difficulty rating (Easy / Med / Hard)
     · note  — free-text remark (e.g. "revisit dp", "用了提示")
   Persisted in localStorage, keyed by LeetCode number.

   Cross-device sync (computer ↔ phone) — GitHub Gist:
     each device pastes the same GitHub token once (scope: gist only).
     Data lives in one secret gist, file nc250-notes.json. Every record
     carries _t (last edit, ms); merging keeps the newer record per
     problem, so edits on either device win in time order.
     Sync runs on page load, ~1.5 s after an edit, and whenever the
     tab comes back into view. The token never leaves the browser
     except to api.github.com.
   ============================================================ */
(function () {
  var KEY = 'nc250-track-v1';
  var SYNC = 'nc250-sync-v1';                 // { token, gistId }
  var FILE = 'nc250-notes.json';
  var API = 'https://api.github.com';
  var TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=neetcode-250%20notes%20sync';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  function cfg() {
    try { return JSON.parse(localStorage.getItem(SYNC)) || {}; }
    catch (e) { return {}; }
  }
  function setCfg(c) {
    try { c ? localStorage.setItem(SYNC, JSON.stringify(c)) : localStorage.removeItem(SYNC); } catch (e) {}
  }

  /* ---------------- fields ---------------- */
  function reflect(el, field) {
    if (field === 'diff') {
      el.classList.remove('is-easy', 'is-med', 'is-hard');
      if (el.value === 'easy') el.classList.add('is-easy');
      else if (el.value === 'med') el.classList.add('is-med');
      else if (el.value === 'hard') el.classList.add('is-hard');
    } else {
      el.classList.toggle('is-set', !!el.value);
    }
  }

  function fields() { return document.querySelectorAll('[data-trk]'); }

  /* paint stored values into the inputs (skips the one being typed in) */
  function paint() {
    var data = load();
    Array.prototype.forEach.call(fields(), function (el) {
      if (el === document.activeElement) return;
      var rec = data[el.getAttribute('data-pid')];
      var v = rec && rec[el.getAttribute('data-trk')];
      el.value = v == null ? '' : v;
      reflect(el, el.getAttribute('data-trk'));
    });
  }

  function wireFields() {
    paint();
    Array.prototype.forEach.call(fields(), function (el) {
      var pid = el.getAttribute('data-pid');
      var field = el.getAttribute('data-trk');
      var evt = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(evt, function () {
        var d = load();
        if (!d[pid]) d[pid] = {};
        d[pid][field] = el.value;
        d[pid]._t = Date.now();              // kept even when emptied, so a clear syncs too
        save(d);
        reflect(el, field);
        scheduleSync();
      });
    });
  }

  /* ---------------- merge: newer record per problem wins ---------------- */
  function merge(a, b) {
    var out = {}, changed = false;
    Object.keys(a).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b).forEach(function (k) {
      var ra = a[k], rb = b[k];
      if (!rb || typeof rb !== 'object') return;
      if (!ra || (rb._t || 0) > (ra._t || 0)) { out[k] = rb; changed = true; }
    });
    return { data: out, changed: changed };
  }
  function same(a, b) { return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b)); }
  function sortKeys(o) {
    if (!o || typeof o !== 'object') return o;
    var r = {};
    Object.keys(o).sort().forEach(function (k) { r[k] = sortKeys(o[k]); });
    return r;
  }

  /* ---------------- GitHub Gist ---------------- */
  function gh(path, opts, token) {
    opts = opts || {};
    opts.headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    opts.cache = 'no-store';
    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.status === 204 ? null : r.json();
    });
  }

  function findOrCreateGist(token) {
    function page(n) {
      return gh('/gists?per_page=100&page=' + n, {}, token).then(function (list) {
        for (var i = 0; i < list.length; i++) if (list[i].files && list[i].files[FILE]) return list[i].id;
        return list.length === 100 && n < 5 ? page(n + 1) : null;
      });
    }
    return page(1).then(function (id) {
      if (id) return id;
      var files = {}; files[FILE] = { content: JSON.stringify(load(), null, 1) };
      return gh('/gists', { method: 'POST', body: JSON.stringify({
        description: 'NeetCode 250 notes sync (foodieteng.github.io/neetcode-250)',
        public: false, files: files }) }, token).then(function (g) { return g.id; });
    });
  }

  function readGist(token, id) {
    return gh('/gists/' + id, {}, token).then(function (g) {
      var f = g.files && g.files[FILE];
      if (!f) return {};
      if (!f.truncated) return JSON.parse(f.content || '{}');
      return fetch(f.raw_url, { cache: 'no-store' }).then(function (r) { return r.json(); });
    });
  }

  function writeGist(token, id, data) {
    var files = {}; files[FILE] = { content: JSON.stringify(data, null, 1) };
    return gh('/gists/' + id, { method: 'PATCH', body: JSON.stringify({ files: files }) }, token);
  }

  var busy = false, again = false, timer = null;
  function scheduleSync() {
    if (!cfg().token) return;
    clearTimeout(timer);
    timer = setTimeout(sync, 1500);
    status('pending');
  }

  function sync() {
    var c = cfg();
    if (!c.token) { status('off'); return Promise.resolve(); }
    if (busy) { again = true; return Promise.resolve(); }
    busy = true; status('busy');
    var idP = c.gistId ? Promise.resolve(c.gistId) : findOrCreateGist(c.token);
    return idP.then(function (id) {
      if (id !== c.gistId) { c.gistId = id; setCfg(c); }
      return readGist(c.token, id).then(function (remote) {
        var local = load();
        var m = merge(local, remote);           // remote newer → into local
        if (m.changed) { save(m.data); paint(); }
        if (!same(m.data, remote)) return writeGist(c.token, id, m.data);
      });
    }).then(function () {
      status('ok');
    }, function (e) {
      if (e && e.status === 404 && c.gistId) { delete c.gistId; setCfg(c); }   // gist deleted → recreate next time
      status(e && (e.status === 401 || e.status === 403) ? 'auth' : 'err');
    }).then(function () {
      busy = false;
      if (again) { again = false; sync(); }
    });
  }

  /* ---------------- small status chip + setup panel ---------------- */
  var chip, panel;
  var LABEL = {
    off: '☁ 啟用同步', pending: '☁ 待同步…', busy: '☁ 同步中…',
    ok: '☁ 已同步', err: '☁ 同步失敗 · 重試', auth: '☁ Token 失效 · 重設'
  };
  function status(s) {
    if (!chip) return;
    chip.className = 'trk-sync trk-sync--' + s;
    var t = LABEL[s];
    if (s === 'ok') {
      var d = new Date();
      t += ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    chip.textContent = t;
  }

  function buildUI() {
    if (!document.querySelector('[data-trk]') || document.querySelector('.trk-sync')) return;
    chip = document.createElement('button');
    chip.type = 'button';
    document.body.appendChild(chip);

    panel = document.createElement('div');
    panel.className = 'trk-sync-panel';
    panel.hidden = true;
    document.body.appendChild(panel);

    chip.addEventListener('click', function () {
      var c = cfg();
      if (c.token && !/auth/.test(chip.className)) {
        if (/err/.test(chip.className)) { sync(); return; }
        renderPanel(true);
      } else {
        renderPanel(false);
      }
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== chip) panel.hidden = true;
    });
    status(cfg().token ? 'ok' : 'off');
  }

  function renderPanel(enabled) {
    panel.hidden = false;
    if (enabled) {
      panel.innerHTML =
        '<div class="trk-sync-panel__title">雲端同步 · 已啟用</div>' +
        '<p>這台裝置的時間 / 日期 / 自評 / 註記會自動和你 GitHub 上的私密 gist 同步。</p>' +
        '<div class="trk-sync-panel__row">' +
          '<button type="button" data-a="now">立即同步</button>' +
          '<button type="button" data-a="off">停用此裝置</button>' +
        '</div>';
    } else {
      panel.innerHTML =
        '<div class="trk-sync-panel__title">雲端同步 · 每台裝置設定一次</div>' +
        '<ol>' +
          '<li><a href="' + TOKEN_URL + '" target="_blank" rel="noopener">建立 GitHub token ↗</a>(只勾 <b>gist</b>,到期日選 No expiration),複製它</li>' +
          '<li>貼到下面按「啟用」;手機用<b>同一個</b> token 再做一次</li>' +
        '</ol>' +
        '<input type="password" class="trk-sync-panel__tok" placeholder="ghp_… 或 github_pat_…" autocomplete="off" spellcheck="false" />' +
        '<div class="trk-sync-panel__row">' +
          '<button type="button" data-a="on" class="is-go">啟用</button>' +
          '<span class="trk-sync-panel__msg" role="status"></span>' +
        '</div>';
    }
    panel.onclick = function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'now') { panel.hidden = true; sync(); }
      else if (a === 'off') { setCfg(null); panel.hidden = true; status('off'); }
      else if (a === 'on') {
        var tok = panel.querySelector('.trk-sync-panel__tok').value.trim();
        var msg = panel.querySelector('.trk-sync-panel__msg');
        if (!tok) { msg.textContent = '請先貼上 token'; return; }
        msg.textContent = '驗證中…';
        gh('/gists?per_page=1', {}, tok).then(function () {
          setCfg({ token: tok });
          panel.hidden = true;
          sync();
        }, function (err) {
          msg.textContent = err && err.status === 401 ? '✗ token 無效' :
                            err && err.status === 403 ? '✗ 沒有 gist 權限' : '✗ 連不到 GitHub';
        });
      }
    };
  }

  function init() {
    wireFields();
    buildUI();
    if (cfg().token) sync();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && cfg().token) sync();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
