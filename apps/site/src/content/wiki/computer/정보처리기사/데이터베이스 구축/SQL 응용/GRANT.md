---
title: GRANT
aliases:
  - 권한 부여
  - GRANT(권한 부여)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/GRANT.md
created: 2026-09-15
---

- [[데이터베이스|DB]] 관리자 -> 사용자 권한 부여 [[DCL]] 명령어

### 형식
```sql
GRANT 사용자등급 TO 사용자_ID_리스트 [IDENTIFIED BY 암호];
GRANT 권한_리스트 ON 개체 TO 사용자 [WITH GRANT OPTION];
```

- 권한 종류 : `ALL`, `SELECT`, `INSERT`, `DELETE`, `UPDATE`, `ALTER` 등
- `WITH GRANT OPTION` : 부여받은 권한 다른 사용자 재부여 권한까지 부여
- 취소 -> [[REVOKE]]
- ==ex)==
```sql
GRANT RESOURCE TO NABI;
GRANT CONNECT TO START;
GRANT ALL ON 고객 TO NABI WITH GRANT OPTION;
```
