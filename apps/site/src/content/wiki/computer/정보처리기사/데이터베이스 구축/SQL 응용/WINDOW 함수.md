---
title: WINDOW 함수
aliases:
  - Window Function
  - 윈도우 함수
  - WINDOW 함수(Window Function)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/WINDOW 함수.md
created: 2026-09-15
---

- `GROUP BY` 절 이용 X -> [[함수]] 인수 지정 [[속성]] 범위로 속성 값 집계
- WINDOW = 함수 인수 지정 속성 레코드 범위

### 형식
- `PARTITION BY` : WINDOW 함수 적용 범위 속성 지정
- `ORDER BY` : PARTITION 내부 정렬 기준 속성 지정

### 종류
| 함수 | 내용 |
| --- | --- |
| `ROW_NUMBER()` | 윈도우 별 각 레코드 [[Sequence Number\|일련 번호]] 반환 |
| `RANK()` | 윈도우 별 순위 반환, 공동 순위 반영 |
| `DENSE_RANK()` | 윈도우 별 순위 반환, 공동 순위 무시 후 순위 부여 |

- ==ex)==
```sql
# <상여금> 테이블에서 '상여내역'별로 '상여금'에 대한 일련 번호 구하기 (내림차순, 속성명 'NO')
SELECT 상여내역, 상여금,
	ROW_NUMBER() OVER (PARTITION BY 상여내역 ORDER BY 상여금 DESC) AS NO
FROM 상여금;
# <상여금> 테이블에서 '상여내역' 별로 '상여금'에 대한 순위 구하기 (내림차순)
SELECT 상여내역, 상여금,
	RANK() OVER (PARTITION BY 상여내역 ORDER BY 상여금 DESC) AS 상여금순위
FROM 상여금;
```
