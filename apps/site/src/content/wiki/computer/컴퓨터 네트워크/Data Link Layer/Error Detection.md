---
title: Error Detection
aliases:
  - 오류 검출
  - Error Detection(오류 검출)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/Error Detection.md
created: 2026-07-31
---

- [[Error]] 발생 사실만 인지 -> 수정 방법 X -> 오류 [[Block|block]] 폐기
- [[Redundancy]] bit 추가 필요

![[Error-Detection-and-Correction-02.png]]

### 조건
- codeword set 의 [[Minimum Hamming Distance|MHD]] - 1 까지 검출 O

### 종류
- [[Simple Parity Check Code]]
- [[2-Dimensional Parity]]
- [[Checksum]]
- [[Cyclic Redundancy Check]]
