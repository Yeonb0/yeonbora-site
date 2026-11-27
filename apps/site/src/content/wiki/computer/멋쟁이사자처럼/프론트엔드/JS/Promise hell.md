---
title: Promise hell
aliases: []
tags: []
field: computer
topic: likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/프론트엔드/JS/Promise hell.md
created: 2026-07-30
---
- [[비동기]] 작업이 중첩될수록 가독성 ↓

```js
/* Promise Hell */
fetch('https://example.com/api')
  .then(response => response.json())
  .then(data => fetch(`https://example.com/api/${data.id}`))
  .then(response => response.json())
  .then(data => fetch(`https://example.com/api/${data.id}/details`))
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```