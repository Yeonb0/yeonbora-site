---
title: OUTER JOIN
aliases:
  - 외부 조인
  - OUTER JOIN(외부 조인)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/OUTER JOIN.md
created: 2026-09-15
---

- [[릴레이션]] 中 [[JOIN]] 조건 미만족 [[튜플]] 도 결과 출력

### LEFT OUTER JOIN
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1 LEFT OUTER JOIN 테이블명2
ON 테이블명1.속성명 = 테이블명2.속성명;

SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1, 테이블명2
WHERE 테이블명1.속성명 = 테이블명2.속성명(+);
```
![[SQL-응용-01.png]]

### RIGHT OUTER JOIN
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1 RIGHT OUTER JOIN 테이블명2
ON 테이블명1.속성명 = 테이블명2.속성명;
	
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1, 테이블명2
WHERE 테이블명1.속성명(+) = 테이블명2.속성명;
```
![[SQL-응용-02.png]]

### FULL OUTER JOIN
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1 FULL OUTER JOIN 테이블명2
ON 테이블명1.속성명 = 테이블명2.속성명;
```
![[SQL-응용-03.png]]
