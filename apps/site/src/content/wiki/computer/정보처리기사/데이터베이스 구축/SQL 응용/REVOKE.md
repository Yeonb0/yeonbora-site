---
title: REVOKE
aliases:
  - 권한 취소
  - REVOKE(권한 취소)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/REVOKE.md
created: 2026-09-15
---

- [[데이터베이스|DB]] 관리자 -> 사용자 권한 취소 [[DCL]] 명령어

### 형식
```sql
REVOKE 사용자등급 FROM 사용자_ID_리스트;
REVOKE [GRANT OPTION FOR] 권한_리스트 ON 개체 FROM 사용자 [CASCADE];
```

- `GRANT OPTION FOR` : 다른 사용자 권한 부여 가능 권한만 취소
- `CASCADE` : 다른 사용자에게 부여한 권한도 연쇄 취소
- 부여 -> [[GRANT]]
- ==ex)==
```sql
REVOKE GRANT OPTION FOR UPDATE ON 고객 FROM STAR;
```
