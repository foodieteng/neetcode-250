/* ============================================================
   Progress Tracker
   Self-editable per-problem columns on the category quick-index:
     · time  — how long the problem took (free text, e.g. "25m")
     · date  — last attempted (native date picker)
     · diff  — my own difficulty rating (Easy / Med / Hard)
     · note  — free-text remark (e.g. "revisit dp", "用了提示")
   Persisted in localStorage, keyed by LeetCode number.

   localStorage is per-origin AND per-device, so notes don't follow you
   computer→phone by themselves. Two ways to carry them across, both here:
     · Sync link — pack all data into a URL; open it on the other device
       and it auto-imports (one tap, no copy-paste, no account).
     · Export / Import — JSON textarea / file, for manual moves or backup.
   ============================================================ */
(function () {
  var KEY = 'nc250-track-v1';
  var LIVE = 'https://foodieteng.github.io/neetcode-250/';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }

  /* UTF-8-safe base64 (handles Chinese notes) */
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64dec(b64) { return decodeURIComponent(escape(atob(b64))); }

  /* live URL of the current category page, so a link made on file:// still
     opens correctly on the phone */
  function livePath() {
    var p = location.pathname, i = p.indexOf('/topics/');
    return i >= 0 ? LIVE + p.slice(i + 1) : LIVE + 'topics/01-arrays-hashing/index.html';
  }

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

  function wireFields() {
    var data = load();
    var fields = document.querySelectorAll('[data-trk]');
    Array.prototype.forEach.call(fields, function (el) {
      var pid = el.getAttribute('data-pid');
      var field = el.getAttribute('data-trk');
      var rec = data[pid];
      if (rec && rec[field] != null && rec[field] !== '') el.value = rec[field];
      reflect(el, field);

      var evt = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(evt, function () {
        var d = load();
        if (!d[pid]) d[pid] = {};
        d[pid][field] = el.value;
        if (Object.keys(d[pid]).every(function (k) { return !d[pid][k]; })) delete d[pid];
        save(d);
        reflect(el, field);
      });
    });
  }

  /* merge an incoming object into localStorage (imported wins, existing kept) */
  function mergeIn(incoming) {
    var d = load(), n = 0;
    Object.keys(incoming).forEach(function (pid) {
      var rec = incoming[pid];
      if (!rec || typeof rec !== 'object') return;
      if (!d[pid]) d[pid] = {};
      Object.keys(rec).forEach(function (k) { d[pid][k] = rec[k]; });
      n++;
    });
    save(d);
    return n;
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- auto-import when opened via a sync link (#trk=...) ---- */
  function checkSyncLink() {
    var m = (location.hash || '').match(/trk=([^&]+)/);
    if (!m) return;
    var incoming;
    try { incoming = JSON.parse(b64dec(decodeURIComponent(m[1]))); }
    catch (e) { return; }
    // clean the hash so a refresh doesn't re-prompt
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    var count = incoming && typeof incoming === 'object' ? Object.keys(incoming).length : 0;
    if (!count) return;
    if (window.confirm('偵測到同步連結:要把 ' + count + ' 題的自評/註記匯入這台裝置嗎？\n(既有的資料會保留，同一題同欄位會以連結內容為準)')) {
      var n = mergeIn(incoming);
      alert('✓ 已匯入 ' + n + ' 題，重新整理後就會顯示。');
      location.reload();
    }
  }

  function buildIO() {
    var host = document.querySelector('.table-scroll');
    if (!host || document.querySelector('.trk-io')) return;

    var wrap = document.createElement('div');
    wrap.className = 'trk-io';
    wrap.innerHTML =
      '<div class="trk-io__bar">' +
        '<button class="trk-io__btn trk-io__btn--go" data-a="link" type="button">🔗 產生同步連結</button>' +
        '<button class="trk-io__btn" data-a="export" type="button">⤓ 匯出 JSON</button>' +
        '<button class="trk-io__btn" data-a="import" type="button">⤒ 匯入 JSON</button>' +
        '<span class="trk-io__hint">同步連結：電腦按一下→複製→傳到手機打開，就自動帶入註記</span>' +
      '</div>' +
      '<div class="trk-io__panel" hidden>' +
        '<textarea class="trk-io__box" spellcheck="false" ' +
          'placeholder="同步連結 / 匯出的 JSON 會出現在這裡。匯入時把 JSON 貼進來(或用「選檔案」)，再按「套用匯入」。"></textarea>' +
        '<div class="trk-io__row">' +
          '<button class="trk-io__btn" data-a="copy" type="button">複製</button>' +
          '<button class="trk-io__btn" data-a="dl" type="button">下載 .json</button>' +
          '<label class="trk-io__btn trk-io__file">選檔案<input type="file" accept="application/json,.json" hidden></label>' +
          '<button class="trk-io__btn trk-io__btn--go" data-a="apply" type="button">✔ 套用匯入</button>' +
          '<span class="trk-io__msg" role="status"></span>' +
        '</div>' +
      '</div>';
    host.parentNode.insertBefore(wrap, host);

    var panel = wrap.querySelector('.trk-io__panel');
    var box = wrap.querySelector('.trk-io__box');
    var msg = wrap.querySelector('.trk-io__msg');
    function flash(m) {
      msg.textContent = m;
      if (m) setTimeout(function () { if (msg.textContent === m) msg.textContent = ''; }, 3500);
    }
    function copyBox(okMsg) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(box.value).then(function () { flash(okMsg); },
          function () { box.select(); flash('請長按文字框手動複製'); });
      } else { box.select(); try { document.execCommand('copy'); flash(okMsg); } catch (e) { flash('請長按文字框手動複製'); } }
    }

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      var data = load();
      var count = Object.keys(data).length;

      if (a === 'link') {
        panel.hidden = false;
        if (!count) { box.value = ''; flash('還沒有任何註記可同步'); return; }
        box.value = livePath() + '#trk=' + encodeURIComponent(b64enc(JSON.stringify(data)));
        box.focus(); box.select();
        copyBox('✓ 已複製同步連結（' + count + ' 題）— 傳到手機打開即可');
      } else if (a === 'export') {
        panel.hidden = false;
        box.value = JSON.stringify(data, null, 2);
        box.focus(); box.select();
        flash('已匯出 ' + count + ' 題');
      } else if (a === 'import') {
        panel.hidden = false;
        if (!/^\s*[\{h]/.test(box.value)) box.value = '';
        box.focus();
        flash('貼上 JSON（或同步連結）再按「套用匯入」');
      } else if (a === 'copy') {
        copyBox('✓ 已複製');
      } else if (a === 'dl') {
        download('nc250-notes.json', box.value && /^\s*\{/.test(box.value) ? box.value : JSON.stringify(data, null, 2));
        flash('✓ 已下載');
      } else if (a === 'apply') {
        applyFromBox(box.value, flash);
      }
    });

    wrap.querySelector('input[type=file]').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { box.value = rd.result; flash('已載入檔案，按「套用匯入」'); };
      rd.readAsText(f);
    });
  }

  /* accept either raw JSON or a full sync link pasted into the box */
  function applyFromBox(text, flash) {
    text = (text || '').trim();
    var linkMatch = text.match(/trk=([^&\s]+)/);
    var jsonStr;
    if (linkMatch) {
      try { jsonStr = b64dec(decodeURIComponent(linkMatch[1])); }
      catch (e) { flash('✗ 連結解不開'); return; }
    } else { jsonStr = text; }
    var incoming;
    try { incoming = JSON.parse(jsonStr); }
    catch (e) { flash('✗ JSON 格式錯誤'); return; }
    if (!incoming || typeof incoming !== 'object') { flash('✗ 資料格式不對'); return; }
    var n = mergeIn(incoming);
    flash('✓ 已匯入 ' + n + ' 題，重新整理中…');
    setTimeout(function () { location.reload(); }, 700);
  }

  function init() {
    checkSyncLink();   // handle #trk= before wiring, so import→reload is clean
    wireFields();
    buildIO();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
