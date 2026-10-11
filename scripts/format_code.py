#!/usr/bin/env python3
"""Keep every C++ code block in the notes in LeetCode's editor layout.

Usage:
    python3 scripts/format_code.py            # fix all pages in place
    python3 scripts/format_code.py --check    # list blocks that would change; exit 1 if any
    python3 scripts/format_code.py FILE...    # only these HTML files

Blocks handled:
    <pre class="sc-code"> … </pre>   (study-card code windows)
    <pre class="tcode">   … </pre>   (topic cheatsheet / template pages)

LeetCode layout (what the LeetCode C++ template looks like):
    class Solution {
    public:                                   <- access specifier flush with `class`
        vector<int> twoSum(vector<int>& nums, int target) {
            ...                               <- 4 spaces per brace level
        }
    };

What the script changes — indentation only, conservatively:
    * a line that STARTS a statement is indented 4 spaces past the line that opened its
      `{` (a `}` line and `public:` / `private:` / `protected:` line up with that opener);
      the body of a braceless `if (...)` / `for (...)` / `while (...)` / `else` is 4 past it
    * a CONTINUATION line (inside open parentheses, or the previous code line did not
      end with ; { } or :) keeps its position relative to its statement, so hand-aligned
      wrapped expressions and braceless `if (...)` bodies stay exactly as written
    * tabs in indentation -> 4 spaces; trailing whitespace removed
    * a fragment (a snippet that starts indented) keeps its starting indentation

What it never does: join or split lines, move comments, touch anything after a line's
first non-space character, rename anything. The script verifies that every line's
content is unchanged and refuses the block otherwise. Highlight spans are carried over
character by character, so colours never change. Idempotent.
"""
import glob
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCK_RE = re.compile(r'(<pre class="(?:sc-code|tcode)"[^>]*>)(.*?)(</pre>)', re.S)
# a bare '&' or '<' (not an entity / tag) is kept as a literal character
TAG_RE = re.compile(r'<span class="([^"]+)">|</span>|&#?\w+;|<[a-zA-Z/][^>]*>|[^<&]|[<&]', re.S)
ACCESS_RE = re.compile(r'(public|private|protected)\s*:(?!:)')
# a control header whose body is the next line (no brace): `if (...)`, `} else`, `for (...)` …
HEADER_RE = re.compile(r'^(\}\s*)?(else\s+)?((if|for|while)\s*\(.*\)|else|do)$')
INDENT = 4


def parse(block_html):
    """Return [(char, stack)] — stack = tuple of (span_id, class) open at that char."""
    chars, stack, next_id = [], [], 0
    for m in TAG_RE.finditer(block_html):
        tok = m.group(0)
        if m.group(1) is not None:
            stack.append((next_id, m.group(1)))
            next_id += 1
        elif tok == '</span>':
            stack.pop()
        elif tok.startswith('<') and len(tok) > 1:
            raise ValueError(f'unexpected tag {tok[:30]!r}')
        else:
            text = html.unescape(tok) if tok.startswith('&') else tok
            for ch in text:
                chars.append((ch, tuple(stack)))
    return chars


def scan(code, state, line_indent, stmt_indent, started_in_paren):
    """Walk one line, tracking comments, strings, parens and an indent stack of open
    braces. Returns the last code character (None for a comment-only line)."""
    i, last, n = 0, None, len(code)
    stack = state['stack']
    while i < n:
        c = code[i]
        if state['block_comment']:
            j = code.find('*/', i)
            if j < 0:
                return last
            state['block_comment'] = False
            i = j + 2
            continue
        if code.startswith('//', i):
            break
        if code.startswith('/*', i):
            state['block_comment'] = True
            i += 2
            continue
        if c in '"\'':
            j = i + 1
            while j < n and code[j] != c:
                j += 2 if code[j] == '\\' else 1
            i = j + 1
            last = c
            continue
        brackets = state['brackets']
        if c == '{':
            # body indent is measured from: the line itself (fresh statement, braceless
            # child like `if (...) {`, or a lambda opened inside call parentheses), or the
            # statement start when a wrapped header closes its parens on this line
            inside_paren = bool(brackets) and brackets[-1] in '(['
            if not inside_paren and started_in_paren:
                stack.append(stmt_indent)
            else:
                stack.append(line_indent)
            brackets.append('{')
        elif c == '}':
            while brackets and brackets[-1] != '{':
                brackets.pop()
            if brackets:
                brackets.pop()
            if stack:
                stack.pop()
        elif c in '([':
            brackets.append(c)
        elif c in ')]':
            if brackets and brackets[-1] in '([':
                brackets.pop()
        if not c.isspace():
            last = c
        i += 1
    return last


