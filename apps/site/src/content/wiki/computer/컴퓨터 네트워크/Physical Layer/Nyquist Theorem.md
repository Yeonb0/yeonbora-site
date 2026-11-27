---
title: Nyquist Theorem
aliases:
  - 나이퀴스트 정리
  - Sampling theorem
  - 나이퀴스트 정리(Nyquist Theorem)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Physical Layer/Nyquist Theorem.md
created: 2026-07-31
---

- [[Sampling]] rate 는 signal frequency 의 최소 ==2배==
	- 더 많이 -> oversampling -> 용량 ↑, 정확도 ↑
	- 더 적게 -> undersampling -> signal 복구 X

![[Digital-Transmission-17.png]]

- c. Undersampling : $f_s = \frac{3}{4}f$
