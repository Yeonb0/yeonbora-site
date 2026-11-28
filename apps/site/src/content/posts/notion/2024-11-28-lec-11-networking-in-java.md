---
title: Lec 11 - Networking in Java
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f9780bbbe16f839bc4fdefa
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 11
---

---

---

## 1. Introduction to Java Networking APIs

### ◆ Overview of Java Networking Capabilities

- Java Networking
    - 데이터 교환을 위해 서로 다른 장치나 애플리케이션 간의 연결을 만드는 것.
    - Java의 네트워킹 기능은 애플리케이션이 로컬 네트워크(LAN) & 인터넷 모두에서 통신할 수 있도록 지원.
- Java의 Networking API
    - `java.net` 패키지에서 기본 네트워킹 API 제공. 이를 통해 네트워크 어플 구축 가능.
    - 클라이언트-서버 통신(ex. 웹 서버)  & peer-to-peer 데이터 교환(ex. 채팅 어플) 모두 지원
- 네트워킹의 역할 : 분산 애플리케이션 구축
    - 여러 어플이 네트워크를 통해 자원을 공유하고 통신
        
        ex) 클라이언트-서버 모델에서 서버 어플은 다수의 클라이언트 요청 동시 처리 
        
    

## 2. Java Networking Pacakage

### ◆ Overview of Key Classes and Interfaces

- `Socket`
    - 두 기계 간의 통신을 위한 endpoint. TCP 연결을 통해 직접 데이터 전송 가능.
    - 신뢰할 수 있는 데이터 전송이 필요한 클라이언트-서버 설정에서 사용.
- `ServerSocket`
    - 서버 측 class, 클라이언트의 연결 요청 수신
    - 클라이언트 요청 수락&응답 해야 하는 서버 어플 생성 시 필수적.
- `URL`
    - 인터넷 리소스를 접근할 수 있는 주소를 나타내는 Uniform Resource Locator(통합 자원 위치 지정자) 표현
    - 파일 다운로드, API 콘텐츠 가져오기 등 웹 리소스 가져오는 데 사용.
- `HttpURLConnection`
    - `URLConnection` 의 하위 클래스. HTTP 요청(GET, POST 등) 처리 기능
    - 웹 서비스와 연결 & 요청 전송, HTTP 응답 처리. REST API와의 상호작용.

### ◆ High-Level vs. Low-Level Networking

- Socket 기반 네트워킹
    - `Socket` 과 `ServerSocket` 사용. 커스터마이징 가능한 저수준 통신 제공
    - 데이터 흐름에 대한 세부 제어 가능. 실시간 통신 & 채팅 어플에 적합
- URL 기반 네트워킹
    - 인터넷 상의 리소스에 고수준으로 접근 가능, 소켓 관리 복잡성 추상화
    - 파일 다운로드, API와의 상호작용 등 웹 리소스 접근에 적합

### ◆ Why is Networking Important?

- 애플리케이션이 장치 간의 통신 & 상호작용 가능하게 함.
- 사례
    1. 웹 서비스 & API
        - `HttpURLConnection`을 사용하여 API와 상호작용, 외부 서비스와 데이터를 교환 (예: REST API).
    2. 실시간 데이터 어플 : 소켓을 통해 서버로부터 실시간 데이터 수신
        
        ex) 주식 시장 추적기, 날씨 업데이트 등. 
        
    3. 채팅 & 커뮤니케이션 어플 
        - 클라이언트-서버 또는 peer-to-peer 지원해 채팅 애플리케이션을 구현
    4. 분산 시스템 
        - 여러 어플이 리소스 공유 & 분산 컴퓨팅 수행
            
            → 부하 분산 & 클라우드 컴퓨팅 애플리케이션.
            
- Java Networking 장점
    1. 플랫폼 독립성
        - 네트워크 어플이 다양한 운영 체제에서 실행 가능
            
            → 매우 유연 & 호환성 뛰어님
            
    2. 강력한 라이브러리
        - 네트워킹 라이브러리가 잘 문서화 되어 있음.
        - 다양한 네트워크 조건에서도 안정적 & 일관된 성능 제공

## 2. Sockets and Server Sockets in Java

### ◆ What is a Socket

- 정의
    - Socket : 네트워크에서 데이터를 보내고 받는 데 사용 되는 endpoint
    - 두 장치 간의 통신 가능하게 함. 전용 통신 채널 제공
- 동작 방식
    - 클라이언트 : 소켓 생성 & 서버와 연결 시작
    - 서버 : `ServerSocket` 통해 들어오는 연결 대기, 연결 이뤄지면 클라이언트와 통신.

### ◆ Type of Sockets

- TCP Socket
    - 설명 : 신뢰할 수 있는 연결 지향형 통신 제공
    - 특징 : 데이터 전달 보장, 데이터 순서 유지, 오류 검증 제공
    - 사용 사례 : 웹 서버, 파일 전송, 채팅 어플
