---
title: CREATE VIEW
aliases:
  - 뷰 정의
  - CREATE VIEW(뷰 정의)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/CREATE VIEW.md
created: 2026-09-15
---

- [[뷰]] 정의 [[DDL]] 명령문

### 형식
```sql
CREATE VIEW 뷰명[(속성명[, 속성명, …])]
AS SELECT문;
```

### 특징
- [[SELECT]] 문 서브 쿼리 사용 -> `SELECT` 결과로서 뷰 생성
- `SELECT` 문에 `UNION` · `ORDER BY` 절 사용 X
- 속성명 미기술 -> `SELECT` 문 속성명 자동 사용
- ==ex)==
```sql
CREATE VIEW 안산고객(성명, 전화번호)
AS SELECT 성명, 전화번호
FROM 고객
WHERE 주소 = '안산시';
```
