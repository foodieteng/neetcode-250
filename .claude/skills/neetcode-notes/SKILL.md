---
name: neetcode-notes
description: Use this skill when the user pastes a NeetCode/LeetCode problem into the NeetCode250 repo and wants it integrated into their personal study-notes site. Each problem becomes a 3-page "study card" set (Concept / Code / Review) in industrial-cream styling with manual-token-span C++ syntax highlighting and step-by-step canvas animations. Each problem also ships a two-voice spoken mock interview (mock.mp3 + click-to-seek mock.html). The skill handles file scaffolding, category placement, sidebar sync via scripts/generate_chapters.py, and git commits.
---

# neetcode-notes — NeetCode 250 study notes workflow

## Site layout

Static HTML notebook at the NeetCode250 repo root, organized by the **18 NeetCode 250 categories** (`CHAPTERS` in the generator). **3-page study card per problem:**

```
topics/<NN>-<slug>/
├── index.html                  # category overview + outline (generated)
└── problems/<pXXX>/
    ├── index.html              # PAGE 1 · Concept (題意 + algo + viz)
    ├── code.html               # PAGE 2 · Code + Complexity
    └── review.html             # PAGE 3 · Review (Q&A + worked trace)
```

`<pXXX>` is `p<leetcode-number>` — e.g. Two Sum (LeetCode #1) → `p1`, Longest Consecutive Sequence (#128) → `p128`.

**Once the first problem is built it becomes the canonical template — read its three files to mirror structure.** The study-card design system (`assets/css/study-card.css`) and the animation reference library (`assets/js/viz/*.js`, carried over from ALGO_NOTES — e.g. `p114-lboard.js`, `p157-incexc.js`, `p507-closest.js`) are already in place; use those JS files as animation *patterns*, not as this repo's content. **Every problem gets 3 pages**, with or without animation. Problems without a canvas just skip the `.sc-viz` block and put the algorithm walkthrough straight into a `.sc-dark-box` proof or `.sc-trace` example.

## Single source of truth

`scripts/generate_chapters.py` holds:
- `CHAPTERS` — the 18 NeetCode 250 categories (id `01`–`18`, slug, English title, Chinese subtitle, problem count).
- `PROBLEMS` — dict of `category-id → list of (pid, title-en, url_slug, difficulty, status)`
  - `pid`        : folder slug `p<leetcode-number>` (e.g. `p1`)
  - `title-en`   : official LeetCode title
  - `url_slug`   : the kebab string in `leetcode.com/problems/<url_slug>/` (e.g. `two-sum`) — powers the "原題 ↗" link
  - `difficulty` : `easy` | `med` | `hard`
  - `status`     : `todo` | `done` | `demo`
- `DIFF_NAMES` / `DIFF_COLOR` — difficulty chip labels + colors.

Run after editing:

```
python3 scripts/generate_chapters.py
```

It rewrites every `topics/<NN>-<slug>/index.html` category page and refreshes the `// NEETCODE 250` sidebar on `index.html` and every problem subpage. **Never hand-edit category index pages** — they get clobbered on next run. Problems render in NeetCode's curated within-category order (the order they appear in `PROBLEMS[cat]`), each with a difficulty chip and an "原題 ↗" LeetCode link.

## Parallelize with subagents — what to fan out, what to keep

The serial version of this workflow spends most of its wall-clock on two things: **compile-verify loops** and **render-and-look loops**. Both are mechanical and independent, so fan them out. **Content stays on the main thread** — see the "never parallelize" list below for why.

### PHASE A · 驗證(fan out 3 agents, all `general-purpose`)

Runs first and blocks everything else, because every page quotes its numbers. The three questions are genuinely independent, so send all three in **one message**:

| Agent | Question it answers |
| --- | --- |
| **A1 · 主解** | Compile the user's exact C++. Run every official example. Then exhaustive/randomized cross-check against an independent reference implementation. Report pass counts. |
| **A2 · 反例獵捕** | For each plausible way to get the code subtly wrong (flip a `<` to `<=`, drop a `+1`, move a line into the `else`, wrong initial bound), build that variant and **brute-force the smallest failing input**. Report `失敗筆數 / 總組數` + minimal counterexample per variant. |
| **A3 · 極端與型別** | Max-size input, overflow reachability, floating-point exactness, degenerate shapes (n=1, single column, no rotation, h == n). Report actual observed values, not bounds you reasoned out. |

**A2 is the highest-value agent** — the pitfalls table and the answer blocks live or die on whether the counterexamples are real. It is also the most tedious to do serially, so it is exactly what a subagent should own.

**Contract — every agent returns a fact sheet, and only that:**

```
## 官方範例      <input> → <output>   (expect <output>)   ✓/✗
## 對拍          <N> 組,不一致 <M>   [reference used]
## 變體反例      <變體名>:失敗 <k>/<N>,最小反例 <input> → <got>(正解 <exp>)
## 極端          <case> → <observed value>
## Trace         <the exact step-by-step the animation and 走讀 must both use>
```

**Downstream pages may only quote this sheet. They may not derive a number themselves.** That single rule is what keeps the animation, the `細節走讀`, the mock's dry-run table, and the `範例 Trace` from drifting apart. If a page wants a number that isn't on the sheet, go get it verified — don't reason it out.

### PHASE B · 產出(fan out 2 agents, after the sheet exists)

| Agent | Owns |
| --- | --- |
| **B1 · 動畫** | Write `assets/js/viz/<pid>-<algo>.js` from the Trace section, then run the headless-Chrome screenshot loop itself (940 + 720, a mid-step and the final step) and **keep iterating until the layout passes**. Hand it Integration steps 5–6 + the Animation rules verbatim. Return the JS path + the widths/steps it verified. |
| **B2 · mock + 語音** | Write the transcript directly as `mock.html` (the `leetcode-mock-png` dialogue spec + dark template, no PNG render), write `mock.script.json`, run `scripts/make_mock_audio.py` → `mock.mp3`, screenshot-check 880 + 390. Hand it the fact sheet + the exact C++ + Integration step 7 verbatim. |

These two touch disjoint files and neither reads the other's output, so they parallelize cleanly.

### PHASE C · 三頁與收尾(main thread, never delegated)

Write `index.html` / `code.html` / `review.html` yourself, then flip status → `generate_chapters.py` → commit.

### PHASE D · 版面抽查(1 agent, after C — blocks the commit)

Everything rendered gets eyeballed by a **fresh `general-purpose` agent that did not build it** — the builder grading its own layout misses the same bugs twice. Hand the agent only the problem dir + this spec:

- **Render every page it finds** (`index.html` / `code.html` / `review.html` / `mock.html`) full-page in headless Chrome: study-card pages at **940 and 390**, mock at **880 and 390**. Before shooting: review → click 全部展開; animation pages → click Next 2–3 times (mid-step is where overlaps hide); mock → confirm the sticky audio bar, then scroll mid-page and shoot again.
- **LOOK at every screenshot** and flag: clipped or overlapping text, elements touching (<12px), horizontal page overflow (`scrollWidth` at 390 may be up to 395 — the site-wide baseline; flag only >395), canvas cut off, sticky bar covering content, table columns crushed into vertical letter-stacks, code escaping its box, beige chip backgrounds that should not exist (printed-ink rule).
- **Report per page × width: `PASS` or the exact issue + a cropped screenshot path.** No "looks fine" without listing what it rendered.

Main thread fixes every flagged issue and re-runs PHASE D until all PASS — only then step 8 (flip status) and the commit.

### Wall-clock discipline(跑快一點)

- **A 跑的同時,主線程先搭骨架。** 加 `PROBLEMS` 條目、鋪好三頁的 chrome(nav / mast / pageind / pager / summary-bar + 空 section)和 `mock.html` 外殼 — sheet 一到只剩填內容。
- **每個 A agent 給預算:單項檢查 ≤ ~90 秒。** 空間大就用編譯過的 C++ 窮舉,不用 Python;尺寸取預算內跑得完的,回報實際測的組數。五個驗完的變體勝過十一個驗一半的。
- **Sheet 一到,B1 + B2 在同一則訊息發出。** 語音合成已是 4 路並發(8 分鐘 mp3 約 1 分鐘)。
- **截圖同一個 session 抓完**:一個寬度開一次頁面,mid-step 和 final 在同一次裡抓,不要每張圖重啟瀏覽器。

### 🚫 Never parallelize these

- **The three study-card pages.** They cross-reference each other (`概念頁 → 程式碼頁 → 複習頁`), reuse one running explanation, and must not repeat or contradict each other. Three agents produce three voices and three slightly different versions of the same lemma.
- **Cross-problem links** (e.g. "和 875 唯一的差別是左界"). Only the main thread knows what the neighbouring problems' pages actually say.
- **The commit.** One commit message has to describe everything that happened, including corrections.

### 一個實測過的教訓

A subagent that is asked to "verify X" will happily report "X 安全" from a plausible argument. **Make the prompt demand an observed value**: not "does int overflow here?" but "print the largest value this accumulator actually reaches on the worst legal input". The 875 `int` analysis and the 875 `+1` correction both came from forcing that distinction — a reasoned answer would have been wrong in one of the two cases.

## Integration steps when the user pastes a problem

1. **Identify the category.** Match the problem to one of the 18 categories in `CHAPTERS`. Most map naturally (e.g. sliding-window problem → `03`); ask the user only if ambiguous.

2. **Add / flip the entry in `PROBLEMS[cat]`:**
   ```python
   ('p<num>', '<LeetCode Title>', '<url-slug>', '<difficulty>', 'todo'),  # before content exists
   ('p<num>', '<LeetCode Title>', '<url-slug>', '<difficulty>', 'done'),  # once detail pages exist
   ```
   - Keep NeetCode's ordering within the category if known (easy warm-ups first).
   - `difficulty` one of `easy` / `med` / `hard`.

3. **Scaffold the 3-page set** at `topics/<NN>-<slug>/problems/<pXXX>/`. Mirror the canonical template (the first completed problem) and replace per-problem content. Required path adjustments:
   - CSS link uses `../../../../assets/css/study-card.css`
   - Crumb / nav back to category index uses `../../index.html`
   - Sibling subpage links use bare `index.html` / `code.html` / `review.html`
   - The "原題 ↗" link is the LeetCode URL `https://leetcode.com/problems/<url-slug>/`

4. **🔴 MANDATORY: compile & run the C++ on the sample I/O before pasting it into `code.html`.** (Fan this out — PHASE A above. The steps below are what those agents must do.) A wrong solution in the notes is worse than no notes. Do it in a scratch dir, never commit scratch files:
   ```bash
   mkdir -p /tmp/nc-check && cd /tmp/nc-check
   cat > sol.cpp <<'CPP'
   ... the exact code you intend to put on the page ...
   CPP
   g++ -O2 -std=c++17 sol.cpp -o sol && ./sol < sample.in
   # compare stdout against EVERY LeetCode example line-for-line
   ```
   - LeetCode problems are function-signature based. Wrap the `Solution` method in a tiny `main()` that reads/prints the examples so you can actually run it; verify against **every** example the problem lists, plus an edge case (empty input, single element, all-equal, max constraint).
   - If the page shows **two implementations** (e.g. brute vs optimized), compile-run **both**; they must agree.
   - If you can't reproduce the expected output, the code is wrong — **fix it before writing the page**, don't paste hopeful code.
   - **Never leave dead placeholder lines** like `if (!(cond && 1)) {}` or `// 見下方` stubs — they compile but signal the logic was never run.
   - The page's `// OUTPUT` trace block and any hand-trace must match what the verified binary actually prints.

5. **If the algorithm benefits from animation**, write `assets/js/viz/<pid>-<algo>.js`. (Delegate to PHASE B1 — hand the agent this section verbatim plus step 6.) Reference `assets/js/viz/p114-lboard.js` / `p157-incexc.js` for the pattern:
   - White paper background `#ffffff`
   - Step-by-step state machine driven by Reset / Prev / Play / Next
   - Single canvas per page; canvas + control IDs are `viz-canvas`, `viz-reset`, `viz-prev`, `viz-play`, `viz-next`, `viz-step`, `viz-label`
   - Live description via `<div class="sc-viz__label" id="viz-label">`
   - **🎬 ONE ANIMATION PER WRITE-UP (required).** If the problem has N distinct solution write-ups (e.g. DFS vs BFS, or Union-Find vs Dijkstra vs binary-search), the Concept page's 動畫演示 section must contain **N animations — one per approach**, each showing that approach's own mechanic (not the same animation reused). Give each its own prefixed IDs (`va-*`, `vb-*`, `vc-*` …), one `.sc-viz` block per approach, and load one JS file per approach. Same rule for base+general (`vb-*` / `vg-*`). Every canvas + control set must use a unique prefix so the instances don't collide.
   - **📱 MOBILE (required).** Every `<canvas>` ships inside `.sc-viz__cvwrap`, designed against the 620px floor — snippet and full rule in **Animation rules #7**.

6. **🟠 MANDATORY: screenshot-verify the animation layout before flipping to done.** The user cares a lot that the canvas is *整齊好看、不被切到*. Eyeballing the JS is not enough — render every animation step in headless Chrome and look at the image:
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-sandbox \
     --screenshot=/tmp/nc-check/render.png --window-size=980,5200 --virtual-time-budget=4000 \
     "file:///tmp/nc-check/render.html"
   # Read the PNG and CHECK: no text/cells clipped, no overlaps, no dead zone > ~80px,
   # every step visibly changes something. Test ~940px AND ~720px widths — AND grab a mid-step
   # (not just step 0): auto-click Next a couple times in a <script> so the equation/active-cell
   # band is on screen, since that is where overlaps hide.
   ```
   - On Linux/cloud the binary is `google-chrome` (or `chromium`) with the same flags.
   - The `string.length`-based bbox stub is **unreliable for CJK** — trust the rendered PNG, not the stub.
   - Anything clipped/overlapping/dead-zoned: **fix the JS geometry per Animation rules #2–#3 and re-render.** Clear horizontal bands (see `p157-incexc.js`) is the layout that reliably passes.

7. **🎧 MANDATORY: 有聲 mock interview.** (Delegate to PHASE B2, in parallel with B1.) Every problem ships three mock files in `topics/<NN>-<slug>/problems/<pXXX>/` — no PNG; `mock.html` *is* the transcript:

   | file | what |
   | --- | --- |
   | `mock.html` | the full UMPIRE transcript as a live dark-theme page with click-to-seek audio |
   | `mock.script.json` | the spoken adaptation, one entry per dialogue turn |
   | `mock.mp3` | the two-voice audio built by `scripts/make_mock_audio.py` |

   Write the transcript straight into `mock.html`, following the `leetcode-mock-png` skill's dialogue spec (UMPIRE structure, signature phrases, simple-to-say English, Python-trace before any dry-run table) and its dark template — just skip the PNG render.

   **M — match 講演算法類型,絕不引另一題 LeetCode。**「This problem reminds me of」後面接的是 pattern 的名字和它的機制(a greedy exchange argument / a sliding-window count / a monotonic stack / binary search on the answer …),再用一句話說這題為什麼符合那個 pattern 的使用條件。不說 "this is like LeetCode 322" — 面試裡引題號不真實,聽的人也未必做過那題。此規則管 `mock.html` 全文和語音;三頁學習卡之間的互相連結(筆記站導航)不受限。 If the problem has **two implementations**, the mock covers **both**. The mock's code boxes use the **same LeetCode layout** as `code.html` (see *C++ code layout* below) — paste, never re-indent by hand. Screenshot-check `mock.html` at ~880 and ~390 widths (code-box overflow scrolls inside the box; sticky audio bar doesn't cover text). Problems built before this change still carry a `mock.png` + 🎤 link — when touching one, transcribe it into `mock.html` and delete the PNG.

   **`mock.script.json` — 廣播劇改編, not a transcript reading:**
   ```json
   [ {"v": "iv", "text": "You run a lemonade stand. Each lemonade costs five dollars. ..."},
     {"v": "cd", "text": "Before I dive in, I'd like to clarify a few things. ..."} ]
   ```
   - All English. One entry per dialogue turn, **same order as the `.turn` blocks in `mock.html`** — the audio cues bind by index.
   - Never speak the INTERVIEWER / CANDIDATE labels or the UMPIRE phase chips; the voice change carries the roles.
   - **Code is never read verbatim.** Every code block and pseudocode plan becomes the candidate explaining it in spoken English ("I keep two counters, pay-five and pay-ten. A ten always costs me one five, and I fail the moment a counter would go negative."). Symbols become words: `10^5` → "ten to the fifth", `O(n)` → "linear time", `[5,5,10]` → "five, five, ten", `--pay5 < 0` → "if that takes pay-five below zero".
   - **精簡、講重點、不報流水帳。** Every turn says what it is for, the one point that matters, and the conclusion — never a step-by-step log. Banned shapes: "At i = 0 … at i = 1 … then …", "first … second … third …" over rows, reading a loop line by line.
     - **Code turn** ≤ ~120 words: the idea in 2–3 sentences + the one line that is easy to get wrong and why.
     - **Dry-run turn** ≤ ~100 words: input + expected → **the one row where the decision happens** and why → result. ("Example two: five, five, ten, ten, twenty — expected false. The moment that matters is the twenty: I hold two tens but no five, and fifteen always needs a five. So false, on the spot.")
     - **Plan** = 3 short spoken steps; **corner cases** = at most 4, one clause each.
   - Hard cap: no turn > 150 words; whole script ~900–1,300 words (≈ 6–8 min). Length follows content — never pad. The Concept page's 「面試這樣說」 is the register to match. `make_mock_audio.py` refuses a turn over 160 words.
   - Every number spoken comes from the PHASE A fact sheet, same as the pages.

   **頁面 = 語音(看到的就是聽到的)。** In every `.turn` of `mock.html`, the prose says exactly what that turn's script entry says — same sentences, same order, same corner cases — only in written form (`<code class="chip">[5,5,10]</code>` where the audio says "five, five, ten"). The `pre.code` block, `table.trace` and the plan `.insight-box` stay as visuals the audio talks *about*; they are not prose. Write the script first, then write each turn's prose from it — never keep a longer page version. `make_mock_audio.py` compares page prose vs script per turn and fails on a > 35% word-count gap.

   **`mock.html` — click-to-seek contract:** the kept transcript HTML plus: a sticky `<audio id="mock-audio" controls preload="metadata" src="mock.mp3">` at the top; every dialogue turn tagged `class="turn"`; before `</body>`: `<script>window.MOCK_CUES = []</script>` then `<script src="../../../../assets/js/mock-audio.js"></script>`. The shared player makes turns clickable (seek + play), highlights the playing turn, and keeps it scrolled into view. `make_mock_audio.py` fills `MOCK_CUES` — never hand-edit it.

   **Audio build:**
   ```bash
   python3 scripts/make_mock_audio.py topics/<NN>-<slug>/problems/<pXXX>
   ```
   edge-tts per turn → 0.45 s gaps → ffmpeg concat → `mock.mp3`, cue offsets written into `mock.html`. Voices: **two different people drawn from the Plus-grade Microsoft multilingual pool** (Andrew / Ava / Brian / Emma — the natural ones; same family NaturalReaders sells as Plus Voices), seeded by the problem number: stable across re-runs, roles not gender-fixed, speakers always differ. Don't add the older single-language voices (Guy/Jenny/Aria/Christopher…) back — noticeably more robotic. Needs `speech.platform.bing.com` reachable (honors `HTTPS_PROXY`); if synthesis is blocked, ship the other three files and say so — **never commit a silent or partial mp3**.

   **Spot-check (mandatory):** listen to the first ~20 s and one code-explanation turn; the script prints total duration (expect ~6–8 min); click two turns in `mock.html` and confirm the seek lands on the right sentence.

   Link it from `code.html` right after the code window:
   ```html
   <p style="margin-top:14px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.04em;">
     🎧 面試模擬 · <a href="mock.html" target="_blank" rel="noopener">UMPIRE mock · 逐句點播有聲版 ↗</a>
   </p>
   <audio controls preload="metadata" src="mock.mp3" style="width:100%;margin-top:6px;"></audio>
   ```

8. **🧹 MANDATORY: PHASE D 版面抽查 PASS → auto-fix code layout, then flip status.** A fresh subagent that didn't build the pages renders all of them (two widths, details opened, animation mid-step) and eyeballs every screenshot for 跑版 — see PHASE D. All PASS is the precondition for everything below.
   ```bash
   python3 scripts/format_code.py            # fixes indentation of every <pre class="sc-code"> / <pre class="tcode">
   python3 scripts/format_code.py --check    # must end with "0 block(s) need fixing, 0 skipped"
   ```
   Then flip status to `'done'` in `PROBLEMS` and run `python3 scripts/generate_chapters.py`. If it reports `SKIPPED`, fix that block by hand (usually a stray tag inside `<pre>`), don't ignore it.

9. **Commit:**
   ```
   feat(<NN>/P<num>): <Title> — <one-line algorithm summary>
   ```
   (e.g. `feat(01/P1): Two Sum — one-pass hash map`)

## Three sub-page contracts

All three pages use `assets/css/study-card.css` and `<body class="study-card">`. Inline `code` on all three pages is the flat printed-ink style — when writing content, wrap standalone numbers in `<span class="nm">` and keywords in `<span class="kw2">` (identifiers stay bare). Each page has:
- Top nav strip `.sc-topnav` (Home / <NN> category / P<num>  ·  原題 LeetCode link)
- Masthead `.sc-mast` (chip "學習卡 · STUDY CARD" + title + subtitle "// <page name>" + difficulty/meta row)
- Page indicator `.sc-pageind` (`PAGE N / 3 · <NAME>` with 3 dots, current is `is-active`)
- Rule divider `.sc-mast__rule`
- Numbered `<section class="sc-section">` blocks
- Pager `.sc-pager` (PREV / NEXT)
- Final `.sc-summary-bar` (ink-black bg, one-line summary)

### PAGE 1 · `index.html` — Concept

Sections (7–9 typical):
1. **題目簡介** · `.sc-question` — coral left-border quote of the problem brief. Mono `QUESTION` label.
2. **為什麼用 X** · `.sc-ko` knockout layout — eliminated options (`--bad`, `--mid`) → mono arrow `BOTH FAIL · ADOPT` → winner card (`--good`). Verdicts: `× REJECT · TLE`, `△ REJECT · UNSTABLE`, `● ADOPT · STABLE` (mono uppercase, never emoji).
3. **核心策略 · 三步驟** · plain ordered list — terse (3–5 lines).
4. **動畫演示** · `.sc-viz` with `<canvas>` + Reset/Prev/Play/Next/step controls + `.sc-viz__label`.
5. **(optional) 兩個關鍵 / LEMMA** · `.sc-dark-box` titled `// LEMMA NAME`.
6. **最佳解證明** · `.sc-question` CLAIM(要證明什麼) → `.sc-dark-box` titled `PROOF · 手法:<交換論證|不變量|分層|必然選擇|…>` with a numbered `<ol>` of 3 steps → `.sc-question` 「面試這樣說 · 30 秒」spoken version (the mock audio reuses this register). Sits between 兩個關鍵 and 複雜度.
7. **複雜度** · brief paragraph + `.sc-formula` + a 4-row `.sc-table` (Time / Space / … / Constant factor).
8. **一句洞察** · `.sc-insight` — one-line takeaway.

Pager: PREV disabled / NEXT → `code.html`.

### PAGE 2 · `code.html` — Code + Complexity

1. **完整實作** · `.sc-codewindow` (macOS chrome + `<pid>.cpp` tab + `C++17` label) containing `<pre class="sc-code">` with **manual token spans** — `<span class="k">` keyword, `<span class="t">` type, `<span class="f">` function, `<span class="s">` string, `<span class="n">` number, `<span class="c">` comment, `<span class="p">` punctuation. **Never use Prism + `language-cpp`** — token classes are pre-styled by `study-card.css`.
2. **複雜度分析** · per-step cost table → `.sc-formula` → summary `.sc-table`.
3. **邊界與陷阱** · `.sc-table` of named pitfalls + fixes.
4. **細節走讀** · `.sc-trace` blocks, each starting `<span class="sc-trace__head">// <PHASE>: <name></span>`. Never add `language-cpp` to a trace block.

Pager: PREV → `index.html` / NEXT → `review.html`.

### PAGE 3 · `review.html` — Review 複習考卷(exam paper)

Components (`.xp-*`, `.xq*`) live in `study-card.css` — 定稿「C-2 藍圖框 × VS Code Light+」: steel (`--sc-steel`) 題章/卡框/解答橫條;**考卷 = 白紙**(考卷頭、題卡、卡內 insight/表格全是 `#fff`,米黃只留在頁面桌面);行內 `code` 用全站統一的 printed-ink 印字(見 palette 一節)。**排版寧鬆勿擠**:題卡間 20px、題目 15/18、答案 17/18、行高 ≥ 2,元件間距已在 CSS 裡,不要在頁內用 style 縮小。

1. **考卷頭** · `.xp-strip`:單元/範圍/共 N 題/滿分 100 + 建議時間 + NAME/SCORE 填空線;其後 `.xp-tools` 全部展開/收合按鈕(頁尾 ~8 行 script)。
2. **PART A · 觀念題** · 5 題 × 10 分。每題一張 `.xq`:`.xq__head`(`.xq__no` 題章 + `.xq__pts` 配分)→ `.xq__body` 題目 → `<details class="xq__ans">`「// 解答與說明 · ANSWER」下拉 → `.xq__ansbody`:一句粗體主張 → 空行 → 理由與反例,數字只引 PHASE A fact sheet。
3. **PART B · 手走模擬** · 1 題 × 10 分:答案內放對照 `.sc-trace`(照程式 vs 錯誤走法,各以 `// OUTPUT` 結尾)+ `.sc-insight` 收尾。
4. **PART C · 應用題** · 3 題 × 12–14 分;全卷配分合計 100。
5. **考後重點** · 一張收合卡:六句話 `.sc-table`。

答案一律內嵌在各題的 `<details>` 裡 — 不再有 `.answer-divider` / 頁尾 ANSWERS 區。
Pager: PREV → `code.html` / NEXT → `../../index.html` ("↑ 回 <NN> 分類").

## Required `<head>` includes per page (study-card variant)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" />

<link rel="stylesheet" href="../../../../assets/css/study-card.css" />
```

`<body class="study-card">` and you're done. **Do NOT load** `tokens.css`, `base.css`, `components.css`, `problem.css`, or any Prism script. Code highlighting is via manual `<span class="k/t/f/s/n/c/p">` token spans.

Animation pages add at the bottom of `<body>`:

```html
<script src="../../../../assets/js/viz/<pid>-<algo>.js"></script>
```

## C++ code layout — LeetCode editor style, automatic (user's preference)

All code windows on the site (`<pre class="sc-code">` on problem pages, `<pre class="tcode">` on cheatsheets) use **the layout of LeetCode's own C++ template**, enforced by `scripts/format_code.py` (`.sc-trace` traces and inline `<pre>` snippets in review pages are not touched — write those in the same layout by hand):
```cpp
class Solution {
public:                                  // access specifier flush with `class`
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;    // 4 spaces per level
        ...
    }
};
```
- **4-space indent** per brace level; `public:` / `private:` / `protected:` and `}` line up with the line that opened the `{`.
- Body of a braceless `if (...)` / `for (...)` / `while (...)` / `else` = 4 spaces past its header.
- Lambda bodies (`sort(..., [&](int a, int b) {`) = 4 spaces past the line that opens them.
- No tabs, no trailing whitespace. Pointer style as LeetCode writes it (`ListNode* head` in signatures; `ListNode *slow = head, *fast = head;` for multi-declarations is fine).
- **The fixer only touches indentation.** It never joins or splits lines (compact `l++; r--;` and `{ st.push(x); continue; }` stay), never moves trailing comments (hand-aligned comment columns stay), keeps hand-aligned continuation lines (`return a\n     || b;`, wrapped signatures) at their relative offset, keeps a snippet's starting indent, never renames anything. It refuses (reports `SKIPPED`) if any line's content would change, and leaves blocks that need no fix byte-for-byte untouched.
- Highlight spans (`k/t/f/s/n/c/p`, cheatsheet `kw/ty/cm/hl`) are carried over character by character — colours never need redoing. Idempotent.
- **Not clang-format / not Google style** — that was tried and rejected: it re-flowed comments, merged hand-wrapped expressions and split the user's compact lines.
- When asked to "整理排版 / 自動修正排版 / format the code": run the script on the whole repo, confirm `--check` prints `0 block(s) need fixing, 0 skipped`, look at the diff (should be indentation-only), render-check a changed page, commit as `style: …`.

## C++ code conventions (from user's preferences)

- **Plain C arrays over STL sugar where it clarifies the layout.** Prefer parallel `int` arrays and explicit indices over opaque `struct`/`std::array` wrappers when showing grid/pointer mechanics. (LeetCode signatures using `vector<int>` are fine — this is about the internal working arrays.)
- **Descriptive variable names** rather than one-letter math shorthand (`left`/`right` not `l`/`r`, `midX`/`midY` not `mr`/`mc`).
- Always begin any `main()`/driver with:
  ```cpp
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  ```

## Study-card palette discipline (the most important rule)

Restrained industrial-mono look. **The palette is exactly three layers:**
1. **Paper** — `var(--sc-paper)` `#faf5e6` — every block's background
2. **Ink** — `var(--sc-ink)` — body text, 1px hairline borders
3. **Coral** — `var(--sc-coral)` — *one accent per block* (section number chips, one border accent per callout, the "winner", `strong` in formula/insight/question, the summary bar shadow)

**No other colors** in study-card pages. Forbidden: pastel pink/yellow/green backgrounds, emoji verdicts (`❌`/`⚠️`/`✓` → use `×`/`△`/`●` + uppercase `REJECT`/`ADOPT`), the `sn-wobble` SVG filter, decorative pseudo-element glyphs, `border-radius: 10px+` (use `2px`), coral bullets for lists (use ink-black square chips).

(Difficulty chips on the *category index pages* — Easy green `#6ba368` / Medium `#d4a017` / Hard `#c1440e` — are a `components.css` concern, separate from the study-card palette. Don't bring those colors into study-card pages.)

(One sanctioned extension — the **printed-ink set**: inline `code` on every study-card page is flat VS Code Light+ print — no background, no border(本體 `#001080`,獨立數字包 `<span class="nm">` `#098658`,關鍵字包 `<span class="kw2">` `#af00db`;spans 寫死在 HTML,不用 JS)。Steel `--sc-steel #33566b` marks the 考卷元件(題章/卡框/解答橫條)and the `.sc-trace` left bar + head。**米黃鋪底已退役**:never put a chip background under inline code, and never tint a trace block — 走讀 = 白紙 + 鋼青左線,printed like a note。The dark `.sc-codewindow` keeps its own Dark+ tokens.)

### Animation rules (learned the hard way)

1. **Base case animation = the algorithm itself on its smallest non-trivial input.** Never show "brute force on the full problem" as the "base case" — that conveys a different algorithm. If Canvas A shows code the user wouldn't submit, you've drawn the wrong thing.
2. **Fill the canvas — no dead zones > ~80px.** Arrays span most of the width; supplementary panels live in the lower half *inside* the canvas. Spread nodes/cells across the usable width — never cluster them at one end; a note/legend box goes on its own line below, not overlapping the nodes.
3. **Don't cram — leave ≥12px between any two text/graphics elements.** Mid markers, brackets, chips each need their own band. **Column/index headers must sit ≥12px clear of the value cells below them** (`cellTop = bandTop + ~30`) — a header baseline touching the number in a cell is the single most-reported layout bug. Stacked rows (`nums[]` over `dp[]`) need a full ~40px gap between rows, and enough canvas height to hold both (a 2-row array band + 2 lower bands ⇒ canvas ~340–360px, not 290). Row tags (`nums` / `dp`) sit vertically centered in the left margin, never on top of a cell.
4. **Show *what changes per step*.** Each step changes something visible; merge steps that would render identical pixels.
5. **Animation palette** (paper `#faf5e6`, cells `#ffffff` + ink border, left/upper tint `#e3edf5`, right/lower tint `#f6ead8`, active/answer **red `#cf3535`** (bg `#fbe1e1`, dark text `#992424`), good `#d9e8c7`, bad `#f0d4d4`, inactive `#cfcfcf`). Don't introduce new tints without reason. **The "current/active" accent is RED `#cf3535` and is labelled 紅 (one char) in legends — never coral/`#d96e4e`/珊瑚 (retired).** If a second red is needed (cycle/bridge/removed/hit), use a distinct dark-red `#a31d1d` labelled 深紅 so the two don't clash. The page CSS `--sc-coral` is also `#cf3535` (still named coral internally, but renders red).
6. **Screenshot-verify, don't eyeball** (see Integration step 6). Clear horizontal bands is the layout that reliably passes.
7. **Mobile is non-negotiable — wrap every canvas in `.sc-viz__cvwrap` and design against a 620px floor.**
   ```html
   <div class="sc-viz__cvwrap"><canvas id="viz-canvas" class="sc-viz__canvas" style="height:NNNpx;"></canvas></div>
   ```
   Hardcoded pixel coords overflow phones; the wrapper (`overflow-x:auto`) + canvas `min-width:620px` + body `overflow-x:hidden` — all already in `study-card.css` — are what stop the page "爆掉". Never remove them, never emit a bare `<canvas>`. On wider screens the ResizeObserver `fit()` scales up. Verify a narrow width (≤720px), not just desktop.

## Common pitfalls (memorize)

1. **Trace blocks must not have `language-cpp`** — trace text has Chinese + arrows.
2. **No "Variants / 延伸題" section** — they belong in the 考卷's PART C 應用題.
3. **Animations are white-bg solid-fill**, not dark outlined cells.
4. **Re-run the generator** after any change to `PROBLEMS` / `CHAPTERS` — sidebars desync silently otherwise.
5. **Never ship unverified or mis-indented C++** (steps 4 & 8); no dead placeholder lines; `// OUTPUT` must match the verified binary.
6. **SVG `<text>` cannot contain `<strong>`/HTML tags** — use `<tspan font-weight="700">`. Screenshot-check figures.
7. **Animation geometry, mobile wrap and screenshot verification all live in Animation rules #2/#3/#6/#7** — 940 + 720 widths on a mid-step, no bare `<canvas>`, headers clear of cells. Re-read them before writing any viz JS.
8. **`mock.script.json` entries and `mock.html` `.turn` blocks bind by index** — same count, same order. After any transcript edit re-run `make_mock_audio.py`; never hand-edit `window.MOCK_CUES`. Never commit an unheard mp3.

## Git workflow

```bash
python3 scripts/format_code.py
python3 scripts/generate_chapters.py
git add -A
git commit -m "feat(<NN>/P<num>): <Title> — <one-line summary>"
```

Scope prefixes: `feat(<NN>/P<num>)`, `fix(...)`, `style(...)`, `chore(...)`, `refactor(...)`. Don't push without explicit user request.

## When the user simply pastes problem text

Treat it as: "integrate this into my NeetCode 250 notes." Follow the integration steps above without further prompting unless the category is ambiguous.
