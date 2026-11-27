---
title: Ping of Death
aliases:
  - 죽음의 핑
  - Ping of Death(죽음의 핑)
tags: []
field: computer
topic: security
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/시스템 보안 구축/Ping of Death.md
created: 2026-09-15
---

- Ping 명령 전송 시 [[Packet|패킷]] 크기를 [[IP|인터넷 프로토콜]] 허용 범위 ==65,536 [[바이트]]== [[이상(Anomaly)|이상]]으로 전송
- 다수 [[Fragmentation|단편화]] 유발 -> 공격 대상 [[컴퓨터 네트워크|네트워크]] 마비
- [[서비스 거부]] 유형

### 변종
- jolt / sPING / [[ICMP]] bug / IceNewk

### 대응
- [[방화벽]] 에서 [[ICMP]] Ping 메시지 전송 차단
