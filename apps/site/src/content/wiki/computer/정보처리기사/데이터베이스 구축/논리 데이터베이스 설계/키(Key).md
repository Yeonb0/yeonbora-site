---
title: 키(Key)
aliases:
  - Key
  - 키
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/논리 데이터베이스 설계/키(Key).md
created: 2026-09-15
---

- [[데이터베이스|DB]] 에서 [[튜플]] 검색 · 구분 기준 [[속성]]
- [[릴레이션]] 제약 조건의 축

### 종류
| 키 | 내용 |
| --- | --- |
| [[후보키]] (Candidate Key) | [[기본키]] 로 사용 가능한 속성, 유일성 + 최소성 |
| [[기본키]] (Primary Key) | 후보키 中 선정 주 키, NULL X |
| [[대체키]] (Alternate Key) | 기본키 제외 나머지 후보키 |
| [[슈퍼키]] (Super Key) | 유일성 O, 최소성 X |
| [[외래키]] (Foreign Key) | 다른 릴레이션 기본키 참조 |
