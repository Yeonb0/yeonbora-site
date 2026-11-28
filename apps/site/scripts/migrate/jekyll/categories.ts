// 깃블로그 _posts 하위 폴더 → posts frontmatter 의 topic · context · course
// topic 은 기술 블로그 바탕화면 폴더 (src/sections/posts/data.ts) 로 이어진다
export interface CategoryRule {
  topic: string
  context: 'self' | 'course' | 'study'
  course?: string
  // 시리즈 이름이 이 값이면 context 를 바꾼다 (책으로 혼자 공부한 시리즈 등)
  seriesContext?: Record<string, { context: 'self' | 'course' | 'study'; course?: string }>
}

export const Categories: Record<string, CategoryRule> = {
  BOJ: { topic: 'boj', context: 'self' },
  DS: { topic: 'data-structure', context: 'course', course: '자료구조' },
  'data-structure': { topic: 'data-structure', context: 'course', course: '자료구조' },
  algorithm: { topic: 'algorithm', context: 'course', course: '알고리즘설계와분석' },
  'c-cpp': { topic: 'c-cpp', context: 'self' },
  'computer-architecture': { topic: 'computer-architecture', context: 'course', course: '컴퓨터아키텍처' },
  'computer-graphics': { topic: 'computer-graphics', context: 'course', course: '기초컴퓨터그래픽스' },
  'computer-system': { topic: 'computer-system', context: 'course', course: '컴퓨터시스템개론' },
  devlog: { topic: 'devlog', context: 'self' },
  'discrete-math': { topic: 'discrete-math', context: 'course', course: '이산구조' },
  java: { topic: 'java', context: 'self' },
  network: {
    topic: 'network',
    context: 'course',
    course: '컴퓨터네트워크',
    seriesContext: { '혼자 공부하는 네트워크': { context: 'self' } },
  },
  'operation-system': { topic: 'operation-system', context: 'self' },
  'programming-language': { topic: 'programming-language', context: 'course', course: '프로그래밍언어' },
}

// 옮기지 않는 글 (같은 글이 두 번 올라간 경우 등) : _posts 상대 경로 → 이유
export const Excluded: Record<string, string> = {
  'programming-language/2026-03-15-[pl]-preliminaries.md': '2026-06-24 판과 같은 글 (06-24 판만 남김)',
  'computer-architecture/2026-03-15-[ca]-computer-abstractions-and-technology.md': '2026-06-24 판과 같은 글 (06-24 판만 남김)',
}

export const Tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const
