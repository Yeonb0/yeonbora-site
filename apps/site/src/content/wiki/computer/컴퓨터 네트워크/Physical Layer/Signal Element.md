---
title: Signal Element
aliases:
  - 신호 요소
  - 신호 요소(Signal Element)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Physical Layer/Signal Element.md
created: 2026-07-31
---

- signal 을 끊어 읽는 단위
- $r = \frac{\text{data element}}{\text{signal element}}$
	- 하나의 signal element 에 들어가는 [[Data Element]] 수

![[Digital-Transmission-02.png]]

### Signal transmission rate
- 초당 보내지는 signal element 수
- 단위 : ==baud==
- r 값 파악 -> bps 변환 O
- $S = N \times \frac{1}{r}$
	- N = [[Data Transfer Rate 1|bit rate]], S = baud rate
