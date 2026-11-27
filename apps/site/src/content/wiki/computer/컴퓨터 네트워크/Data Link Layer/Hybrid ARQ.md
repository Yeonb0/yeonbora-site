---
title: Hybrid ARQ
aliases:
  - HARQ
  - Hybrid ARQ(HARQ)
  - 하이브리드 ARQ
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/Hybrid ARQ.md
created: 2026-08-01
---

- HARQ = [[ARQ]] + [[FEC]]

### 특징
- 기존 ARQ : [[Error]] 발견 -> frame 버리고 재전송 요청
- HARQ : Error 발견 -> error 난 frame 도 일단 저장
	- 재전송된 frame 과 합쳐서 복원 성공률 ↑ (soft combining)

### 사용
- 4G LTE, 5G NR
