---
title: UPDATE
aliases:
  - UPDATE SET
  - 갱신문
  - UPDATE(갱신문)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/UPDATE.md
created: 2026-09-15
---

- 기본 테이블 [[튜플]] 中 특정 튜플 내용 변경 [[DML]] 명령문

### 형식
```sql
UPDATE 테이블명
SET 속성명 = 데이터[, 속성명 = 데이터, …]
[WHERE 조건];
```

- ==ex)==
```sql
UPDATE 사원
SET 주소 = '수색동'
WHERE 이름 = '홍길동';

UPDATE 사원
SET 부서 = '기획', 기본급 = 기본급 + 5
WHERE 이름 = '황진이';
```
