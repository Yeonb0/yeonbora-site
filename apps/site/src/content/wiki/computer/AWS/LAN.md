---
title: LAN
aliases:
  - Local Area Network
  - LAN(Local Area Network)
  - 근거리 통신망
tags: []
field: computer
topic: aws
source: obsidian
sourcePath: AWS/LAN.md
created: 2026-08-06
---

- 사설 [[컴퓨터 네트워크|네트워크]]
- 입구에 [[게이트웨이]]로 [[Router|라우터]] 존재 -> [[데이터]] 막거나 통과
- [[Subnetting|서브넷]] : LAN 안을 세세하게 나누는 범위
- [[IP 주소]] : 출발지 / 목적지 표시
	- [[IPv4 Class]]
	- 할당 -> [[DHCP]]
	- 사설 <-> 공용 변환 -> [[NAT]]/[[Port Forwarding|NAPT]]
- [[방화벽]] : 수상한 데이터 걸러냄
- 좁은 범위에 구축된 네트워크
	- ==ex)== 기업 내부 네트워크
- 인터넷 ↔ 내부 네트워크 분리 -> [[DMZ]]
- ↔ [[WAN]]

### 근거리 통신망
- 비교적 가까운 거리 연결 -> 주로 자원 공유
- 거리 짧음, 전송 속도 ↑, 에러 발생 ↓
- 버스형 or 링형 구조 -> [[네트워크 설치 구조]]
- 물리적 [[배치 처리|배치]]와 무관하게 논리적 분리 -> [[VLAN]]
