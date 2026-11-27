---
title: Variable-size Framing
aliases:
  - 가변 크기 프레이밍
  - Variable-size Framing(가변 크기 프레이밍)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/Variable-size Framing.md
created: 2026-08-01
---

- frame 마다 길이 상이 -> 요즘 사용하는 [[Framing]] 방법
- frame 나누는 delimiter 필요
	- 시작 / 끝에 flag (`01111110`)

![[Framing-Error-Control-01.png]]

### 조건
- data 안에 flag 와 동일한 패턴 등장 가능 -> [[Bit Stuffing]] / [[Byte Stuffing]] 로 회피
