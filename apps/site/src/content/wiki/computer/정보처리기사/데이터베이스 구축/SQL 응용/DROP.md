---
title: DROP
aliases:
  - DROP문
  - 제거문
  - DROP(제거문)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/DROP.md
created: 2026-09-15
---

- [[스키마]] · [[도메인]] · 기본 테이블 · [[뷰]] 테이블 · [[인덱스]] · 제약 조건 제거 [[DDL]] 명령문

### 형식
```sql
DROP SCHEMA 스키마명 [CASCADE | RESTRICT];
DROP DOMAIN 도메인명 [CASCADE | RESTRICT];
DROP TABLE 테이블명 [CASCADE | RESTRICT];
DROP VIEW 뷰명 [CASCADE | RESTRICT];
DROP INDEX 인덱스명 [CASCADE | RESTRICT];
DROP CONSTRAINT 제약조건명;
```

### 옵션
| 옵션 | 내용 |
| --- | --- |
| `CASCADE` | 제거 요소 참조 all 개체 함께 제거 |
| `RESTRICT` | 다른 개체가 제거 요소 참조 中 -> 제거 취소 |

- 테이블 구조까지 제거 -> [[DELETE]] 와의 차이점
- ==ex)==
```sql
DROP TABLE 학생 CASCADE
```
