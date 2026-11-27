---
title: Data Transfer Rate
aliases:
  - Bit Rate
  - 데이터 전송 속도
  - Data Transfer Rate(데이터 전송 속도)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Physical Layer/Data Transfer Rate.md
created: 2026-07-31
---

- data 전송 속도 = bit rate
- 통신 설계의 핵심 지표

### 조건
- 예측 위해 필요한 ==3 가지 요소==
	- [[Bandwidth]]
	- number of signal level -> 몇 가지 pattern 사용?
	- channel quality -> noise level

### 종류
| 이론 | [[Noise]] 고려 |
| --- | --- |
| [[Nyquist Equation]] | X |
| [[Shannon Capacity]] | O |

### 특징
- header · overhead · 혼잡 제외한 실제값 -> [[Throughput]]
- baud rate 환산 -> $S = N \times \frac{1}{r}$, r 은 [[Signal Element]] 기준
