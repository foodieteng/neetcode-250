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
    '01': [  # Arrays & Hashing
        ('p1929','Concatenation of Array',            'concatenation-of-array',            'easy','todo'),
        ('p217', 'Contains Duplicate',                'contains-duplicate',                'easy','todo'),
        ('p242', 'Valid Anagram',                     'valid-anagram',                     'easy','todo'),
        ('p1',   'Two Sum',                           'two-sum',                           'easy','todo'),
        ('p14',  'Longest Common Prefix',             'longest-common-prefix',             'easy','todo'),
        ('p49',  'Group Anagrams',                    'group-anagrams',                    'med', 'todo'),
        ('p27',  'Remove Element',                    'remove-element',                    'easy','todo'),
        ('p169', 'Majority Element',                  'majority-element',                  'easy','todo'),
        ('p705', 'Design HashSet',                    'design-hashset',                    'easy','todo'),
        ('p706', 'Design HashMap',                    'design-hashmap',                    'easy','todo'),
        ('p912', 'Sort an Array',                     'sort-an-array',                     'med', 'todo'),
        ('p75',  'Sort Colors',                       'sort-colors',                       'med', 'todo'),
        ('p347', 'Top K Frequent Elements',           'top-k-frequent-elements',           'med', 'todo'),
        ('p271', 'Encode and Decode Strings',         'encode-and-decode-strings',         'med', 'todo'),
        ('p304', 'Range Sum Query 2D - Immutable',    'range-sum-query-2d-immutable',      'med', 'todo'),
        ('p238', 'Product of Array Except Self',      'product-of-array-except-self',      'med', 'todo'),
        ('p36',  'Valid Sudoku',                      'valid-sudoku',                      'med', 'todo'),
        ('p128', 'Longest Consecutive Sequence',      'longest-consecutive-sequence',      'med', 'todo'),
        ('p122', 'Best Time to Buy and Sell Stock II','best-time-to-buy-and-sell-stock-ii','med', 'todo'),
        ('p229', 'Majority Element II',               'majority-element-ii',               'med', 'todo'),
        ('p560', 'Subarray Sum Equals K',             'subarray-sum-equals-k',             'med', 'todo'),
        ('p41',  'First Missing Positive',            'first-missing-positive',            'hard','todo'),
    ],
    '02': [  # Two Pointers
        ('p344', 'Reverse String',                     'reverse-string',                     'easy','todo'),
        ('p125', 'Valid Palindrome',                   'valid-palindrome',                   'easy','todo'),
        ('p680', 'Valid Palindrome II',                'valid-palindrome-ii',                'easy','todo'),
        ('p1768','Merge Strings Alternately',          'merge-strings-alternately',          'easy','todo'),
        ('p88',  'Merge Sorted Array',                 'merge-sorted-array',                 'easy','todo'),
        ('p26',  'Remove Duplicates from Sorted Array','remove-duplicates-from-sorted-array','easy','todo'),
        ('p167', 'Two Sum II - Input Array Is Sorted', 'two-sum-ii-input-array-is-sorted',   'med', 'todo'),
        ('p15',  '3Sum',                               '3sum',                               'med', 'todo'),
        ('p18',  '4Sum',                               '4sum',                               'med', 'todo'),
        ('p189', 'Rotate Array',                       'rotate-array',                       'med', 'todo'),
        ('p11',  'Container With Most Water',          'container-with-most-water',          'med', 'todo'),
        ('p881', 'Boats to Save People',               'boats-to-save-people',               'med', 'todo'),
        ('p42',  'Trapping Rain Water',                'trapping-rain-water',                'hard','todo'),
    ],
    '03': [  # Sliding Window
        ('p219','Contains Duplicate II',                         'contains-duplicate-ii',                         'easy','todo'),
        ('p121','Best Time to Buy and Sell Stock',               'best-time-to-buy-and-sell-stock',               'easy','todo'),
        ('p3',  'Longest Substring Without Repeating Characters','longest-substring-without-repeating-characters','med', 'todo'),
        ('p424','Longest Repeating Character Replacement',       'longest-repeating-character-replacement',       'med', 'todo'),
        ('p567','Permutation in String',                         'permutation-in-string',                         'med', 'todo'),
        ('p209','Minimum Size Subarray Sum',                     'minimum-size-subarray-sum',                     'med', 'todo'),
        ('p658','Find K Closest Elements',                       'find-k-closest-elements',                       'med', 'todo'),
        ('p76', 'Minimum Window Substring',                      'minimum-window-substring',                      'hard','todo'),
        ('p239','Sliding Window Maximum',                        'sliding-window-maximum',                        'hard','todo'),
    ],
    '04': [  # Stack
        ('p682','Baseball Game',                   'baseball-game',                   'easy','todo'),
        ('p20', 'Valid Parentheses',               'valid-parentheses',               'easy','todo'),
        ('p225','Implement Stack using Queues',    'implement-stack-using-queues',    'easy','todo'),
        ('p232','Implement Queue using Stacks',    'implement-queue-using-stacks',    'easy','todo'),
        ('p155','Min Stack',                       'min-stack',                       'med', 'todo'),
        ('p150','Evaluate Reverse Polish Notation','evaluate-reverse-polish-notation','med', 'todo'),
        ('p735','Asteroid Collision',              'asteroid-collision',              'med', 'todo'),
        ('p739','Daily Temperatures',              'daily-temperatures',              'med', 'todo'),
        ('p901','Online Stock Span',               'online-stock-span',               'med', 'todo'),
        ('p853','Car Fleet',                       'car-fleet',                       'med', 'todo'),
        ('p71', 'Simplify Path',                   'simplify-path',                   'med', 'todo'),
        ('p394','Decode String',                   'decode-string',                   'med', 'todo'),
        ('p895','Maximum Frequency Stack',         'maximum-frequency-stack',         'hard','todo'),
        ('p84', 'Largest Rectangle in Histogram',  'largest-rectangle-in-histogram',  'hard','todo'),
    ],
    '05': [  # Binary Search
        ('p704', 'Binary Search',                          'binary-search',                          'easy','todo'),
        ('p35',  'Search Insert Position',                 'search-insert-position',                 'easy','todo'),
        ('p374', 'Guess Number Higher or Lower',           'guess-number-higher-or-lower',           'easy','todo'),
        ('p69',  'Sqrt(x)',                                'sqrtx',                                  'easy','todo'),
        ('p74',  'Search a 2D Matrix',                     'search-a-2d-matrix',                     'med', 'todo'),
        ('p875', 'Koko Eating Bananas',                    'koko-eating-bananas',                    'med', 'todo'),
        ('p1011','Capacity to Ship Packages Within D Days','capacity-to-ship-packages-within-d-days','med', 'todo'),
        ('p153', 'Find Minimum in Rotated Sorted Array',   'find-minimum-in-rotated-sorted-array',   'med', 'todo'),
        ('p33',  'Search in Rotated Sorted Array',         'search-in-rotated-sorted-array',         'med', 'todo'),
        ('p81',  'Search in Rotated Sorted Array II',      'search-in-rotated-sorted-array-ii',      'med', 'todo'),
        ('p981', 'Time Based Key-Value Store',             'time-based-key-value-store',             'med', 'todo'),
        ('p410', 'Split Array Largest Sum',                'split-array-largest-sum',                'hard','todo'),
        ('p4',   'Median of Two Sorted Arrays',            'median-of-two-sorted-arrays',            'hard','todo'),
        ('p1095','Find in Mountain Array',                 'find-in-mountain-array',                 'hard','todo'),
    ],
    '06': [  # Linked List
        ('p206','Reverse Linked List',             'reverse-linked-list',             'easy','todo'),
        ('p21', 'Merge Two Sorted Lists',          'merge-two-sorted-lists',          'easy','todo'),
        ('p141','Linked List Cycle',               'linked-list-cycle',               'easy','todo'),
        ('p143','Reorder List',                    'reorder-list',                    'med', 'todo'),
        ('p19', 'Remove Nth Node From End of List','remove-nth-node-from-end-of-list','med', 'todo'),
        ('p138','Copy List with Random Pointer',   'copy-list-with-random-pointer',   'med', 'todo'),
        ('p2',  'Add Two Numbers',                 'add-two-numbers',                 'med', 'todo'),
        ('p287','Find the Duplicate Number',       'find-the-duplicate-number',       'med', 'todo'),
        ('p92', 'Reverse Linked List II',          'reverse-linked-list-ii',          'med', 'todo'),
        ('p622','Design Circular Queue',           'design-circular-queue',           'med', 'todo'),
        ('p146','LRU Cache',                       'lru-cache',                       'med', 'todo'),
        ('p460','LFU Cache',                       'lfu-cache',                       'hard','todo'),
        ('p23', 'Merge K Sorted Lists',            'merge-k-sorted-lists',            'hard','todo'),
        ('p25', 'Reverse Nodes in k-Group',        'reverse-nodes-in-k-group',        'hard','todo'),
    ],
    '07': [  # Trees
        ('p94',  'Binary Tree Inorder Traversal',                            'binary-tree-inorder-traversal',                            'easy','todo'),
        ('p144', 'Binary Tree Preorder Traversal',                           'binary-tree-preorder-traversal',                           'easy','todo'),
        ('p145', 'Binary Tree Postorder Traversal',                          'binary-tree-postorder-traversal',                          'easy','todo'),
        ('p226', 'Invert Binary Tree',                                       'invert-binary-tree',                                       'easy','todo'),
        ('p104', 'Maximum Depth of Binary Tree',                             'maximum-depth-of-binary-tree',                             'easy','todo'),
        ('p543', 'Diameter of Binary Tree',                                  'diameter-of-binary-tree',                                  'easy','todo'),
        ('p110', 'Balanced Binary Tree',                                     'balanced-binary-tree',                                     'easy','todo'),
        ('p100', 'Same Tree',                                                'same-tree',                                                'easy','todo'),
        ('p572', 'Subtree of Another Tree',                                  'subtree-of-another-tree',                                  'easy','todo'),
        ('p235', 'Lowest Common Ancestor of a Binary Search Tree',           'lowest-common-ancestor-of-a-binary-search-tree',           'med', 'todo'),
        ('p701', 'Insert into a Binary Search Tree',                         'insert-into-a-binary-search-tree',                         'med', 'todo'),
        ('p450', 'Delete Node in a BST',                                     'delete-node-in-a-bst',                                     'med', 'todo'),
        ('p102', 'Binary Tree Level Order Traversal',                        'binary-tree-level-order-traversal',                        'med', 'todo'),
        ('p199', 'Binary Tree Right Side View',                              'binary-tree-right-side-view',                              'med', 'todo'),
        ('p427', 'Construct Quad Tree',                                      'construct-quad-tree',                                      'med', 'todo'),
        ('p1448','Count Good Nodes in Binary Tree',                          'count-good-nodes-in-binary-tree',                          'med', 'todo'),
        ('p98',  'Validate Binary Search Tree',                              'validate-binary-search-tree',                              'med', 'todo'),
        ('p230', 'Kth Smallest Element in a BST',                            'kth-smallest-element-in-a-bst',                            'med', 'todo'),
        ('p105', 'Construct Binary Tree from Preorder and Inorder Traversal','construct-binary-tree-from-preorder-and-inorder-traversal','med', 'todo'),
        ('p337', 'House Robber III',                                         'house-robber-iii',                                         'med', 'todo'),
        ('p1325','Delete Leaves With a Given Value',                         'delete-leaves-with-a-given-value',                         'med', 'todo'),
        ('p124', 'Binary Tree Maximum Path Sum',                             'binary-tree-maximum-path-sum',                             'hard','todo'),
        ('p297', 'Serialize and Deserialize Binary Tree',                    'serialize-and-deserialize-binary-tree',                    'hard','todo'),
    ],
    '08': [  # Heap / Priority Queue
        ('p703', 'Kth Largest Element in a Stream','kth-largest-element-in-a-stream','easy','todo'),
        ('p1046','Last Stone Weight',              'last-stone-weight',              'easy','todo'),
        ('p973', 'K Closest Points to Origin',     'k-closest-points-to-origin',     'med', 'todo'),
        ('p215', 'Kth Largest Element in an Array','kth-largest-element-in-an-array','med', 'todo'),
        ('p621', 'Task Scheduler',                 'task-scheduler',                 'med', 'todo'),
        ('p355', 'Design Twitter',                 'design-twitter',                 'med', 'todo'),
        ('p1834','Single Threaded CPU',            'single-threaded-cpu',            'med', 'todo'),
        ('p767', 'Reorganize String',              'reorganize-string',              'med', 'todo'),
        ('p1405','Longest Happy String',           'longest-happy-string',           'med', 'todo'),
        ('p1094','Car Pooling',                    'car-pooling',                    'med', 'todo'),
        ('p295', 'Find Median from Data Stream',   'find-median-from-data-stream',   'hard','todo'),
        ('p502', 'IPO',                            'ipo',                            'hard','todo'),
    ],
    '09': [  # Backtracking
        ('p1863','Sum of All Subset XOR Totals',         'sum-of-all-subset-xor-totals',         'easy','todo'),
        ('p78',  'Subsets',                              'subsets',                              'med', 'todo'),
        ('p39',  'Combination Sum',                      'combination-sum',                      'med', 'todo'),
        ('p40',  'Combination Sum II',                   'combination-sum-ii',                   'med', 'todo'),
        ('p77',  'Combinations',                         'combinations',                         'med', 'todo'),
        ('p46',  'Permutations',                         'permutations',                         'med', 'todo'),
        ('p90',  'Subsets II',                           'subsets-ii',                           'med', 'todo'),
        ('p47',  'Permutations II',                      'permutations-ii',                      'med', 'todo'),
        ('p79',  'Word Search',                          'word-search',                          'med', 'todo'),
        ('p131', 'Palindrome Partitioning',              'palindrome-partitioning',              'med', 'todo'),
        ('p17',  'Letter Combinations of a Phone Number','letter-combinations-of-a-phone-number','med', 'todo'),
        ('p22',  'Generate Parentheses',                 'generate-parentheses',                 'med', 'todo'),
        ('p473', 'Matchsticks to Square',                'matchsticks-to-square',                'med', 'todo'),
        ('p698', 'Partition to K Equal Sum Subsets',     'partition-to-k-equal-sum-subsets',     'med', 'todo'),
        ('p51',  'N-Queens',                             'n-queens',                             'hard','todo'),
        ('p52',  'N-Queens II',                          'n-queens-ii',                          'hard','todo'),
        ('p140', 'Word Break II',                        'word-break-ii',                        'hard','todo'),
    ],
    '10': [  # Tries
        ('p208', 'Implement Trie (Prefix Tree)',              'implement-trie-prefix-tree',                'med', 'todo'),
        ('p211', 'Design Add and Search Words Data Structure','design-add-and-search-words-data-structure','med', 'todo'),
        ('p2707','Extra Characters in a String',              'extra-characters-in-a-string',              'med', 'todo'),
        ('p212', 'Word Search II',                            'word-search-ii',                            'hard','todo'),
    ],
    '11': [  # Graphs
        ('p463', 'Island Perimeter',                                     'island-perimeter',                                     'easy','todo'),
        ('p953', 'Verifying an Alien Dictionary',                        'verifying-an-alien-dictionary',                        'easy','todo'),
        ('p997', 'Find the Town Judge',                                  'find-the-town-judge',                                  'easy','todo'),
        ('p200', 'Number of Islands',                                    'number-of-islands',                                    'med', 'todo'),
        ('p695', 'Max Area of Island',                                   'max-area-of-island',                                   'med', 'todo'),
        ('p133', 'Clone Graph',                                          'clone-graph',                                          'med', 'todo'),
        ('p286', 'Walls and Gates',                                      'walls-and-gates',                                      'med', 'todo'),
        ('p994', 'Rotting Oranges',                                      'rotting-oranges',                                      'med', 'todo'),
        ('p417', 'Pacific Atlantic Water Flow',                          'pacific-atlantic-water-flow',                          'med', 'todo'),
        ('p130', 'Surrounded Regions',                                   'surrounded-regions',                                   'med', 'todo'),
        ('p752', 'Open the Lock',                                        'open-the-lock',                                        'med', 'todo'),
        ('p207', 'Course Schedule',                                      'course-schedule',                                      'med', 'todo'),
        ('p210', 'Course Schedule II',                                   'course-schedule-ii',                                   'med', 'todo'),
        ('p261', 'Graph Valid Tree',                                     'graph-valid-tree',                                     'med', 'todo'),
        ('p1462','Course Schedule IV',                                   'course-schedule-iv',                                   'med', 'todo'),
        ('p323', 'Number of Connected Components in an Undirected Graph','number-of-connected-components-in-an-undirected-graph','med', 'todo'),
        ('p684', 'Redundant Connection',                                 'redundant-connection',                                 'med', 'todo'),
        ('p721', 'Accounts Merge',                                       'accounts-merge',                                       'med', 'todo'),
        ('p399', 'Evaluate Division',                                    'evaluate-division',                                    'med', 'todo'),
        ('p310', 'Minimum Height Trees',                                 'minimum-height-trees',                                 'med', 'todo'),
        ('p127', 'Word Ladder',                                          'word-ladder',                                          'hard','todo'),
    ],
    '12': [  # Advanced Graphs
        ('p1631','Path With Minimum Effort',                                        'path-with-minimum-effort',                                        'med', 'todo'),
        ('p743', 'Network Delay Time',                                              'network-delay-time',                                              'med', 'done'),
        ('p332', 'Reconstruct Itinerary',                                           'reconstruct-itinerary',                                           'hard','done'),
        ('p1584','Min Cost to Connect All Points',                                  'min-cost-to-connect-all-points',                                  'med', 'todo'),
        ('p778', 'Swim in Rising Water',                                            'swim-in-rising-water',                                            'hard','done'),
        ('p269', 'Alien Dictionary',                                                'alien-dictionary',                                                'hard','done'),
        ('p787', 'Cheapest Flights Within K Stops',                                 'cheapest-flights-within-k-stops',                                 'med', 'done'),
        ('p1489','Find Critical and Pseudo Critical Edges in Minimum Spanning Tree','find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree','hard','done'),
        ('p2392','Build a Matrix With Conditions',                                  'build-a-matrix-with-conditions',                                  'hard','done'),
        ('p2709','Greatest Common Divisor Traversal',                               'greatest-common-divisor-traversal',                               'hard','done'),
    ],
    '13': [  # 1-D Dynamic Programming
        ('p70',  'Climbing Stairs',               'climbing-stairs',               'easy','todo'),
        ('p746', 'Min Cost Climbing Stairs',      'min-cost-climbing-stairs',      'easy','todo'),
        ('p1137','N-th Tribonacci Number',        'n-th-tribonacci-number',        'easy','todo'),
        ('p198', 'House Robber',                  'house-robber',                  'med', 'todo'),
        ('p213', 'House Robber II',               'house-robber-ii',               'med', 'todo'),
        ('p5',   'Longest Palindromic Substring', 'longest-palindromic-substring', 'med', 'todo'),
        ('p647', 'Palindromic Substrings',        'palindromic-substrings',        'med', 'todo'),
        ('p91',  'Decode Ways',                   'decode-ways',                   'med', 'todo'),
        ('p322', 'Coin Change',                   'coin-change',                   'med', 'todo'),
        ('p152', 'Maximum Product Subarray',      'maximum-product-subarray',      'med', 'todo'),
        ('p139', 'Word Break',                    'word-break',                    'med', 'todo'),
        ('p300', 'Longest Increasing Subsequence','longest-increasing-subsequence','med', 'todo'),
        ('p416', 'Partition Equal Subset Sum',    'partition-equal-subset-sum',    'med', 'todo'),
        ('p377', 'Combination Sum IV',            'combination-sum-iv',            'med', 'todo'),
        ('p279', 'Perfect Squares',               'perfect-squares',               'med', 'todo'),
        ('p343', 'Integer Break',                 'integer-break',                 'med', 'todo'),
        ('p1406','Stone Game III',                'stone-game-iii',                'hard','todo'),
    ],
    '14': [  # 2-D Dynamic Programming
        ('p62',  'Unique Paths',                                 'unique-paths',                                 'med', 'todo'),
        ('p63',  'Unique Paths II',                              'unique-paths-ii',                              'med', 'todo'),
        ('p64',  'Minimum Path Sum',                             'minimum-path-sum',                             'med', 'todo'),
        ('p1143','Longest Common Subsequence',                   'longest-common-subsequence',                   'med', 'todo'),
        ('p1049','Last Stone Weight II',                         'last-stone-weight-ii',                         'med', 'todo'),
        ('p309', 'Best Time to Buy and Sell Stock with Cooldown','best-time-to-buy-and-sell-stock-with-cooldown','med', 'todo'),
        ('p518', 'Coin Change II',                               'coin-change-ii',                               'med', 'todo'),
        ('p494', 'Target Sum',                                   'target-sum',                                   'med', 'todo'),
        ('p97',  'Interleaving String',                          'interleaving-string',                          'med', 'todo'),
        ('p877', 'Stone Game',                                   'stone-game',                                   'med', 'todo'),
        ('p1140','Stone Game II',                                'stone-game-ii',                                'med', 'todo'),
        ('p329', 'Longest Increasing Path in a Matrix',          'longest-increasing-path-in-a-matrix',          'hard','todo'),
        ('p115', 'Distinct Subsequences',                        'distinct-subsequences',                        'hard','todo'),
        ('p72',  'Edit Distance',                                'edit-distance',                                'med', 'todo'),
        ('p312', 'Burst Balloons',                               'burst-balloons',                               'hard','todo'),
        ('p10',  'Regular Expression Matching',                  'regular-expression-matching',                  'hard','todo'),
    ],
    '15': [  # Greedy
        ('p860', 'Lemonade Change',                      'lemonade-change',                      'easy','todo'),
        ('p53',  'Maximum Subarray',                     'maximum-subarray',                     'med', 'todo'),
        ('p918', 'Maximum Sum Circular Subarray',        'maximum-sum-circular-subarray',        'med', 'todo'),
        ('p978', 'Longest Turbulent Subarray',           'longest-turbulent-subarray',           'med', 'todo'),
        ('p55',  'Jump Game',                            'jump-game',                            'med', 'todo'),
        ('p45',  'Jump Game II',                         'jump-game-ii',                         'med', 'todo'),
        ('p1871','Jump Game VII',                        'jump-game-vii',                        'med', 'todo'),
        ('p134', 'Gas Station',                          'gas-station',                          'med', 'todo'),
        ('p846', 'Hand of Straights',                    'hand-of-straights',                    'med', 'todo'),
        ('p649', 'Dota2 Senate',                         'dota2-senate',                         'med', 'todo'),
        ('p1899','Merge Triplets to Form Target Triplet','merge-triplets-to-form-target-triplet','med', 'todo'),
        ('p763', 'Partition Labels',                     'partition-labels',                     'med', 'todo'),
        ('p678', 'Valid Parenthesis String',             'valid-parenthesis-string',             'med', 'todo'),
        ('p135', 'Candy',                                'candy',                                'hard','todo'),
    ],
    '16': [  # Intervals
        ('p57',  'Insert Interval',                       'insert-interval',                       'med', 'todo'),
        ('p56',  'Merge Intervals',                       'merge-intervals',                       'med', 'todo'),
        ('p435', 'Non-overlapping Intervals',             'non-overlapping-intervals',             'med', 'todo'),
        ('p252', 'Meeting Rooms',                         'meeting-rooms',                         'easy','todo'),
        ('p253', 'Meeting Rooms II',                      'meeting-rooms-ii',                      'med', 'todo'),
        ('p2402','Meeting Rooms III',                     'meeting-rooms-iii',                     'hard','todo'),
        ('p1851','Minimum Interval to Include Each Query','minimum-interval-to-include-each-query','hard','todo'),
    ],
    '17': [  # Math & Geometry
        ('p168', 'Excel Sheet Column Title',                      'excel-sheet-column-title',                      'easy','todo'),
        ('p1071','Greatest Common Divisor of Strings',            'greatest-common-divisor-of-strings',            'easy','todo'),
        ('p2807','Insert Greatest Common Divisors in Linked List','insert-greatest-common-divisors-in-linked-list','med', 'todo'),
        ('p867', 'Transpose Matrix',                              'transpose-matrix',                              'easy','todo'),
        ('p48',  'Rotate Image',                                  'rotate-image',                                  'med', 'todo'),
        ('p54',  'Spiral Matrix',                                 'spiral-matrix',                                 'med', 'todo'),
        ('p73',  'Set Matrix Zeroes',                             'set-matrix-zeroes',                             'med', 'todo'),
        ('p202', 'Happy Number',                                  'happy-number',                                  'easy','todo'),
        ('p66',  'Plus One',                                      'plus-one',                                      'easy','todo'),
        ('p13',  'Roman to Integer',                              'roman-to-integer',                              'easy','todo'),
        ('p50',  'Pow(x, n)',                                     'powx-n',                                        'med', 'todo'),
        ('p43',  'Multiply Strings',                              'multiply-strings',                              'med', 'todo'),
        ('p2013','Detect Squares',                                'detect-squares',                                'med', 'todo'),
    ],
    '18': [  # Bit Manipulation
        ('p136', 'Single Number',               'single-number',               'easy','todo'),
        ('p191', 'Number of 1 Bits',            'number-of-1-bits',            'easy','todo'),
        ('p338', 'Counting Bits',               'counting-bits',               'easy','todo'),
        ('p67',  'Add Binary',                  'add-binary',                  'easy','todo'),
        ('p190', 'Reverse Bits',                'reverse-bits',                'easy','todo'),
        ('p268', 'Missing Number',              'missing-number',              'easy','todo'),
        ('p371', 'Sum of Two Integers',         'sum-of-two-integers',         'med', 'todo'),
        ('p7',   'Reverse Integer',             'reverse-integer',             'med', 'todo'),
        ('p201', 'Bitwise AND of Numbers Range','bitwise-and-of-numbers-range','med', 'todo'),
        ('p3133','Minimum Array End',           'minimum-array-end',           'med', 'todo'),
    ],
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
        f'<span class="chip chip--diff" style="font-size:9px;border-color:{color};'
        f'color:{color};">{name}</span>'
    )


