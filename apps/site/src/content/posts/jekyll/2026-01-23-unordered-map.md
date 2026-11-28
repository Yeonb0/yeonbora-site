---
title: "[C++] Unordered Map"
field: computer
context: self
topic: c-cpp
source: jekyll
originalUrl: https://yeonb0.github.io/c-cpp/c++-unordered-map/
date: 2026-01-23
tags:
  - 자료 구조
  - C++
  - 집합과 맵
  - STL
  - c-cpp
toc: true
---

## **1. 개요**

`std::unordered_map`은 해시 기반의 연관 컨테이너로, 키-값 쌍을 저장하며 키는 고유해야 합니다. `<unordered_map>` 헤더에 정의되어 있으며, 내부적으로 해시 테이블을 사용합니다.

```c++
 #include <unordered_map>
 std::unordered_map<std::string, int> age = {{"Alice", 25}, {"Bob", 30}};
```

## **2. 주요 특징**

- 키는 유일하며, 순서는 보장되지 않음
- 내부적으로 해시 테이블 사용
- 평균적으로 삽입, 검색, 삭제가 O(1)
- 반복 순서는 해시 버킷 순서에 따라 달라짐
## **3. 주요 멤버 함수**

### **🔹 크기 관련**

| **함수** | **설명** |
| `empty()` | 비었는지 확인 |
| `size()` | 요소 수 반환 |
| `clear()` | 모든 요소 삭제 |

### **🔹 접근**

| **함수** | **설명** |
| `operator[](key)` | 키로 값 접근 (없으면 생성) |
| `at(key)` | 키로 값 접근 (없으면 예외 발생) |

### **🔹 삽입/삭제**

| **함수** | **설명** |
| `insert({key, val})` | 키-값 쌍 삽입 |
| `emplace(key, val)` | 직접 생성하여 삽입 |
| `erase(key)` | 키로 제거 |
| `erase(iterator)` | 반복자로 제거 |
| `swap(other)` | 다른 unordered_map과 교환 |

### **🔹 탐색**

| **함수** | **설명** |
| `find(key)` | 키 탐색 |
| `count(key)` | 키 존재 여부 (0 또는 1) |

## **4. 반복자 관련**

| **함수** | **설명** |
| `begin()` / `end()` | 반복자 |
| `cbegin()` / `cend()` | const 반복자 |

## **5. 해시 및 버킷 관련**

| **함수** | **설명** |
| `bucket_count()` | 버킷 수 반환 |
| `bucket_size(n)` | n번째 버킷의 크기 |
| `load_factor()` | 현재 load factor |
| `rehash(n)` | 최소 n개의 버킷 확보 |
| `reserve(n)` | n개의 원소를 위한 공간 확보 |

## **6. 예제 코드**

```c++
 #include <iostream>
 #include <unordered_map>
 using namespace std;
 
 int main() {
     unordered_map<string, int> age;
     age["Alice"] = 25;
     age["Bob"] = 30;
 
     for (auto& p : age) {
         cout << p.first << ": " << p.second << endl;
     }
 
     if (age.find("Bob") != age.end()) {
         cout << "Bob found" << endl;
     }
 
     return 0;
 }
```

## **7. `std::map` vs `std::unordered_map`**

| **항목** | **`std::map`** | **`std::unordered_map`** |
| 내부 구조 | 이진 탐색 트리 | 해시 테이블 |
| 정렬 | 키 순서대로 정렬 | 없음 |
| 시간 복잡도 | O(log N) | 평균 O(1) |
| 순회 순서 | 정렬된 순서 | 해시 순서 |
| 커스텀 정렬 | 가능 | 불가 (해시 필요) |

## **8. 주의사항**

- 키 타입은 해시 함수(`std::hash`)와 동등 비교 연산자 필요
- 해시 충돌 시 성능 저하 가능 (적절한 `reserve()` 필요)
- 반복자는 무작위 순서를 가짐
