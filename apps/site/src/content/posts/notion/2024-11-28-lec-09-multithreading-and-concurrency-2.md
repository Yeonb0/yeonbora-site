---
title: Lec 09 - Multithreading and Concurrency(2)
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f978079a653ebacce4aa678
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 9
---

---

---

## 1. Sychronization and Thread Safety

### ◆ Need for Synchronization

- Race Conditions(경쟁 상태)
    - 두 개 이상의 thread가 동시에 공유 데이터를 접근하고 수정하려 할 때 발생
    - 최종 결과가 thread 실행 타이밍에 따라 달라질 수 있어 예측 불가능 & 일관성 없는 결과
        
        ex) 두 thread가 동시에 공유된 카운터 변수를 증가시키려고 하면, 연산이 겹쳐서 최종 값이 잘못될 수 있음.
        
- Data Inconsistency(데이터 불일치)
    - 동시 실행 환경에서 공유 자원에 대한 동기화되지 않은 접근은 데이터의 불일치나 손상 초래 가능
        
        ex) 은행 어플리케이션에서 두 thread가 동시에 계좌 잔액을 업데이트하면, thread의 수정이 덮어씌워질 수 있어 잘못된 정보 저장 가능.
        
- Ensuring Thread Safety(안정성 보장)
    - 동기화는 여러 thread가 동시에 중요한 코드를 실행하지 못하도록 막아줌 → 데이터 안정적 보호
    - 동기화된 블록이나 메소드는 한 번에 하나의 thread만 접근 허용 → 데이터 불일치 방지

### ◆ Synchronized Methods and Blocks

- Synchronized Method
    - 메소드를 동기화하면 동일한 객체에 대해 한 번에 하나의 thread만 실행 가능하도록 보장.
    
    ```java
    public synchronized void synchronizedMethod(){
    	// critical section
    }
    ```
    

- Synchronized Block
    - 메소드 전체 대신 특정 코드 섹션만 동기화 하도록 사용 가능
        
        → 중요 섹션만 동기화 : 세밀한 제어 가능 & 성능 향상
        
    
    ```java
    public void method() {
    	sychronized(this) {
    		// critical section
    	}
    }
    ```
    

- Method vs. Block

```java
public class BankAccount {
    private int balance = 1000;

    // synchronized method example
    public synchronized void deposit(int amount) {
        balance += amount;
        System.out.println(Thread.currentThread().getName() + " deposited " + amount + ". Balance: " + balance);
    }

    // synchronized block example
    public void withdraw(int amount) {
        synchronized (this) {
            if (balance >= amount) {
                balance -= amount;
                System.out.println(Thread.currentThread().getName() + " withdrew " + amount + ". Balance: " + balance);
            } else {
                System.out.println(Thread.currentThread().getName() + " attempted to withdraw " + amount + " but insufficient balance.");
            }
        }
    }

    public int getBalance() {
        return balance;
    }
}
```

```java
public static void main(String[] args) {
        BankAccount account = new BankAccount();

        Thread t1 = new Thread(() -> {
            account.deposit(500);
            account.withdraw(200);
        });

        Thread t2 = new Thread(() -> {
            account.deposit(100);
            account.withdraw(300);
        });

        t1.start();
        t2.start();
    }
```

- Result :

### ◆ Using Lock Objects - ReentrantLock

- `ReentrantLock`
    - `java.util.concurrent.locks` 패키지에 포함된 클래스, `synchronized` 키워드 보다 더 유연한 잠금 메커니즘 제공
    - 잠금(Lock)과 잠금 해제(Unlock)를 수동으로 제어 가능
- `ReentrantLock` 의 장점
    1. Explicit Locking(명시적 잠금)
        - `lock()` 과 `unlock()` 메소드를 사용하여 명시적으로 잠금 설정 & 해제 가능
    2. Try Locking(잠금 시도)
        - `tryLock()` 메소드를 사용하여 잠금 가능 여부 판단 가능.
        - 잠금 불가능 할시 다른 작업 계속 진행.
    3. Fairness(공정성)
        - ReentrantLock은 요청 순서에 따라 thread에 접근 권한을 부여하도록 설정 가능

```java
ReentrantLock lock = new ReentrantLock();

public void safeIncrement(){ 
	lock.lock(); // 잠금
	try {
		count++;
	} finally }
		lock.unlock(); // 항상 호출 해 교착 상태(deadlock) 방지.
	}
}
```

### ◆ Volatile and Atomic Variables

- Volatile 키워드
    - 목적
        - `volatile` 은 변수 변경 사항이 모든 thread에서 즉시 확인 가능하도록 보장.
        - 변수 값이 로컬 캐시가 아닌 메인 메모리에서 직접 읽히거나 쓰여지도록 함.
        - `volatile` 로 선언된 변수는 모든 읽기와 쓰기 연산이 메인 메모리에 접근하도록 강제됨
    - 사용 예
        - 여러 thread에서 읽고 쓰는 변수에 대해 atomicity를 요구하지 않는 경우
        - 변수 업데이트가 즉시 모든 thread에 반영되어야 할 때
    
    ```java
    private volatile boolean flag = true;
    ```
    

