---
title: IDS
aliases:
  - Intrusion Detection System
  - 침입 탐지 시스템
  - IDS(Intrusion Detection System)
tags: []
field: computer
topic: server
source: obsidian
sourcePath: 서버 구조와 기술/IDS.md
created: 2026-08-06
---

- 침입 탐지 시스템
- [[방화벽]] 으로 막을 수 없는 불법 통신 탐지

### 기능
- [[Packet|패킷]] 검사 -> 미리 설정한 정책 위반 접근 탐지 시 관리자에게 알림

### 단점
- 탐지만 O -> 수동 조치 필요
- 미리 설정한 정책 위반 접근만 탐지 -> 알려지지 않은 공격 대처 X
- 자동 차단 필요 -> [[IPS]] 로 발전

### 탐지 방식
- 오용 탐지(Misuse Detection) : 미리 입력해둔 공격 패턴 감지 시 알림
- [[이상(Anomaly)|이상]] 탐지(Anomaly Detection) : 평균 시스템 [[state|상태]] 기준 비정상 행위 · 자원 사용 감지 시 알림

### 종류
- HIDS(Host-Based Intrusion Detection) : 시스템 내부 감시 & 분석 중점
	- 내부 시스템 변화 실시간 감시 · 기록 · 추적
	- 종류 : OSSEC / md5deep / AIDE / Samhain
- NIDS(Network-Based Intrusion Detection System) : 외부 침입 감시 & 분석 중점
	- [[컴퓨터 네트워크|네트워크]] 트래픽 감시 -> [[서비스 거부]] 공격 · [[Port|포트]] 스캔 탐지
	- 종류 : Snort / Zeek

### 배치 위치
| 위치 | 탐지 범위 |
| --- | --- |
| [[Router\|라우터]] 앞 | 모든 공격 |
| [[Router\|라우터]] 뒤 | [[Router\|라우터]] [[패킷 필터링]] 통과분 |
| [[방화벽]] 뒤 | 내부 -> 외부 |
| 내부 [[컴퓨터 네트워크\|네트워크]] | 내부 -> 내부 |
| [[DMZ]] | 외부 인터넷에 서비스 제공하는 [[서버]] 위치 네트워크 |
