---
title: Active Queue Management
aliases:
  - AQM
  - 능동 큐 관리
  - Active Queue Management(AQM)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Network Layer/Active Queue Management.md
created: 2026-08-03
---

- [[Queue]] 를 적극적으로 관리해 가득 차기 전 미리 조취
- [[FIFO Queue]] + tail drop 의 대안
- [[TCP]] 에게 거의 다 찼다는 hint 제공

### 종류
- [[RED]]
- CoDel / FQ-CoDel
- [[ECN]] 마킹