- Atomic 변수
    - `java.util.concurrent.atomic` 패키지를 통해 `AtomicInteger`, `AtomicBoolean` 과 같은 단일 변수에 대한 원자적 연산을 제공
    - 동기화 블록이나 잠금 없이 원자적 연산을 수행 가능
    - `getAndIncrement()` , `compareAndSet()` 등의 원자적 메소드를 통해 thread 의 안정성 보장
    - 여러 thread 가 동시에 접근해도 경쟁 상태 없이 안전하게 업데이트
    
    ```java
    private AtomicInteger count = new AtomicInteger(0);
    
    public void increment() {
        count.getAndIncrement(); // 원자적 증가 연산
    }
    ```
    

## 2. Inter-Thread Communication

### ◆ Inter-Thread Communication with wait(), notify(), and notifyAll()

- Inter-Thread Communication(스레드 간 통신)
    - thread가 신호를 주고 받으며 동작을 조정할 수 있도록 하는 메커니즘
    - 공유 데이터를  접근할 때 충돌이나 교착 상태(deadlock) 방지 & 자원 효율적 사용 가능
- 중요성
    - 서로 의존적인 thread 간에 적절한 동기화를 가능하게 함.
        
        ex) 한 thread는 데이터 생산, 다른 thread는 데이터 처리(소비)
        
    - 조건을 지속적으로 확인하는 대신 thread가 기다릴 수 있어 불필요한 CPU 사용을 줄임

- Methods
    - `wait()`
        - 현재 thread가 잠금을 해제하고 다른 thread가 `notify()` 나 `nofityAll()` 을 호출할 때 까지 대기
        - 특정 조건이 만족될 때까지 실행을 멈추기 위해 동기화 블록 안에서 사용.
    - `notify()`
        - 객체의 모니터에서 대기 중인 thread 하나를 깨움
        - 깨어난 thread는 잠금을 다시 획득한 후 실행을 계속.
    - `notifyAll()`
        - 객체의 모니터에서 대기 중인 모든 thread를 깨움
        - 깨어난 모든 thread가 잠금을 획득하기 위해 경쟁하며 실행을 계속.
        - 조건 변경에 따라 여러 thread가 반응해야 하는 상황에서 유용

### ◆ Producer-Consumer Problem Using wait() and notify()

- 생산자-소비자 문제
    - 하나의 thread(생산자)가 데이터를 생성, 다른 thread(소비자)가 해당 데이터 처리.
    - 생산자는 자원이 가득 차면 기다림, 소비자는 자원이 비어있으면 기다림.
- 목표
    - 생산자가 소비되지 않은 데이터를 덮어쓰지 않도록 보장
    - 소비자가 존재하지 않는 데이터를 소비하지 않도록 보장

```java
public class Store {
    private int product = 0;
    private final int CAPACITY = 5;
    
    // Producer method
    public synchronized void produce() throws InterruptedException{
        while (product >= CAPACITY) {
            System.out.println("Store is full. Waiting for consumption...");
            wait(); // wait for consumer to consume
        }
        product++;
        System.out.println("Producer produced 1 product. Total: " + product);
        notify(); // notify consumer
    }
    
    // Consumer method
    public synchronized void consume() throws InterruptedException{
        while (product <= 0) {
            System.out.println("Store is empty. Waiting for production...");
            wait(); // wait for producer to produce
        }
        product--;
        System.out.println("Consumer consumed 1 product. Total: " + product);
        notify(); // notify producer
    }
}
```

### ◆ Simplified Producer-Consumer with BlockingQueue

- `BlockingQueue`
    - thread 간 통신을 자동으로 동기화하는 thread-safe 컬렉션
    - `java.util.concurrent` 패키지의 일부. `put()` 과 `take()` 같은 차단 연산 제공 → 대기와 통신 관리
- 장점
    - 동기화를 내부적으로 처리해 코드 단순화
    - 수동으로 잠금 설정 & 조건 확인 X → 오류 및 복잡성 감소
- 사용법
    - `BlockingQueue` (ex. `LinkedBlockingQueue`) 를 생산자와 소비자 간의 공유 버퍼로 사용
    - Queue의 용량이 버퍼 제한으로 작용.
        - 가득 차면 생산자 자동 대기
        - 비어 있으면 소비자 자동 대기

```java
BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(5);
    
    class Producer implements Runnable {
        @Override
        public void run() {
            try {
                int value = new Random().nextInt();
                queue.put(value); // Blocks if queue is full
                System.out.println("Produced: " + value);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }      
    }
    
    class Consumer implements Runnable {
        @Override
        public void run() {
            try {
                int value = queue.take(); // Blocks if queue is empty
                System.out.println("Consumed: " + value);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }      
    }
```

