---
title: CPM
aliases:
  - Critical Path Method
  - 임계 경로 기법
  - CPM(Critical Path Method)
tags: []
field: computer
topic: se
course:
  - engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/소프트웨어 개발 방법론 활용/CPM.md
created: 2026-09-15
---

- 임계 경로 기법
- 프로젝트 완성 필요 작업 나열, 작업 필요 소요 기간 예측 시 사용

### 구조
![[소프트웨어-개발-방법론-활용-04.png]]

- 원 [[뉴런|노드]] : 각 작업. 작업 [[이름]] · 소요 시간 표시
- 박스 노드 : 이정표. 예상 완료 시간 표시

### 특징
- 각 작업 순서 · 의존 관계 · 동시 작업 수행 가능성 표현 O
- 경영층 과학적 의사 결정 지원 -> 효과적 프로젝트 통제 O
- 병행 작업 계획 O, 자원 할당 O
- 임계 경로 = 최장 경로 -> [[크리티컬 패스]]
