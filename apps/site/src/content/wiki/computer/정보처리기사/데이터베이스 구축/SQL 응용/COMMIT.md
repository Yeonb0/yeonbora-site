---
title: COMMIT
aliases:
  - 커밋
  - COMMIT(커밋)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/COMMIT.md
created: 2026-09-15
---

- [[트랜잭션]] 성공 종료 -> all 내용 [[데이터베이스|DB]] 반영 [[DCL]] 명령어
- 반영 목적 = new 일관성([[ACID|Consistency]]) [[state|상태]] 확보

### 특징
- [[DML]] 문 성공 완료 -> 자동 COMMIT
- DML 문 실패 -> 자동 [[ROLLBACK]]
	- 위 둘 = Auto Commit 기능
