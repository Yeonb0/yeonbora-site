---
title: "[Java] Java Basics"
field: computer
context: self
topic: java
series: Java
source: jekyll
originalUrl: https://yeonb0.github.io/java/java-java-basics/
date: 2026-03-18T11:10:00.000+09:00
tags:
  - Java
toc: true
---

## 1. Java Syntax and Structure


### 자바 프로그램의 기본 구조


- [[클래스|class]] : [[객체|object]] 를 만드는 청사진. 변수와 [[메소드]]로 구성
```java
public class ClassName{
 	// fields 변수
    // methods 함수
}
```

- main 함수 : 실행의 시작점. 클래스에 1개만 존재할 수 있음
```java
public static void main(String[] args) {
  	// 실행할 코드
}
```

### 문법 규칙


- 대문자 / 소문자 구별
- 이름 짓는 규칙
  - class : 대문자 시작, `CamelCase` 사용
`MyClass`
  - 메소드 & 변수 : 소문자 시작, `camelCase` 사용
`myVariable` / `myMethod`
  - 상수 : 대문자로만 작성, 공백은 `_` 사용
`MAX_VALUE`
- 주석
  - 한 줄 주석 : `//`
  - 여러 줄 주석 : `/* */`
  - Documentation Comments : `/** */`
```java
public class Class{
	// 한 줄 주석

    /* 여러 줄
       주석 */

    /**
     * Documentation
     * Comments
     */
 }
```

## 2. Data Types, Variavles, and Operators


### 원시 데이터 타입


- 정수

| byte | short | int | long |
|:--|:--|:--|:--|
| 8 bit | 16bit | 32 bit | 64 bit |
| ~128 ~ 127 | -32,768 ~ 32,767 | -2<sup>31</sup> ~ 2<sup>31</sup>-1 | -2<sup>63</sup> ~ 2<sup>63</sup>-1 |

- 실수

| float | double |
|:--|:--|
| 32 bit | 64 bit |

- 기타 타입

| char | boolean |
|:--|:--|
| 16 bit | 1 bit |
| 0 ~ 65,535 | true / false |

### 변수와 변수의 범위


- 변수의 선언과 초기화
```java
int number;  // 선언
number = 10; // 초기화
int number = 10; // 선언과 동시에 초기화 가능
```

### 변수의 범위


- [[지역 변수]] : 메소드나 중괄호 블럭 내에 선언된 변수. 벗어날 시 소멸
```java
public void myMethod(){
	int localVar = 10;  // myMethod 내부에서만 존재하는 지역 변수
}
// 메소드 밖으로 나가면 소멸
```

- [[인스턴스]] 변수(객체 변수) : 클래스 안에 있지만 메소드 밖에 있는 변수. 객체(인스턴스) 당 하나
→ 클래스 안 모든 메소드에서 사용 가능. 객체(인스턴스) 소멸 시 같이 소멸
```java
public class myClass{
	int instanceVar;  // myClass 안에서 존재하는 인스턴스 변수
}
```

- static variable 정적 변수, 클래스 변수 : static 키워드가 붙은 클래스 변수
  - 같은 클래스를 가지는 모든 객체(인스턴스)가 공유. 클래스 당 하나
  - 클래스가 로딩되는 시점에 생겨남. (객체 생성 이전)
```java
public class myClass{
	static int classVar;  // 같은 클래스를 가진 모든 객체가 공유하는 변수
}
```

### 연산자


- 비교 연산자

| == | != | > | >= |
|:--|:--|:--|:--|
| 같을 때 참 | 다를 때 참 | 클 때 참 | 크거나 같을 때 참 |

- 논리 연산자

| && | || | ! |
|:--|:--|:--|
| AND | OR | NOT |

## 3. Control Flow Statements


### 조건문


- if, else if, else
```java
int number = 10;
if (number > 0) {
	System.out.println("Positive");
} else if (number < 0) {
	System.out.println("Negative");
} else {
	System.out.println("Zero");
}
```

- switch
```java
int day = 3;
switch(day) {
	case 1 :
		System.out.println("Monday");
		break;
	case 2 :
		System.out.println("Tuesday");
		break;
	case 3 :
		System.out.println("Wednesday");
		break;
	default:
		System.out.println("Other day");
}
```

### 반복문


- for
- while
- do ~ while
```java
int i = 0;
do {
	System.out.println("Iteration: " + i);
	i++;
} while (i<5);
```
