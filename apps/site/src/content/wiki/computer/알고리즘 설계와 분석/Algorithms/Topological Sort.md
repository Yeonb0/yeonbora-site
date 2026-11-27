---
title: Topological Sort
aliases: []
tags: []
field: computer
topic: algorithm
source: obsidian
sourcePath: 알고리즘 설계와 분석/Algorithms/Topological Sort.md
created: 2026-07-30
domain: graph
formulation: search
techniques: DFS
---
### 문제 정의
- DAG (Directed Acyclic Graph, 유방향 비순환 그래프) 의 모든 node 를 하나의 선형 순서로 나열
- [[DFS]] 사용 

### 성능
- $\Theta(V + E)$ -> [[DFS]] 와 동일