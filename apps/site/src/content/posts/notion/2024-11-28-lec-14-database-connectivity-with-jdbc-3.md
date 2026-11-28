---
title: Lec 14 - Database Connectivity with JDBC (3)
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f9780a38190eeeebe81643b
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 14
---

---

---

## 1. PreparedStatement

### ◆ Introduction to PreparedStatement

- 정의
    - `PreparedStatement` : 미리 컴파일 된 SQL 문, 파라미터화 된 쿼리 지원
    - SQL 쿼리는 한 번 컴파일 된 후 여러 번 재사용 가능 → 성능 & 보안 모두 개선
- 장점
    - Performance(성능) : 한 번 컴파일 & 여러 번 재사용 → 반복적 쿼리 실행 시 더 빠르게 실행
    - Security(보안) : SQL 구조 & 데이터 분리 → SQL injection 공격으로부터 보호.

### ◆ Advantages of PreparedStatement

- SQL Injection 방지
    - SQL Injection : 공격자가 악의적인 SQL 코드를 쿼리에 넣어 실행하게 하는 공격
    - 보호 방법 : `PreparedStatement` 는 플레이스 홀더 **`(?)`** 를 사용해 SQL 구조와 데이터 값 분리 → 쿼리 구조 변경 어렵게 만듬
- 향상된 성능
    - Precompilation : SQL 쿼리는 한 번 컴파일 되고 저장 → 반복 실행 시 오버헤드 감소
    - Reusability : 파라미터화 된 쿼리 사용 → 동일한 쿼리를 다른 데이터 값과 함께 여러 번 실행 가능 → 효율성 증가
- 유지보수 용이성
    - 파라미터화 된 쿼리 → 구조 변화 X 값만 변경 - 코드 유지 보수 간단.

### ◆ Example of Using PreparedStatement

- Parameterization(파라미터화)
    - `PreparedStatement` 는 값에 대해 placeholder `?` 사용.
        
        → 이후 코드에서 값 설정해 쿼리 실행
        
- Code
    
    ```java
    String query = "SELECT * FROM users WHERE id = ?";
    PreparedStatement preparedStatement = connection.prepareStatement(query);
    preparedStatement.setInt(1, userId); // 첫 번째 플레이스홀더에 값을 설정
    ResultSet resultSet = preparedStatement.executeQuery();
    ```
    
    - `prepareStatement(query)`: 플레이스홀더를 포함한 SQL 쿼리를 컴파일.
    - `setInt(1, userId)`: 첫 번째 플레이스홀더(?)에 값을 설정.
    - `executeQuery()`: 파라미터화된 쿼리를 실행, 결과를 ResultSet으로 반환.

### ◆ How PreparedStatement Works

- 파라미터화된 쿼리
    - SQL 명령과 데이터 입력 분리
    - PlaceHolder `?` 가 파라미터로 사용. 특정 메소드(`setInt` , `setString` ) 통해 값 설정
- SQL injection 방지 이유
    - SQL 구조는 DB에 의해 미리 정의 & 컴파일 → 입력값 통한 쿼리 조작 불가능
    - 입력값은 데이터로만 처리, 실행 가능한 SQL 해석 X

### ◆ Understanding SQL Injection

- 정의
    - 공격자가 어플 입력 필드(로그인 폼, 검색 필드 등.) 조작해 악의적 SQL 코드 쿼리에 삽입 → 보안 취약점
    - 공격 성공 시 DB 조작, 민감한 데이터를 노출, 수정, 삭제
- 작동 원리
    - 공격자는 특수하게 작성된 SQL 코드를 입력 필드에 삽입, 애플리케이션이 쿼리에 이를 추가하도록 유도.
    - 쿼리가 부적절하게 구성된 경우(예: 문자열 연결 사용), 삽입된 SQL이 쿼리 동작을 변경하여 보안 검사를 우회하거나 예기치 않은 동작 초래 가능.
- 예시
    
    ```java
    String query = "SELECT * FROM users WHERE username = '" + userInput + "'";
    // 만약 userInput이 "username' OR '1'='1"로 설정된다면, 쿼리는 다음과 같이 변환된다.
    String userInput = "username' OR '1'='1";
    SELECT * FROM users WHERE username = 'username' OR '1'='1';
    ```
    
    → `1=1` 이 항상 참 : 모든 레코드 반환
    
