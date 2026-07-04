# NEETCODE_250_NOTES

個人 NeetCode 250 學習筆記，依 [NeetCode 250](https://neetcode.io/practice/practice/neetcode250) 的 18 個分類編排。工業風 design system 沿用自 ALGO_NOTES。

## 本地檢視

直接以瀏覽器開啟 `index.html`，或在專案根目錄執行：

```
python3 -m http.server 8000
```

然後開啟 `http://localhost:8000`。

## 目錄結構

```
.
├── index.html                 # 首頁：18 分類導覽
├── about.html                 # 說明頁
├── assets/
│   ├── css/                   # 工業風 design system
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── problem.css
│   │   └── study-card.css
│   └── js/
│       └── viz/               # 演算法動畫（自 ALGO_NOTES 帶入的參考範本）
├── scripts/
│   └── generate_chapters.py   # 分類 / 側欄的單一真相來源
└── topics/
    └── <NN>-<slug>/
        ├── index.html         # 分類總覽（自動生成，勿手改）
        └── problems/<pXXX>/
            ├── index.html     # PAGE 1 · Concept
            ├── code.html      # PAGE 2 · Code
            └── review.html    # PAGE 3 · Review
```

## 18 個分類

| # | Category | 題數 | # | Category | 題數 |
|---|---|---|---|---|---|
| 01 | Arrays & Hashing | 22 | 10 | Tries | 4 |
| 02 | Two Pointers | 13 | 11 | Graphs | 21 |
| 03 | Sliding Window | 9 | 12 | Advanced Graphs | 10 |
| 04 | Stack | 14 | 13 | 1-D DP | 17 |
| 05 | Binary Search | 14 | 14 | 2-D DP | 16 |
| 06 | Linked List | 14 | 15 | Greedy | 14 |
| 07 | Trees | 23 | 16 | Intervals | 7 |
| 08 | Heap / Priority Queue | 12 | 17 | Math & Geometry | 13 |
| 09 | Backtracking | 17 | 18 | Bit Manipulation | 10 |

共 250 題（Easy 60 / Medium 155 / Hard 35）。

## 撰寫節奏

由本人挑題，再由 Claude 依固定三頁學習卡結構整理筆記。流程封裝於
`.claude/skills/neetcode-notes/SKILL.md`。改動 `PROBLEMS` / `CHAPTERS` 後執行：

```
python3 scripts/generate_chapters.py
```

## 私密發布（Cloudflare Pages + Access）

1. 將此 repo 設為 GitHub Private。
2. 到 Cloudflare Pages 連結 repo，build 設定留空，輸出目錄填 `/`。
3. Pages 部署完成後到 **Zero Trust → Access → Applications** 建立 Self-hosted Application，
   把 Pages 網域加進去，設定 Email Policy 只允許自己的信箱。
