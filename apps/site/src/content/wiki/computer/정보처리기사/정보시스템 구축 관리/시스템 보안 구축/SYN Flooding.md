---
title: SYN Flooding
aliases:
  - SYN 플러딩
  - SYN Flooding(SYN 플러딩)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/시스템 보안 구축/SYN Flooding.md
created: 2026-09-15
---

- 공격자가 가상 [[클라이언트]]로 위장 -> [[3-Way Handshake]] 의도적 중단 -> 정상 서비스 수행 X
- SYN [[신호]] 전송 / SYN + [[ACK]] 신호 전송 단계에서 방치 -> 수신지 대기 자원 고갈
- [[서비스 거부]] 유형

### 대응
- 수신지 SYN 수신 대기 시간 ↓
- 침입 차단 시스템 활용 -> [[방화벽]]
