---
title: Congestion Control
aliases:
  - 혼잡 제어
  - Congestion Control(혼잡 제어)
  - 폭주 제어
  - 폭주(혼잡) 제어
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Transport Layer/Congestion Control.md
created: 2026-08-03
---

- 중간 [[Router|router]] 에서 drop 발생 X 하도록 전송 속도 조절
- congestion 판단 근거 -> packet loss (`ACK` 미수신)

![[Transport-Layer-20.png]]

### 특징
- data 전송 ↑ -> capacity ↑, delay ↑
- throughput : pipe 꽉 채워 전송 -> 노란색 영역 best
- 목표 -> Reliable delivery + Fast delivery

### 변수
| [[변수]] | 내용 |
| --- | --- |
| CWND | congestion window, 단위 [[MSS\|MSS]] |
| SSThresh | slow start 종료 임계값, drop 당시 CWND 의 절반 |

### 단계
1. [[Slow Start]]
2. [[Congestion Avoidance]]
3. [[Fast Retransmission]] / [[Fast Recovery]]

- receiver 측 속도 조절 -> [[Flow Control]]

### 목적
- [[컴퓨터 네트워크|network]] 내 [[Packet|packet]] 수 조절 -> network overflow 방지
- [[트래픽 제어]] 기법 중 하나
