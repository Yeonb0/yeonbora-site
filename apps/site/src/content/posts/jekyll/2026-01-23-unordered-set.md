---
title: "[C++] Unordered Set"
field: computer
context: self
topic: c-cpp
source: jekyll
originalUrl: https://yeonb0.github.io/c-cpp/c++-unordered-set/
date: 2026-01-23
tags:
  - 자료 구조
  - C++
  - STL
  - 집합과 맵
  - c-cpp
toc: true
---

## **1. 개요**

`std::unordered_set`은 해시 기반의 집합 컨테이너로, 고유한 값을 저장하며, 원소의 순서는 정의되지 않습니다. `<unordered_set>` 헤더에 정의되어 있습니다.

```c++
 #include <unordered_set>
 std::unordered_set<int> uset = {10, 20, 30};
```

## **2. 주요 특징**

- 고유한 값만 저장
- 정렬되지 않음 (삽입 순서와 무관)
- 평균적으로 매우 빠른 검색, 삽입, 삭제 (O(1))
- 내부적으로 해시 테이블 사용
- 반복 순서는 일정하지 않음
## **3. 주요 멤버 함수**

### **🔹 크기 관련**

| **함수** | **설명** |
| `empty()` | 비었는지 확인 |
| `size()` | 요소 수 반환 |
| `clear()` | 모든 요소 삭제 |

### **🔹 삽입/삭제**

| **함수** | **설명** |
| `insert(val)` | 요소 삽입 |
| `emplace(args...)` | 직접 생성하여 삽입 |
| `erase(val)` | 값 제거 |
| `erase(iterator)` | 반복자로 제거 |
| `erase(first, last)` | 범위 삭제 |
| `swap(other)` | 다른 컨테이너와 교환 |

### **🔹 탐색**

| **함수** | **설명** |
| `find(val)` | 값 탐색, 반복자 반환 |
| `count(val)` | 해당 값이 존재하는지 확인 (0 또는 1) |

## **4. 반복자 관련**

| **함수** | **설명** |
| `begin()` / `end()` | 반복자 |
| `cbegin()` / `cend()` | const 반복자 |

## **5. 해시 및 버킷 관련**

| **함수** | **설명** |
| `bucket_count()` | 버킷 수 |
| `bucket_size(n)` | n번째 버킷의 크기 |
| `load_factor()` | 현재 load factor 확인 |
| `rehash(n)` | 최소 n개의 버킷 확보 |
| `reserve(n)` | n개의 원소를 저장할 공간 확보 |

## **6. 예제 코드**

```c++
 #include <iostream>
 #include <unordered_set>
 using namespace std;
 
 int main() {
     unordered_set<int> us = {1, 2, 3};
 
     us.insert(4);
     us.erase(2);
 
     for (int val : us) {
         cout << val << " ";
     }
     cout << endl;
 
     if (us.find(3) != us.end()) {
         cout << "3 is found" << endl;
     }
 
     return 0;
 }
```

## **7. `std::set` vs `std::unordered_set`**

| **항목** | **`std::set`** | **`std::unordered_set`** |
| 내부 구조 | 트리 (Red-Black Tree) | 해시 테이블 |
| 정렬 여부 | 자동 정렬 | 없음 |
| 접근 속도 | O(log N) | 평균 O(1) |
| 순서 보장 | 있음 | 없음 |
| 커스텀 정렬 | 가능 | 불가 (해시 기준) |

## **8. 주의사항**

- 키 값의 해시 함수와 동등 비교 연산자 필요
- 반복 순서는 삽입/삭제에 따라 변할 수 있음
- 충돌이 많아지면 성능 저하 가능 (load factor 관리)
