---
title: All Pairs Shorest Path
aliases: []
tags: []
field: computer
topic: algorithm
source: obsidian
sourcePath: 알고리즘 설계와 분석/Problems/All Pairs Shorest Path.md
created: 2026-07-30
domain:
  - graph
formulation:
  - optimization
techniques:
  - DP
---
### 문제 정의
- 전체 node 에서 전체 node 까지의 최소 weight 구하기
- Input : directed graph $G = (V, E)$, weight function $w$
- Output : n -> n 개의 모든 shortest-path distance

### 알고리즘
- [[Floyd-Warshall]]
- [[Johnson's Algorithm]]
