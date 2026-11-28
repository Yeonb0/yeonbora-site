---
title: Lec 10 - Multithreading and Concurrency (3)
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f9780afa75adfe9ca55b39e
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 10
---

---

---

## 1. Advanced Concurrency Utilities

### ◆ Concurrent Collections

- 목적
    - 전통적인 [[Java]] 컬렉션의 외부 동기화 없이 동시 수정을 처리 할 수 있는 Thread-safe version.
    - 다중 thread 환경에서 여러 thread가 동시에 컬렉션을 읽거나 쓸 수 있어야 하는 경우 유용.
- 종류
    - `ConcurrentHashMap`
        - HashMap의 thread-safe 버전, 맵을 여러 세그먼트로 나누어 동시 접근 허용.
        - 고성능 동시 읽기와 제어된 동시 쓰기 지원
            
            ex) 실시간 어플에서 공유 데이터를 저장 & 업데이트
            
    - `CopyOnWriteArrayList`
        - ArrayList의 thread-safe 버전, 업데이트 시 [[배열]]의 새 복사본 생성. 수정 중에도 안전한 반복 가능.
            
            ex) 읽기 작업이 쓰기 작업보다 훨씬 많은 경우. event listener 목록 유지.
            
    - `BlockingQueue`
        - thread-safe 큐, 큐가 가득 찬 경우(생산자)나 비어 있는 경우(소비자)에 작업을 차단
            
            ex) 생산자-소비자 패턴 단순화, 동기화 자동 처리.
            
    
    ```java
    ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
    map.put("key", 1);
    
    CopyOnWriteArrayList<Integer> list = new CopyOnWriteArrayList<>();
    list.add(1);
    
    BlockingQueue<Integer> queue = new BlockingQueue<>(10);
    queue.put(1); // Blocks if queue is full
    ```
    

- Example
    - Code
        
        ```java
        import java.util.concurrent.ConcurrentHashMap;
        
        public class ConcurrentHashMapExample {
            public static void main(String[] args) {
                // ConcurrentHashMap creation
                ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        
                // Generate 3 threads
                Thread thread1 = new Thread(() -> {
                    for (int i = 1; i <= 5; i++) {
                        map.put("Thread-1-" + i, i);
                        System.out.println("Thread-1 added: Thread-1-" + i + " = " + i);
                    }
                });
        
                Thread thread2 = new Thread(() -> {
                    for (int i = 1; i <= 5; i++) {
                        map.put("Thread-2-" + i, i);
                        System.out.println("Thread-2 added: Thread-2-" + i + " = " + i);
                    }
                });
        
                Thread thread3 = new Thread(() -> {
                    for (int i = 1; i <= 5; i++) {
                        map.put("Thread-3-" + i, i);
                        System.out.println("Thread-3 added: Thread-3-" + i + " = " + i);
                    }
                });
        
                // Start the threads
                thread1.start();
                thread2.start();
                thread3.start();
        
                // Wait for the threads to finish
                try {
                    thread1.join();
                    thread2.join();
                    thread3.join();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
        
                // Print all results from ConcurrentHashMap
                System.out.println("\nFinal map contents:");
                map.forEach((key, value) -> {
                    System.out.println(key + " = " + value);
                });
            }
        }
        
        ```
        
    - Result
        
        ```java
        Thread-1 added: Thread-1-1 = 1
        Thread-1 added: Thread-1-2 = 2
        Thread-3 added: Thread-3-1 = 1
        Thread-2 added: Thread-2-1 = 1
        Thread-1 added: Thread-1-3 = 3
        Thread-3 added: Thread-3-2 = 2
        Thread-2 added: Thread-2-2 = 2
        Thread-2 added: Thread-2-3 = 3
        Thread-1 added: Thread-1-4 = 4
        Thread-1 added: Thread-1-5 = 5
        Thread-3 added: Thread-3-3 = 3
        Thread-3 added: Thread-3-4 = 4
        Thread-3 added: Thread-3-5 = 5
        Thread-2 added: Thread-2-4 = 4
        Thread-2 added: Thread-2-5 = 5
        
        Final map contents:
        Thread-3-5 = 5
        Thread-3-3 = 3
        Thread-2-4 = 4
        Thread-1-5 = 5
        Thread-3-4 = 4
        Thread-2-5 = 5
        Thread-3-1 = 1
        Thread-1-3 = 3
        Thread-2-2 = 2
        Thread-3-2 = 2
        Thread-1-4 = 4
        Thread-2-3 = 3
        Thread-1-1 = 1
        Thread-2-1 = 1
        Thread-1-2 = 2
        ```
        
    

