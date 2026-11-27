---
title: CREATE SCHEMA
aliases:
  - 스키마 정의
  - CREATE SCHEMA(스키마 정의)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/CREATE SCHEMA.md
created: 2026-09-15
---

- [[스키마]] 정의 [[DDL]] 명령문

### 형식
```sql
CREATE SCHEMA 스키마명 AUTHORIZATION 사용자_ID;
```

- `AUTHORIZATION` : 스키마 소유 사용자_ID 명시
- ==ex)==
```sql
CREATE SCHEMA 대학교 AUTHORIZATION 홍길동;
```
