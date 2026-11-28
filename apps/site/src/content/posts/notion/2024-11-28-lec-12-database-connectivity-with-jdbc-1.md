---
title: Lec 12 - Database Connectivity with JDBC (1)
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f9780eb9ed3c2ef4333def1
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 12
---

---

---

## 1. Introduction to JDBC

### ◆ Definition of a Database

- 개요
    - Database : 데이터를 효율적으로 저장, 검색, 관리 할 수 있도록 구성된 데이터의 집합
    - 관계형 데이터 베이스(SQL) → 테이블 형식
    - NoSQL 데이터베이스(MongoDB) → 문서 형식
        
        → 다양한 형식 존재
        
- 어플에서의 역할
    - 대규모 데이터 저장 지원 → 높은 데이터 볼륨 & 신뢰성 필요 어플에 필요.
    - 빠른 데이터 접근 제공 → 실시간 데이터 검색 & 처리 필요 어플에 필요.
- 장점
    - Centralized Data Management (중앙 집중화 된 데이터 관리)
        - 여러 사용자 & 시스템이 데이터를 일관되게 저장 & 업데이트 & 검색할 수 있도록 지원
        - 온라인 소매, 소셜 미디어, 기업 시스템처럼 협업 또는 대규모 데이터를 처리하는 애플리케이션에 매우 중요
    - Data Integrity (데이터 무결성)
        - 고유 ID, 데이터 타입 등의 규칙 & 제약 조건 강제 → 데이터의 정확성 & 일관성 보장
        - 데이터 중복 방지, 유효한 데이터 입력 보장. 데이터 테이블 간의 관계 유지.
    - Scalability (확장성)
        - 비즈니스나 애플리케이션이 확장됨에 따라 증가하는 데이터 볼륨을 처리하도록 설계.
        - 여러 서버에 데이터를 분산시켜 대규모 사용자 기반 지원 가능
    - Efficient Data Retrieval (효율적인 데이터 검색)
        - 복잡한 쿼리 지원을 통해 특정 데이터를 빠르고 효과적으로 검색 가능.
        - 정렬, 필터링, 그룹화 가능 → 분석 & 데이터 기반 의사결정에 필수적.

### ◆ Defining JDBC

- 정의
    - JDBC(Java Database Connectivity) : 관계형 DB에 연결 & 상호작용 하기 위해 Java에서 제공하는 API
    - SQL 쿼리 실행, 데이터 검색, DB 업데이트 가능하게 함.
- 주요 기능
    - DB 연결 : Java 어플과 DB 간의 연결 설정.
    - SQL 명령 실행 : SELECT, INSERT, UPDATE, DELETE 와 같은 SQL 작업 지원.
    - 데이터 검색 & 업데이트 : Java 코드에서 직접 데이터 읽기 & 수정 가능

## 2. JDBC Architecture and Components

### ◆ JDBC Core Components

- JDBC Driver Manager
    - DB 드라이버를 관리 & 연결 설정
    - 적절한 DB 드라이버로 연결 요청을 전달하는 중앙 구성 요소.
- JDBC Driver
    - JDBC 호출을 대상 DB에서 이해할 수 있는 형식으로 변환하는 소프트웨어 구성 요소
    - MySQL, PostgreSQL, Oracle 과 같은 DB에 대해 다양한 드라이버 존재.
- JDBC API
    - DB 연결, SQL 명령 실행, 쿼리 결과 관리를 위한 표준 인터페이스 & 클래스 제공.

### ◆ How JDBC Components Work Together

- 애플리케이션은 JDBC API를 통해 요청을 보냄
- DriverManager은 연결 URL에 따라 적절한 JDBC 드라이버 선택.
- JDBC Driver은 Java 애플리케이션과 DB 간의 통신 지원.

### ◆ Types of JDBC Drivers

1. JDBC-ODBC Bridge Driver
    - 설명
        - JDBC 호출을 ODBC 호출로 변환.
        - Java 어플과 ODBC 호환 DB 간의 다리 역할
    - 사용 시점
        - 레거시 DB나 ODBC를 통해서만 접근 가능한 DB 연결 시 사용
        
        ex) Java 어플 - Microsoft Access DB 연결
        
    - 주의 사항
        - Java 8 이후로 지원 X, 새로운 어플에서 사용 권장 X
2. Native-API/Partially Java Driver
    - 설명
        - DB의 API에 특화된 네이티브 코드 라이브러리를 호출하기 위해 Java wrapper 사용.
        - 클라이언트의 기계에 DB 제공 업체의 클라이언트 라이브러리가 필요함.
    - 사용 시점
        - 클라이언트 머신에 네이티브 라이브러리가 있는 경우
        
        ex) Oracle의 네이티브 클라이언트 라이브러리를 사용해 Java 어플 - Oracle DB 연결
        
    - 주의 사항
        - 플랫폼에 종속적인 라이브러리에 의존 → 클라이언트가 서버가 호환되는 운영 체제에서 실행되어야 함.
