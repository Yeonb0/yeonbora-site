---
title: Global CSS
aliases: []
tags: []
field: computer
topic: web
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/CSS/Global CSS.md
created: 2026-07-30
---
- 전역에서 사용할 CSS
- 모든 팀원이 같은 초기 설정 내에서 개발해야하므로 중요

- 많이 사용되는 [[Global CSS]] 구성
```css
 * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    scroll-behavior: smooth;
  }
  
  html {
	  font-size: 62.5%;
  }
  
  body {
	  background-color: white; /* 기본 배경색 설정해놓기 */
	  height: 100dvh;
  }
```

- [[font]] 설정

