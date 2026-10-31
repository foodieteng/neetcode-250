#!/usr/bin/env python3
"""Build mock.mp3 + cue table for a problem's click-to-seek mock.html.

Usage:
    python3 scripts/make_mock_audio.py topics/15-greedy/problems/p860

Reads  <dir>/mock.script.json : [{"v": "iv"|"cd", "text": "..."}, ...]
Writes <dir>/mock.mp3 and fills `window.MOCK_CUES = [...]` in <dir>/mock.html.

Voices: drawn from two pools, seeded by the problem number — stable across
re-runs, interviewer and candidate always differ. Needs `pip install edge-tts`
+ ffmpeg, and network to speech.platform.bing.com (honors HTTPS_PROXY).
"""
import asyncio
import json
import os
import random
import re
import subprocess
import sys
import tempfile

# The "Plus"-grade Microsoft multilingual voices (the natural ones — same
# family NaturalReaders sells as Plus Voices). Two DIFFERENT people are drawn
# per problem, seeded by the problem number; roles are not gender-fixed.
PLUS_POOL = [
    "en-US-AndrewMultilingualNeural",  # male,  warm, confident
    "en-US-AvaMultilingualNeural",     # female, expressive, pleasant
    "en-US-BrianMultilingualNeural",   # male,  approachable, casual
    "en-US-EmmaMultilingualNeural",    # female, cheerful, conversational
]
GAP = 0.45  # silence between turns, seconds


def dur(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", path]).strip())


async def synth(entries, iv, cd, tmp, workers=4):
    import edge_tts
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    sem = asyncio.Semaphore(workers)  # ~4.2 s/turn serial; 4-way ≈ 3× faster

    async def one(i, e):
        out = os.path.join(tmp, f"{i:03d}.mp3")
        wav = out[:-4] + ".wav"  # sample-exact timing; mp3 frame padding drifts
        voice = iv if e["v"] == "iv" else cd
        rate = "+2%" if e["v"] == "cd" else "-2%"
        words = len(e["text"].split())
        async with sem:
            for attempt in (1, 2, 3):
                try:
                    await edge_tts.Communicate(e["text"], voice, rate=rate,
                                               proxy=proxy).save(out)
                except Exception:
                    if attempt == 3:
                        raise
                    await asyncio.sleep(2)
                    continue
                if not os.path.getsize(out):
                    await asyncio.sleep(2)
                    continue
                subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", out,
                                       "-ar", "24000", "-ac", "1", wav])
                # edge-tts sometimes truncates long turns SILENTLY (e.g. 229
                # words in 25 s). Normal speech is 130–200 wpm; > 260 wpm on a
                # non-trivial turn means part of the text never got spoken.
                wpm = words / (dur(wav) / 60)
                if words < 20 or wpm <= 260:
                    return wav
                print(f"  turn {i}: {wpm:.0f} wpm looks truncated, retrying")
                await asyncio.sleep(2)
        sys.exit(f"turn {i}: synthesis kept failing/truncating after 3 tries")

    outs = await asyncio.gather(*[one(i, e) for i, e in enumerate(entries)])
    for i, (e, w) in enumerate(zip(entries, outs)):
        print(f"  {i:03d} {e['v']} {dur(w):6.1f}s  {e['text'][:48]}…")
    return list(outs)


def main():
    pdir = sys.argv[1].rstrip("/")
    pid = os.path.basename(pdir)  # e.g. p860
    rng = random.Random(int(re.sub(r"\D", "", pid)))
    iv, cd = rng.sample(PLUS_POOL, 2)

    entries = json.load(open(f"{pdir}/mock.script.json", encoding="utf-8"))
    html_path = f"{pdir}/mock.html"
    html = open(html_path, encoding="utf-8").read()
    n_turns = len(re.findall(r'class="[^"]*\bturn\b', html))
    if n_turns != len(entries):
        sys.exit(f"mock.html has {n_turns} .turn blocks, "
                 f"mock.script.json has {len(entries)} — must match 1:1")
    # 頁面 = 語音: each .turn's prose (code blocks, tables, plan box removed)
    # must say what its script entry says. Spoken numbers ("five, five, ten")
    # vs chips ("[5,5,10]") shift word counts a little, so allow 35%.
    def prose(turn_html):
        t = re.sub(r'<pre class="code">.*?</pre>', '', turn_html, flags=re.S)
        t = re.sub(r'<table.*?</table>', '', t, flags=re.S)
        t = re.sub(r'<div class="insight-box"[^>]*>.*?</div>', '', t, flags=re.S)
        t = re.sub(r'<div class="(avatar|role|stage)[^"]*"[^>]*>.*?</div>', '', t, flags=re.S)
        t = re.sub(r'<script.*?</script>', '', t, flags=re.S)
        t = re.sub(r'<[^>]+>', ' ', t)
        return re.sub(r'\s+', ' ', t).strip()
    body = html.split('<div class="page">', 1)[-1]
    page_turns = [prose(t) for t in re.split(r'<div class="turn"[^>]*>', body)[1:]]
    gaps = []
    for i, (pt, e) in enumerate(zip(page_turns, entries)):
        pw, sw = len(pt.split()), len(e["text"].split())
        if sw >= 25 and abs(pw - sw) / sw > 0.35:
            gaps.append(f"#{i} page {pw}w vs audio {sw}w")
    if gaps:
        sys.exit("頁面 ≠ 語音 — rewrite these turns' prose to match the script: "
                 + "; ".join(gaps))

    long = [(i, len(e["text"].split())) for i, e in enumerate(entries)
            if len(e["text"].split()) > 160]
    if long:
        sys.exit("turns over 160 words (精簡、講重點、不報流水帳 — tighten them): "
                 + ", ".join(f"#{i} {w}w" for i, w in long))
    if "--check" in sys.argv:
        print(f"{pid}: OK — {len(entries)} turns, page prose matches script, no turn > 160 words")
        return
    print(f"{pid}: {len(entries)} turns · interviewer={iv} · candidate={cd}")

    with tempfile.TemporaryDirectory() as tmp:
        outs = asyncio.run(synth(entries, iv, cd, tmp))
        cues, t = [], 0.0
        for o in outs:
            cues.append(round(t, 2))
            t += dur(o) + GAP

        args = []
        for o in outs:
            args += ["-i", o]
        fc = "".join(f"[{k}:a]apad=pad_dur={GAP}[a{k}];"
                     for k in range(len(outs)))
        fc += "".join(f"[a{k}]" for k in range(len(outs)))
        fc += f"concat=n={len(outs)}:v=0:a=1[out]"
        subprocess.check_call(
            ["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", fc,
             "-map", "[out]", "-ac", "1", "-b:a", "48k", f"{pdir}/mock.mp3"])

    new = re.sub(r"window\.MOCK_CUES\s*=\s*\[[^\]]*\]",
                 "window.MOCK_CUES = " + json.dumps(cues), html, count=1)
    if new == html:
        sys.exit("mock.html is missing the `window.MOCK_CUES = []` marker")
    open(html_path, "w", encoding="utf-8").write(new)
    total = dur(f"{pdir}/mock.mp3")
    print(f"mock.mp3 {total / 60:.1f} min · {len(cues)} cues written into mock.html")
    if not 240 <= total <= 600:
        print("WARNING: expected ~6–8 min (900–1,300 words); check the script")


if __name__ == "__main__":
    main()
