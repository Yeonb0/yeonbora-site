---
title: Event Loop
aliases: []
tags: []
field: computer
topic: web
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/JS/Event Loop.md
created: 2026-07-30
---
- [[Call Stack]]이 비어있으면 [[Callback Queue]]의 함수를 가져와 실행

1. [[Call Stack]] 이 비어있는지 확인
2. 비어 있으면 [[Callback Queue]] 에서 작업을 가져와 실행
3. [[Call Stack]] 이 다시 비면 반복 -> loop 인 이유
   
   ![[image (1).gif]]