- SQL Injection 의 위험성
    - Data Theft(데이터 유출)
        - 공격자는 민감한 정보(사용자 데이터, 신용카드 정보, 회사 기록 등) 탈취 가능
    - Data Manipulation and Corruption (데이터 조작 및 손상)
        - 공격자가 데이터 변경 & 삭제 가능 → 레코드 손상 & 무단 변경
    - Authentiaction Bypass (인증 우회)
        - 공격자가 로그인 화면 우회해 유효한 자격 증명 없이 시스템 접근.
    - System Takeover (시스템 장악)
        - DB 서버에서 추가 명령 실행 → 시스템 장악 가능

### ◆ SQL Injection Prevention

- 항상 `PreparedStatement`  사용
    - 사용자 입력 처리 시 반드시 `PreparedStatement` 사용해 DB 쿼리 실행
- Validate and Sanitize Inputs (입력값 검증 및 정리)
    - 이메일, 숫자 같은 특정 형식을 기대하는 필드에선 입력값 검증&정리  중요
- Restrict Database Permissions (데이터베이스 권한 제한)
    - DB 사용자의 권한을 필요한 작업에만 제한.
        
        ex) 데이터 수정 필요 없는 쿼리는 읽기 전용 계정 사용.
        
- ORM Tool
    - ORM(Object-Relational Mapping) 도구 (Hibernate 등)는 파라미터화된 쿼리를 기본적으로 사용 → 더 높은 수준의 추상화 & 보안 제공

## 2. ResultSet

### ◆ Introduction to ResultSet

- 정의
    - DB 쿼리에서 검색된 데이터 저장 JDBC 객체.
    - 데이터를 행 단위로 탐색 & 추출 가능
- ResultSet 탐색 방법
    - `next()`: 커서를 다음 행으로 이동.
    - `getString(columnLabel)` 및 `getInt(columnLabel)`: 열 이름 또는 인덱스를 사용해 열 값 가져옴.
- 중요성
    - 쿼리 결과를 구조적으로 접근 가능 → 어플 내에서 데이터 쉽게 처리 가능.
- Code
    
    ```java
    while (resultSet.next()) {
        int id = resultSet.getInt("id");
        String name = resultSet.getString("name");
        String email = resultSet.getString("email");
        System.out.println("ID: " + id + ", Name: " + name + ", Email: " + email);
    }
    ```
    
    - `resultSet.next()`: 커서를 다음 행으로 이동.
    - `getInt("id")`, `getString("name")`, `getString("email")`: 열 이름을 사용해 각 열의 데이터 조회.

### ◆ Closing ResultSet and Best Practices

- Closing 의 중요성
    - `ResultSet` 객체는 DB 리소스 사용 → 닫지 않으면 메모리 누수 & 성능 문제 발생
    - 다른 작업에 사용할 수 있도록 리소스 해체
- 모범 사례
    - 항상 Close Resources: `ResultSet` , `PreparedStatement` , `Connection` 객체는 사용 후 반드시 닫기.
    - Try-With-Resource : 
    예외가 발생하더라도 리소스가 자동으로 닫히도록 `try-with-resources`를 사용.
        - Code
        
        ```java
        try (PreparedStatement preparedStatement = connection.prepareStatement(query);
             ResultSet resultSet = preparedStatement.executeQuery()) {
        
            while (resultSet.next()) {
                // 결과 데이터 처리
            }
        
        } catch (SQLException e) {
            e.printStackTrace();
        }
        ```
        

## 3. Transition Management

### ◆ Introduction to Transaction Management

- 정의
    - DB에서 실행되는 일련의 작업. 단일하고 불가분의 작업 단위로 처리.
    - transaction에 포함된 모든 작업이 성공 or 모두 실패 → 데이터 무결성 보장
- 목적
    - 데이터의 논리적 무결성 관리 + 강화
    
    ex) 은행 계좌 간의 돈 이체와 같이 여러 단계가 모두 성공 or 실패해야 하는 작업에 필수적.
    

### ◆ ACID Properties of Transactions

- Atomicity (원자성)
    - All-or-Nothing 원칙 : transaction의 모든 부분이 성공적으로 완료 or 중간에 하나라도 실패시 transaction 중단 & 모든 변경 사항 취소
- Consistency (일관성)
    - Data Integrity (데이터 무결성) : DB를 한 일관된 상태 → 또 다른 일관된 상태로 전환
    - DB 규칙과 제약 조건이 transaction이 commit 되기 전에 충족되어야 함.
- Isolation (격리성)
    - Concurrent Transactions(동시 transactions) : 상호 간섭 없이 독립적으로 실행
    - Transaction 완료 전 중간 상태는 다른 transaction에서 보이지 않음.
- Durability (지속성)
    - Persistence(영속성) : 한 번 commit 된 transaction의 결과는 시스템 장애가 발생해도 영구적으로 유지.

### ◆ JDBC Transaction Control : Auto-Commit Mode

