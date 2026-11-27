---
title: TCP Sequence Number
aliases:
  - TCP 순서 번호
  - Byte Number
  - TCP Sequence Number(TCP 순서 번호)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Transport Layer/TCP Sequence Number.md
created: 2026-08-03
---

- [[TCP]] 는 byte 마다 numbering -> stream 전송
- segment 의 첫 byte number -> sequence number

### Byte number
- 첫 byte 에 $0 \sim 2^{32}-1$ 중 random number 부여

### Sequence number
![[Transport-Layer-09.png]]
- 각 segment 첫 byte 의 번호
- segment number + length -> 빠진 byte 파악

### Acknowledgement number
- [[ACK]] 에 들어가는 순서
- 다음 받아야 할 byte number -> 그 이전까지 수신 완료 의미
