---
title: "!important (CSS)"
aliases:
  - "!important"
tags: []
field: computer
topic: likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/CSS/!important.md
created: 2026-07-30
---
- [[CSS]] 에서 [[Cascade]]의 예외
- 어떤 스타일이든 `!important` 붙이면 모든 다른 규칙보다 우선 적용
- 그러나 너무 많이 사용하면 유지보수가 어려워짐
```css
h1 {
  background-color: white !important;
}
```
