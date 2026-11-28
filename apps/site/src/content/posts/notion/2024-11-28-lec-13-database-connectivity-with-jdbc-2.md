---
title: Lec 13 - Database Connectivity with JDBC (2)
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f978045a056e98dddabfd40
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 13
---

---

---

## 1. SQL Practices

### ◆ Creating Tables in SQL

- [[CREATE TABLE]]
    - [[데이터베이스|DB]]에 지정된 열과 데이터 유형으로 새 테이블 정의
    - 각 열에는 **이름**, **데이터 유형**, 그리고 선택적으로 **제약 조건** 포함.
- 테이블 구조
    - Columns(열) : 데이터 [[필드]] 정의
    - Constraints(제약 조건) : 데이터 [[무결성]]을 보장하기 위한 규칙 설정
        
        ex) PRIMARY KEY, UNIQUE
        
- 기본 문법
    
    ```sql
    CREATE TABLE table_name (
        column1 datatype constraint,
        column2 datatype constraint,
        ...
    );
    ```
    
- 구성 요소
    - table_name : 생성할 테이블의 이름
    - column1, column2 : 열 이름과 정의된 데이터 유형 (ex. INT, VARCHAR)
    - constraint(제약 조건) : 열 데이터에 규칙을 적용
- 주요 제약 조건
    - PRIMARY KEY : 각 레코드를 고유하게 식별 (테이블에 1개만 가능. NULL 값 불가능)
    - NOT NULL : 열에 NULL 값을 허용하지 않음
    - UNIQUE : 열 값이 고유해야 함.
    - FOREIGN KEY : 다른 테이블의 레코드와 연결
- 예제
    
    ```sql
    CREATE TABLE Customers (
        customer_id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(15),
        address TEXT
    );
    ```
    
    → Customers 테이블 생성
    
    - 고객 ID, 이름, 이메일, 전화번호, 주소 저장
    - `customer_id`: 기본 키로 설정되어 각 레코드가 고유함.
    - `name`: 필수값(NOT NULL)으로 설정.
    - `email`: 각 레코드마다 고유해야 함(UNIQUE).

### ◆ Create Three Tables

- Code_1
    
    ```sql
    statement.execute("CREATE TABLE employees (" +
        "emp_id INT PRIMARY KEY, " +
        "name VARCHAR(50), " +
        "department VARCHAR(50), " +
        "salary INT, " +
        "hire_date DATE)");
    
    statement.execute("CREATE TABLE departements (" +
        "dept_id INT PRIMARY KEY, " +
        "dept_name VARCHAR(50), " +
        "location VARCHAR(50))");
    
    statement.execute("CREATE TABLE sales (" +
        "sale_id INT PRIMARY KEY, "+
        "emp_id INT, " +
        "sale_date DATE, " +
        "amount DECIMAL(10,2))");
    
    ```
    
    - **employees 테이블:**
        - 직원 정보 저장.
        - 열: `emp_id`(기본 키), `name`, `department`, `salary`, `hire_date`.
    - **departements 테이블:**
        - 부서 정보 저장.
        - 열: `dept_id`(기본 키), `dept_name`, `location`.
    - **sales 테이블:**
        - 판매 정보 저장.
        - 열: `sale_id`(기본 키), `emp_id`(직원 ID와 연결), `sale_date`, `amount`.
    
