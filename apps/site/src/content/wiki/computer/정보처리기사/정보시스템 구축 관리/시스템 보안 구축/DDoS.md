---
title: DDoS
aliases:
  - 분산 서비스 거부
  - Distributed Denial of Service
  - DDoS(분산 서비스 거부)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/시스템 보안 구축/DDoS.md
created: 2026-09-15
---

- 여러 곳 분산 공격 지점에서 한 [[서버]] 로 수행하는 [[서비스 거부]] 공격

### 구조
- 에이전트(Agent) : [[컴퓨터 네트워크|네트워크]] 취약 호스트 [[Searching|탐색]] & 공격용 툴 설치 결과물
- 핸들러(Handler) : 에이전트 관리 프로그램
- 마스터(Master) : 핸들러 설치 -> 에이전트 관리 주체

### 절차
1. 취약 호스트 탐색
2. 공격용 툴 설치 -> 에이전트 생성
3. 핸들러 프로그램 설치 -> 마스터 구성
4. 표적 [[서버]] 동시 공격
