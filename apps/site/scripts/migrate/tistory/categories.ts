// 티스토리 카테고리 → posts frontmatter 의 topic · tags · series
// topic 은 기술 블로그 바탕화면 폴더 (src/sections/posts/data.ts) 로 이어진다. web · git 은 아직 폴더가 없어 기타로 간다
export interface CategoryRule {
  topic: string
  context: 'self' | 'course' | 'study'
  // 제목의 번호 (01_) 로 순서를 매기는 시리즈 이름
  series: string
  tags: string[]
}

export const Categories: Record<string, CategoryRule> = {
  'C/C': { topic: 'c-cpp', context: 'self', series: 'C', tags: ['C'] },
  'C/C++': { topic: 'c-cpp', context: 'self', series: 'C++', tags: ['C++'] },
  'C/Data Structure': { topic: 'data-structure', context: 'self', series: 'Data Structure', tags: ['Data Structure'] },
  'HTML + CSS + JS/HTML': { topic: 'web', context: 'self', series: 'HTML', tags: ['HTML'] },
  'HTML + CSS + JS/CSS': { topic: 'web', context: 'self', series: 'CSS', tags: ['CSS'] },
  'HTML + CSS + JS/JavaScript': { topic: 'web', context: 'self', series: 'JavaScript', tags: ['JavaScript'] },
  'Git & GitHub': { topic: 'git', context: 'self', series: 'Git & GitHub', tags: ['Git'] },
}

// 옮기지 않는 글 : 티스토리 글 id → 이유
export const Excluded: Record<string, string> = {
  '8': '티스토리 비공개 글 ([HTML] Self Check) : 관리자 결정으로 옮기지 않음',
}

// 묶음 (커밋) 이름 : 카테고리 → 짧은 이름
export const BatchNames: Record<string, string> = {
  'C/C': 'c',
  'C/C++': 'cpp',
  'C/Data Structure': 'ds',
  'HTML + CSS + JS/HTML': 'html',
  'HTML + CSS + JS/CSS': 'css',
  'HTML + CSS + JS/JavaScript': 'js',
  'Git & GitHub': 'git',
}
