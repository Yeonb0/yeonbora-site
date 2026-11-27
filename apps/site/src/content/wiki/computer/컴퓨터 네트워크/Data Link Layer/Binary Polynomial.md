---
title: Binary Polynomial
aliases:
  - 이진 다항식
  - Binary Polynomial(이진 다항식)
tags: []
field: computer
topic: network
source: obsidian
sourcePath: 컴퓨터 네트워크/Data Link Layer/Binary Polynomial.md
created: 2026-07-31
---

- [[Cyclic Redundancy Check|CRC]] [[연산]]을 [[Polynomial|다항식]]으로 표현한 형태

### 기호
| 기호 | 내용 |
| --- | --- |
| $g(x)$ | generator |
| $d(x)$ | dataword |
| $r(x)$ | remainder |
| $T(x)$ | 송신 codeword |
| $T'(x)$ | 수신 codeword, $T'(x) = T(x) + e(x)$ |
| $e(x)$ | 오류 |

- $e(x)$ 가 0이 아닌데 나눠 떨어지는 경우 -> 오류 있는데 검출 안됨

![[Error-Detection-and-Correction-15.png]]
