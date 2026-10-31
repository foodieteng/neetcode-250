---
name: neetcode-notes
description: Use this skill when the user pastes a NeetCode/LeetCode problem into the NeetCode250 repo and wants it integrated into their personal study-notes site. Each problem becomes a 3-page "study card" set (Concept / Code / Review) in industrial-cream styling with manual-token-span C++ syntax highlighting and step-by-step canvas animations. Each problem also ships a two-voice spoken mock interview (mock.mp3 + click-to-seek mock.html). The skill handles file scaffolding, category placement, sidebar sync via scripts/generate_chapters.py, and git commits.
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
| **B1 · 動畫** | Write `assets/js/viz/<pid>-<algo>.js` from the Trace section, then run the headless-Chrome screenshot loop itself (940 + 720, a mid-step and the final step) and **keep iterating until the layout passes**. Hand it the full geometry rules from Integration step 6 — the header-vs-cell gap, the 620px floor, the `.sc-viz__cvwrap` requirement. Return the JS path + the widths/steps it verified. |
| **B2 · mock + 語音** | Build the transcript from the `leetcode-mock-png` template, render + slice-check → `mock.png`, keep the HTML as `mock.html` (click-to-seek audio version), write `mock.script.json`, run `scripts/make_mock_audio.py` → `mock.mp3`. Hand it the fact sheet + the exact C++ + Integration step 7 verbatim. |

These two touch disjoint files and neither reads the other's output, so they parallelize cleanly.

### PHASE C · 三頁與收尾(main thread, never delegated)

Write `index.html` / `code.html` / `review.html` yourself, then flip status → `generate_chapters.py` → commit.

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

7. **🎤🎧 MANDATORY: mock-interview PNG + 語音版.** (Delegate to PHASE B2, in parallel with B1.) Every problem ships four mock files in `topics/<NN>-<slug>/problems/<pXXX>/`:

   | file | what |
   | --- | --- |
   | `mock.png` | the `leetcode-mock-png` transcript render |
   | `mock.html` | the same transcript as a live page with click-to-seek audio |
   | `mock.script.json` | the spoken adaptation, one entry per dialogue turn |
   | `mock.mp3` | the two-voice audio built by `scripts/make_mock_audio.py` |

   Build the transcript with the `leetcode-mock-png` skill as before, render + slice-check → `mock.png`. If the problem has **two implementations**, the mock covers **both**. The mock's code boxes use the **same LeetCode layout** as `code.html` (see *C++ code layout* below) — paste, never re-indent by hand.

   **`mock.script.json` — 廣播劇改編, not a transcript reading:**
   ```json
   [ {"v": "iv", "text": "You run a lemonade stand. Each lemonade costs five dollars. ..."},
     {"v": "cd", "text": "Before I dive in, I'd like to clarify a few things. ..."} ]
   ```
   - All English. One entry per dialogue turn, **same order as the `.turn` blocks in `mock.html`** — the audio cues bind by index.
   - Never speak the INTERVIEWER / CANDIDATE labels or the UMPIRE phase chips; the voice change carries the roles.
   - **Code is never read verbatim.** Every code block and pseudocode plan becomes the candidate explaining it in spoken English ("I keep two counters, pay-five and pay-ten. A ten always costs me one five, and I fail the moment a counter would go negative."). Symbols become words: `10^5` → "ten to the fifth", `O(n)` → "linear time", `[5,5,10]` → "five, five, ten", `--pay5 < 0` → "if that takes pay-five below zero".
   - Dry-run tables → narrate only the turning-point rows ("By the fourth customer I'm out of fives — then the twenty shows up and I can't make fifteen.").
   - Keep every UMPIRE beat and the full prose (target ≥ 8 min); only code and tables are re-spoken. The Concept page's 「面試這樣說」 wording is the register to match.
   - Every number spoken comes from the PHASE A fact sheet, same as the pages.

   **`mock.html` — click-to-seek contract:** the kept transcript HTML plus: a sticky `<audio id="mock-audio" controls preload="none" src="mock.mp3">` at the top; every dialogue turn tagged `class="turn"`; before `</body>`: `<script>window.MOCK_CUES = []</script>` then `<script src="../../../../assets/js/mock-audio.js"></script>`. The shared player makes turns clickable (seek + play), highlights the playing turn, and keeps it scrolled into view. `make_mock_audio.py` fills `MOCK_CUES` — never hand-edit it.

   **Audio build:**
   ```bash
   python3 scripts/make_mock_audio.py topics/<NN>-<slug>/problems/<pXXX>
   ```
   edge-tts per turn → 0.45 s gaps → ffmpeg concat → `mock.mp3`, cue offsets written into `mock.html`. Voices: **two different people drawn from the Plus-grade Microsoft multilingual pool** (Andrew / Ava / Brian / Emma — the natural ones; same family NaturalReaders sells as Plus Voices), seeded by the problem number: stable across re-runs, roles not gender-fixed, speakers always differ. Don't add the older single-language voices (Guy/Jenny/Aria/Christopher…) back — noticeably more robotic. Needs `speech.platform.bing.com` reachable (honors `HTTPS_PROXY`); if synthesis is blocked, ship the other three files and say so — **never commit a silent or partial mp3**.

   **Spot-check (mandatory):** listen to the first ~20 s and one code-explanation turn; the script prints total duration (expect ≥ 8 min); click two turns in `mock.html` and confirm the seek lands on the right sentence.

   Link all of it from `code.html` right after the code window:
   ```html
   <p style="margin-top:14px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.04em;">
     🎤 面試模擬 · <a href="mock.png" target="_blank" rel="noopener">UMPIRE mock interview transcript ↗</a><br>
     🎧 面試語音 · <a href="mock.html" target="_blank" rel="noopener">逐句點播版 ↗</a>
   </p>
   <audio controls preload="none" src="mock.mp3" style="width:100%;margin-top:6px;"></audio>
   ```

8. **🧹 MANDATORY: auto-fix code layout (LeetCode style), then flip status.**
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
2. **No "Variants / 延伸題" section** — use the `.qa` App questions instead.
3. **Animations are white-bg solid-fill**, not dark outlined cells.
4. **Re-run the generator** after any change to `PROBLEMS` / `CHAPTERS` — sidebars desync silently otherwise.
5. **Never ship unverified C++** (Integration step 4). **Never ship mis-indented C++** — run `scripts/format_code.py` before every commit (step 8). No dead placeholder lines. The `// OUTPUT` trace must match the verified binary.
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
