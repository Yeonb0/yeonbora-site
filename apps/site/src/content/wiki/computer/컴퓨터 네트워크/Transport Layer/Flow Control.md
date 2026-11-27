---
title: Flow Control
aliases:
  - 흐름 제어
  - Flow Control(흐름 제어)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Transport Layer/Flow Control.md
created: 2026-08-03
---

- receiver 에 무리 없도록 sender 전송 속도 조절
- [[TCP Header]] 의 Window size 로 receiver 남은 공간 추정

### 특징
- 16 bit -> ==0 ~ 65535 byte==
- [[TCP]] option (Window scale) 로 배수 지정 O
	- n -> $2^n$ 만큼 곱하기

![[Transport-Layer-19.png]]

- 전송 단위 상한 -> [[MSS]]
- 대응 개념 -> [[Congestion Control]]

### 기법
| 기법 | 내용 |
| --- | --- |
| [[Stop-and-Wait]] | 수신 측 확인 [[신호]](`ACK`) 받음 -> 다음 packet 전송, 한 번에 한 packet 만 |
| [[Sliding Window]] | 확인 신호로 송신 data 양 조절, 미리 정해진 packet 수만큼 연속 전송 |

- receiver overflow 방지 목적
- [[트래픽 제어]] 기법 중 하나
