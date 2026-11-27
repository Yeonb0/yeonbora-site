---
title: Java 명명 규칙
aliases: []
tags: []
field: computer
topic: likelion
source: obsidian
sourcePath: 멋쟁이사자처럼/백엔드/Java/Java 명명 규칙.md
created: 2026-07-30
---

| Name                 | Convention            | Example                                     |
| -------------------- | --------------------- | ------------------------------------------- |
| class: [[클래스]]       | 대문자로 시작하고, 명사를 사용한다.  | class Menu;  <br>class price;               |
| interface: [[인터페이스]] | 대문자로 시작하고, 형용사를 사용한다. | interface Runnable;  <br>interface Storing; |
| method: 함수([[메소드]])  | 소문자로 시작하며 동사를 사용한다.   | add();  <br>getNumber();                    |
| variable: [[변수]]     | 소문자로 시작한다.            | int number;  <br>int addCost;               |
| package: [[패키지]]     | 소문자로 시작한다.            | com.sun.kor  <br>com.store.menu             |
| constant: [[상수]]     | 대문자로 시작한다.            | final float PI:                             |
%% typo? : 표 마지막 행 `final float PI:` → `final float PI;` %%