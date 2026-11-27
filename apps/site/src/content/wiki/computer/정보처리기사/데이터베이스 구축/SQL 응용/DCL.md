---
title: DCL
aliases:
  - Data Control Language
  - 데이터 제어어
  - DCL(Data Control Language)
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/DCL.md
created: 2026-09-15
---

- [[SQL]] 中 [[데이터베이스 보안|보안]] · [[무결성]] · 회복 · [[병행 제어]] 제어 정의
- 사용 주체 : [[데이터베이스|DB]] 관리자

### 명령어
| 명령어 | 내용 |
| --- | --- |
| [[COMMIT]] | 수행 결과 실제 물리적 디스크 저장 + 완료 관리자 통보 |
| [[ROLLBACK]] | DB 조작 비정상 종료 시 원상태 복구 |
| [[GRANT]] | DB 사용자 사용 권한 부여 |
| [[REVOKE]] | DB 사용자 사용 권한 취소 |

- 권한 부여 · 취소 -> [[접근 통제]] 수단
