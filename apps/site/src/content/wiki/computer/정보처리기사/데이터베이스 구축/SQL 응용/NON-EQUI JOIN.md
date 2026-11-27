---
title: NON-EQUI JOIN
aliases:
  - 비동등 조인
  - NON-EQUI JOIN(비동등 조인)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/NON-EQUI JOIN.md
created: 2026-09-15
---

- [[JOIN]] 조건에 `>`, `<`, `>=`, `<=` [[연산]] 자 사용하는 [[INNER JOIN]]

### 형식
```sql
SELECT [테이블명1.]속성명, [테이블명2.]속성명, …
FROM 테이블명1, 테이블명2
WHERE (NON-EQUI JOIN 조건);
```

- ==ex)==
```sql
# <학생> 테이블과 <성적등급> 테이블 JOIN 해 각 학생의 '학번', '이름', '성적', '등급' 출력
SELECT 학번, 이름, 성적, 등급
FROM 학생, 성적등급
WHERE 학생.성적 BETWEEN 성적등급.최저 AND 성적등급.최고;
```
