// 옮길 Notion 페이지 : 페이지 id (32 hex) → 묶음 · 작성일 (Notion 생성 일시의 한국 날짜)
// 범위는 관리자가 고른 것만 (2026-11-28) : 운영체제 교재 · Java 기말고사 공부 · 스터디 보기 중 사이트에 없는 글
export interface GroupRule {
  // 커밋 묶음 이름 (run 의 <묶음> 인자)
  batch: string
  topic: string
  context: 'self' | 'course' | 'study'
  series: string
  tags: string[]
  // 제목의 강의 번호 (Lec 08) 를 step 으로
  stepFromLec?: boolean
}

export const Groups: Record<string, GroupRule> = {
  java: { batch: 'java', topic: 'java', context: 'self', series: 'Java 언어', tags: ['Java'], stepFromLec: true },
  spring: { batch: 'spring', topic: 'java', context: 'study', series: 'Spring', tags: ['Spring', 'Java'] },
  typescript: { batch: 'typescript', topic: 'web', context: 'study', series: '타입스크립트', tags: ['TypeScript'] },
  dl3: { batch: 'deep-learning', topic: 'ml', context: 'study', series: '밑바닥부터 시작하는 딥러닝 3', tags: ['Deep Learning', 'Python'] },
  dl2: { batch: 'deep-learning', topic: 'ml', context: 'study', series: '밑바닥부터 시작하는 딥러닝 2', tags: ['Deep Learning', 'Python'] },
}

// Java 8편은 생성 일시를 알 수 없어 관리자 결정으로 2024-11-28 (2026-11-28)
export const Pages: Record<string, { group: keyof typeof Groups; date: string }> = {
  '2ea3a7483f9780c08cb0ffa8685f8a5f': { group: 'java', date: '2024-11-28' }, // Lec 08 - Multithreading and Concurrency (1)
  '2ea3a7483f978079a653ebacce4aa678': { group: 'java', date: '2024-11-28' }, // Lec 09 - Multithreading and Concurrency(2)
  '2ea3a7483f9780afa75adfe9ca55b39e': { group: 'java', date: '2024-11-28' }, // Lec 10 - Multithreading and Concurrency (3)
  '2ea3a7483f9780bbbe16f839bc4fdefa': { group: 'java', date: '2024-11-28' }, // Lec 11 - Networking in Java
  '2ea3a7483f9780eb9ed3c2ef4333def1': { group: 'java', date: '2024-11-28' }, // Lec 12 - Database Connectivity with JDBC (1)
  '2ea3a7483f978045a056e98dddabfd40': { group: 'java', date: '2024-11-28' }, // Lec 13 - Database Connectivity with JDBC (2)
  '2ea3a7483f9780a38190eeeebe81643b': { group: 'java', date: '2024-11-28' }, // Lec 14 - Database Connectivity with JDBC (3)
  '2ea3a7483f9780e88513eab5b7a7e3e0': { group: 'java', date: '2024-11-28' }, // Lec 15 ~ 18 Design Patterns and Best Practices
  '3c33a7483f9780699d5cde9afba05b30': { group: 'spring', date: '2026-08-21' }, // CI/CD 도입하기
  '3bb3a7483f978010b56fe2ea88a63cbb': { group: 'spring', date: '2026-08-14' }, // AWS 에 프로젝트 배포하기
  '3b63a7483f9780f4ba62d45929ca9c45': { group: 'spring', date: '2026-08-08' }, // OAuth2로 로그인/로그아웃 구현하기
  '3ad3a7483f978048b4c4d4578e9aaeff': { group: 'spring', date: '2026-07-30' }, // JWT 로 로그인/로그아웃 구현하기
  '3a83a7483f9780a4b186e1e6a288c7cd': { group: 'spring', date: '2026-07-25' }, // 스프링 시큐리티로 로그인/로그아웃, 회원 가입 구현하기
  '3a63a7483f9780dca35dc8e0dc76a0cd': { group: 'spring', date: '2026-07-23' }, // 스프링 AI로 기능 추가하기
  '3a03a7483f9780a087aef60bc8fe95d3': { group: 'spring', date: '2026-07-17' }, // 블로그 화면 구성하기
  '39d3a7483f9780709e3ee0f20974b7e3': { group: 'spring', date: '2026-07-14' }, // 블로그 기획하고 API 만들기
  '39d3a7483f9780edbfddeeee442572de': { group: 'spring', date: '2026-07-14' }, // 데이터베이스 조작이 편해지는 ORM
  '3983a7483f97809b939ef32290ec1e33': { group: 'spring', date: '2026-07-09' }, // 스프링 부트 4와 테스트
  '3963a7483f9780b3a097dc53aefcb01d': { group: 'spring', date: '2026-07-08' }, // 스프링 부트 4 구조 이해하기
  '3963a7483f9780cca319c4efbd9be305': { group: 'spring', date: '2026-07-07' }, // 스프링 부트 4 시작하기
  '3963a7483f978032b3a1fc257d2d1653': { group: 'spring', date: '2026-07-07' }, // 자바 백엔드 개발자가 알아두면 좋은 지식
  '3963a7483f9780a5bf24cc57d58f95cf': { group: 'spring', date: '2026-07-07' }, // 개발 환경 구축하기
  '3a43a7483f97806e945fd79a6558a3e2': { group: 'typescript', date: '2026-07-21' }, // 객체
  '3a43a7483f9780eeb92df418a8296743': { group: 'typescript', date: '2026-07-21' }, // 유니온과 리터럴
  '3a33a7483f978076a763cfe364fab34c': { group: 'typescript', date: '2026-07-20' }, // 타입 시스템
  '3a33a7483f9780fa963ad27cbaa2853e': { group: 'typescript', date: '2026-07-20' }, // 자바스크립트에서 타입스크립트로
  '3c63a7483f9780a69591ed1cac9d0133': { group: 'dl3', date: '2026-08-24' }, // 함수 연결
  '3ba3a7483f978037b0f8c5a8b5ca3a87': { group: 'dl3', date: '2026-08-12' }, // 변수를 낳는 함수
  '3ba3a7483f9780d1b785db5de63e29d9': { group: 'dl3', date: '2026-08-12' }, // 상자로서의 변수
  '3c63a7483f9780eb8918dcdff1a997e0': { group: 'dl2', date: '2026-08-24' }, // 게이트가 추가된 RNN
}

// 내보내기에 있지만 옮기지 않는 페이지 : id → 이유
export const Excluded: Record<string, string> = {
  '2ea3a7483f9780bc8b6fdce0b8beda16': 'Java 기말고사 공부 : 하위 페이지 목록만 있는 페이지',
  '3ba3a7483f9780b6ac2cc109f68190d1': '딥러닝 3 Index : 목차 페이지',
}

export const BatchNames = [...new Set(Object.values(Groups).map((g) => g.batch))]
