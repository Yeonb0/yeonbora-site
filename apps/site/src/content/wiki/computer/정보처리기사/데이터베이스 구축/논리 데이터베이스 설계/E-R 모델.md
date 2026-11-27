---
title: E-R 모델
aliases:
  - Entity-Relationship Model
  - 개체-관계 모델
  - E-R 다이어그램
tags: []
field: computer
topic: database
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/데이터베이스 구축/논리 데이터베이스 설계/E-R 모델.md
created: 2026-09-15
---

- Entity-[[연관성|Relationship]], 개체 - 관계 모델
- 개념적 [[데이터 모델]] -> [[데이터베이스 설계]] 의 개념적 설계 단계 제작
- ==1976== 피터 첸 제안, 특정 [[데이터베이스 관리 시스템|DBMS]] 고려 X

### 표기
- E-R [[다이어그램]] = E-R 모델 시각적 표현
- [[개체]] (Entity) : 사각형
	![[논리-데이터베이스-설계-01.png]]
- 관계 (Relationship) : 마름모
	![[논리-데이터베이스-설계-02.png]]
- [[속성]] (Attribute) : 타원
	![[논리-데이터베이스-설계-03.png]]
- 다중값 속성 (복합 속성) : 이중 타원
	![[논리-데이터베이스-설계-04.png]]
- [[기본키]] 속성 : 밑줄 타원
	![[논리-데이터베이스-설계-05.png]]
- 복합 속성 : 복수 타원
	- ==ex)== 성명 -> 성, [[이름]] 구성
	![[논리-데이터베이스-설계-06.png]]
- 개체 간 관계 : 1 : 1, 1 : N, N : M
	![[논리-데이터베이스-설계-07.png]]
- 개체 - 속성 연결 : 선, 링크

### 참고
- [[ER Diagram]] : [[Mermaid]] 표기법
