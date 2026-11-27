---
title: Falsy
aliases:
  - Falsy
  - falsy
tags: []
field: computer
topic: web
course:
  - likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/JS/Falsy.md
created: 2026-07-30
---
- [[boolean]] 으로 평가되는 상황에서 `true`로 취급되는 값
%% check : falsy 값은 `false`로 취급되는데 본문은 `true`로 적음 %%

### 종류
- [[null]] : 없음
- [[undefined]] : 값 미할당
- [[false]] 
- [[NaN]] : Not a Number
- [[0]] : 숫자 0 (`0.0`, `0x0`, `-0`, `0n` 포함)
- `""` : 빈 문자열

```js
// falsy
if (false)
if (null) 
if (undefined) 
if (0) 
if (-0) 
if (0n) 
if (NaN) 
if ("") 
```