### ◆ Sychronization Utilities

- `CountDownLatch`
    - 하나 이상의 thread가 다른 thread에서 특정 작업이 완료될 때까지 기다릴 수 있도록 도와주는 동기화 도구.
    - 초기화 시 설정된 카운트를 `countDown()`  [[메소드]]를 통해 감소, 카운트가 0이 되면 thread 진행 가능
    - 사용 예시 : 메인 thread가 여러 작업을 병렬 처리 후, 모든 작업 완료 기다려야할 때 사용
    - Code
        - Main
            
            ```java
            import java.util.concurrent.CountDownLatch;
            
            public class CountDownLatchExample {
                public static void main(String[] args) {
                    // Create a CountDownLatch with a count of 3
                    CountDownLatch latch = new CountDownLatch(3);
            
                    // Create 3 threads that will use the CountDownLatch
                    Thread worker1 = new Thread(new Worker(latch, "Worker-1"));
                    Thread worker2 = new Thread(new Worker(latch, "Worker-2"));
                    Thread worker3 = new Thread(new Worker(latch, "Worker-3"));
            
                    // Start the threads
                    worker1.start();
                    worker2.start();
                    worker3.start();
            
                    // Main thread waits until the CountDownLatch count reaches 0
                    try {
                        latch.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
            ```
            
        - Worker
            
            ```java
            import java.util.concurrent.CountDownLatch;
            
            public class Worker implements Runnable {
                private final CountDownLatch latch;
                private String name;
            
                public Worker(CountDownLatch latch, String name) {
                    this.latch = latch;
                    this.name = name;
                }
            
                @Override
                public void run() {
                    try {
                        System.out.println(Thread.currentThread().getName() + " is working...");
                        Thread.sleep(1000); // Simulate task duration with a delay
            
                        System.out.println(Thread.currentThread().getName() + " finished its work.");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } finally {
                        // Decrease the count of the CountDownLatch after completing the task
                        latch.countDown();
                    }
                }
            }
            
            ```
            
        - Result
            
            ```java
            Thread-1 is working...
            Thread-2 is working...
            Thread-0 is working...
            Thread-0 finished its work.
            Thread-1 finished its work.
            Thread-2 finished its work.
            ```
            
