---
title: SAVEPOINT
aliases:
  - 저장점
  - SAVEPOINT(저장점)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/SAVEPOINT.md
created: 2026-09-15
---

- [[트랜잭션]] 내 [[ROLLBACK]] 할 위치인 저장점 지정

### 형식
```sql
SAVEPOINT 저장점_이름;
```

- ==ex)==
```sql
SAVEPOINT S1;
ROLLBACK TO S1;
```
