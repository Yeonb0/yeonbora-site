---
title: ACID
aliases:
  - 트랜잭션의 특성
  - ACID(트랜잭션의 특성)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/물리 데이터베이스 설계/ACID.md
created: 2026-09-15
---

- [[트랜잭션]] 이 보장해야 할 ==4가지== 특성

| 특성 | 내용 |
| --- | --- |
| Atomicity ==원자성== | Commit or Rollback 中 1, 중간 [[Error\|오류]] 발생 -> 트랜잭션 전부 취소 |
| Consistency ==일관성== | 완료 시 일관성 있는 [[데이터베이스\|DB]] [[state\|상태]]로 변환, 시스템 고정 요소 -> 수행 전 / 후 = |
| Isolation ==독립성 · 격리성 · 순차성== | 2개 [[이상(Anomaly)\|이상]] 트랜잭션 병렬 수행 시 끼어들기 X, 수행 中 이면 완료까지 다른 곳에서 참조 X |
| Durability ==영속성 · 지속성== | 완료된 결과 -> 시스템 고장나도 영구적 반영 |

### 제어 명령어
- [[DCL]] 로 제어
- [[COMMIT]] : 성공 종료 -> all 내용 [[데이터베이스|DB]] 반영
- [[ROLLBACK]] : 미 COMMIT 변경 취소 -> 이전 [[state|상태]] 복귀
- [[SAVEPOINT]] : 트랜잭션 내 ROLLBACK 위치 저장점 지정
