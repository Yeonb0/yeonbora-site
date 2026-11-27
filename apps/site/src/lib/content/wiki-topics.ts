// 위키 카테고리 : frontmatter topic 값 → 보이는 이름. 목록 순서가 왼쪽 트리 순서
// 기술 블로그 폴더 (sections/posts/data.ts) 와 같은 갈래, 같은 별칭을 쓴다
export interface WikiTopic {
  id: string
  name: string
  // 같은 카테고리로 묶을 다른 topic 값
  aliases: string[]
}

export const Topics: WikiTopic[] = [
  { id: 'cpp', name: 'C / C++', aliases: ['c-cpp', 'c', 'c++'] },
  { id: 'java', name: 'Java', aliases: [] },
  { id: 'python', name: 'Python', aliases: ['py'] },
  { id: 'pl', name: '프로그래밍 언어', aliases: ['programming-language'] },
  { id: 'ds', name: '자료구조', aliases: ['data-structure'] },
  { id: 'dm', name: '이산수학', aliases: ['discrete-math'] },
  { id: 'algorithm', name: '알고리즘', aliases: [] },
  { id: 'os', name: '운영체제', aliases: ['operating-system', 'operation-system'] },
  { id: 'system', name: '컴퓨터 시스템', aliases: ['computer-system', 'system-programming'] },
  { id: 'network', name: '네트워크', aliases: [] },
  { id: 'architecture', name: '컴퓨터 구조', aliases: ['computer-architecture'] },
  { id: 'graphics', name: '컴퓨터 그래픽스', aliases: ['computer-graphics'] },
  { id: 'database', name: '데이터베이스', aliases: ['db'] },
  { id: 'ml', name: '머신러닝', aliases: ['machine-learning'] },
  { id: 'se', name: '소프트웨어공학', aliases: ['software-engineering'] },
  { id: 'server', name: '서버', aliases: [] },
  { id: 'aws', name: 'AWS', aliases: [] },
  { id: 'devops', name: 'DevOps', aliases: [] },
  { id: 'engineer-cert', name: '정보처리기사', aliases: [] },
  { id: 'bigdata-cert', name: '빅데이터분석기사', aliases: [] },
  { id: 'likelion', name: '멋쟁이사자처럼', aliases: [] },
]

// topic 이 없는 노트가 모이는 곳 : 늘 맨 뒤
export const EtcTopic = { id: 'etc', name: '기타' }

// 별칭 · 대소문자를 대표 id 로. 목록에 없는 값은 그대로, 비면 etc
export const normalizeTopic = (raw?: string): string => {
  const V = raw?.trim().toLowerCase()
  if (!V) return EtcTopic.id
  return Topics.find((t) => t.id === V || t.aliases.includes(V))?.id ?? V
}

export const topicName = (id: string): string => Topics.find((t) => t.id === id)?.name ?? (id === EtcTopic.id ? EtcTopic.name : id)

// 목록에 없는 topic 은 아는 것 뒤, 기타 앞에 이름 순으로
export const sortTopics = (Ids: string[]): string[] => {
  const rank = (id: string) => (id === EtcTopic.id ? 2e3 : Topics.findIndex((t) => t.id === id) + 1 || 1e3)
  return [...Ids].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}
