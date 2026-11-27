---
title: Function Scope
aliases: []
tags: []
field: computer
topic: programming-language
source: obsidian
sourcePath: 프로그래밍 언어/Function Scope.md
created: 2026-07-30
---
- [[변수]]가 선언된 함수 내부에서만 접근 가능
```js
function abc() {
	if(true) {
		var x = "hello";
		console.log(x); //정상 출력
	}
	console.log(x); //정상 출력
}

abc();
```

- [[var]]