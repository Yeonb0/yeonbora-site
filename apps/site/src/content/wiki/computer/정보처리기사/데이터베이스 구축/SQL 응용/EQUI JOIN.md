---
title: EQUI JOIN
aliases:
  - 동등 조인
  - EQUI JOIN(동등 조인)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/EQUI JOIN.md
created: 2026-09-15
---

- 공통 [[속성]] 기준 `=` 비교 -> 같은 값 갖는 행 연결 [[INNER JOIN]]
- JOIN 속성 : EQUI JOIN 연결 고리 공통 속성
- [[NATURAL JOIN]] : 중복 속성 제거 -> 같은 속성 1회만 표기

### 형태
- `WHERE` 절 이용
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1, 테이블명2, …
WHERE 테이블명1.속성명 = 테이블명2.속성명;
```
- `NATURAL JOIN` 절 이용
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명 1 NATURAL JOIN 테이블명2;
```
- `JOIN ~ USING` 절 이용
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1 JOIN 테이블명2 USING(속성명);
```

- ==ex)==
```sql
# <학생> 테이블과 <학과> 테이블에서 '학과코드' 값이 같은 튜플 JOIN
SELECT 학번, 이름, 학생.학과코드, 학과명
FROM 학생, 학과
WHERE 학생.학과토드 = 학과.학과코드;

SELECT 학번, 이름, 학생.학과코드, 학과명
FROM 학생 NATURAL JOIN 학과;

SELECT 학번, 이름, 학생.학과코드, 학과명
FROM 학생 JOIN 학과 USING(학과코드);
```
