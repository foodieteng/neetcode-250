#!/usr/bin/env python3
"""Convert an old-format review.html (重點回顧 / 觀念題 / 範例 Trace / 應用題 +
// ANSWERS region) into the 白紙考卷 layout (see p860/review.html).

Usage: python3 scripts/review_to_exam.py topics/<NN>-<slug>/problems/<pid>/review.html [...]
Idempotent: pages that already contain .xp-strip are skipped.
"""
import re
import sys

from bs4 import BeautifulSoup, NavigableString

# Label formats seen across the site:
#   <strong>Q1.</strong> / <strong>A1.</strong> / <strong>App 1.</strong> / <strong>A-App 1.</strong>
#   <span class="qa__tag">Q1</span>      <span class="qa__id">A1 · 問題轉化</span>   <span class="qa__id">A · App 1</span>
#   <div class="qa__q"><span class="qa__tag">Q1</span> text</div> [+ <div class="qa__a">answer</div>]
LABEL_RE = re.compile(r'^\s*(?:A\s*[-·・]\s*)?(Q|A|App)\s*(\d+)\s*[.:]?\s*(?:[·・]\s*(.*?))?\s*$')


def _first_tag(node):
    for child in node.children:
        if isinstance(child, NavigableString) and not child.strip():
            continue
        if child.name in ('strong', 'span'):
            m = LABEL_RE.match(child.get_text())
            if m:
                return m, child
        return None, None
    return None, None


def _unwrap_p(node):
    kids = [c for c in node.children if not (isinstance(c, NavigableString) and not c.strip())]
    if len(kids) == 1 and kids[0].name == 'p':
        return kids[0].decode_contents().strip()
    return node.decode_contents().strip()


def parse_qa(qa):
    """Return (kind, n, body_html) for a .qa block, or (None, None, None).
    kind: 'Q' / 'A' / 'App'.  body: question text for questions, answer for answers."""
    q = qa.find('div', class_='qa__q', recursive=False)
    if q is not None:
        m, tag = _first_tag(q)
        if not m:
            return None, None, None
        a = qa.find('div', class_='qa__a', recursive=False)
        if a is not None:                        # answer block: body is .qa__a
            return m.group(1), int(m.group(2)), _unwrap_p(a)
        tag.extract()
        return m.group(1), int(m.group(2)), q.decode_contents().strip()
    m, tag = _first_tag(qa)
    if not m:
        return None, None, None
    tag.extract()
    body = _unwrap_p(qa)
    if m.group(3):                               # "A1 · 問題轉化" → keep the subtitle as a lead
        body = f'<strong>{m.group(3)}</strong> — ' + body
    return m.group(1), int(m.group(2)), body


def section_by_title(soup, prefix):
    for h in soup.select('.sc-section__title'):
        if h.get_text().strip().startswith(prefix):
            return h.find_parent('section')
    return None


def tokenize_codes(html):
    def tok(m):
        body = m.group(1)
        if '<' in body:
            return m.group(0)
        body = re.sub(r'\b(return|if|else|for|while|true|false|int|bool)\b',
                      r'<span class="kw2">\1</span>', body)
        body = re.sub(r'(^|[^A-Za-z_0-9;&])(\d[\d,\.]*)',
                      r'\1<span class="nm">\2</span>', body)
        return f'<code>{body}</code>'
    return re.sub(r'<code>(.*?)</code>', tok, html, flags=re.S)


def card(no, pts, question, answer):
    pts_html = f'<span class="xq__pts">{pts} 分</span>' if pts else ''
    ans_html = ''
    if answer:
        ans_html = (f'\n      <details class="xq__ans"><summary>解答與說明 · ANSWER'
                    f'<span class="xq__caret">▾</span></summary>\n'
                    f'        <div class="xq__ansbody">{answer}</div>\n      </details>')
    return (f'    <div class="xq">\n'
            f'      <div class="xq__head"><span class="xq__no">第 {no} 題</span>{pts_html}</div>\n'
            f'      <div class="xq__body">{question}</div>{ans_html}\n'
            f'    </div>\n')


def section(num, title, en, body):
    return (f'  <section class="sc-section">\n'
            f'    <div class="sc-section__head">\n'
            f'      <span class="sc-section__num">{num}</span>\n'
            f'      <h2 class="sc-section__title">{title}<span class="sc-section__title-en">// {en}</span></h2>\n'
            f'    </div>\n\n{body}  </section>\n\n')


