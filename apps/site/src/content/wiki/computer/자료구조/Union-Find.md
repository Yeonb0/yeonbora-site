---
title: Union-Find
aliases:
  - Disjoint Set
tags: []
field: computer
topic: data-structure
source: obsidian
sourcePath: 자료구조/Union-Find.md
created: 2026-07-30
---
- 겹치는 요소가 없는 set
- set 마다 representative (대표값) 존재

### Operation
- `MAKE_SET(x)` : x 를 원소로 가지는 set 을 만들기
- `UNION(x, y)` : x, y 를 원소로 가지는 두 set 을 $\cup$
- `FIND_SET(X)` : x 를 원소로 가지는 set 의 representative 반환