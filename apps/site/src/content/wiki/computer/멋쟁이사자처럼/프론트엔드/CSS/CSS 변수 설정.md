---
title: CSS 변수 설정
aliases: []
tags: []
field: computer
topic: likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/CSS/CSS 변수 설정.md
created: 2026-07-30
---
- [[CSS]]에서 변수를 사용하는 방법
- `root` 의 가상 클래스 활용

- 변수 생성하기
```css
:root {
	--bg-color: #2C2C2C; 
	--text-color: #4285F4;
}
```

- 변수 사용하기
``` css
body { 
background-color: var(--bg-color); 
color: var(--text-color); 
}
```