3. Network Protocol/All-Java Driver
    - 설명
        - 네트워크 기반 드라이버, 미들웨어 서버와 통신하며 DB와 상호작용.
        - 여러 DB를 지원해야 하는 클라이언트-서버 아키텍처에서 유리함.
    - 사용 시점
        - 여러 DB에 연결해야 할 때
        - 클라이언트 머신에 네이티브 드라이버 설치 X 일 때
        
        ex) Oracle, MySQL 등 여러 DB에 연결해야 하는 어플에서 미들웨어 서버를 통해 사용
        
    - 주의 사항
        - 미들웨어 서버가 DB 요청과 라우팅 처리 → 추가적 복잡성 O
        - 여러 유형의 DB에 접근 가능
4. Thin Driver/Pure Java Driver
    - 설명
        - 순수 Java로 작성된 드라이버. JDBC 호출을 DB에 특화된 프로토콜 호출로 직접 변환
        - 네이티브 라이브러리나 ODBC 브릿지를 필요로 하지 않아 가장 널리 사용되는 드라이버 유형.
    - 사용 시점
        - Java로 현대적 DB에 직접 연결할 때 사용. 대부분 DB가 Type 4 드라이버 제공.
        
        ex) MySQL, PostgreSQL, Oracle DB에 직접 연결
        
    - 주의 사항
        - 순수 Java로 작성되어 네이티브 라이브러리 필요 X
            
            → 대부분의 Java 어플에서 선호
            

## 3. Setting Up Database Connection

### ◆ Prerequisites for Establishing a JDBC Connection

- DB Server
    - DB 서버가 설치되고 실행 중이어야 함(ex. MySQL, PostgreSQL, Oracle)
    - DB 설정에는 DB 생성, 테이블 생성, 사용자 접근 설정 등이 포함될 수 있음.
- DB Driver
    - Driver Requirement(드라이버 요구 사항)
        - 각 DB(ex. MySQL, Oracle)는 특정 JDBC 드라이버가 필요함.
    - Driver Download(드라이버 다운로드)
        - DB 제공업체의 웹사이트에서 JDBC 드라이버를 다운로드함.
            
            ex) MySQL의 MySQL Connector/J
            
    - Adding Driver to Project(프로젝트에 드라이버 추가)
        - JDBC 드라이버를 프로젝트의 classpath에 포함하여 연결 가능하도록 함.

### ◆ Steps to Set Up JDBC

1. 필요한 DB 서버 설치
2. 사용 중인 특정 DB에 맞는 JDBC Driver 다운로드
3. 드라이버를 프로젝트 의존성에 추가
    
    ex) Java 어플인 경우 `lib` 폴더에 추가, Maven/Gradle 사용해 의존성 관리.
    

## 4. Establishing a Database Connection

### ◆ Connection String and Database Credentials

- Connection String
    - 형식 : `jdbc:<database-type>://<host>:<port>/<database-name>`
    - 구성 요소
        - `jdbc:` : JDBC 프로토콜을 나타냄
        - `<database-type>` : DB 유형 (ex. mysql, postgresql)
        - `<host>` : DB 서버의 호스트 이름 또는 IP 주소
        - `<port>` : DB 접근을 위한 포트 번호 (ex. MySQL의 기본 값은 3306)
        - `<database-name>` : 연결할 DB의 이름
    - 예시
    
    ```java
    String url = "jdbc:mysql://localhost:3306/mydatabase";
    ```
    
- Database Credentials (DB 자격 증명)
    - DB에 연결하고 인증하려면 사용자 이름 & 비밀번호 필요
    - DB 서버에 설정된 것과 일치해야 함.

### ◆ Using DriverManager to Obtain a Connection

- `DriverManager.getConnection()`
    - DB 연결을 설정하는데 사용.
    - 연결 URL, 사용자 이름, 비밀번호를 매개변수로 요구.
- Code
    
    ```java
    public class OracleConnectionExample {
        public static void main(String[] args) {
            String url = "jdbc:oracle:thin:@localhost:1521:orcl";
            String username = "system";
            String password = "oracle";
    
            try {
                // Oracle 데이터베이스에 연결 설정
                Connection connection = DriverManager.getConnection(url, username, password);
                System.out.println("Oracle 데이터베이스에 성공적으로 연결되었습니다!");
    
                // 데이터베이스 작업 수행
                
                connection.close(); // 연결 종료
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    
    ```
    
    - URL : `"jdbc:oracle:thin:@localhost:1521:orcl"`
    - `jdbc:oracle:thin:@`: Oracle의 Thin 드라이버 프로토콜을 나타냄.
    - `localhost:1521`: Oracle 서버가 실행 중인 호스트 이름과 포트 번호.
    - `orcl`: Oracle 시스템 식별자(SID) 또는 데이터베이스 이름.

