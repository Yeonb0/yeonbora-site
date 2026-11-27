---
title: Mermaid 테마 설정
aliases:
  - Mermaid Theme
  - Mermaid 공통 설정
tags: []
field: computer
topic: etc
source: obsidian
sourcePath: 기타 정보들/Mermaid 테마 설정.md
created: 2026-09-04
---

- [[다이어그램]] 첫 줄 `%%{init: ...}%%` 지시자 -> 테마 · 옵션 개별 지정 O
- 주석은 `%%` 로 시작, 렌더링 X

### 종류
- 내장 테마 : `default`, `neutral`, `dark`, `forest`, `base`

### 예시
```mermaid
%%{init: {'theme': 'forest', 'themeVariables': {'fontSize': '14px'}}}%%
flowchart LR
    A[요청] --> B[처리] --> C[응답]
```
