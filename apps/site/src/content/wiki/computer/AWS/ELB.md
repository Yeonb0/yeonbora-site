---
title: ELB
aliases:
  - Elastic Load Balancing
  - ELB(Elastic Load Balancing)
tags: []
field: computer
topic: aws
source: obsidian
sourcePath: AWS/ELB.md
created: 2026-08-06
---

- [[AWS]]가 제공하는 [[로드 밸런서]]
- [[클라이언트]] 요청을 어느 [[서버]] 가 처리할지 선택하는 [[부하 분산]] 서비스
- 수신 트래픽 -> [[이중화]] 시스템으로 분산
- 부하 분산 장치 ([[로드 밸런서]]) 이용

### 종류
- [[ALB]]
- [[NLB]]
- [[GLB]]

### 비용
- 사용 요금 + LCU 요금
	- LCU 요금 : Load Balanver Capacity Unit
	%% typo? : "Balanver" → "Balancer" %%