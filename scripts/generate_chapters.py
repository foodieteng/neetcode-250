#!/usr/bin/env python3
"""
generate_chapters.py
====================
Single source of truth for the NeetCode 250 category list and per-category
problem set.

Run from repo root:
    python3 scripts/generate_chapters.py

Generates:
  - topics/<slug>/index.html      (one per category)
  - Refreshes the sidebar in index.html and any existing problem pages

To add a problem to a category:
  1. Add an entry to PROBLEMS[cat]
  2. Re-run this script
  3. Create the actual problem detail pages at
     topics/<slug>/problems/<pid>/{index,code,review}.html

Status values:
  - 'todo'  -> grayed out, no link (placeholder)
  - 'done'  -> normal link
  - 'demo'  -> linked + DEMO badge
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

# ============================================================
#  Category list (single source of truth)
# ============================================================
# (id, slug, title-en, subtitle-zh, total-problem-count)
# ids are the NeetCode 250 category order 01..18.
CHAPTERS = [
    ('01', '01-arrays-hashing',       'Arrays & Hashing',       '陣列、雜湊表、前綴積、集合去重',                 22),
    ('02', '02-two-pointers',         'Two Pointers',           '雙指標、對撞指標、快慢指標',                     13),
    ('03', '03-sliding-window',       'Sliding Window',         '滑動視窗、可變/固定窗、單調隊列',                 9),
    ('04', '04-stack',                'Stack',                  '堆疊、單調堆疊、括號匹配',                       14),
    ('05', '05-binary-search',        'Binary Search',          '二分搜尋、答案二分、旋轉陣列',                   14),
    ('06', '06-linked-list',          'Linked List',            '鏈結串列、快慢指標、翻轉',                       14),
    ('07', '07-trees',                'Trees',                  '二元樹、BST、DFS/BFS 走訪',                      23),
    ('08', '08-heap-priority-queue',  'Heap / Priority Queue',  '堆積、優先佇列、Top-K',                          12),
    ('09', '09-backtracking',         'Backtracking',           '回溯、子集、排列、剪枝',                         17),
    ('10', '10-tries',                'Tries',                  '字典樹、前綴匹配',                                4),
    ('11', '11-graphs',               'Graphs',                 'DFS/BFS、拓樸排序、Union-Find',                  21),
    ('12', '12-advanced-graphs',      'Advanced Graphs',        'Dijkstra、MST、最短路進階',                      10),
    ('13', '13-1d-dp',                '1-D Dynamic Programming', '一維動態規劃、線性 DP',                          17),
    ('14', '14-2d-dp',                '2-D Dynamic Programming', '二維動態規劃、背包、字串 DP',                    16),
    ('15', '15-greedy',               'Greedy',                 '貪心策略與正確性論證',                           14),
    ('16', '16-intervals',            'Intervals',              '區間合併、掃描線、排程',                          7),
    ('17', '17-math-geometry',        'Math & Geometry',        '數論、矩陣、計算幾何',                           13),
    ('18', '18-bit-manipulation',     'Bit Manipulation',       '位元運算、XOR、位元 DP',                         10),
]

# ============================================================
#  Per-category problem set
# ============================================================
# Map: cat_id -> list of (pid, title-en, url_slug, difficulty, status)
#   pid        : folder slug, 'p<leetcode-number>'  (e.g. 'p1')
#   title-en   : official LeetCode title
#   url_slug   : leetcode.com/problems/<url_slug>/
#   difficulty : 'easy' | 'med' | 'hard'
#   status     : 'todo' | 'done' | 'demo'
# Order within a category mirrors NeetCode's curated ordering.
PROBLEMS = {
    # filled by scripts/generate_chapters.py maintenance; expand one at a time.
}

DIFF_NAMES = {'easy': 'Easy', 'med': 'Medium', 'hard': 'Hard'}
DIFF_COLOR = {'easy': '#6ba368', 'med': '#d4a017', 'hard': '#c1440e'}


# ============================================================
#  Sidebar
# ============================================================
def sidebar_html(active_cat, base):
    """Render the curriculum sidebar nav. base is path back to root, eg '../../' """
    items = []
    for cid, slug, title, _, count in CHAPTERS:
        cls = ' class="is-active"' if cid == active_cat else ''
        items.append(
            f'          <li><a href="{base}topics/{slug}/index.html"{cls}>'
            f'{cid} · {title} <span class="tag">{count:02d}</span></a></li>'
        )
    items_html = '\n'.join(items)
    return f'''      <div class="nav-label">// NEETCODE 250</div>
      <nav>
        <ul>
{items_html}
        </ul>
      </nav>

      <div class="nav-label">// PAGES</div>
      <nav>
        <ul>
          <li><a href="{base}index.html">Home</a></li>
          <li><a href="{base}about.html">About</a></li>
        </ul>
      </nav>'''


# ============================================================
#  Problem rendering helpers
# ============================================================
def resolve_problem_link(cat_slug, pid):
    """Pick the right URL for a problem detail page.

    Multi-page layout (preferred):  problems/<pid>/index.html
    Single-page legacy:              problems/<pid>.html
    Falls back to multi-page form for not-yet-created entries.
    """
    chap_dir = ROOT / 'topics' / cat_slug
    multi = chap_dir / 'problems' / pid / 'index.html'
    single = chap_dir / 'problems' / f'{pid}.html'
    if multi.exists():
        return f'problems/{pid}/index.html'
    if single.exists():
        return f'problems/{pid}.html'
    return f'problems/{pid}/index.html'


def leetcode_url(url_slug):
    """Original LeetCode problem URL for the '原題 ↗' link."""
    return f'https://leetcode.com/problems/{url_slug}/'


def diff_chip(difficulty):
    name = DIFF_NAMES.get(difficulty, difficulty)
    color = DIFF_COLOR.get(difficulty, 'var(--concrete)')
    return (
        f'<span class="chip" style="font-size:9px;border-color:{color};'
        f'color:{color};">{name}</span>'
    )


def render_problem_item(cat_id, cat_slug, pid, title, url_slug, difficulty, status, *, indent=''):
    """Render a single <li> for a problem in the category outline / list."""
    num = pid[1:]  # strip leading 'p' -> leetcode number
    label = f'{num} · {title}'
    source = (
        f' <a href="{leetcode_url(url_slug)}" target="_blank" rel="noopener" '
        f'style="margin-left:8px;font-size:11px;color:var(--rust-bright);border:none;">'
        f'原題 ↗</a>'
    )
    chip = diff_chip(difficulty)
    if status == 'todo':
        return (
            f'{indent}<li>{chip} <span style="color:var(--concrete)">{label} '
            f'<span style="color:var(--line-bright)">(待補)</span></span>{source}</li>'
        )
    href = resolve_problem_link(cat_slug, pid)
    if status == 'demo':
        return (
            f'{indent}<li>{chip} <a href="{href}">{label}</a>'
            f'<span class="chip chip--warning" style="margin-left:8px;font-size:9px;">DEMO</span>'
            f'{source}</li>'
        )
    # 'done' or anything else
    return f'{indent}<li>{chip} <a href="{href}">{label}</a>{source}</li>'


def chapter_quick_index(cat_id, cat_slug, probs):
    """Flat quick-reference table of every problem in the category."""
    if not probs:
        return ''
    rows = []
    for pid, title, url_slug, difficulty, status in probs:
        num = pid[1:]
        href = resolve_problem_link(cat_slug, pid)
        source = leetcode_url(url_slug)

        if status == 'done':
            status_html = '<span style="color:#6ba368">✓ done</span>'
        elif status == 'demo':
            status_html = '<span class="chip chip--warning" style="font-size:9px;">DEMO</span>'
        else:
            status_html = '<span style="color:var(--concrete)">○ todo</span>'

        if status in ('done', 'demo'):
            title_cell = f'<a href="{href}">{title}</a>'
        else:
            title_cell = f'<span style="color:var(--concrete)">{title}</span>'

        rows.append(
            f'            <tr>'
            f'<td>{diff_chip(difficulty)}</td>'
            f'<td style="font-family:var(--font-mono);">{num}</td>'
            f'<td>{title_cell}</td>'
            f'<td><a href="{source}" target="_blank" rel="noopener" '
            f'style="color:var(--rust-bright);border:none;">原題 ↗</a></td>'
            f'<td>{status_html}</td>'
            f'</tr>'
        )
    rows_html = '\n'.join(rows)
    return f'''      <article id="sec-quick-index">
        <span class="stamp">▼ QUICK INDEX</span>
        <h2>題目快速索引</h2>
        <div class="article-meta">
          <span>SUMMARY</span>
          <span>{len(probs)} PROBLEMS</span>
        </div>
        <table>
          <thead>
            <tr><th>難度</th><th>#</th><th>題目</th><th>原題</th><th>狀態</th></tr>
          </thead>
          <tbody>
{rows_html}
          </tbody>
        </table>
      </article>'''


def chapter_outline(cat_id, cat_slug, probs):
    """Build the category TOC at the top of the category page."""
    items = []
    if probs:
        items.append(f'          <li><a href="#sec-quick-index">⚡ 快速索引</a></li>')
    items.append(f'          <li><a href="#sec-concept">{cat_id}.1 · 核心概念</a></li>')

    if not probs:
        items.append(f'          <li><a href="#sec-problems">{cat_id}.2 · 題目列表</a></li>')
        items.append(f'          <li><a href="#sec-notes">{cat_id}.3 · 筆記與補充</a></li>')
        return '\n'.join(items)

    items.append(f'          <li><a href="#sec-problems">{cat_id}.2 · 題目列表</a>')
    sub = '\n'.join(
        render_problem_item(cat_id, cat_slug, pid, title, url_slug, difficulty, status,
                            indent='              ')
        for pid, title, url_slug, difficulty, status in probs
    )
    items.append(f'            <ul class="notes-list" style="margin: 6px 0 6px 16px;">')
    items.append(sub)
    items.append(f'            </ul>')
    items.append(f'          </li>')
    items.append(f'          <li><a href="#sec-notes">{cat_id}.3 · 筆記與補充</a></li>')
    return '\n'.join(items)


def chapter_sections(cat_id, cat_slug, probs):
    """Build the main content sections (quick index + concept + problem list + notes)."""
    out = []

    qi = chapter_quick_index(cat_id, cat_slug, probs)
    if qi:
        out.append(qi)

    out.append(f'''      <article id="sec-concept">
        <span class="stamp">▼ {cat_id}.1</span>
        <h2>核心概念</h2>
        <div class="article-meta">
          <span>OVERVIEW</span>
        </div>
        <p>—— 待補 ——</p>
      </article>''')

    if not probs:
        out.append(f'''      <article id="sec-problems">
        <span class="stamp">▼ {cat_id}.2</span>
        <h2>題目列表</h2>
        <div class="article-meta">
          <span>PROBLEMS</span>
        </div>
        <ul class="notes-list">
          <li><span style="color:var(--concrete)">—— 待新增題目 ——</span></li>
        </ul>
      </article>''')
    else:
        items = '\n          '.join(
            render_problem_item(cat_id, cat_slug, pid, title, url_slug, difficulty, status)
            for pid, title, url_slug, difficulty, status in probs
        )
        count = len(probs)
        out.append(f'''      <article id="sec-problems">
        <span class="stamp">▼ {cat_id}.2</span>
        <h2>題目列表</h2>
        <div class="article-meta">
          <span>{count} {"PROBLEM" if count == 1 else "PROBLEMS"}</span>
        </div>
        <ul class="notes-list">
          {items}
        </ul>
      </article>''')

    out.append(f'''      <article id="sec-notes">
        <span class="stamp">▼ {cat_id}.3</span>
        <h2>筆記與補充</h2>
        <div class="article-meta">
          <span>NOTES</span>
        </div>
        <p>—— 待補 ——</p>
      </article>''')

    return '\n\n'.join(out)


# ============================================================
#  Category page template
# ============================================================
def chapter_page(cat_id, slug, title, subtitle, count):
    base = '../../'
    sidebar = sidebar_html(cat_id, base)
    probs = PROBLEMS.get(cat_id, [])
    outline = chapter_outline(cat_id, slug, probs)
    sections = chapter_sections(cat_id, slug, probs)
    actual_count = len(probs) if probs else count

    return f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{cat_id} // {title.upper()} // NEETCODE 250</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" />

  <link rel="stylesheet" href="{base}assets/css/tokens.css" />
  <link rel="stylesheet" href="{base}assets/css/base.css" />
  <link rel="stylesheet" href="{base}assets/css/components.css" />
  <link rel="stylesheet" href="{base}assets/css/problem.css" />
</head>
<body>

  <div class="rivet tl"></div>
  <div class="rivet tr"></div>
  <div class="rivet bl"></div>
  <div class="rivet br"></div>

  <div class="top-strip">
    <div class="marquee">
      <span>※ NEETCODE 250 ※</span>
      <span>{cat_id} · {title.upper()}</span>
      <span>{subtitle}</span>
      <span>⚙ NOTES IN PROGRESS</span>
      <span>※ NEETCODE 250 ※</span>
      <span>{cat_id} · {title.upper()}</span>
      <span>{subtitle}</span>
      <span>⚙ NOTES IN PROGRESS</span>
    </div>
  </div>

  <header class="workshop-header">
    <div class="meta-row">
      <span><span class="dot"></span>CATEGORY {cat_id}</span>
      <span>NEETCODE 250</span>
      <span>{actual_count:02d} PROBLEMS</span>
    </div>
    <h1 class="workshop-title">{title}.</h1>
    <p class="workshop-subtitle">
      {subtitle}
    </p>
  </header>

  <div class="shell">

    <aside class="sidebar">
{sidebar}
    </aside>

    <main class="content">

      <div class="crumb">
        <a href="{base}index.html">Home</a>
        <span class="crumb__sep">/</span>
        <span>{cat_id} · {title}</span>
      </div>

      <!-- ============================================================
           CATEGORY OUTLINE (TOC for this category)
           ============================================================ -->
      <article>
        <span class="stamp">▼ CATEGORY OUTLINE</span>
        <h2>本分類大綱</h2>
        <div class="article-meta">
          <span>{cat_id}</span>
          <span>{actual_count:02d} PROBLEMS</span>
        </div>

        <ul class="notes-list">
{outline}
        </ul>
      </article>

{sections}

    </main>

  </div>

  <footer class="workshop-footer">
    <div>© 2026 // {cat_id} · {title.upper()}</div>
    <div><a href="{base}index.html">← BACK TO INDEX</a></div>
    <div>SERIAL_NO. NC-{cat_id}-2026</div>
  </footer>

</body>
</html>
'''


# ============================================================
#  Sidebar refresh for existing pages (home + problem detail pages)
# ============================================================
def refresh_home_sidebar():
    """Replace the sidebar block in index.html (no category is active on home)."""
    home = ROOT / 'index.html'
    if not home.exists():
        return False
    txt = home.read_text(encoding='utf-8')
    new_sidebar = sidebar_html(active_cat=None, base='')
    pat = re.compile(r'(<aside class="sidebar">)(.*?)(</aside>)', re.DOTALL)
    new_txt, n = pat.subn(
        lambda m: m.group(1) + '\n' + new_sidebar + '\n    ' + m.group(3),
        txt, count=1
    )
    if n:
        home.write_text(new_txt, encoding='utf-8')
        return True
    return False


def refresh_problem_sidebars():
    """Refresh the sidebar of every existing problem page.
    Handles both single-page (problems/pXX.html) and multi-page (problems/pXX/*.html)."""
    for problem_html in (ROOT / 'topics').rglob('*.html'):
        rel = problem_html.relative_to(ROOT)
        path_str = str(rel).replace('\\', '/')
        if '/problems/' not in path_str:
            continue
        # active category from path
        cat = None
        for cid, slug, *_ in CHAPTERS:
            if f'topics/{slug}/' in path_str:
                cat = cid
                break
        # base path back to root = (n_parts - 1) levels up
        depth = len(rel.parts) - 1
        base = '../' * depth

        txt = problem_html.read_text(encoding='utf-8')
        sidebar = sidebar_html(active_cat=cat, base=base)
        pat = re.compile(
            r'<div class="nav-label">// NEETCODE 250</div>.*?</aside>',
            re.DOTALL,
        )
        replacement = sidebar.lstrip() + '\n    </aside>'
        new_txt, n = pat.subn(replacement, txt, count=1)
        if n:
            problem_html.write_text(new_txt, encoding='utf-8')
            print(f'refreshed {rel} sidebar')


# ============================================================
#  Main
# ============================================================
def main():
    for cid, slug, title, subtitle, count in CHAPTERS:
        d = ROOT / 'topics' / slug
        d.mkdir(parents=True, exist_ok=True)
        html = chapter_page(cid, slug, title, subtitle, count)
        (d / 'index.html').write_text(html, encoding='utf-8')
        print(f'wrote topics/{slug}/index.html')

    if refresh_home_sidebar():
        print('refreshed index.html sidebar')

    refresh_problem_sidebars()


if __name__ == '__main__':
    main()