- UDP Socket
    - 설명 : 비연결형, 빠른 통신 제공, but 데이터 전달 보장 X
    - 특징 : 오류 검증 X, 데이터 순서 유지 X, 데이터 유실 가능성 존재
    - 사용 사례 : 실시간 스트리밍, 온라인 게임, 실시간 센서 데이터

### ◆ Creating a Client Socket with the `Socket` Class

- 목적
    - `Socket` 클래스는 클라이언트가 서버에 연결하고 양방향 통신을 할 수 있도록 함.
    - 클라이언트 socket은 서버에 연결을 시작, 데이터 송수신 가능하게 함.
- 메소드
    - `connect()`
        - socket을 서버의 주소와 포트에 연결.
    - `getInputStream()`
        - 서버로부터 데이터를 읽기 위한 입력 스트림 가져옴.
    - `getOutputStream()`
        - 서버로 데이터를 보내기 위한 출력 스트림 가져옴.
    - `close()`
        - socket 연결 종료. 리소스 해제.
- Code
    
    ```java
    try {
    	Socket clientSocket = new Socket("localhost", 8080); // Connect to server
    	OutputStream output = clientSocket.getOutputStream();
    	InputStream input = clientSocket.getInputStream();
    	// Perform communication
    	clientSocket.close(); // close connection
    } catch (IOExeception e) {
    	e.printStackTrace();
    }
    ```
    
    → 클라이언트가 socket을 만들고, [localhost:8080](http://localhost:8080) 서버와 연결
    
    → `getOutputStream()` ,`getInputStream()`  사용해 서버와 데이터 주고 받음.
    

### ◆ `ServerSocket` Class for Listening to Client Connections

- 목적
    - `ServerSocket` : 네트워크 연결에서 서버 측 구성 요소. 클라이언트의 들어오는 연결 요청 대기.
    - 서버는 각 클라이언트 연결 요청 수락 & new Socket 생성 → 해당 클라이언트와의 통신 관리.
- 메소드
    - `accept()`
        - 클라이언트 연결 요청 대기, 연결 되면 통신 설정
    - `bind()`
        - `ServerSocket` 을 특정 포트 및 로컬 IP 주소에 바인딩
    - `close()`
        - 서버 소켓을 닫아 더 이상 연결 요청 수신 X
- Code
    
    ```java
    try {
    	ServerSocket serverSocket = new ServerSocket(8080); // bind to port 8080
    	System.out.println("Server is listening...");
    	Socket clientSocket = serverSocket.accept(); // accept client connection
    	InputStream input = clientSocket.getInputStream();
    	OutputStream output = clientSocket.getOutputStream();
    	//Communication with client
    	clientSocket.close();
    	serverSocket.close();
    } catch (IOExeception e) {
    	e.printStackTrace();
    }
    ```
    
    → 서버 소켓은 포트 8080에 바인딩, 클라이언트 연결 요청 대기
    
    → 클라이언트가 연결되면, `accept()`가 새로운 소켓을 반환, 이를 통해 클라이언트와 통신을 수행.
    

### ◆ Example Code - TCP Client and Server

- Server code
    - `ServerSocket` 생성, 지정된 포트에서 연결 대기.
    - Code
        
        ```java
        // 서버
        try (ServerSocket serverSocket = new ServerSocket(8080)) {
            System.out.println("Server listening on port 8080");
            Socket clientSocket = serverSocket.accept(); // 클라이언트 연결 대기
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
        
            String message = in.readLine();
            System.out.println("Received from client: " + message);
            out.println("Message received: " + message);
        
            clientSocket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        ```
        
- Client code
    - 서버에 `Socket` 연결 설정, 메세지 전송, 응답 받고 연결 닫기.
    - Code
        
        ```java
        // 서버
        try (ServerSocket serverSocket = new ServerSocket(8080)) {
            System.out.println("Server listening on port 8080");
            Socket clientSocket = serverSocket.accept(); // 클라이언트 연결 대기
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
        
            String message = in.readLine();
            System.out.println("Received from client: " + message);
            out.println("Message received: " + message);
        
            clientSocket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        ```
        

## 3. Working with URLs in Java

### ◆ The `URL` Class in Java

- 정의
    - URL(Uniform Resource Locator) : 웹 주소, Java 어플이 인터넷 리소스에 접근할 수 있도록 함.
    - Java의 `URL` 클래스는 리소스에 대한 정보(프로토콜, 호스트, 포트, 파일 경로)를 캡슐화.
- 구조
    - Protocol(프로토콜) : 통신에 사용되는 프로토콜(HTTP, HTTPS, FTP)
    - Host(호스트) : 리소스를 호스팅하는 서버 이름 / IP 주소
    - Port(포트) : 서버가 수신 대기 중인 네트워크 포트(선택 사항, 기본값은 80)
    - File(파일) : 서버의 특정 리소스 경로
- 메소드
    - `getProtocol()`
        - URL에서 사용된 프로토콜 반환
    - `getHost()`
        - URL의 호스트 구성 요소 반환
    - `getPort()`
        - 포트 번호 반환. 지정되지 않았으면 -1 반환
    - `getFile()`
        - 매개변수를 포함한 파일 경로 반환
- Code
    
    ```java
    URL url = new URL("https://www.example.com:8080/page");
    System.out.println("Protocol: " + url.getProtocol());
    System.out.println("Host: " + url.getHost());
    System.out.println("Port: " + url.getPort());
    System.out.println("File: " + url.getFile());
    ```
    

### ◆ Connecting to Web Resources with `HttpURLConnection`

- 정의
    - Java의 `URLConnection` 의 하위 클래스, HTTP 요청 보냄 & HTTP 응답 처리
    - 웹 리소스 연결 & 데이터 전송 & 응답 읽기 메소드 제공.
    - REST API 및 인터넷 컨텐츠 로드에 유용.
- 메소드
    - `connect()`
        - URL 에 대한 연결 열기.
    - `getResponseCode()`
        - HTTP 응답 코드 반환
            
            ex) 200(OK), 404(Not Found)
            
    - `getInputStream()`
        - 서버로부터 응답 데이터를 읽기 위한 입력 스트림 제공
    - `disconnect()`
        - 연결을 닫아 리소스 해제.

