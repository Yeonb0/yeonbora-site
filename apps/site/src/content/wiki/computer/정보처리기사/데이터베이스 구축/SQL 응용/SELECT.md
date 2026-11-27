---
title: SELECT
aliases:
  - SELECT문
  - 검색문
  - SELECT(검색문)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/SELECT.md
created: 2026-09-15
---

- 테이블에서 조건 만족 [[튜플]] 검색 [[DML]] 명령문

### 일반 형식
```sql
SELECT [PREDICATE] [테이블명.]속성명 [AS 별칭][, [테이블명.]속성명, …]
[, 그룹함수(속성명) [AS 별칭]]
[, Window함수 OVER (PARTITION BY 속성명1, 속성명2, …
	            ORDER BY 속성명3, 속성명4, …)]
FROM 테이블명[, 테이블명, …]
[WHERE 조건]
[GROUP BY 속성명, 속성명, …]
[HAVING 조건]
[ORDER BY 속성명 [ASC | DESC]];
```

### 절
| 절 | 내용 |
| --- | --- |
| `SELECT` | 검색 [[속성]](열) or 속성 이용 수식 지정, all 속성 -> `*`, 2 테이블 [[이상(Anomaly)\|이상]] -> `테이블명.속성명` |
| `FROM` | 검색 [[데이터]] 포함 테이블명 기술 |
| `WHERE` | 검색 조건 기술 |
| `GROUP BY` | 특정 속성 기준 그룹화, 주로 [[그룹 함수]] 와 병행 |
| `HAVING` | `GROUP BY` 와 함께 사용, 그룹 조건 지정 |
| `ORDER BY` | 특정 속성 기준 정렬, `ASC` 오름차순(기본값) · `DESC` 내림차순 |

- `AS` : 속성 · [[연산]] [[이름]] -> 다른 제목 표시

### PREDICATE
- 불러올 튜플 수 제한 명령어

| 종류 | 내용 |
| --- | --- |
| `ALL` | all 튜플 검색, 주로 생략 |
| `DISTINCT` | 중복 튜플 有 -> 첫 번째 1개만 검색 |
| `DISTINCTROW` | 중복 튜플 제거 후 1개 검색, 선택 속성값 X 튜플 전체 대상 |

### 기본 검색
- ==ex)==
```sql
# <사원> 테이블 모든 튜플 검색
SELECT * FROM 사원;
# <사원> 테이블에서 '주소' 검색 -> 중복 X
SELECT DISTINCT 주소
FROM 사원;
# <사원> 테이블에서 '기본급'에 특별수당 10을 더한 월급 출력
SELECT 부서 + '부서의' AS 부서2, 이름 + '의 월급' AS 이름2, 기본급 + 10 AS 기본급2
FROM 사원;
```

### 조건 지정 검색
- `WHERE` 절 조건 지정 -> 조건 만족 튜플만 검색
- ==ex)==
```sql
# <사원> 테이블에서 '기획'부의 모든 튜플 검색
SELECT *
FROM 사원
WHERE 부서 = '기획';
# <사원> 테이블에서 성이 '김'인 사람의 튜플 검색
SELECT *
FROM 사원
WHERE 이름 LIKE "김%";
# <사원> 테이블에서 '생일'이 '01/01/69'에서 '12/31/73' 사이인 튜플 검색
SELECT *
FROM 사원
WHERE 생일 BETWEEN #01/01/69# AND #12/31/73#;
# <사원> 테이블에서 '주소'가 NULL인 튜플 검색
SELECT *
FROM 사원
WHERE 주소 IS NULL;
```

### 정렬 검색
- `ORDER BY` 절 특정 속성 지정 -> 자료 정렬 검색
- ==ex)==
```sql
# <사원> 테이블에서 '주소'를 기준으로 내림차순 정렬해 상위 2개 튜플만 검색
SELECT TOP 2 *
FROM 사원
ORDER BY 주소 DESC;
# <사원> 테이블에서 '부서' 기준 오름차순, 같은 '부서'면 '이름' 기준 내림차순
SELECT *
FROM 사원
ORDER BY 부서 ASC, 이름 DESC;
```

### 복수 테이블 검색
- 여러 테이블 대상 검색 -> [[JOIN]] 조건 `WHERE` 절 기술
- ==ex)==
```sql
# '경력'이 10년 이상인 사원의 '이름, '부서', '취미', '경력' 검색
SELECT 사원.이름, 사원.부서, 여가활동.취미, 여가활동.경력
FROM 사원, 여가활동
WHERE 여가활동.경력 >= 10 AND 사원.이름 = 여가활동.이름;
```

### 확장
- [[하위 질의]] / [[그룹 함수]] / [[WINDOW 함수]] / [[집합 연산자]]