- `CyclicBarrier`
    - 여러 thread가 공통의 베리어 지점(barrier point)에 도달할 때까지 서로 기다리도록 도와주는 동기화 도구.
    - 모든 thread가 barrier 도달 시, 함께 진행. barrier [[재사용(Reuse)|재사용]] 불가.
    - 사용 예시 : 데이터 처리 단계 별로 모든 thread가 작업을 완료한 뒤 다음 단계로 진행해야 하는 경우.
    - Code
        - Main
            
            ```java
            public class CyclicBarrierExample {
                public static void main(String[] args) {
                    // Create a CyclicBarrier for 3 threads, with a barrier action to notify when all threads reach it
                    CyclicBarrier barrier = new CyclicBarrier(3, () ->
                            System.out.println("All threads reached the barrier, moving to the next phase...")
                    );
            
                    // Create a CountDownLatch for 3 threads to signal the main thread after both phases are completed
                    CountDownLatch latch = new CountDownLatch(3);
            
                    // Create and start 3 threads
                    Thread worker1 = new Thread(new Worker(barrier, latch), "Worker-1");
                    Thread worker2 = new Thread(new Worker(barrier, latch), "Worker-2");
                    Thread worker3 = new Thread(new Worker(barrier, latch), "Worker-3");
            
                    worker1.start();
                    worker2.start();
                    worker3.start();
                }
            }
            ```
            
        - Worker
            
            ```java
            // Worker class that performs tasks in two phases
            class Worker implements Runnable {
                private final CyclicBarrier barrier;
                private final CountDownLatch latch;
            
                public Worker(CyclicBarrier barrier, CountDownLatch latch) {
                    this.barrier = barrier;
                    this.latch = latch;
                }
            
                public void run() {
                    try {
                        // Phase 1
                        System.out.println(Thread.currentThread().getName() + " is performing phase 1...");
                        Thread.sleep(1000); // Simulate task duration
                        System.out.println(Thread.currentThread().getName() + " completed phase 1.");
                        barrier.await(); // Wait for other threads at the barrier
            
                        // Phase 2
                        System.out.println(Thread.currentThread().getName() + " is performing phase 2...");
                        Thread.sleep(1000); // Simulate task duration
                        System.out.println(Thread.currentThread().getName() + " completed phase 2.");
                        barrier.await(); // Wait for other threads at the barrier again
            
                        // Signal the main thread that this thread has completed both phases
                        latch.countDown();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
            ```
            
        - Result
            
            ```java
            Worker-3 is performing phase 1...
            Worker-1 is performing phase 1...
            Worker-2 is performing phase 1...
            Worker-2 completed phase 1.
            Worker-3 completed phase 1.
            Worker-1 completed phase 1.
            All threads reached the barrier, moving to the next phase...
            Worker-1 is performing phase 2...
            Worker-2 is performing phase 2...
            Worker-3 is performing phase 2...
            Worker-1 completed phase 2.
            Worker-2 completed phase 2.
            Worker-3 completed phase 2.
            All threads reached the barrier, moving to the next phase...
            ```
            

### ◆ Semaphore

- 정의
    - 고정된 개수의 thread만 특정 공유 자원에 접근할 수 있도록 제어하는 도구
    - 사용 가능한 permit의 개수 유지. thread는 permit을 얻어 진행, 작업 완료 후 permit을 release 해 다른 thread가 접근할 수 있도록 함.
- 사례 : 제한된 리소스에 대한 접근 제어. [[데이터베이스|DB]] 연결, 프린터 등.
- Code
    - Main
        
        ```java
        public class SemaphoreExample {
            public static void main(String[] args) {
                // Create a Semaphore with 2 permits
                Semaphore semaphore = new Semaphore(2);
        
                // Create and start 5 worker threads
                for (int i = 1; i <= 5; i++) {
                    new Thread(new Worker(semaphore), "Worker-" + i).start();
                }
            }
        }
        ```
        
    - Worker
        
        ```java
        class Worker implements Runnable {
            private final Semaphore semaphore;
        
            public Worker(Semaphore semaphore) {
                this.semaphore = semaphore;
            }
        
            @Override
            public void run() {
                try {
                    System.out.println(Thread.currentThread().getName() + " is waiting to access the resource...");
        
                    // Acquire a permit before accessing the resource
                    semaphore.acquire();
                    System.out.println(Thread.currentThread().getName() + " has acquired a permit and is accessing the resource.");
        
                    // Simulate work with the shared resource
                    Thread.sleep(1000); // Simulate resource usage time
        
                    System.out.println(Thread.currentThread().getName() + " is releasing the permit.");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    // Release the permit after the work is done
                    semaphore.release();
                }
            }
        }
        ```
        
    - Result
        
        ```java
        Worker-2 is waiting to access the resource...
        Worker-5 is waiting to access the resource...
        Worker-3 is waiting to access the resource...
        Worker-4 is waiting to access the resource...
        Worker-1 is waiting to access the resource...
        Worker-5 has acquired a permit and is accessing the resource.
        Worker-2 has acquired a permit and is accessing the resource.
        Worker-2 is releasing the permit.
        Worker-4 has acquired a permit and is accessing the resource.
        Worker-5 is releasing the permit.
        Worker-3 has acquired a permit and is accessing the resource.
        Worker-4 is releasing the permit.
        Worker-3 is releasing the permit.
        Worker-1 has acquired a permit and is accessing the resource.
        Worker-1 is releasing the permit.
        ```
        
    

