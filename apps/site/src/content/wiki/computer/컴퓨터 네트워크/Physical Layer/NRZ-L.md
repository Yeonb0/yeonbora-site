---
title: NRZ-L
aliases:
  - NRZ-L(Level)
  - Non-Return-to-Zero Level
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Physical Layer/NRZ-L.md
created: 2026-07-31
---

- [[Polar Encoding]] 중 voltage level 로 값 결정
	- bit 0 -> +V
	- bit 1 -> -V

![[Digital-Transmission-04.png]]

### 단점
- 0 or 1 지속 -> [[DC Component]] 발생 -> [[Baseline Wandering]], [[Clock Drift]]