### ◆ Example Code - Fetching Data from a Web Server

- Code
    
    ```java
    URL url = new URL("https://jsonplaceholder.typicode.com/posts/1");
    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
    connection.setRequestMethod("GET");
    connection.connect();
    
    // HTTP 응답 코드 확인
    int responseCode = connection.getResponseCode();
    if (responseCode == HttpURLConnection.HTTP_OK) {
        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        String line;
        StringBuilder responseContent = new StringBuilder();
        while ((line = reader.readLine()) != null) {
            responseContent.append(line);
        }
        reader.close();
        System.out.println("Response: " + responseContent.toString());
    } else {
        System.out.println("Error: HTTP response code " + responseCode);
    }
    
    connection.disconnect();
    ```
    

## 4. Building a Simple Client-Server Application

### ◆ Defining the Application : Chat or Echo Server

- 개요
    - 클라이언트 → 서버 메세지 전송 시 서버가 응답하는 Chat 또는 Echo 서버 구축
    - Echo 서버는 : 서버가 클라이언트에게 받은 메세지를 그대로 반환
- Client-Server 모델 디자인
    - Server : Client의 연결 요청 대기, 다중 연결 동시 처리 위해 각 Client에 대해 별도 thread 생성
    - Client : Server에 연결해 메세지 전송, Server 로부터의 응답 수신
- 목표
    - 여러 클라이언트를 동시에 관리할 수 있는 확장 가능한 서버 생성
    - 클라이언트-서버 간 원활한 통신, 서버는 각 메세지를 확인 & 응답.

### ◆ Setting up the Server

- `ServerSocket` 을 이용해 클라이언트 연결 처리
    - 지정된 포트에서 클라이언트 연결 요청 대기
    - 새 클라이언트 연결 마다 서버는 통신을 처리하기 위해 새 thread 생성
- 주요 구성 요소
    - `ServerSocket` : 들어오는 연결 수신
    - `Thread` : 각 클라이언트 연결은 별도의 thread 에서 실행. 동시에 여러 클라이언트 처리.
- Code
    
    ```java
    import java.io.*;
    import java.net.*;
    
    public class EchoServer {
        public static void main(String[] args) {
            try (ServerSocket serverSocket = new ServerSocket(8080)) {
                System.out.println("Server listening on port 8080");
    
                // Continuously listen for client connections
                while (true) {
                    Socket clientSocket = serverSocket.accept(); // Accepts new client
                    System.out.println("Client connected");
                    new Thread(new ClientHandler(clientSocket)).start(); // Start new thread for client
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    // ClientHandler class to handle communication with a single client
    class ClientHandler implements Runnable {
        private Socket clientSocket;
    
        public ClientHandler(Socket clientSocket) {
            this.clientSocket = clientSocket;
        }
    
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                 PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)) {
    
                String message;
                // Read messages from the client and echo them back
                while ((message = in.readLine()) != null) {
                    System.out.println("Received: " + message);
                    out.println("Echo: " + message); // Send response back to client
                }
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                try {
                    clientSocket.close();
                    System.out.println("Client disconnected");
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    ```
    

### ◆ Setting up the Client

