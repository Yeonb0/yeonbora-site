---
title: Manchester Encoding
aliases:
  - 맨체스터 인코딩
  - differential Manchester
  - 맨체스터 인코딩(Manchester Encoding)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Physical Layer/Manchester Encoding.md
created: 2026-07-31
---

- 한 bit 를 signal element 2개로 표현 -> 중간 전이로 값 결정
	- 0 : 위 -> 아래
	- 1 : 아래 -> 위
- differential Manchester : [[NRZ-I]] 와 유사
	- 0 : 앞이랑 반대로
	- 1 : 앞이랑 똑같이

### 장점
- level 2개 사용
- [[DC Component]] X, [[Baseline Wandering]] X, [[Clock Drift]] X

### 단점
- 한 bit 에 2 signal element -> baud 2배
