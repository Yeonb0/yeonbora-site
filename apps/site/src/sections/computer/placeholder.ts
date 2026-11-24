// 임시 글 데이터 : Phase 2 에서 posts collection 으로 바꾼다
// collection 으로 옮길 때 같은 필드 (field, course, topic, tags, slug, title, date) 로 걸러 쓰면 된다
export interface PlaceholderPost {
  field: 'computer'
  // 과목 코드 : 코드가 없는 과목은 비우고 topic 으로 잇는다
  course?: string
  // 바탕화면 아이콘 id
  topic?: string
  // 언어 태그 (PL 폴더의 언어 아이콘 id)
  tags: string[]
  slug: string
  title: string
  date: string
}

export const PlaceholderPosts: PlaceholderPost[] = [
  { field: 'computer', topic: 'os', tags: ['c'], slug: 'pintos-threads', title: 'Pintos 스레드 스케줄러 정리', date: '2026-10-12' },
  { field: 'computer', topic: 'os', tags: ['c', 'asm'], slug: 'pintos-syscall', title: 'Pintos 시스템 콜 구현 메모', date: '2026-11-02' },
  { field: 'computer', course: 'CSE4170', tags: ['cpp', 'glsl'], slug: 'opengl-lighting', title: 'OpenGL 조명 모델', date: '2026-09-28' },
  { field: 'computer', course: 'CSE4010', tags: [], slug: 'pipeline-hazard', title: '파이프라인 해저드', date: '2026-10-05' },
  { field: 'computer', course: 'CSE4120', tags: ['c'], slug: 'lexer-notes', title: '렉서와 정규 표현', date: '2026-10-20' },
  { field: 'computer', topic: 'pl-course', tags: ['typescript'], slug: 'type-systems', title: '타입 시스템 개관', date: '2026-11-08' },
  { field: 'computer', topic: 'ds', tags: ['java'], slug: 'avl-tree', title: 'AVL 트리 회전', date: '2025-06-14' },
]