def render_problem_item(cat_id, cat_slug, pid, title, url_slug, difficulty, status, *, indent=''):
    """Render a single <li> for a problem as a column-aligned .pl-row
    (difficulty chip | number | title | 原題 link)."""
    num = pid[1:]  # strip leading 'p' -> leetcode number
    chip = diff_chip(difficulty)
    numspan = f'<span class="pl-num">{num}</span>'
    src = (
        f'<a class="pl-src" href="{leetcode_url(url_slug)}" target="_blank" rel="noopener" '
        f'style="font-size:11px;color:var(--rust-bright);border:none;">原題 ↗</a>'
    )
    if status == 'todo':
        main = (
            f'<span class="pl-main" style="color:var(--concrete)">{title} '
            f'<span style="color:var(--line-bright)">(待補)</span></span>'
        )
    elif status == 'demo':
        href = resolve_problem_link(cat_slug, pid)
        main = (
            f'<span class="pl-main"><a href="{href}">{title}</a>'
            f'<span class="chip chip--warning" style="margin-left:8px;font-size:9px;">DEMO</span></span>'
        )
    else:  # 'done'
        href = resolve_problem_link(cat_slug, pid)
        main = f'<span class="pl-main"><a href="{href}">{title}</a></span>'
    return f'{indent}<li><span class="pl-row">{chip}{numspan}{main}{src}</span></li>'


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
    """Build the category TOC at the top of the category page — section links only
    (the full problem list lives in the quick-index table and the 題目列表 section)."""
    items = []
    if probs:
        items.append(f'          <li><a href="#sec-quick-index">⚡ 快速索引</a></li>')
    items.append(f'          <li><a href="#sec-concept">{cat_id}.1 · 核心概念</a></li>')
    items.append(f'          <li><a href="#sec-problems">{cat_id}.2 · 題目列表</a></li>')
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