## 2. Best Practices for Multithreaded Programming

1. 공유 데이터 사용 최소화
    - 동기화 문제를 줄이기 위해 공유 데이터 줄이는 것이 중요.
    - [[지역 변수]]와 불변 객체(immutable objects)를 사용하여 스레드 간 간섭 방지.
2. 고수준 Concurrenct [[API]] 활용
    - 직접적 thread 관리 대신, `ExecutorService`, `BlockingQueue`, `Concurrent Collections` 와 같은 Java의 고수준 동시성 유틸리티를 사용.
    - 코드 작성 단순화 & [[교착상태|데드락]](deadlock)이나 경쟁 조건(race condition) 같은 일반적인 동시성 문제 줄일 수 있음.
3. 확장성과 유지보수성 고려 설계
    - 향후 확장을 염두에 두고 thread 관리 계획.
    - 장시간 잠금(long-running locks)는 병목 현상 유발할 수 있으니 피하기.
    - multithread 코드가 쉽게 유지 보수되고 확장 가능하도록 설계
4. 동시성 어플의 테스트와 디버깅
    - 타이밍 & 동기화 문제로 디버깅 어려움
    - log, thread dumps, 모니터링 도구 등을 활용해 문제 탐지 & 진단
    - VisualVM 과 같은 도구 사용해 상태 확인

## 3. Practical Examples

### ◆ Multithreaded Sorting Algorithm - Merge Sort

- 목적
    - 작업 분할 + 병렬 실행으로 효율적인 정렬
    - 분할 정복 [[알고리즘]](divide-and-conquer), 배열을 나누고 각 부분을 정렬한 뒤 병합
- 작동 방식
    1. 배열 절반 나누기. 절반을 다른 thread로 병렬로 정렬
    2. 정렬된 결과를 병합해 최종 정렬 배열 생성
    3. 각 하위 작업(subtask)를 별도의 thread로 실행.
- Code
    - Main
        
        ```java
        public class ForkJoinMergeSort {
            public static void main(String[] args) {
                int[] array = {38, 27, 43, 3, 9, 82, 10};
        
                System.out.println("Original array: " + Arrays.toString(array));
        
                // Sort the array using ForkJoinPool
                ForkJoinPool pool = new ForkJoinPool();
                pool.invoke(new MergeSortTask(array, 0, array.length - 1));
        
                System.out.println("Sorted array: " + Arrays.toString(array));
            }
        }
        ```
        
    - MergeSortTask
        
        ```java
        // RecursiveAction subclass to handle the merge sort tasks
        class MergeSortTask extends RecursiveAction {
            private final int[] array;
            private final int left;
            private final int right;
        
            public MergeSortTask(int[] array, int left, int right) {
                this.array = array;
                this.left = left;
                this.right = right;
            }
        
            @Override
            protected void compute() {
                if (left < right) {
                    int mid = (left + right) / 2;
        
                    // Recursively sort each half
                    MergeSortTask leftTask = new MergeSortTask(array, left, mid);
                    MergeSortTask rightTask = new MergeSortTask(array, mid + 1, right);
        
                    // Fork tasks for parallel execution
                    invokeAll(leftTask, rightTask);
        
                    // Merge the sorted halves
                    merge(left, mid, right);
                }
            }
        
            // Merge two sorted halves of the array
            private void merge(int left, int mid, int right) {
                int[] temp = new int[right - left + 1];
                int i = left, j = mid + 1, k = 0;
        
                // Merge elements from left and right halves into temp
                while (i <= mid && j <= right) {
                    if (array[i] <= array[j]) {
                        temp[k++] = array[i++];
                    } else {
                        temp[k++] = array[j++];
                    }
                }
        
                // Copy any remaining elements from the left half
                while (i <= mid) {
                    temp[k++] = array[i++];
                }
        
                // Copy any remaining elements from the right half
                while (j <= right) {
                    temp[k++] = array[j++];
                }
        
                // Copy sorted temp array back to the original array
                System.arraycopy(temp, 0, array, left, temp.length);
            }
        }
        ```
        
    - Result
        
        ```java
        Original array: [38, 27, 43, 3, 9, 82, 10]
        Sorted array: [3, 9, 10, 27, 38, 43, 82]
        ```
        
    

