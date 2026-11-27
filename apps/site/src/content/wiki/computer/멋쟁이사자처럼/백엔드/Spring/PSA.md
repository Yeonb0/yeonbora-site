---
title: PSA
aliases:
  - Portable Service Abstraction
tags: []
field: computer
topic: spring
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/백엔드/Spring/PSA.md
created: 2026-07-30
---
- 다양한 기술을 일관된 방식으로 처리하도록 [[추상화]]

```java
@Transactional
public void order() {
    System.out.println("주문하기");
}
```