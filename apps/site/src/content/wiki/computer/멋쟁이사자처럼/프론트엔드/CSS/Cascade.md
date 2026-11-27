---
title: Cascade
aliases: []
tags: []
field: computer
topic: likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/CSS/Cascade.md
created: 2026-07-30
---
- 작성 순서 -> 나중에 작성된 스타일 적용
	- 같은 요소에 대해 우선순위가 같은 스타일이 여러 개 일 때
```css
p {
  color: red;
}

p {
  color: blue; /* 나중에 작성된 스타일이 적용됨 → 파란색이 됨 */
}
```