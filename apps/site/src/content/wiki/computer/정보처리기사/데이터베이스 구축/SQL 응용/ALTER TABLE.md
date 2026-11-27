---
title: ALTER TABLE
aliases:
  - 테이블 정의 변경
  - ALTER TABLE(테이블 정의 변경)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/ALTER TABLE.md
created: 2026-09-15
---

- 테이블 정의 변경 [[DDL]] 명령문

### 형식
```sql
ALTER TABLE 테이블명 ADD 속성명 데이터_타입 [DEFAULT '기본값'];
ALTER TABLE 테이블명 ALTER 속성명 [SET DEFAULT '기본값'];
ALTER TABLE 테이블명 DROP COLUMN 속성명 [CASCADE];
```

### 옵션
| 옵션 | 내용 |
| --- | --- |
| `ADD` | new [[속성]](열) 추가 |
| `ALTER` | 특정 속성 Default 값 변경 |
| `DROP COLUMN` | 특정 속성 삭제 |

- ==ex)==
```sql
ALTER TABLE 학생 ADD 학년 VARCHAR(3);
ALTER TABLE 학생 ALTER 학번 VARCHAR(10) NOT NULL;
```
