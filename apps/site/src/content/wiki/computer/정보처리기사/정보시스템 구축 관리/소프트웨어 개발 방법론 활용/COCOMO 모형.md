---
title: COCOMO 모형
aliases:
  - COCOMO
  - Constructive Cost Model
  - COCOMO 모형(Constructive Cost Model)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/소프트웨어 개발 방법론 활용/COCOMO 모형.md
created: 2026-09-15
---

- 보헴(Boehm) 제안, 원시 프로그램 규모 [[LOC 기법|LOC]] 의한 비용 산정 기법
- 개발 [[소프트웨어]] 규모(LOC) 예측 -> 소프트웨어 종류 따라 다른 비용 산정 방정식 대입해 비용 산정
- 중소 규모 소프트웨어 프로젝트 비용 추정 적합
- 비용 산정 결과 -> 프로젝트 완성 필요 노력(Man-Month) 로 표현

### 종류
- 조직형(Organic Mode)
	- 기관 내부 개발 중 · 소 규모 소프트웨어
	- 일괄 자료 처리, 과학 기술 계산, 비즈니스 자료 처리용
	- ==5만 라인 이하== 소프트웨어 개발

$$
\text{노력 (MM)} = 2.4 \times \text{(KDSI)}^{1.05}
\\ \text{개발\ 기간(TDEV)} = 2.5 \times (\text{MM})^{0.38}
$$

- 반분리형(Semi-Detached Mode)
	- 조직형 · 내장형 중간형
	- [[트랜잭션]] 처리 시스템, [[운영체제]], [[DBMS]] 용
	- ==30만 라인 이하== 소프트웨어 개발

$$
\text{노력 (MM)} = 3.0 \times \text{(KDSI)}^{1.12}
\\ \text{개발\ 기간(TDEV)} = 2.5 \times (\text{MM})^{0.35}
$$

- 내장형(Embedded Mode)
	- 초대형 규모 트랜잭션 처리 시스템, 운영체제
	- ==30만 라인 [[이상(Anomaly)|이상]]== 소프트웨어 개발

$$
\text{노력 (MM)} = 3.6 \times \text{(KDSI)}^{1.20}
\\ \text{개발\ 기간(TDEV)} = 2.5 \times (\text{MM})^{0.32}
$$

- KDSI(Kilo Delivered Source Instruction) : 전체 라인 수 ==1,000 라인== 단위로 묶은 것
