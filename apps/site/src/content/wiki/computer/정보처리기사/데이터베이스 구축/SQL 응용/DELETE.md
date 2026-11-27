---
title: DELETE
aliases:
  - DELETE FROM
  - 튜플 삭제문
  - DELETE(튜플 삭제문)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/DELETE.md
created: 2026-09-15
---

- 기본 테이블 [[튜플]] 中 특정 튜플(행) 삭제 [[DML]] 명령문

### 형식
```sql
DELETE
FROM 테이블명
[WHERE 조건];
```

### 특징
- all 레코드 삭제 -> `WHERE` 절 생략
- all 레코드 삭제해도 테이블 구조 잔존 -> [[DROP]] 과의 차이점
- ==ex)==
```sql
DELETE 
FROM 사원
WHERE 이름 = '임꺽정';

DELETE
FROM 사원
WHERE 부서 = '인터넷';

DELETE
FROM 사원;
```