## 5. CRUD Operations Overview

### ◆ Defining CRUD Operations

- CRUD
    - Create, Read, Update, Delete : DB와 상호 작용하기 위한 네 가지 기본 작업.
    - 각 CRUD 작업은 DB 내 데이터 조작의 기본 기능. 완전한 데이터 관리 보장.
    - 애플리케이션이 데이터와 상호 작용하는 기본적 기능 제공.
- SQL Command
    - Create : INSERT - 테이블에 새 레코드 추가
    - Read : SELECT - DB에서 데이터 검색
    - Update : UPDATE - 기존 레코드 수정.
    - Delate : DELETE - 테이블에서 레코드 삭제

### ◆ CREATE Operation - Inserting Data

- JDBC로 레코드 생성
    - SQL INSERT 문
        - 테이블에 새로운 레코드 추가 시 사용.
        
        ```sql
        INSERT INTO <table_name> (column1, column2) VALUES (value1, value2);
        ```
        
    - JDBC 구현
        - `Statement` 또는 `PreparedStatement` 객체 사용
        - Code
            
            ```java
            String query = "INSERT INTO users (id, name, email) VALUES (1, 'John Doe', 'john@example.com')";
            Statement statement = connection.createStatement();
            int rowsInserted = statement.executeUpdate(query);
            System.out.println("Rows inserted: " + rowsInserted);
            ```
            
            - `executeUpdate()` 는 DB를 수정하는 SQL 문을 실행하는 데사용.
            - `rowsInserted` 는 삽입된 행 수를 반환 → 삽입이 성공적으로 이뤄졌는지 확인

### ◆ READ Operation - Retrieving Data

- JDBC로 레코드 읽기
    - SQL SELECT 문
        - 특정 조건에 따라 DB에서 데이터 검색
        
        ```sql
        SELECT column1, column2 FROM <table_name> WHERE condition;
        ```
        
    - JDBC 구현
        - `Statement` 또는 `PreparedStatement` 객체 사용
        - Code
            
            ```java
            String query = "SELECT id, name, email FROM users WHERE id = 1";
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(query);
            
            while (resultSet.next()) {
                int id = resultSet.getInt("id");
                String name = resultSet.getString("name");
                String email = resultSet.getString("email");
                System.out.println("ID: " + id + ", Name: " + name + ", Email: " + email);
            }
            ```
            
            - `executeQuery()`는 쿼리 결과를 포함한 `ResultSet` 객체를 반환
            - `resultSet.next()`는 결과 집합의 각 행을 반복하며 데이터를 검색

### ◆ UPDATE Operation - Modifying Data

- JDBC로 레코드 업데이트
    - SQL UPDATE 문
        - 특정 조건에 따라 테이블의 기존 레코드 수정할 때 사용
        
        ```sql
        UPDATE <table_name> SET column1 = value1 WHERE condition;
        ```
        
    - JDBC 구현
        - `Statement` 또는 `PreparedStatement` 객체 사용
        - `executeUpdate()`는 UPDATE 명령을 실행하고 수정된 행 수를 반환
        - Code
            
            ```java
            String query = "UPDATE users SET email = 'john.new@example.com' WHERE id = 1";
            Statement statement = connection.createStatement();
            int rowsUpdated = statement.executeUpdate(query);
            System.out.println("Rows updated: " + rowsUpdated);
            ```
            
            - `executeUpdate()`는 UPDATE 명령을 실행하고 수정된 행 수를 반환
            - `rowsUpdated`는 성공적으로 수정된 레코드 수를 나타내며, 작업의 성공 여부를 확인할 수 있음.

### ◆ DELETE Operation - Removing Data

- JDBC로 레코드 삭제
    - SQL DELETE문
        - 특정 조건에 따라 테이블에서 레코드 삭제.
        
        ```sql
        DELETE FROM <table_name> WHERE condition;
        ```
        
    - JDBC 구현
        - `Statement` 또는 `PreparedStatement` 객체 사용
        - `executeUpdate()`는 삭제된 행 수 반환.
        - Code
            
            ```java
            String query = "DELETE FROM users WHERE id = 1";
            Statement statement = connection.createStatement();
            int rowsDeleted = statement.executeUpdate(query);
            System.out.println("Rows deleted: " + rowsDeleted);
            ```
            
            - `executeUpdate()`는 DELETE 명령을 실행하며, 삭제된 행 수를 반환
            - `rowsDeleted`는 성공적으로 삭제된 레코드 수를 나타내며, 작업의 성공 여부를 확인할 수 있음.