def renumber_refs(html, nq, ntrace):
    """Q3 → 第 3 題, App 2 → 第 (nq+ntrace+2) 題, 範例 Trace → 第 (nq+1) 題."""
    html = re.sub(r'(?<![A-Za-z_])App\s?(\d)(?![\d])', lambda m: f'第 {nq + ntrace + int(m.group(1))} 題', html)
    html = re.sub(r'(?<![A-Za-z_0-9])Q(\d)(?![\d])', lambda m: f'第 {m.group(1)} 題', html)
    html = re.sub(r'(?<![A-Za-z_0-9#&\-])A([1-9])(?![0-9A-Za-z])', lambda m: f'第 {m.group(1)} 題', html)
    if ntrace:
        html = html.replace('見範例 Trace', f'見第 {nq + 1} 題').replace('範例 Trace', f'第 {nq + 1} 題')
    return html


def convert(path):
    src = open(path, encoding='utf-8').read()
    if 'xp-strip' in src:
        return 'skip (already exam)'
    soup = BeautifulSoup(src, 'html.parser')

    # ---- collect pieces ----
    recap = section_by_title(soup, '重點回顧')
    quiz = section_by_title(soup, '觀念題')
    trace = section_by_title(soup, '範例 Trace')
    apply_ = section_by_title(soup, '應用題')
    if not (quiz and apply_):
        return 'SKIP: missing 觀念題/應用題 section'

    qs, apps = [], []
    for qa in quiz.select('.qa'):
        k, n, body = parse_qa(qa)
        if k == 'Q':
            qs.append((n, body))
    for qa in apply_.select('.qa'):
        k, n, body = parse_qa(qa)
        if k == 'App':
            apps.append((n, body))

    answers = {}
    for qa in soup.select('.qa.qa--answer'):
        if qa.find_parent(class_='qa--answer'):
            continue
        k, n, body = parse_qa(qa)
        if k in ('A', 'Q'):
            answers[('Q', n)] = body
        elif k == 'App':
            answers[('App', n)] = body

    trace_body, trace_en = '', ''
    if trace:
        en = trace.select_one('.sc-section__title-en')
        trace_en = en.get_text().lstrip('/ ').strip() if en else ''
        head = trace.select_one('.sc-section__head')
        head.extract()
        trace_body = trace.decode_contents().strip()

    recap_html = ''
    if recap:
        tbl = recap.select_one('table')
        recap_html = str(tbl) if tbl else ''
    recap_html = renumber_refs(recap_html, len(qs), 1 if trace_body else 0) if recap_html else ''

    nq, napp, ntr = len(qs), len(apps), 1 if trace_body else 0
    if not nq:
        return 'SKIP: no 觀念題 parsed'

    # ---- points: A 10 each, B 10, C shares the rest ----
    rest = max(0, 100 - 10 * nq - 10 * ntr)
    app_pts = []
    if napp:
        base = rest // napp
        app_pts = [base] * napp
        for i in range(rest - base * napp):
            app_pts[-1 - i] += 1
    total = 10 * nq + 10 * ntr + sum(app_pts)
    nall = nq + ntr + napp

    # ---- build exam body ----
    unit = ''
    nav = soup.select_one('.sc-topnav')
    if nav:
        links = nav.select('a')
        if len(links) >= 2:
            unit = links[1].get_text().strip()          # e.g. "01 · Arrays & Hashing"
    title = soup.select_one('.sc-mast__title').get_text().strip()
    lc = re.search(r'LeetCode\s+(\d+)', soup.select_one('.sc-mast__meta').get_text() if soup.select_one('.sc-mast__meta') else '')
    lc = lc.group(1) if lc else ''
    m = re.match(r'(\d+)\s*·\s*(.+)', unit)
    unit_label = f'{m.group(2).upper()} · UNIT {m.group(1)}' if m else unit.upper()

    out = []
    out.append('  <!-- ════════════ 考卷頭 ════════════ -->\n'
               '  <div class="xp-strip">\n'
               '    <div class="xp-strip__row">\n'
               f'      <span>{unit_label} 複習測驗</span>\n'
               f'      <span>範圍:{title.upper()}{f"(LC {lc})" if lc else ""}</span>\n'
               f'      <span>共 <b>{nall}</b> 題 · 滿分 <b>{total}</b></span>\n'
               '    </div>\n'
               '    <div class="xp-strip__row">\n'
               '      <span>建議時間 25 分鐘 · 先作答,再展開解答對分</span>\n'
               '      <span>NAME <span class="blank"></span>&nbsp;&nbsp;SCORE <span class="blank"></span></span>\n'
               '    </div>\n'
               '  </div>\n\n'
               '  <div class="xp-tools">\n'
               '    <button id="xp-open">全部展開 +</button>\n'
               '    <button id="xp-close">全部收合 −</button>\n'
               '  </div>\n\n')

    sec = 1
    body = ''.join(card(i + 1, 10, q, renumber_refs(answers.get(('Q', n), ''), nq, ntr))
                   for i, (n, q) in enumerate(qs))
    out.append(section(sec, 'PART A · 觀念題', f'{nq} 題 × 10 分', body)); sec += 1

    if ntr:
        q = (f'拿一張紙,照程式手走{(" " + trace_en) if trace_en else "這個範例"}:'
             f'逐步寫出關鍵變數的變化,最後回傳什麼?決定結果的是哪一步?')
        out.append(section(sec, 'PART B · 手走模擬', '1 題 × 10 分',
                           card(nq + 1, 10, q, renumber_refs(trace_body, nq, ntr)))); sec += 1

    if napp:
        body = ''.join(card(nq + ntr + i + 1, app_pts[i], q, renumber_refs(answers.get(('App', n), ''), nq, ntr))
                       for i, (n, q) in enumerate(apps))
        rng = f'{min(app_pts)}–{max(app_pts)}' if min(app_pts) != max(app_pts) else f'{app_pts[0]}'
        out.append(section(sec, 'PART C · 應用題', f'{napp} 題 × {rng} 分', body)); sec += 1

    if recap_html:
        out.append(section(sec, '考後重點', 'RECAP · 對完分再看',
                           '    <div class="xq">\n'
                           '      <details class="xq__ans"><summary>重點整理<span class="xq__caret">▾</span></summary>\n'
                           '        <div class="xq__ansbody" style="padding:0;border-left:none;">\n'
                           '          <div style="overflow-x:auto;">' + recap_html + '</div>\n'
                           '        </div>\n      </details>\n    </div>\n'))

    exam = ''.join(out)

    # ---- splice: replace everything between .sc-mast__rule and the pager ----
    s = src
    start = s.index('<div class="sc-mast__rule"></div>') + len('<div class="sc-mast__rule"></div>')
    end = s.index('<nav class="sc-pager">')
    end = s.rfind('\n', 0, end) + 1
    # keep a leading pager comment if present
    pre_pager = re.search(r'\n\s*<!-- ── pager ── -->\s*\n\s*$', s[:end])
    if pre_pager:
        end = pre_pager.start() + 1
    s = s[:start] + '\n\n' + exam + s[end:]

    s = re.sub(r'<span>\d+ \+ \d+ QUESTIONS</span>', f'<span>{nall} QUESTIONS · {total} 分</span>', s)
    s = re.sub(r'(<p class="sc-mast__subtitle">)//[^<]*(</p>)',
               r'\1// REVIEW · 複習考卷 · 作答後逐題展開解答\2', s, count=1)
    if 'xp-open' not in s.split('</nav>')[-1] or "getElementById('xp-open')" not in s:
        s = s.replace('</body>',
                      "  <script>\n"
                      "    document.getElementById('xp-open').onclick = function () {\n"
                      "      document.querySelectorAll('details.xq__ans').forEach(function (d) { d.open = true; });\n"
                      "    };\n"
                      "    document.getElementById('xp-close').onclick = function () {\n"
                      "      document.querySelectorAll('details.xq__ans').forEach(function (d) { d.open = false; });\n"
                      "    };\n"
                      "  </script>\n</body>", 1)
    open(path, 'w', encoding='utf-8').write(s)
    miss = [f'Q{n}' for n, _ in qs if ('Q', n) not in answers] + [f'App{n}' for n, _ in apps if ('App', n) not in answers]
    return f'ok  {nq}Q+{ntr}T+{napp}App={nall}題/{total}分' + (f'  no-answer:{",".join(miss)}' if miss else '')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        try:
            print(p.split('/')[-2], convert(p))
        except Exception as e:  # report and continue
            print(p.split('/')[-2], 'ERROR', type(e).__name__, e)