- Code_2
    
    ```sql
    // employees 테이블에 데이터 삽입
    statement.execute("INSERT INTO employees VALUES(1, 'John', 'IT', 4500, '2024-10-11')");
    statement.execute("INSERT INTO employees VALUES(2, 'Jane', 'Sales', 4000, '2000-01-24')");
    statement.execute("INSERT INTO employees VALUES(3, 'Bob', 'IT', 6050, '2012-08-23')");
    statement.execute("INSERT INTO employees VALUES(4, 'Jane', 'Security', 6000, '2020-11-23')");
    statement.execute("INSERT INTO employees VALUES(5, 'Anie', 'Sales', 5000, '2018-01-24')");
    statement.execute("INSERT INTO employees VALUES(6, 'Charie', 'Sales', 7000, '2022-06-06')");
    
    // departements 테이블에 데이터 삽입
    statement.execute("INSERT INTO departements VALUES(1, 'IT', 'Seoul')");
    statement.execute("INSERT INTO departements VALUES(2, 'Design', 'Seoul')");
    statement.execute("INSERT INTO departements VALUES(3, 'Security', 'Busan')");
    
    // sales 테이블에 데이터 삽입
    statement.execute("INSERT INTO sales VALUES " +
        "(1, 2, '2024-01-14', 5000.00), " +
        "(2, 5, '2024-01-15', 3000.00), " +
        "(3, 5, '2024-01-16', 4500.00), " +
        "(4, 2, '2024-01-17', 5000.00), " +
        "(5, 2, '2024-01-18', 6000.00), " +
        "(6, 6, '2024-01-19', 15000.00)");
    ```
    
    - **employees 테이블 데이터:**
        - 직원 ID, 이름, 부서, 월급, 고용일 정보를 삽입.
    - **departements 테이블 데이터:**
        - 부서 ID, 부서 이름, 위치 정보를 삽입.
    - **sales 테이블 데이터:**
        - 판매 ID, 직원 ID, 판매 날짜, 판매 금액 데이터를 삽입.

### ◆ Basic SQL Query : Where

```sql
runQuery("SELECT name, salary FROM employees WHERE department = 'IT' AND salary >= 5000");
```

- `employees` 테이블에서 `department`가 "IT"이고 `salary`가 5000 이상인 직원의 `name`과 `salary`를 조회.

```java
private static void runQuery(String query) throws SQLException {
    try (Statement statement = connection.createStatement()) {
        ResultSet resultSet = statement.executeQuery(query);
        // 쿼리 실행 후 결과 처리
    }
}
```

- **`runQuery`:** 쿼리를 실행하고 결과를 가져오는 [[함수]].
- **`Statement` 및 `ResultSet`:** [[SQL]] 문 실행 및 결과를 저장하는 [[클래스]].

## 2. SQL JOIN

### ◆ Join Operation

- `employees` Table

| emp_id | name | department_id |
| --- | --- | --- |
| 1 | Alice | 101 |
| 2 | Bob | 102 |
| 3 | Charlie | NULL |
| 4 | David | 103 |
| 5 | Eva | 105 |
- `departments` Table

| department_id | department_name |
| --- | --- |
| 101 | HR |
| 102 | Sales |
| 103 | IT |
| 104 | Marketing |

### ◆ INNER JOIN

```java
String query = "SELECT customers.name, orders.order_date FROM customers " +
               "INNER JOIN orders ON customers.id = orders.customer_id";

PreparedStatement preparedStatement = connection.prepareStatement(query);
ResultSet resultSet = preparedStatement.executeQuery();
```

- `customers` 테이블과 `orders` 테이블을 `customer_id`로 연결.
- 두 테이블에서 매칭되는 행만 결과로 반환.
- 결과에는 고객 이름(`customers.name`)과 주문 날짜(`orders.order_date`)가 포함됨.
- [[INNER JOIN]] → 교집합
    
    ```sql
    SELECT employees.emp_id, employees.name, departments.department_name
    FROM employees
    INNER JOIN departments ON employees.department_id = departments.department_id;
    ```
    
    - `employees` 테이블의 `department_id`와 `departments` 테이블의 `department_id`를 기준으로 매칭.
    - 매칭되는 행만 결과에 포함됨.
    - Result
        
        
        | emp_id | name | department_name |
        | --- | --- | --- |
        | 1 | Alice | HR |
        | 2 | Bob | Sales |
        | 4 | David | IT |

### ◆ LEFT JOIN

```java
String query = "SELECT customers.name, orders.order_date FROM customers " +
               "LEFT JOIN orders ON customers.id = orders.customer_id";

PreparedStatement preparedStatement = connection.prepareStatement(query);
ResultSet resultSet = preparedStatement.executeQuery();
```

