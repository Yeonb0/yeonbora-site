---
title: ARQ
aliases:
  - Automatic Repeat reQuest
  - ARQ(Automatic Repeat reQuest)
  - 자동 재전송 요구
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/ARQ.md
created: 2026-08-01
---

- 피드백 바탕 재전송 -> Data Link Layer 의 error control 방식
- [[Error Detection]] 으로 [[Error|오류]] 확인 -> 해당 frame 재전송

### 종류
- [[Stop-and-Wait]]
- [[Go-Back-N]]
- [[Selective Repeat]]
- [[Hybrid ARQ]] : ARQ + [[FEC]] 결합형
