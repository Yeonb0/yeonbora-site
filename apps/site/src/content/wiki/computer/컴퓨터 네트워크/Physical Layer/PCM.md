---
title: PCM
aliases:
  - Pulse Code Modulation
  - PCM(Pulse Code Modulation)
  - 펄스 부호 변조
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Physical Layer/PCM.md
created: 2026-07-31
---

- analog data -> digital data 변환 방법 -> [[Analog-to-Digital Conversion]] 의 표준 절차

![[Digital-Transmission-15.png]]

### 절차
1. [[Sampling]] : 연속적인 signal 을 주기적으로 읽어 0, 1 로 mapping -> [[PAM]] signal
2. [[Quantizing]] : 연속적인 점의 높이를 discrete 하게 만들기 (양자화)
3. Encoding : 양자화한 data 를 digital 로 만들기

### Encoding
- quantized 된 level 을 bit pattern 으로 변환
- L 개 level -> $n_b = \log_2L$
- 단위 : bit rate
	- bit rate = sampling rate × $n_b$

### 복원
- [[PCM Decoder]]
