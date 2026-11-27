---
title: Token Passing
aliases:
  - 토큰 패싱
  - Token Passing(토큰 패싱)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/Token Passing.md
created: 2026-08-01
---

- token 보유한 station 만 전송 O 인 [[Controlled Access]] 방식

![[Medium-Access-Control-03.png]]

### 단점
- token error -> token 유실 -> 동작 X
- ACK error -> token ==2개== 생성
- 복잡도 ↑ -> 현재는 거의 미사용
