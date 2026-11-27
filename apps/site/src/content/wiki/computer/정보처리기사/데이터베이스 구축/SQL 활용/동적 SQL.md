---
title: 동적 SQL
aliases:
  - Dynamic SQL
  - 동적 SQL(Dynamic SQL)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 활용/동적 SQL.md
created: 2026-09-15
---

- 사용자가 응용 프로그램 실행 -> 입력란에 [[SQL]] 직접 입력해 결과 확인
- 개발 언어 삽입 SQL 코드 [[String|문자열]] [[변수]]에 넣어 처리
- 조건에 따라 SQL 구문 동적 변경 처리 O
- SQL문 일부 or 전부 입력 받아 실행 O
- 속도 ↓, 유연성 ↑

### 정적 SQL 과 비교
|  | [[정적 SQL]] | 동적 SQL |
| --- | --- | --- |
| SQL 구성 | [[커서\|커서(Cursor)]] 를 통한 정적 처리 | 문자열 변수에 담아 동적 처리 |
| 개발 패턴 | 커서 범위 안에서 [[반복문]] 활용 -> SQL 작성 | NVL [[함수]] 없이 로직 통해 SQL 작성 |
| 실행 속도 | 빠름 | 느림 |
| 사전 검사 | O | X |
