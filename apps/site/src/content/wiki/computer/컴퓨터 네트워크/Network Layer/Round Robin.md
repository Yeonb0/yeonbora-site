---
title: Round Robin
aliases:
  - 라운드 로빈
  - Round Robin(라운드 로빈)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Network Layer/Round Robin.md
created: 2026-08-03
---

- flow 별로 [[Queue]] 생성 후 순서대로 하나씩 전송
	- src - dst pair 마다 [[queue]] 생성

![[Scheduling-and-Traffic-Shaping-05.png]]

### 장점
- 보내는 만큼 받기 X -> flow 간 공평

### 단점
- [[Packet]] 마다 size 상이 시 packet 작은 flow 대기 시간 ↑
	- 보완 -> [[Fair Queueing]]

### 파생
- [[Weighted Round Robin]]
