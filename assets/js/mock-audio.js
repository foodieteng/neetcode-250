/* Click-to-seek player for mock.html.
 * Contract: <audio id="mock-audio" src="mock.mp3">, one .turn element per
 * entry in mock.script.json, window.MOCK_CUES = [startSeconds, ...] filled
 * by scripts/make_mock_audio.py.
 * Modes: the top player plays the whole mock; clicking a turn plays ONLY
 * that line and pauses at its end. Pressing play on the bar afterwards
 * continues from there. The playing turn is highlighted and kept in view. */
(function () {
  var cues = window.MOCK_CUES || [];
  var audio = document.getElementById('mock-audio');
  var turns = Array.prototype.slice.call(document.querySelectorAll('.turn'));
  if (!audio || !cues.length || !turns.length) return;
  var GAP = 0.45; // silence makemockaudio.py inserts between turns

  var style = document.createElement('style');
  style.textContent =
    '.turn--clickable{cursor:pointer;border-radius:6px;transition:background .15s}' +
    '.turn--clickable:hover{background:rgba(255,255,255,.05)}' +
    '.turn.is-now{background:rgba(255,255,255,.07);outline:1px solid rgba(255,255,255,.22)}';
  document.head.appendChild(style);

  var segEnd = null;      // pause here when playing a single clicked line
  var lastClick = 0;

  turns.forEach(function (el, i) {
    if (i >= cues.length) return;
    el.classList.add('turn--clickable');
    el.addEventListener('click', function () {
      audio.currentTime = cues[i] + 0.01;
      segEnd = (i + 1 < cues.length) ? cues[i + 1] - GAP + 0.1 : null;
      lastClick = Date.now();
      audio.play();
    });
  });

  // Play pressed on the bar itself (not via a turn click) → continuous mode.
  audio.addEventListener('play', function () {
    if (Date.now() - lastClick > 500) segEnd = null;
  });

  var cur = -1;
  audio.addEventListener('timeupdate', function () {
    var t = audio.currentTime;
    if (segEnd !== null && t >= segEnd) { audio.pause(); segEnd = null; return; }
    var i = -1;
    for (var k = 0; k < cues.length; k++) {
      if (t >= cues[k] && (k + 1 >= cues.length || t < cues[k + 1])) { i = k; break; }
    }
    if (i === cur) return;
    if (cur >= 0 && turns[cur]) turns[cur].classList.remove('is-now');
    cur = i;
    if (i >= 0 && turns[i]) {
      turns[i].classList.add('is-now');
      turns[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
  audio.addEventListener('pause', function () {
    if (cur >= 0 && turns[cur]) turns[cur].classList.remove('is-now');
    cur = -1;
  });
})();
