/* ============================================================
   Progress Tracker
   Self-editable per-problem columns on the category quick-index:
     · time  — how long the problem took (free text, e.g. "25m")
     · date  — last attempted (native date picker)
     · diff  — my own difficulty rating (Easy / Med / Hard)
   Persisted in localStorage, keyed by LeetCode number, so the same
   problem's data shows on every category page. No backend needed.
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

  function init() {
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
        if (!d[pid].time && !d[pid].date && !d[pid].diff) delete d[pid];
        save(d);
        reflect(el, field);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
