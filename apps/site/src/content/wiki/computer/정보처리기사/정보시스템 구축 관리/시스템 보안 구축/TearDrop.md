---
title: TearDrop
aliases:
  - 티어드롭
  - TearDrop(티어드롭)
tags: []
field: computer
topic: security
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/시스템 보안 구축/TearDrop.md
created: 2026-09-15
---

- 재조합 Fragment Offset 값 변경 -> 수신 측 [[Packet|패킷]] 재조립 시 [[Error|오류]] 인한 과부하
- [[Fragmentation|단편화]] 재조립 취약점 악용
- [[서비스 거부]] 유형

### 대응
- Fragment Offset 잘못 설정된 패킷 폐기 설정