## 3. Executor Framework

### ◆ Introduction to the Executor Framework

- 정의
    - `java.util.concurrent` 패키지의 일부, 작업을 thread를 통해 관리하고 실행할 수 있는 고수준의 API 제공
    - thread 관리를 추상화하여 개발자가 작업을 제출, thread의 직접적 관리는 필요 X
- 장점
    - thread 관리 단순화 → 코드 가독성 향상
    - 재사용 가능한 thread pool → 시스템 리소스의 효율적 사용 가능
    - thread 생명 주기 자동 관리 → 리소스 누수 위험 감소
- 핵심 요소
    - `Executor` : `execute(Runnable command` 메소드를 정의해 작업 실행을 관리
    - `ExecutorService` : extends `Executor` , 작업 제출과 종료라는 생명 주기 관리 메소드를 추가 제공.

```java
		ExecutorService executor = Executors.newFixedThreadPool(5);
	  executor.submit(() -> {
        System.out.println("Task executed");
	  });
    executor.shutdown();
```

→ 고정된 5개의 thread로 구성된 thread pool 을 생성

→ `submit()` 을 통해 작업 제출, 모든 작업 완료 후 `shutdown()` 으로 thread pool 종료

### ◆ Types of Thread Pools in the Executor Framework

- Fixed Thread Pool
    - 고정된 개수의 thread 유지, 여러 작업에 대해 재사용 가능
    - 시스템 리소스 사용을 제어하는 데 유용
        
        ex) 작업 부하가 예측 가능한 어플
        
    
    ```java
    ExecutorSerivce executor = Executors.newFixedThreadPool(4); // 4 threads
    ```
    
- Cached Thread Pool
    - 필요에 따라 새로운 thread 생성. 기존의 thread가 사용 가능하면 재사용.
    - 유휴 상태의 thread는 60초 후에 종료
        
        ex) 작업 시간이 짧거나 작업량이 가변적인 어플에 적합
        
    
    ```java
    ExecutorSerivce executor = Executors.newCachedThreadPool(); // 따로 숫자 지정 X
    ```
    
- Scheduled Thread Pool
    - 일정 시간이 지난 후 실행되거나, 주기적으로 실행될 작업을 예약하는 데 사용
        
        ex) 시스템 상태 점검, 데이터 동기화 등 주기적인 작업에 적합
        
    
    ```java
    ScheduledExecutorService executor = Executors.newScheduledThreadPool(2);
    executor.scheduledAtFixedRate()) -> System.out.println("Scheduled task"), 0, 5, TimeUnit.SECONDS);
    ```
    
- Example
    
    ```java
    	 ExecutorService executor = Executors.newFixedThreadPool(3);
       for (int i = 0; i < 10; i++){
            int TaskId = i;
            executor.submit(() -> System.out.println("Executing Task " + taskId));
        }
        
        executor.shutdown;
    ```
    
    - 3개의 thread로 구성된 fixed thread pool 생성
    - 총 10개의 작업 실행. 3개의 thread가 작업 처리.
    - 작업은 대기열에 추가되어 차례대로 처리. 모든 작업 완료 후 `shutdown()` 으로 thread pool 종료

### ◆ ForkJoin Framework

- 목적
    - `ForkJoin` FrameWork는 작업을 재귀적으로 작은 단위로 나누어 병렬로 처리 → 결과를 결합
    - 분할 정복 알고리즘(Divide-and-Conquer), 재귀 정렬 알고리즘, 대규모 데이터의 병렬 처리 등에 유용.
- `ForkJoinPool`
    - `java.util.concurrent`  패키지에 포함된 특수한 thread pool. `ForkJoinTask` 와 함께 작동.
    - 작은 작업을 병렬 실행 → CPU 사용량 최적화
- 재귀 작업 분할
    - 작업을 작은 하위 작업으로 분할해 처리 가능할 정도의 크기(granularity)까지 나눔.
    - 하위 작업들은 병렬로 실행. $\Sigma$각각의 결과 = 최종 출력

```java

public class SumTask extends RecursiveTask<Integer> {
    private int[] array;
    private int start, end;
    
    public SumTask(int[] array, int start, int end) {
        this.array = array;
        this.start = start;
        this.end = end;
    }
    
    protected Integer compute() {
        if (end - start <= 10) {
            int sum = 0;
            for (int i = start; i < end; i++) {
                sum += array[i];
            }
            return sum;
        } else {
            int mid = (start + end) / 2;
            SumTask left = new SumTask(array, start, mid);
            SumTask right = new SumTask(array, mid, end);
            left.fork(); // start left subtask
            return right.compute() + left.join(); // compute right subtask and wait for left subtask
        }
    }
    
    // Using ForkJoinPool
    ForkJoinPool pool = new ForkJoinPool();
    int totalSum = pool.invoke(new SumTask(array, 0, array.length));
}
```
