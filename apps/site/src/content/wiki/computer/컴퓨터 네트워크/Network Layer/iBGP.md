---
title: iBGP
aliases:
  - internal BGP
  - iBGP(internal BGP)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Network Layer/iBGP.md
created: 2026-08-03
---

- 같은 [[Autonomous System|AS]] 내에서 [[Border Router]] 끼리 정보 전달
- 바깥쪽 AS 에서 온 정보 공유 목적

### 원칙
- fully connected
	- 모두가 모두에게 연결
	- 총 $\frac{n(n-1)}{2}$ [[node]] 연결
	- 같은 AS 안의 router 정보는 전송 X

![[Routing-04.png]]

### 특징
- ==ex)== R3
	- iBGP -> R1, R2 : R4 의 정보 전달
	- [[eBGP]] -> R4 : R1, R2 의 정보 전달
- [[반복문|Loop]] 방지 위해 모두 직접적 연결