- `customers` 테이블의 모든 행과 `orders` 테이블에서 매칭되는 데이터를 결합.
- `customers` 테이블에 매칭되는 데이터가 없는 경우, `orders` 테이블의 값은 `NULL`로 반환.
- LEFT [[JOIN]] → left 기준 결합
    - 한 테이블의 모든 데이터 유지하며 관련 데이터 결합.
    
    ```sql
    SELECT employees.emp_id, employees.name, departments.department_name
    FROM employees
    LEFT JOIN departments ON employees.department_id = departments.department_id;
    ```
    
    - `employees` 테이블의 모든 행과 `departments` 테이블에서 매칭되는 데이터를 결합.
    - `employees` 테이블에 매칭되지 않는 `department_id`가 있는 경우, `departments` 테이블의 값은 `NULL`로 반환.
    - Result
        
        
        | emp_id | name | department_name |
        | --- | --- | --- |
        | 1 | Alice | HR |
        | 2 | Bob | Sales |
        | 3 | Charlie | NULL |
        | 4 | David | IT |
        | 5 | Eva | NULL |

### ◆ RIGHT JOIN

### ◆ FULL JOIN

```java
String query = "SELECT employees.name, projects.project_name FROM employees " +
               "FULL JOIN projects ON employees.id = projects.employee_id";

PreparedStatement preparedStatement = connection.prepareStatement(query);
ResultSet resultSet = preparedStatement.executeQuery();
```

- `employees` 테이블과 `projects` 테이블의 모든 행을 결합.
- 두 테이블에서 매칭되지 않는 행은 **NULL**로 표시.
- 양쪽 테이블에 없는 데이터까지 포함하여 결합된 결과를 반환.
- FULL [[OUTER JOIN]] → 합집합
    
    ```sql
    SELECT employees.emp_id, employees.name, departments.department_name
    FROM employees
    FULL OUTER JOIN departments ON employees.department_id = departments.department_id;
    ```
    
    - `employees` 테이블과 `departments` 테이블의 모든 데이터를 결합.
    - 양쪽 테이블에서 매칭되지 않는 데이터는 **NULL**로 표시.
    - Result
        
        
        | emp_id | name | department_name |
        | --- | --- | --- |
        | 1 | Alice | HR |
        | 2 | Bob | Sales |
        | 3 | Charlie | NULL |
        | 4 | David | IT |
        | 5 | Eva | NULL |
        | NULL | NULL | Marketing |

## 3. Using Clause

### ◆ GROUP BY Clause

- 목적
    - 데이터를 특정 열을 기준으로 그룹화하여 집계 분석(aggregate analysis)을 수행
- GROUP BY와 사용 되는 주요 함수
    - COUNT : 그룹 내 행의 개수
    - SUM : 그룹 내 값의 합계
    - AVG : 그룹 내 값의 평균
    - MAX : 그룹 내 최대값
    - MIN : 그룹 내 최소값
- 예제
    
    ```java
    String query = "SELECT customer_id, COUNT(order_id) AS order_count " +
                   "FROM orders GROUP BY customer_id";
    
    PreparedStatement preparedStatement = connection.prepareStatement(query);
    ResultSet resultSet = preparedStatement.executeQuery();
    ```
    

### ◆ ORDER BY Clause

- 목적
    - 쿼리 결과를 특정 열을 기준으로 정렬 (DESC 내림차순 / ASC 오름차순)
- 예제
    
    ```java
    String query = "SELECT name, salary FROM employees ORDER BY salary DESC";
    PreparedStatement preparedStatement = connection.prepareStatement(query);
    ResultSet resultSet = preparedStatement.executeQuery();
    ```
    
    - `employees` 테이블에서 `salary` 열을 기준으로 데이터를 정렬.
    - **DESC:** 내림차순 정렬(큰 값 → 작은 값).
    - **ASC:** 오름차순 정렬(작은 값 → 큰 값).
        - 기본값은 오름차순.

### ◆ LIMIT Clause

- 목적
    - 쿼리 결과에서 반환되는 행의 수를 제한
- 예제
    
    ```java
    String query = "SELECT * FROM employees ORDER BY hire_date DESC LIMIT 5";
    PreparedStatement preparedStatement = connection.prepareStatement(query);
    ResultSet resultSet = preparedStatement.executeQuery();
    ```
    
    - `employees` 테이블에서 모든 열(*)을 선택.
    - `hire_date`를 기준으로 내림차순으로 정렬(`DESC`).
    - 정렬된 결과에서 **상위 5개 행**만 반환.
