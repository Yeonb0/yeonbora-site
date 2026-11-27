---
title: Weighted Round Robin
aliases:
  - 가중 라운드 로빈
  - Weighted Round Robin(가중 라운드 로빈)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Network Layer/Weighted Round Robin.md
created: 2026-08-03
---

- [[Round Robin]] + priority 도입
- 각 [[Queue]] 마다 weight 설정
	- 차례마다 전송 [[Packet]] 개수 상이
	- ==ex)== weight 3 -> 3개 / weight 1 -> 1개 전송
