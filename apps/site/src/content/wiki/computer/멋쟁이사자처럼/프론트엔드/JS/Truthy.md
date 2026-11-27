---
title: Truthy
aliases:
  - Truthy
  - truthy
tags: []
field: computer
topic: likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/JS/Truthy.md
created: 2026-07-30
---


- [[boolean]] 으로 평가되는 상황에서 `true`로 취급되는 값
- [[Falsy]]를 제외한 모든 값이 [[Truthy]]

```js
// truthy
if (true)
if ({})
if ([])
if (42)
if ("0")
if ("false")
if (new Date())
if (-42)
if (12n)
if (3.14)
if (-3.14)
if (Infinity)
if (-Infinity)
```