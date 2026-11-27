---
title: INSERT
aliases:
  - INSERT INTO
  - 삽입문
  - INSERT(삽입문)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/SQL 응용/INSERT.md
created: 2026-09-15
---

- 기본 테이블 new [[튜플]] 삽입 [[DML]] 명령문

### 형식
```sql
INSERT INTO 테이블명([속성명1, 속성명2, …])
VALUES (데이터1, 데이터2, …);
```

### 조건
- 대응 [[속성]] - [[데이터]] : 개수 & 데이터 유형 일치
- 기본 테이블 all 속성 사용 -> 속성명 생략 O
- [[SELECT]] 문 사용 -> 다른 테이블 검색 결과 삽입 O
- ==ex)==
```sql
INSERT INTO 사용(이름, 부서) VALUES ('홍승현', '인터넷');

INSERT INTO 사원 VALUES ('장보고', '기획', '05/03/73', '홍제동', 90);

INSERT INTO 편집부원(이름, 생일, 주소, 기본급)
SELECT 이름, 생일, 주소, 기본급
FROM 사원
WHERE 부서 = '편집';
```
