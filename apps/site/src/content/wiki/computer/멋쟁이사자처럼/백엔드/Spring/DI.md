---
title: DI
aliases:
  - Dependency Injection
  - 의존성 주입
tags: []
field: computer
topic: spring
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/백엔드/Spring/DI.md
created: 2026-07-30
---
- [[객체]]가 필요로 하는 의존성을 [[스프링 컨테이너]]가 자동으로 주입
```java
public class A {
		
		@Autowired
		B b; // A에서 B를 주입받음
}
```