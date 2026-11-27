---
title: OSPF
aliases:
  - Open Shortest Path First
  - OSPF(Open Shortest Path First)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Network Layer/OSPF.md
created: 2026-08-03
---

- [[Link-State Routing]] 구현 protocol
- Open Shortest Path First
- LSA message 로 정보 교환
- periodic + update 시 전송

### message format
![[Routing-23.png]]

| 항목 | 내용 |
| --- | --- |
| Link-[[state]] ID | 나 |
| Link ID | 내 친구 |
| Metric | 친구까지 거리 |
| Link data | 두 [[Router]] 사이 여러 link 구분 (≒ [[Sequence Number\|sequence number]]) |

### 특징
- [[RIP]] 단점 해결 -> 대규모 [[컴퓨터 네트워크|네트워크]] 에서 자주 사용
- routing 정보 : [[node]] 간 거리 정보 + link 상태 정보 실시간 반영
- 최단 경로 [[Searching|탐색]] -> [[Dijkstra]] [[알고리즘]]
- 변화된 정보만 모든 [[Router|router]] 에 알림
- [[IGP]] 에 속함
