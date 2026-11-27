---
title: SAN
aliases:
  - Storage Area Network
  - SAN(Storage Area Network)
  - Storage Area Network(SAN)
tags: []
field: computer
topic: server
source: obsidian
sourcePath: 서버 구조와 기술/SAN.md
created: 2026-08-06
---

- 스토리지 전용 [[컴퓨터 네트워크|네트워크]] 경유해서 접속하는 스토리지
- 전용 네트워크 구성 -> [[서버]] 간 이용
- [[파일 서버]] 구현 방식 중 하나
- [[DAS]] 빠른 처리 + [[NAS]] 파일 공유 혼합
- 광 채널 이용 네트워크 구성

### 장점
- 속도 빠름
- 저장 장치 · [[백업]] 장비 단일화
- 확장성 · 유연성 · 가용성 ↑

### 단점
- 전용 [[스위칭|스위치]] · 케이블 필요
- 고도의 전문 지식 필요
- 장비 업그레이드 필요
- 초기 설치 비용 ↑

### 프로토콜
- FC (파이버 채널)
- FCoE (FC over [[Ethernet]])
- ISCSI

### 관련
- [[스토리지]] 연결 방식 중 하나
