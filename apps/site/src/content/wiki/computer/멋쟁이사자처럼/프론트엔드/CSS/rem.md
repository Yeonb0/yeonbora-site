---
title: rem
aliases: []
tags: []
field: computer
topic: web
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/CSS/rem.md
created: 2026-07-30
---
- 화면의 단위
- 절댓값인 [[px]]와는 달리 상대적인 값  
-  보통 1 [[rem]] = 10 [[px]]

```CSS
html {
	/* html의 font size의 기본 값은 16px */
  font-size: 62.5%; 
  /* 이제 1rem = 10px */
}

div {
	width: 10rem; /* 100px */
	height: 10rem; /* 100px */
	font-size: 1.6rem; /* 16px */
}
```