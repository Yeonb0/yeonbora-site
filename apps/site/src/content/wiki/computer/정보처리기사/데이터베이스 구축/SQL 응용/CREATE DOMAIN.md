---
title: CREATE DOMAIN
aliases:
  - 도메인 정의
  - CREATE DOMAIN(도메인 정의)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/CREATE DOMAIN.md
created: 2026-09-15
---

- [[도메인]] 정의 [[DDL]] 명령문
- 임의 [[속성]] 취할 값 범위 = [[SQL]] 전체 [[데이터 타입]] 中 일부분일 때 사용

### 형식
```sql
CREATE DOMAIN 도메인명 [AS] 데이터_타입
	[DEFAULT 기본값]
	[CONSTRAINT 제약조건명 CHECK (범위값)];
```

- 데이터_타입 : SQL 지원 데이터 타입
- 기본값 : [[데이터]] 미입력 시 자동 입력 값
- ==ex)==
```sql
CREATE DOMAIN SEX CHAR(1)
	DEFAULT '남'
	CONSTRAINT VALID-SEX CHECK(VALUE IN ('남', '여'));
```
