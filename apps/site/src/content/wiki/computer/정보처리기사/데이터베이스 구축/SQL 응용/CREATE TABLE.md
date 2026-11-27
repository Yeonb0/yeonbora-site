---
title: CREATE TABLE
aliases:
  - 테이블 정의
  - CREATE TABLE(테이블 정의)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/CREATE TABLE.md
created: 2026-09-15
---

- 테이블 정의 [[DDL]] 명령문
- 포함 all [[속성]] -> 속성명 & [[데이터 타입]] & 기본값 & NOT NULL 여부 지정

### 형식
```sql
CREATE TABLE 테이블명
	(속성명 데이터_타입 [DEFAULT 기본값] [NOT NULL], …
	[, PRIMARY KEY(기본키_속성명, …)]
	[, UNIQUE(대체키_속성명, …)]
	[, FOREIGN KEY(외래키_속성명, …)]
		[REFERENCES 참조테이블(기본키_속성명, …)]
		[ON DELETE 옵션]
		[ON UPDATE 옵션]
	[, CONSTRAINT 제약조건명] [CHECK (조건식)];
```

### 옵션
| 옵션 | 내용 |
| --- | --- |
| `PRIMARY KEY` | [[기본키]] 사용 속성 or 속성 집합 지정 |
| `UNIQUE` | [[대체키]] 사용 속성 or 속성 집합 지정, 중복 값 X |
| `FOREIGN KEY` ~ `REFERENCES` ~ | 참조 테이블 & [[외래키]] 속성 지정 |
| `CONSTRAINT` | 제약 조건 [[이름]] 지정, 이름 불필요 -> `CHECK` 절만 사용 |
| `CHECK` | 속성값 제약 조건 정의 |

- 외래키 지정 -> [[무결성|참조 무결성]] CASCADE 법칙 적용

### 참조 동작 옵션
- `ON DELETE` : 참조 테이블 [[튜플]] 삭제 시 기본 테이블 조치
- `ON UPDATE` : 참조 테이블 참조 속성 값 변경 시 기본 테이블 조치

| 옵션 | 내용 |
| --- | --- |
| `NO ACTION` | 참조 테이블 변화 O -> 기본 테이블 조취 X |
| `CASCADE` | 참조 테이블 튜플 변화 · 삭제 -> 기본 테이블 관련 튜플 변화 · 삭제 |
| `SET NULL` | 참조 테이블 변화 -> 기본 테이블 관련 튜플 속성값 NULL 변경 |
| `SET DEFAULT` | 참조 테이블 변화 -> 기본 테이블 관련 튜플 속성값 DEFAULT 변경 |

- ==ex)==
```sql
CREATE TABLE 학생
	(이름 VARCHAR(15) NOT NULL,
	학번 CHAR(8),
	전공 CHAR(5),
	성별 SEX,
	생년월일 DATE,
	PRIMARY KEY(학번),
	FOREIGN KEY(전공) REFERENCES 학과(학과코드)
		ON DELETE SET NULL
		ON UPDATE CASCADE,
	CONSTRAINT 생년월일제약
		CHECK(생년월일 >= '1980-01-01'));
```
