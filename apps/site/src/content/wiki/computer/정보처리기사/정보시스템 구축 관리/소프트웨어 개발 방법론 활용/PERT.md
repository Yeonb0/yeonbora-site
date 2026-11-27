---
title: PERT
aliases:
  - Program Evaluation and Review Technique
  - 프로그램 평가 · 검토 기술
  - PERT(Program Evaluation and Review Technique)
tags: []
field: computer
topic: engineer-cert
source: obsidian
sourcePath: 정보처리기사/정보시스템 구축 관리/소프트웨어 개발 방법론 활용/PERT.md
created: 2026-09-15
---

- 프로그램 평가 · 검토 기술
- 프로젝트 필요 전체 작업 상호 관계 표시 [[컴퓨터 네트워크|네트워크]]
	- 낙관적 경우 / 가능성 있는 경우 / 비관적 경우 나눠 각 단계별 종료 시기 결정
- 과거 경험 X, 소요 기간 예측 難 [[소프트웨어]] 사용

### 구조
- [[뉴런|노드]] · 간선 구성

![[소프트웨어-개발-방법론-활용-03.png]]

- 원 : 작업
- 간선(화살표) : 낙관치, 기대치, 비관치

### 특징
- 결정 경로 · 작업 경계 시간 · 작업 상호 관련성 파악 O

### 공식

$$
작업\ 예측치 = \frac {낙관치 + 기대치\times4 + 비관치}{6}
$$

$$
평방\ 편차 = [\frac{(비관치 - 낙관치)}{6}]^2
$$
