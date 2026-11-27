---
title: Deep Access
aliases:
  - 깊은 접근
  - 깊은 접근(Deep Access)
tags: []
field: computer
topic: programming-language
source: obsidian
sourcePath: 프로그래밍 언어/Deep Access.md
created: 2026-08-01
---

- [[Dynamic Scope]] 언어의 nonlocal 참조 구현 방식
- 현재 active 한 다른 subprogram 의 선언 [[Searching|탐색]] -> 가장 최근 activated 된 것부터
	- [[Activation Record|dynamic chain]] 따라감

### 특징
- 탐색 chain 길이 [[컴파일|compile]] 시점 결정 X -> [[Static Scope]] 언어보다 느림
- record 에 [[변수]]의 [[이름]](name) 저장 필요

![[Implementing-Subprograms-08.png]]
