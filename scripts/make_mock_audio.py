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

IV_POOL = [
    "en-US-AndrewMultilingualNeural",
    "en-US-BrianMultilingualNeural",
    "en-US-ChristopherNeural",
    "en-US-GuyNeural",
]
CD_POOL = [
    "en-US-AvaMultilingualNeural",
    "en-US-EmmaMultilingualNeural",
    "en-US-JennyNeural",
    "en-US-AriaNeural",
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
        voice = iv if e["v"] == "iv" else cd
        rate = "+2%" if e["v"] == "cd" else "-2%"
        async with sem:
            for attempt in (1, 2):
                try:
                    await edge_tts.Communicate(e["text"], voice, rate=rate,
                                               proxy=proxy).save(out)
                    if os.path.getsize(out):
                        break
                except Exception:
                    if attempt == 2:
                        raise
                await asyncio.sleep(2)
        if not os.path.getsize(out):
            sys.exit(f"turn {i}: empty synthesis result")
        wav = out[:-4] + ".wav"  # sample-exact timing; mp3 frame padding drifts
        subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", out,
                               "-ar", "24000", "-ac", "1", wav])
        return wav

    outs = await asyncio.gather(*[one(i, e) for i, e in enumerate(entries)])
    for i, (e, w) in enumerate(zip(entries, outs)):
        print(f"  {i:03d} {e['v']} {dur(w):6.1f}s  {e['text'][:48]}…")
    return list(outs)


def main():
    pdir = sys.argv[1].rstrip("/")
    pid = os.path.basename(pdir)  # e.g. p860
    rng = random.Random(int(re.sub(r"\D", "", pid)))
    iv, cd = rng.choice(IV_POOL), rng.choice(CD_POOL)

    entries = json.load(open(f"{pdir}/mock.script.json", encoding="utf-8"))
    html_path = f"{pdir}/mock.html"
    html = open(html_path, encoding="utf-8").read()
    n_turns = len(re.findall(r'class="[^"]*\bturn\b', html))
    if n_turns != len(entries):
        sys.exit(f"mock.html has {n_turns} .turn blocks, "
                 f"mock.script.json has {len(entries)} — must match 1:1")
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
    if total < 180:
        print("WARNING: under 3 min — a full mock adaptation should be ≥ 8 min")


if __name__ == "__main__":
    main()
