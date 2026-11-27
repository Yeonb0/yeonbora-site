---
title: RIP
aliases:
  - Routing Information Protocol
  - RIP(Routing Information Protocol)
  - 거리 벡터 라우팅 프로토콜
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Network Layer/RIP.md
created: 2026-08-03
---

- [[Distance Vector Routing]] 구현 protocol
- [[Router|Routing]] Information [[프로토콜|Protocol]]

### 전송
- ==30초== 주기 전송 + table update 시 전송

### message format
![[Routing-21.png]]
- 목적지 주소 (address + mask) + distance

### 특징
- 최단 경로 [[Searching|탐색]] -> [[Bellman-Ford]] [[알고리즘]]
- [[Autonomous System|AS]] 내에서 효율적 -> [[IGP]] 대표 protocol
- 최대 홉(Hop) 제한 ==15==
- ==180초== 이내 새 [[Router|routing]] 정보 수신 X -> [[이상(Anomaly)|이상]] [[state|상태]] 간주
