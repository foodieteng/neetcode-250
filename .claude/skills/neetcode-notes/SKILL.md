---
name: neetcode-notes
description: Use this skill when the user pastes a NeetCode/LeetCode problem into the NeetCode250 repo and wants it integrated into their personal study-notes site. Each problem becomes a 3-page "study card" set (Concept / Code / Review) in industrial-cream styling with manual-token-span C++ syntax highlighting and step-by-step canvas animations. The skill handles file scaffolding, category placement, sidebar sync via scripts/generate_chapters.py, and git commits.
---

# neetcode-notes — NeetCode 250 study notes workflow

## Site layout

Static HTML notebook at the NeetCode250 repo root. Content is organized by the **18 NeetCode 250 categories** (`CHAPTERS` in the generator). Each category holds a set of problems. **Default layout is 3-page study card per problem:**

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

4. **🔴 MANDATORY: compile & run the C++ on the sample I/O before pasting it into `code.html`.** A wrong solution in the notes is worse than no notes. Do it in a scratch dir, never commit scratch files:
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

5. **If the algorithm benefits from animation**, write `assets/js/viz/<pid>-<algo>.js`. Reference `assets/js/viz/p114-lboard.js` / `p157-incexc.js` for the pattern:
   - White paper background `#ffffff`
   - Step-by-step state machine driven by Reset / Prev / Play / Next
   - Single canvas per page; canvas + control IDs are `viz-canvas`, `viz-reset`, `viz-prev`, `viz-play`, `viz-next`, `viz-step`, `viz-label`
   - Live description via `<div class="sc-viz__label" id="viz-label">`
   - **🎬 ONE ANIMATION PER WRITE-UP (required).** If the problem has N distinct solution write-ups (e.g. DFS vs BFS, or Union-Find vs Dijkstra vs binary-search), the Concept page's 動畫演示 section must contain **N animations — one per approach**, each showing that approach's own mechanic (not the same animation reused). Give each its own prefixed IDs (`va-*`, `vb-*`, `vc-*` …), one `.sc-viz` block per approach, and load one JS file per approach. Same rule for base+general (`vb-*` / `vg-*`). Every canvas + control set must use a unique prefix so the instances don't collide.
   - **📱 MOBILE (required — canvases have hardcoded pixel coords that overflow narrow phones).** Every `<canvas>` MUST be wrapped in a horizontal-scroll box so a wide diagram scrolls sideways *inside the card* instead of blowing out the whole page on a phone:
     ```html
     <div class="sc-viz__cvwrap"><canvas id="viz-canvas" class="sc-viz__canvas" style="height:NNNpx;"></canvas></div>
     ```
     `.sc-viz__cvwrap { overflow-x: auto; }` and `.sc-viz__canvas { min-width: 620px; }` are already in `study-card.css`, and the `.study-card` body has `overflow-x: hidden` — do **not** remove these. Design the canvas geometry against a **620px** logical width (the `min-width` floor); on wider screens it scales up via the ResizeObserver `fit()`. Never emit a bare `<canvas>` without the `.sc-viz__cvwrap` wrapper — that is the exact bug that made animations "爆掉" on mobile.

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
   - The `string.length`-based bbox stub is **unreliable for CJK** — trust the rendered PNG, not the stub.
   - If anything is clipped/overlapping/has a big dead zone, **fix the JS geometry and re-render**. Clear horizontal bands (see `p157-incexc.js`) is the reliable fix.
   - **🚫 Header-vs-cell overlap (the #1 recurring complaint).** When a band draws a *column-header / index label row* above a row of value cells, the header baseline and the cell must not touch. Push cells well below the header (`cellTop = bandTop + ~30`, value text at `cellTop + chh/2`), and leave ≥12px between the header row and the cell top. Same for **two stacked rows** (e.g. `nums[]` over `dp[]`): give the second row a full ~40px gap from the first row's bottom, and put each row's left-hand tag (`nums` / `dp`) vertically centered in the left margin, never on top of a cell.
   - **↔ Spread nodes/cells to fill the band — don't cluster them at one end.** For graph/array bands, distribute nodes across the usable width; a note/legend box goes on its own line below, not overlapping the nodes.

7. **🎤 MANDATORY: also generate a mock-interview PNG.** Every problem's notes must ship with a `leetcode-mock-png` transcript. Invoke the `leetcode-mock-png` skill for the same problem + solution, render the PNG, and save it as `topics/<NN>-<slug>/problems/<pXXX>/mock.png`. Link it from `code.html` right after the code window:
   ```html
   <p style="margin-top:14px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.04em;">
     🎤 面試模擬 · <a href="mock.png" target="_blank" rel="noopener">UMPIRE mock interview transcript ↗</a>
   </p>
   ```
   If the problem has **two implementations**, the mock must cover **both** (show both code blocks in the Implement phase). The mock's `pre.code` follows the mock skill's Google-style spacing rule.

8. **Flip status to `'done'`** in `PROBLEMS`, then `python3 scripts/generate_chapters.py`.

9. **Commit:**
   ```
   feat(<NN>/P<num>): <Title> — <one-line algorithm summary>
   ```
   (e.g. `feat(01/P1): Two Sum — one-pass hash map`)

## Three sub-page contracts (default)

All three pages use `assets/css/study-card.css` and `<body class="study-card">`. Each page has:
- Top nav strip `.sc-topnav` (Home / <NN> category / P<num>  ·  原題 LeetCode link)
- Masthead `.sc-mast` (chip "學習卡 · STUDY CARD" + title + subtitle "// <page name>" + difficulty/meta row)
- Page indicator `.sc-pageind` (`PAGE N / 3 · <NAME>` with 3 dots, current is `is-active`)
- Rule divider `.sc-mast__rule`
- Numbered `<section class="sc-section">` blocks
- Pager `.sc-pager` (PREV / NEXT)
- Final `.sc-summary-bar` (ink-black bg, one-line summary)

### PAGE 1 · `index.html` — Concept

Sections (6–8 typical):
1. **題目簡介** · `.sc-question` — coral left-border quote of the problem brief. Mono `QUESTION` label.
2. **為什麼用 X** · `.sc-ko` knockout layout — eliminated options (`--bad`, `--mid`) → mono arrow `BOTH FAIL · ADOPT` → winner card (`--good`). Verdicts: `× REJECT · TLE`, `△ REJECT · UNSTABLE`, `● ADOPT · STABLE` (mono uppercase, never emoji).
3. **核心策略 · 三步驟** · plain ordered list — terse (3–5 lines).
4. **動畫演示** · `.sc-viz` with `<canvas>` + Reset/Prev/Play/Next/step controls + `.sc-viz__label`.
5. **(optional) 關鍵步驟 / 證明** · `.sc-dark-box` titled `// LEMMA NAME`.
6. **複雜度** · brief paragraph + `.sc-formula` + a 4-row `.sc-table` (Time / Space / … / Constant factor).
7. **一句洞察** · `.sc-insight` — one-line takeaway.

Pager: PREV disabled / NEXT → `code.html`.

### PAGE 2 · `code.html` — Code + Complexity

1. **完整實作** · `.sc-codewindow` (macOS chrome + `<pid>.cpp` tab + `C++17` label) containing `<pre class="sc-code">` with **manual token spans** — `<span class="k">` keyword, `<span class="t">` type, `<span class="f">` function, `<span class="s">` string, `<span class="n">` number, `<span class="c">` comment, `<span class="p">` punctuation. **Never use Prism + `language-cpp`** — token classes are pre-styled by `study-card.css`.
2. **複雜度分析** · per-step cost table → `.sc-formula` → summary `.sc-table`.
3. **邊界與陷阱** · `.sc-table` of named pitfalls + fixes.
4. **細節走讀** · `.sc-trace` blocks, each starting `<span class="sc-trace__head">// <PHASE>: <name></span>`. Never add `language-cpp` to a trace block.

Pager: PREV → `index.html` / NEXT → `review.html`.

### PAGE 3 · `review.html` — Review

1. **重點回顧** · `.sc-table` of key insights.
2. **觀念題** · 5 `.qa` blocks (`Q1`..`Q5`), question only.
3. **範例 Trace** · small input walked through the actual code via sequential `.sc-trace` blocks, ending with `// OUTPUT`. Conclude with a `.sc-insight`.
4. **應用題** · 3 `.qa` blocks tagged `App 1..3`.
5. **`.answer-divider`** (`// ANSWERS` band) then `.qa.qa--answer` blocks answering Q1..Q5 + App1..App3.

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

### Animation rules (learned the hard way)

1. **Base case animation = the algorithm itself on its smallest non-trivial input.** Never show "brute force on the full problem" as the "base case" — that conveys a different algorithm. If Canvas A shows code the user wouldn't submit, you've drawn the wrong thing.
2. **Fill the canvas — no dead zones > ~80px.** Arrays span most of the width; supplementary panels live in the lower half *inside* the canvas.
3. **Don't cram — leave ≥12px between any two text/graphics elements.** Mid markers, brackets, chips each need their own band. **Column/index headers must sit ≥12px clear of the value cells below them** (`cellTop = bandTop + ~30`) — a header baseline touching the number in a cell is the single most-reported layout bug. Stacked rows (`nums[]` over `dp[]`) need a full ~40px gap between rows, and enough canvas height to hold both (a 2-row array band + 2 lower bands ⇒ canvas ~340–360px, not 290).
4. **Show *what changes per step*.** Each step changes something visible; merge steps that would render identical pixels.
5. **Animation palette** (paper `#faf5e6`, cells `#ffffff` + ink border, left/upper tint `#e3edf5`, right/lower tint `#f6ead8`, active/answer coral `#d96e4e`, good `#d9e8c7`, bad `#f0d4d4`, inactive `#cfcfcf`). Don't introduce new tints without reason.
6. **Screenshot-verify, don't eyeball** (see Integration step 6). Clear horizontal bands is the layout that reliably passes.
7. **Mobile is non-negotiable — wrap every canvas in `.sc-viz__cvwrap` and design against a 620px floor.** Hardcoded pixel coords overflow phones; the wrapper (`overflow-x:auto`) + canvas `min-width:620px` + body `overflow-x:hidden` are what stop the page "爆掉". Verify a narrow width (≤720px), not just desktop.

## Common pitfalls (memorize)

1. **Trace blocks must not have `language-cpp`** — trace text has Chinese + arrows.
2. **No "Variants / 延伸題" section** — use the `.qa` App questions instead.
3. **Animations are white-bg solid-fill**, not dark outlined cells.
4. **Re-run the generator** after any change to `PROBLEMS` / `CHAPTERS` — sidebars desync silently otherwise.
5. **Never ship unverified C++** (Integration step 4). No dead placeholder lines. The `// OUTPUT` trace must match the verified binary.
6. **SVG `<text>` cannot contain `<strong>`/HTML tags** — use `<tspan font-weight="700">`. Screenshot-check figures.
7. **Animation layout MUST be screenshot-verified** at ~940px and ~720px widths, on a **mid-step** (not just step 0). The CJK-unaware `string.length` bbox stub lies about overflow.
8. **Bare `<canvas>` (no `.sc-viz__cvwrap`) breaks mobile** — the fixed-pixel diagram overflows the viewport. Always ship the wrapper; never delete `min-width:620px` / body `overflow-x:hidden`.
9. **Header row touching cell values** — push cells down (`bandTop + ~30`) so index/column headers never overlap the numbers. Give stacked rows real vertical gap and bump canvas height to fit.

## Git workflow

```bash
python3 scripts/generate_chapters.py
git add -A
git commit -m "feat(<NN>/P<num>): <Title> — <one-line summary>"
```

Scope prefixes: `feat(<NN>/P<num>)`, `fix(...)`, `style(...)`, `chore(...)`, `refactor(...)`. Don't push without explicit user request.

## When the user simply pastes problem text

Treat it as: "integrate this into my NeetCode 250 notes." Follow the integration steps above without further prompting unless the category is ambiguous.
