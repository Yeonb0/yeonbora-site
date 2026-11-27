// 위키 카테고리 : frontmatter topic 값 → 보이는 이름. 목록 순서가 왼쪽 트리 순서
// 기술 블로그 폴더 (sections/posts/data.ts) 와 같은 갈래, 같은 별칭을 쓴다
export interface WikiTopic {
  id: string
  name: string
  // 같은 카테고리로 묶을 다른 topic 값
  aliases: string[]
  // 그래프 점 · 트리 점 색 : 위키 바탕 (#232236) 위에서 서로 구분되는 밝은 색. 글 노드 노랑 (#f0c674) 은 피한다
  color: string
}

export const Topics: WikiTopic[] = [
  { id: 'cpp', name: 'C / C++', aliases: ['c-cpp', 'c', 'c++'], color: '#7aa2f7' },
  { id: 'java', name: 'Java', aliases: [], color: '#f7a072' },
  { id: 'python', name: 'Python', aliases: ['py'], color: '#9be15d' },
  { id: 'pl', name: '프로그래밍 언어', aliases: ['programming-language'], color: '#a78bfa' },
  { id: 'ds', name: '자료구조', aliases: ['data-structure'], color: '#4fd1c5' },
  { id: 'dm', name: '이산수학', aliases: ['discrete-math'], color: '#c792ea' },
  { id: 'algorithm', name: '알고리즘', aliases: [], color: '#c3e66a' },
  { id: 'os', name: '운영체제', aliases: ['operating-system', 'operation-system'], color: '#ff9e64' },
  { id: 'system', name: '컴퓨터 시스템', aliases: ['computer-system', 'system-programming'], color: '#f27a7a' },
  { id: 'network', name: '네트워크', aliases: [], color: '#5cc8e6' },
  { id: 'architecture', name: '컴퓨터 구조', aliases: ['computer-architecture'], color: '#e0af68' },
  { id: 'graphics', name: '컴퓨터 그래픽스', aliases: ['computer-graphics'], color: '#ff7eb6' },
  { id: 'database', name: '데이터베이스', aliases: ['db'], color: '#ff9ecf' },
  { id: 'ml', name: '머신러닝', aliases: ['machine-learning'], color: '#e879c0' },
  { id: 'se', name: '소프트웨어공학', aliases: ['software-engineering'], color: '#89ddff' },
  { id: 'server', name: '서버', aliases: [], color: '#6aa7ff' },
  { id: 'aws', name: 'AWS', aliases: [], color: '#f59e5b' },
  { id: 'devops', name: 'DevOps', aliases: [], color: '#73daca' },
  { id: 'engineer-cert', name: '정보처리기사', aliases: [], color: '#b8a1ff' },
  { id: 'bigdata-cert', name: '빅데이터분석기사', aliases: [], color: '#ffb86c' },
  { id: 'likelion', name: '멋쟁이사자처럼', aliases: [], color: '#7ee0a8' },
]

// topic 이 없는 노트가 모이는 곳 : 늘 맨 뒤
export const EtcTopic = { id: 'etc', name: '기타', color: '#8e8da6' }

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

// 목록에 없는 topic 은 이름으로 정한 색 (같은 이름이면 늘 같은 색)
const Spare = ['#82aaff', '#f78c6c', '#addb67', '#ffcb8b', '#7fdbca', '#d4bfff']
export const topicColor = (id: string): string => {
  const T = Topics.find((t) => t.id === id)
  if (T) return T.color
  if (id === EtcTopic.id) return EtcTopic.color
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return Spare[h % Spare.length]
}
