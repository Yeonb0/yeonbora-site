---
title: CREATE INDEX
aliases:
  - 인덱스 정의
  - CREATE INDEX(인덱스 정의)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/CREATE INDEX.md
created: 2026-09-15
---

- [[인덱스]] 정의 [[DDL]] 명령문

### 형식
```sql
CREATE [UNIQUE] INDEX 인덱스명
ON 테이블명(속성명 [ASC | DESC] [, 속성명 [ASC | DESC]])
[CLUSTER];
```

### 옵션
| 옵션 | 내용 |
| --- | --- |
| `UNIQUE` 사용 | 중복 값 없는 [[속성]] 으로 인덱스 생성 |
| `UNIQUE` 생략 | 중복 값 허용 속성으로 인덱스 생성 |
| `ASC` | 오름차순 정렬, 생략 시 기본값 |
| `DESC` | 내림차순 정렬 |
| `CLUSTER` | 클러스티드 인덱스로 설정 |

- ==ex)==
```sql
CREATE UNIQUE INDEX 고객번호_IDX
ON 고객(고객번호 DESC);
```
