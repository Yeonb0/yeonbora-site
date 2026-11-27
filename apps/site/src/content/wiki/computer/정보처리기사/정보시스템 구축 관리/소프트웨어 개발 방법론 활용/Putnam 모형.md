---
title: Putnam 모형
aliases:
  - Putnam
  - 퍼트남 모형
  - Putnam 모형(Putnam Model)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/소프트웨어 개발 방법론 활용/Putnam 모형.md
created: 2026-09-15
---

- [[소프트웨어 생명 주기]] all 과정 동안 사용될 노력 분포 가정
- Putnam 제안, [[생명 주기]] 예측 모형
- Rayleigh-Norden 곡선의 노력 분포도 기초

![[소프트웨어-개발-방법론-활용-02.png]]

### 특징
- 대형 프로젝트 노력 분포 산정 이용
- 개발 기간 ↑ -> 프로젝트 적용 인원 노력 ↓

$$
\text{개발\ 노력(MM)} = \frac{L^3}{{C_k}^3 \times {Td}^4}
$$

- $L$ : 원시 코드 라인 수
- $Td$ : 개발 기간
- $C_k$ : 환경 [[상수]] (==빈약 환경 = 2,000== / ==좋은 환경 = 8,000== / ==최적 환경 = 12,000==)
