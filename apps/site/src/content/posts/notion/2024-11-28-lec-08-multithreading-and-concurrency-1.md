---
title: Lec 08 - Multithreading and Concurrency (1)
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f9780c08cb0ffa8685f8a5f
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 8
---

---

---

## 1. Multithreading

### ◆ Definition

- Thread
    - 프로그램 실행의 한 시퀀스
    - operating system이 스케쥴할 수 있는 가장 작은 단위
    - 각각의 자바 application은 최소 1개(main thread)의 thread를 가짐. 그렇지만 동시에 여러 일을 하도록 추가 thread 생성 가능
- Multithreading
    - 여러 thread의 동작을 한 번에 하도록 하는 것
    - CPU의 코어를 최대한 활용하는 것
    - 효율성 + 성능 증가

### ◆ Importance

- Performance Enhancement : 성능 증가
    - 일들을 여러 개의 thread로 나눠서 프로그램이 CPU 자원을 더 효율적으로 사용하게 함.
    - 직렬적이 아니라 병렬적으로 실행해 더 빠르게 완료 가능
- Responsiveness
    - GUI 같은 real-time 반응성이 필요한 어플에 필수적임
    - ex) GUI 에서 보여주는 것 / 계산하는 것(background thread) 나누기.
- Resource Utilization
    - 프로그램이 다른 코어에서 각각의 thread를 실행할 수 있는 멀티 코어 프로세서를 활용할 수 있도록 함.
    - 시뮬레이션이나 데이터 분석 같은, 집중적인 컴퓨터 어플에 필수적.

### ◆ Examples Use Cases for Multithreading

- 게임 개발 : 시각적 그래픽 + 유저의 입력 처리 + 게임 내부 동작들
- Real-Time 데이터 처리
    
    ex) 주식 시장 : 독립적인 여러 주식을 동시에 업데이트
    
- 웹 서버
    - 여러 사이트를 동시에 켤 수 있음
- GUI : 보이는 화면 + 안에서 내부적으로 동작하는 코드들

## 2. Concurrency vs. Parallelism

### ◆ Concurrency

- 한 기간 동안 여러 작업을 관리하고 실행할 수 있는 기능, 작업들 간 시간 겹칠 수 있음.
- 다른 일이 끝나기까지 기다리지 않도록 의존성 낮추기 위해 사용
- thread 들이 동시에 실행되는 것처럼 보임. (단일 코어 환경에서는 실행이 교차되어 진행됨에도 불구하고.)
    
    ex) Java 프로그램에서 여러 thread가 파일 읽기, 데이터 처리, UI 업데이트 등의 서로 다른 작업 동시 처리.  (단일 코어에서 실제로 동시 실행 X, but 그렇게 보임.
    

### ◆ Parallelism

- 여러 작업을 동시에 실행하는 것. in 다중 코어 프로세서
- 각 작업은 각 코어에서 실행. **진짜** 동시 실행
- 진짜 병렬 처리는 멀티 코어 or 프로세서 하드웨어 요구됨
    
    ex) 서버 어플에서 다수의 클라이언트 요청이 병렬 처리됨. 각 요청이 다른 코어에서 다른 thread로 처리
    
- 차이점
    - concurrency : 단일 코어 프로세서에서 여러 작업을 처리하고 실행을 관리하는 것.
    - parallelism : 멀티 코어 프로세서에서 여러 작업을 동시에 실행하는 것.

## 3. Creating and Managing Threads in Java

### ◆ Extending Thread Class

- Thread 클래스 상속 + `run()` 메소드 오버라이드 → thread 만듬
- 직접 어디 thread를 사용할지 정하지는 않음 → OS의 영역
    
    → extend 는 오직 한 class 만 가능 : not flexible
    

```java
class MyThread extends Thread {
	public void run() {
		System.out.println("Thread running.");
	}
}

public class Main {
	public static void main(String[] args) {
		Mythread t1 = new MyThread();
		t1.start(); // Starts the thread and calls the run() method
	}
}
```

→ `run()` override, `t1.start()` 와 같이 새 thread 시작 (`run()`에 있는 코드 실행)

### ◆ Implementing Runnable Class

- Thread 클래스 상속과 같은 기능, but interface 로 구현하는 거라 좀 더 flexible
- Thread 클래스와 마찬가지로 `run()` 메소드를 반드시 오버라이딩 해야함.
    - 독립적인 class에만 `Runnable` 을 implement (종속적 X)
- class 안에 thread를 넣을 수 있음 → 종속성 없애기.
- 코드가 더 reusable 하고 여러 thread가 같은 일을 하도록 할 수 있다.

```java
class MyRunnable implements Runnable {
	public void run() {
		System.out.println("Runnable running.");
	}
}

public class Main {
	public static void main(String[] args) {
		Thread t2 = new Thread(new MyRunnable());
		t2.start(); // Starts the thread and calls the run() method in MyRunnable
	}
}
```

- Runnable은 함수형 인터페이스 (함수 하나로만 구성된 인터페이스) 기에 람다 표현 사용 가능.
    - 잡다한 코드 쓰는 걸 줄여줌. 더 간단하고 이해 쉬움!
    
    ```java
    public class Main {
    	public static void main(String[] args) {
    		Thread t3 = new Thread(() -> System.out.println("Lambda running"));
    		t3.start(); // Starts the thread, executing the lambda expression in the new thread
    	}
    }
    ```
    

## 4. Thread Lifecycle and States

### ◆ Lifecycle of a Thread

- New
    - thread 가 생성되었지만 아직 시작되지 않은 상태
    - `start()` 메소드가 호출 될 때까지 이 상태
- Runnable
    - `start()` 메소드 호출 후.
    - thread는 실행 준비가 되었고, CPU 시간을 기다리는 상태
    - thread scheduler 가 언제 CPU 시간을 할당할지 결정
- Blocked
    - thread가 동기화 블록 또는 메소드에 들어가려 하지만 lock을 얻기 까지 기다리는 상태
    - lock을 얻어 접근 가능할 때까지 이 상태
        
        ex) 한 thread가 lock을 보유한 상태에서 다른 thread 가 동기화 블록에 접근하려 할 때
        
- Waiting
    - 다른 thread 가 특정 작업을 수행할 때까지 무기한으로 기다리는 상태
    - `wait()` 메소드를 통해 타임아웃 없이 이 상태 돌입
        
        ex) 생산자 thread의 데이터 제공을 소비자 thread가 기다리는 경우
        
- Time Waiting
    - thread 가 지정된 시간 동안 기다리는 상태
    - `sleep(milliseconds)` / `wait(milliseconds)`
    - 지정된 시간이 지나면 다시 Runnable 상태로 돌아감
- Terminated
    - thread가 실행을 완료한 상태, 더 이상 재시작 불가
    - `run()` 메소드가 끝나면 자동으로 이 상태.

### ◆ Methoeds to Control Thread State

- `start()`
    - thread를 New 상태에서 Runnable 상태로 전환
- `sleep(milliseconds)`
    - thread를 지정된 시간 동안 Timed Waiting 상태로 전환
- `yield()`
    - 현재 thread가 프로세서를 양보할 의사가 있음을 thread scheduler 에게 알림
- `join()`
    - 현재 thread를 대기 상태로 만들고, 지정된 thread를 1순위로 처리하도록 함.
- `interrupt()`
    - thread가 Waiting, Timed Waiting 상태일 때, Runnable로 돌아가도록 함.
