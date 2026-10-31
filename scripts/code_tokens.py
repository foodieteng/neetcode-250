#!/usr/bin/env python3
"""Printed-ink colouring for inline <code> on study-card pages.

Wraps standalone numbers in <span class="nm"> and C++ keywords in
<span class="kw2"> inside every <code>…</code> that has no nested tags.
Never touches <pre> blocks or .sc-trace boxes. Idempotent: existing
nm/kw2 spans are stripped and re-applied.

A number is coloured only when it stands alone — `2n`, `0x1F`, `1e9`,
`"0P"`, `dp2` stay plain ink, so a span never splits a token.

Usage: python3 scripts/code_tokens.py <file.html> [...]
"""
import re
import sys

KW = re.compile(r'\b(return|if|else|for|while|true|false|int|bool)\b')
NUM = re.compile(r'(?<![A-Za-z0-9_.#&])(\d+(?:[.,]\d+)*)(?![A-Za-z0-9_])')
SPAN = re.compile(r'<span class="(?:nm|kw2)">([^<]*)</span>')
PROTECT = re.compile(r'(<pre[\s\S]*?</pre>|<div class="sc-trace"[\s\S]*?</div>)')


def colour(body):
    body = KW.sub(r'<span class="kw2">\1</span>', body)
    # numbers only outside the keyword spans we just added
    parts = re.split(r'(<span class="kw2">[^<]*</span>)', body)
    return ''.join(p if i % 2 else NUM.sub(r'<span class="nm">\1</span>', p)
                   for i, p in enumerate(parts))


def tokenize(html):
    def code(m):
        inner = SPAN.sub(r'\1', m.group(1))
        if '<' in inner:
            return m.group(0)
        return f'<code>{colour(inner)}</code>'
    parts = PROTECT.split(html)
    return ''.join(p if i % 2 else re.sub(r'<code>(.*?)</code>', code, p, flags=re.S)
                   for i, p in enumerate(parts))


if __name__ == '__main__':
    changed = 0
    for path in sys.argv[1:]:
        s = open(path, encoding='utf-8').read()
        t = tokenize(s)
        if t != s:
            open(path, 'w', encoding='utf-8').write(t)
            changed += 1
    print(f'{changed} / {len(sys.argv) - 1} files changed')
