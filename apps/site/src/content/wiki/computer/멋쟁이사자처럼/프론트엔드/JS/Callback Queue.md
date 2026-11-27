---
title: Callback Queue
aliases: []
tags: []
field: computer
topic: web
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/JS/Callback Queue.md
created: 2026-07-30
---
- [[비동기]] 작업 완료 시, 실행할 함수가 대기하는 장소
- [[Web API]] 가 작업을 끝내면, 해당 함수를 [[Callback Queue]] 로 보냄

```js
function 콜백함수() {
  console.log("1초 간의 비동기 작업이 끝나고 실행되는 콜백함수입니다");
}

setTimeout(콜백함수, 1000); // setTimeout은 비동기 함수
```
- 1초 후 `콜백함수()` 가 [[Callback Queue]]에서 대기

![[image.gif]]