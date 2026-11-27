---
title: SELF JOIN
aliases:
  - 자체 조인
  - SELF JOIN(자체 조인)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/SELF JOIN.md
created: 2026-09-15
---

- 같은 테이블 2개 [[속성]] 연결 -> [[EQUI JOIN]] 수행
- 별칭 2개 부여 -> 서로 다른 테이블처럼 취급

### 형식
```sql
SELECT [별칭1.]속성명, [별칭1.]속성명, …
FROM 테이블명1 [AS] 별칭1 JOIN 테이블명1 [AS] 별칭2
ON 별칭1.속성명 = 별칭2.속성명;

SELECT [별칭1.]속성명, [별칭1.]속성명, …
FROM 테이블명1 [AS] 별칭1 JOIN 테이블명1 [AS] 별칭2
WHERE 별칭1.속성명 = 별칭2.속성명;
```