- `Socket` 을 사용한 클라이언트 통신
    - 서버의 IP 주소와 포트에 연결
    - 클라이언트는 서버로 메세지 전송, 서버로부터 응답 수신
- 주요 구성 요소
    - `Socket` : 지정된 IP와 포트를 통해 서버에 연결
    - 입력 및 출력 스트림 : 메세지 전송 & 수신에 사용.
- Code
    
    ```java
    import java.io.*;
    import java.net.*;
    
    public class EchoClient {
        public static void main(String[] args) {
            try (Socket clientSocket = new Socket("localhost", 8080);
                 BufferedReader consoleInput = new BufferedReader(new InputStreamReader(System.in));
                 PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
                 BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()))) {
    
                String userInput;
                System.out.println("Connected to server. Type a message:");
    
                // Send user input to the server and read server's response
                while ((userInput = consoleInput.readLine()) != null) {
                    out.println(userInput); // Send message to server
                    System.out.println("Server response: " + in.readLine()); // Receive server response
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
    
    ```
    

### ◆ Complete Client-Server Application Walkthrough

- Server 프로세스
    - `ServerSocket`이 포트에서 연결 수신&수락
    - 각 클라이언트 연결 in new thread, 입력 읽고, 응답 보내기.
- Client 프로세스
    - `Socket` 사용 서버 연결
    - 사용자 메세지 → 서버 / 서버로부터 응답 출력
- Example
    
    ```java
    Client: "Hello, server!"
    Server: "Echo: Hello, server!"
    ```
    
- 예외 처리 : `IOExeception` 처리 위해 `try-catch` 블록 사용
- 리소스 관리 : 소켓과 스트림은 사용 후 반드시 close.

## 5. Handling Network Exceptions

### ◆ Common Network Exceptions

- **`UnknownHostException`:**
    - 지정된 호스트를 확인할 수 없을 때.
        
        ex) 잘못되거나 접근할 수 없는 서버 주소에 연결을 시도할 경우.
        
- **`IOException`:**
    - 입출력 오류에 대한 일반적인 예외. 데이터 스트림 읽기/쓰기 문제를 포함.
        
        ex) 네트워크 연결이 중단되거나 리소스를 사용할 수 없을 때 발생.
        
- **`SocketException`:**
    - 기본 소켓에 오류가 있을 때 발생. 예를 들어, 연결이 리셋되거나 타임아웃이 발생했을 경우.
        
        ex) 서버가 갑자기 연결을 종료했을 때.
        

### ◆ Best Practices for Exception Handling

- `try-catch` 블록 사용
    - 특정 예외 처리 위해 사용해, 목표에 맞는 응답 & 로깅 구현
- Graceful Error Handling
    - 사용자에게 친화적인 오류 메세지를 제공 / 대체 동작 수행
- 리소스 관리
    - 소켓과 스트림을 항상 `finally` 블록에서 닫거나, `try-with-resources` 사용해 오류 발생 여부와 관계없이 리소스 해제.

## 6. Extra Information about Networking

### ◆ Basic Security Measures

- Data Encryption (데이터 암호화)
    - SSL/TLS 와 같은 암호화 사용해 데이터 전송 보호 & 가로채기, 무단 엑세스 방지
    - Java는 `SSLSocket` 제공해 안전한 통신 채널 지원
- Authentication (인증)
    - API 키, 토큰, SSL 인증서 등을 사용해 인증 구현, 허가된 클라이언트와 서버만 연결 허용
- Access Control (접근 제어)
    - 특정 IP를 제한하거나 방화벽 사용 → 무단 사용자 연결 방지
- Validation (검사)
    - 공격 및 악의적 입력 방지 위해 들어오는 데이터 항상 검증.

### ◆ Techniques for Efficient Data Transmission

- Using Buffers (버퍼 사용)
    - 네트워크로의 직접적 읽기/쓰기 작업 수 감소 → 성능 향상
    - `BufferedInputStream`과 `BufferedOutputStream`을 사용하여 데이터 처리 최적화.
- Managing Data Packet Sizes (데이터 패킷 크기 관리)
    - 데이터가 적절한 크기의 패킷으로 전송되도록 제어 → 네트워크 혼잡 & 지연 감소
    - 작은 패킷을 배치에 오버헤드 최소화 고려.
- Minimizing Latency (지연 시간 최소화)
    - 지연을 줄이기 위해 서버를 사용자 근처에 배치(엣지 서버, CDN)
    - 데이터 처리 최적화 → 불필요한 전송 및 처리 지연 방지.
- Code
    
    ```java
    try (Socket socket = new Socket("localhost", 8080);
         BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
         BufferedWriter out = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()))) {
    
        out.write("Hello, Server!\n");
        out.flush();
        System.out.println("Response: " + in.readLine());
    
    } catch (IOException e) {
        e.printStackTrace();
    }
    ```