def reindent(text):
    lines = text.split('\n')
    expanded = [l.replace('\t', ' ' * INDENT) for l in lines]
    first = next((l for l in expanded if l.strip()), '')
    base = len(first) - len(first.lstrip())
    if re.match(r'\s*(class|struct|template|#)\b', first):
        base = 0                                   # a whole program / class starts at column 0
    base -= base % INDENT                          # a snippet starts on a 4-space boundary
    state = {'stack': [], 'brackets': [], 'block_comment': False}
    prev_end, delta, stmt_indent, header_indent, out = ';', 0, base, None, []
    for line in expanded:
        content = line.strip()
        if not content:
            out.append('')
            continue
        orig = len(line) - len(line.lstrip())
        stack = state['stack']
        started_in_paren = bool(state['brackets']) and state['brackets'][-1] in '(['
        if state['block_comment'] or content.startswith('#'):
            new = 0 if content.startswith('#') else max(0, orig + delta)   # preprocessor: column 0
        elif header_indent is not None and not started_in_paren:
            # body of a braceless if/for/while/else (or an Allman `{` under it)
            new = header_indent if content.startswith('{') else header_indent + INDENT
            delta = new - orig
            stmt_indent = new
        elif started_in_paren or prev_end not in (';', '{', '}', ':'):
            new = max(0, orig + delta)                 # continuation: keep relative position
        else:
            if content.startswith('}') or ACCESS_RE.match(content):
                new = stack[-1] if stack else base
            else:
                new = stack[-1] + INDENT if stack else base
            delta = new - orig
            stmt_indent = new
        out.append(' ' * new + content)
        last = scan(content, state, new, stmt_indent, started_in_paren)
        if last is not None and not content.startswith('#'):   # comments / #include don't count
            prev_end = last
            code_part = content.split('//')[0].strip()
            in_paren = bool(state['brackets']) and state['brackets'][-1] in '(['
            header_indent = new if (not in_paren and not state['block_comment']
                                    and HEADER_RE.match(code_part)) else None
    return '\n'.join(out)


def rebuild(chars, new_text):
    """Lines correspond 1:1; content chars keep their spans, indentation inherits the
    original indentation's spans (e.g. a highlighted-line span that starts at column 0)."""
    orig_lines, cur = [], []
    for ch, st in chars:
        if ch == '\n':
            orig_lines.append((cur, st))
            cur = []
        else:
            cur.append((ch, st))
    orig_lines.append((cur, ()))
    new_lines = new_text.split('\n')
    if len(new_lines) != len(orig_lines):
        raise ValueError('line count changed')
    seq = []
    for (oline, nl_stack), nline in zip(orig_lines, new_lines):
        ocontent = [(c, s) for c, s in oline]
        while ocontent and ocontent[0][0].isspace():
            ocontent.pop(0)
        lead_stack = oline[0][1] if oline and oline[0][0].isspace() else None
        while ocontent and ocontent[-1][0].isspace():
            ocontent.pop()
        content = ''.join(c for c, _ in ocontent)
        if nline.strip() != content.strip() or nline.lstrip() != content:
            raise ValueError('line content changed')
        lead = len(nline) - len(nline.lstrip())
        if lead_stack is None:
            lead_stack = ()
        seq += [(' ', lead_stack)] * lead + ocontent
        seq.append(('\n', nl_stack))
    seq.pop()                                        # no newline after the last line
    out, open_stack = [], []
    for ch, st in seq:
        n = 0
        while n < len(open_stack) and n < len(st) and open_stack[n] == st[n]:
            n += 1
        while len(open_stack) > n:
            out.append('</span>')
            open_stack.pop()
        for s in st[n:]:
            out.append(f'<span class="{s[1]}">')
            open_stack.append(s)
        out.append(html.escape(ch, quote=False))
    out.extend('</span>' for _ in open_stack)
    return ''.join(out)


def format_block(block_html):
    chars = parse(block_html)
    text = ''.join(c for c, _ in chars)
    # independent check that parsing lost nothing: strip only span tags, decode entities
    plain = html.unescape(re.sub(r'</?span[^>]*>', '', block_html))
    if plain != text:
        raise ValueError('could not parse block text exactly')
    new_text = reindent(text)
    if new_text == text:
        return block_html
    for a, b in zip(text.split('\n'), new_text.split('\n')):
        if a.strip() != b.strip():
            raise ValueError('a line changed beyond indentation')
    return rebuild(chars, new_text)


def process(path, check):
    s = open(path, encoding='utf-8').read()
    changed, failed = [], []

    def repl(m):
        try:
            new = format_block(m.group(2))
        except Exception as e:                     # keep the block exactly as it is
            failed.append(f'{os.path.relpath(path, ROOT)}: {e}')
            return m.group(0)
        if new != m.group(2):
            changed.append(1)
        return m.group(1) + new + m.group(3)

    out = BLOCK_RE.sub(repl, s)
    if changed and not check:
        open(path, 'w', encoding='utf-8').write(out)
    return len(changed), failed


def main():
    check = '--check' in sys.argv
    args = [a for a in sys.argv[1:] if a != '--check']
    files = args or sorted(glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True))
    total, fails = 0, []
    for f in files:
        n, bad = process(f, check)
        total += n
        fails += bad
        if n:
            print(('would fix' if check else 'fixed'), n, 'block(s):', os.path.relpath(f, ROOT))
    for b in fails:
        print('SKIPPED', b)
    print(f'{total} block(s) {"need fixing" if check else "fixed"}, {len(fails)} skipped')
    sys.exit(1 if (check and total) or fails else 0)


if __name__ == '__main__':
    main()