- 정의
    - JDBC는 기본적으로 **Auto-commit mode**로 작동. 각 개별 SQL 문장이 독립적인 transaction으로 처리.
    - SQL 명령 실행 마다 DB에 자동 커밋
- 작동 방식
    - 자동 커밋 모드에서는 각`INSERT`, `UPDATE`, `DELETE`, 또는 `SELECT` 문이 실행된 후 즉시 DB에 커밋.
    - 한 번 커밋된 문장은 롤백 불가.
- 사례 : 단순 삽입 or 업데이트과 같이 데이터 일관성이 여러 단계에 의존하지 않는 어플에서 편리.

### ◆ Manual Transaction Management in JDBC

- auto-commit 끄기
    - `auto-commit` 을 false로 설정해 여러 SQL 명령을 하나의 transaction으로 그룹화 가능
- Manual Transaction Commands
    - `commit()`
        - transaction 확정. 모든 변경 사항 영구 저장
    - `rollback()`
        - transaction 시작 이후 모든 변경 사항 취소. DB 이전 상태 복원.
- Code
    
    ```java
    connection.setAutoCommit(false); // 트랜잭션 시작
    try {
        statement.executeUpdate("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
        statement.executeUpdate("UPDATE accounts SET balance = balance + 100 WHERE id = 2");
        connection.commit(); // 트랜잭션 커밋
    } catch (SQLException e) {
        connection.rollback(); // 오류 발생 시 트랜잭션 롤백
        e.printStackTrace();
    } finally {
        connection.setAutoCommit(true); // 자동 커밋 복원
    }
    ```
    

### ◆ Best Practices in Transaction Management

- 항상 `try-catch-finally` 사용
    - transaction 로직을 `try-catch-finally` 블록으로 캡슐화해 예외를 처리, 커밋 또는 롤백이 올바르게 실행되도록 함.
- Set Auto-Commit Back to True
    - Transaction 후 독립적인 SQL 명령이 필요한 경우 자동 커밋 다시 활성화.
- Minimize Transaction Scope
    - transacion 코드 블록은 가능한 작게 → 잠금 문제 줄이고 성능 향상
- Consider Isolation Levels
    - 데이터 일관성과 동시성을 균형 있게 유지하기 위해 적절한 transaction isolation 수준 사용.

- Code
    - Transaction 내에서 SQL 명령 실행
        
        ```java
        public class TransactionManagementExample {
            public static void main(String[] args) {
                String url = "jdbc:mysql://localhost:3306/your_database";
                String username = "your_username";
                String password = "your_password";
        
                Connection connection = null;
        
                try {
                    // Step 1: 데이터베이스 연결 설정
                    connection = DriverManager.getConnection(url, username, password);
        
                    // Step 2: 자동 커밋 비활성화
                    connection.setAutoCommit(false);
        
                    // Step 3: 트랜잭션 내 SQL 명령 실행
                    try (Statement statement = connection.createStatement()) {
                        statement.executeUpdate("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
                        statement.executeUpdate("UPDATE accounts SET balance = balance + 100 WHERE id = 2");
                        connection.commit();
                        System.out.println("트랜잭션이 성공적으로 커밋되었습니다.");
                    } catch (SQLException e) {
                        // Step 4: 트랜잭션 롤백
                        if (connection != null) {
                            try {
                                connection.rollback();
                                System.out.println("오류로 인해 트랜잭션이 롤백되었습니다.");
                            } catch (SQLException rollbackEx) {
                                rollbackEx.printStackTrace();
                            }
                        }
                        e.printStackTrace();
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                } finally {
                    // Step 5: 자동 커밋 복원 및 연결 닫기
                    if (connection != null) {
                        try {
                            connection.setAutoCommit(true);
                            connection.close();
                        } catch (SQLException closeEx) {
                            closeEx.printStackTrace();
                        }
                    }
                }
            }
        }
        
        ```
        
    - **자동 커밋 비활성화**: 여러 명령을 하나의 트랜잭션으로 묶기 위해 `setAutoCommit(false)`를 설정한다.
    - **트랜잭션 처리**: 트랜잭션 내에서 SQL 명령을 실행하고 성공 시 `commit()`, 실패 시 `rollback()`을 호출한다.
    - **예외 처리**: `try-catch` 블록을 사용해 예외 발생 시에도 리소스를 관리한다.
    - **자원 해제**: `finally` 블록에서 자동 커밋을 다시 활성화하고 데이터베이스 연결을 닫는다.
    - **가독성 및 안정성**: `try-with-resources`를 활용하여 `Statement`와 같은 자원을 자동으로 닫는다.