### ◆ Building a Simple Server with Thread Pool

- 목적
    - Fixed thread pool 사용해 여러 [[클라이언트]] 요청 동시 처리.
    - 리소스 사용 제한 → 응답 시간 개선
    - [[서버]]가 다수의 클라이언트 요청 처리 시, 각 요청을 사용할 수 있는 thread 에 분배해 처리.
- 작동 방식
    1. 서버는 들어오는 클라이언트 요청 수신.
    2. 각 요청은 fixed thread pool에 작업으로 제출, 병렬로 처리
    3. 리소스를 효과적으로 관리 & 동시 여러 요청 처리
- Code
    
    ```java
    public class SimpleMultithreadedServer {
        private static final int PORT = 8080;
        private static final int THREAD_POOL_SIZE = 5;
    
        public static void main(String[] args) {
            // Create a thread pool with a fixed number of threads
            ExecutorService threadPool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    
            try (ServerSocket serverSocket = new ServerSocket(PORT)) {
                System.out.println("Server is listening on port " + PORT);
    
                // Continuously accept client connections
                while (true) {
                    Socket clientSocket = serverSocket.accept();
                    System.out.println("New client connected");
    
                    // Handle client request in a separate thread from the pool
                    threadPool.submit(() -> handleClientRequest(clientSocket));
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    
        // Method to handle each client's request
        private static void handleClientRequest(Socket socket) {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                 PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {
    
                // Read client request
                String clientMessage = in.readLine();
                System.out.println("Received from client: " + clientMessage);
    
                // Send a response back to the client
                out.println("Hello from the server!");
    
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                try {
                    socket.close(); // Close the client socket
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    ```
    

### ◆ Real-Time Data Processing with BlockingQueue

- 목적
    - 생산자-소비자 패턴을 활용한 데이터 처리 pipeline 시뮬레이션
    - `BlockingQueue` 는 대기-알림(wait-notify) 메커니즘 내부적 관리 → 동기화 단순화
- 작동 방식
    1. 생산자 : 지속적 데이터 생성 → 공유 `BlockingQueue`에 추가
    2. 소비자 : 지속적으로 `BlockingQueue` 에서 데이터 가져와 처리
    3. `BlockingQueue`는 큐가 가득 찼을 때 생산자를 차단하고, 비었을 때 소비자를 차단하여 데이터 흐름을 제어.
- Code
    
    ```java
    import java.util.Random;
    import java.util.concurrent.BlockingQueue;
    import java.util.concurrent.ExecutorService;
    import java.util.concurrent.Executors;
    import java.util.concurrent.LinkedBlockingQueue;
    import java.util.concurrent.TimeUnit;
    
    public class ProducerConsumerExample {
        private static final int QUEUE_CAPACITY = 10;
        private static final BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(QUEUE_CAPACITY);
    
        public static void main(String[] args) {
            ExecutorService executor = Executors.newFixedThreadPool(2);
    
            // Submit Producer and Consumer tasks to the executor
            executor.submit(new Producer());
            executor.submit(new Consumer());
    
            // Shutdown executor after some time
            executor.shutdown();
            try {
                if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
            }
        }
    
        // Producer class that produces data and adds it to the queue
        static class Producer implements Runnable {
            @Override
            public void run() {
                while (true) {
                    try {
                        int data = new Random().nextInt(100);
                        queue.put(data); // Blocks if queue is full
                        System.out.println("Produced: " + data);
                        Thread.sleep(500); // Simulate production time
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
    
        // Consumer class that consumes data from the queue
        static class Consumer implements Runnable {
            @Override
            public void run() {
                while (true) {
                    try {
                        Integer data = queue.take(); // Blocks if queue is empty
                        System.out.println("Consumed: " + data);
                        Thread.sleep(1000); // Simulate consumption time
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
    }
    
    ```
