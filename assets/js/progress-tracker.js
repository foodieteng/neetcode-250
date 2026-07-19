/* ============================================================
   Progress Tracker
   Self-editable per-problem columns on the category quick-index:
     · time  — how long the problem took (free text, e.g. "25m")
     · date  — last attempted (native date picker)
     · diff  — my own difficulty rating (Easy / Med / Hard)
     · note  — free-text remark (e.g. "revisit dp", "用了提示")
   Persisted in localStorage, keyed by LeetCode number, so the same
   problem's data shows on every category page. No backend needed.

   localStorage is per-origin AND per-device, so notes DON'T follow you
   from computer→phone (or file://→the live site). The Export/Import bar
   moves the data across: export a JSON string / file on one device,
   import it on another.
   ============================================================ */
(function () {
  var KEY = 'nc250-track-v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
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
        var d = load();                 // re-read so parallel tabs don't clobber
        if (!d[pid]) d[pid] = {};
        d[pid][field] = el.value;
        // drop the record only when every tracked field is empty
        if (Object.keys(d[pid]).every(function (k) { return !d[pid][k]; })) delete d[pid];
        save(d);
        reflect(el, field);
      });
    });
  }

  /* ---- Export / Import: carry notes between devices ---- */
  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function applyImport(text, flash) {
    var incoming;
    try { incoming = JSON.parse(text); }
    catch (e) { flash('✗ JSON 格式錯誤'); return; }
    if (!incoming || typeof incoming !== 'object') { flash('✗ 資料格式不對'); return; }
    var d = load(), n = 0;
    Object.keys(incoming).forEach(function (pid) {
      var rec = incoming[pid];
      if (!rec || typeof rec !== 'object') return;
      if (!d[pid]) d[pid] = {};
      Object.keys(rec).forEach(function (k) { d[pid][k] = rec[k]; });   // imported wins, existing kept
      n++;
    });
    save(d);
    flash('✓ 已匯入 ' + n + ' 題,重新整理中…');
    setTimeout(function () { location.reload(); }, 700);
  }

  function buildIO() {
    var host = document.querySelector('.table-scroll');
    if (!host || document.querySelector('.trk-io')) return;

    var wrap = document.createElement('div');
    wrap.className = 'trk-io';
    wrap.innerHTML =
      '<div class="trk-io__bar">' +
        '<button class="trk-io__btn" data-a="export" type="button">⤓ 匯出註記</button>' +
        '<button class="trk-io__btn" data-a="import" type="button">⤒ 匯入註記</button>' +
        '<span class="trk-io__hint">localStorage 不跨裝置 — 用這裡把自評/註記搬到手機</span>' +
      '</div>' +
      '<div class="trk-io__panel" hidden>' +
        '<textarea class="trk-io__box" spellcheck="false" ' +
          'placeholder="匯出:資料會出現在這裡,按「複製」或「下載」帶走。&#10;匯入:把 JSON 貼進來(或用「選檔案」),再按「套用匯入」。"></textarea>' +
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
      if (m) setTimeout(function () { if (msg.textContent === m) msg.textContent = ''; }, 3000);
    }

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'export') {
        panel.hidden = false;
        box.value = JSON.stringify(load(), null, 2);
        box.focus(); box.select();
        flash('已匯出 ' + Object.keys(load()).length + ' 題');
      } else if (a === 'import') {
        panel.hidden = false;
        if (!/^\s*\{/.test(box.value)) box.value = '';
        box.focus();
        flash('貼上 JSON 或用「選檔案」,再按「套用匯入」');
      } else if (a === 'copy') {
        var done = function () { flash('✓ 已複製'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(box.value).then(done, function () { box.select(); flash('請手動複製'); });
        } else { box.select(); try { document.execCommand('copy'); done(); } catch (e) { flash('請手動複製'); } }
      } else if (a === 'dl') {
        download('nc250-notes.json', box.value || JSON.stringify(load(), null, 2));
        flash('✓ 已下載');
      } else if (a === 'apply') {
        applyImport(box.value, flash);
      }
    });

    wrap.querySelector('input[type=file]').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { box.value = rd.result; flash('已載入檔案,按「套用匯入」'); };
      rd.readAsText(f);
    });
  }

  function init() {
    wireFields();
    buildIO();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
