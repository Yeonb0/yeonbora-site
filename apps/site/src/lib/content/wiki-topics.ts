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
  { id: 'spring', name: 'Spring', aliases: [] },
  { id: 'python', name: 'Python', aliases: ['py'] },
  { id: 'pl', name: '프로그래밍 언어', aliases: ['programming-language'] },
  { id: 'web', name: '웹 프론트엔드', aliases: ['frontend'] },
  { id: 'ds', name: '자료구조', aliases: ['data-structure'] },
  { id: 'dm', name: '이산수학', aliases: ['discrete-math'] },
  { id: 'algorithm', name: '알고리즘', aliases: [] },
  { id: 'os', name: '운영체제', aliases: ['operating-system', 'operation-system'] },
  { id: 'system', name: '컴퓨터 시스템', aliases: ['computer-system', 'system-programming'] },
  { id: 'network', name: '네트워크', aliases: [] },
  { id: 'security', name: '보안', aliases: [] },
  { id: 'architecture', name: '컴퓨터 구조', aliases: ['computer-architecture'] },
  { id: 'graphics', name: '컴퓨터 그래픽스', aliases: ['computer-graphics'] },
  { id: 'database', name: '데이터베이스', aliases: ['db'] },
  { id: 'ml', name: '머신러닝', aliases: ['machine-learning'] },
  { id: 'se', name: '소프트웨어공학', aliases: ['software-engineering'] },
  { id: 'server', name: '서버', aliases: [] },
  { id: 'aws', name: 'AWS', aliases: [] },
  { id: 'devops', name: 'DevOps', aliases: [] },
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

// 카테고리 색 : 노트가 있는 카테고리만 목록 순서대로 무지개 (빨강 → 보라) 로 나눈다. 기타는 회색
// 위키 바탕 (#232236) 위에서 밝게 보이도록 HSL 명도 68% · 채도 72%
export const topicColors = (Ids: string[]): Map<string, string> => {
  const Rainbow = Ids.filter((id) => id !== EtcTopic.id)
  const M = new Map(Rainbow.map((id, i) => [id, hsl((i / Math.max(1, Rainbow.length - 1)) * 280, 72, 68)]))
  if (Ids.includes(EtcTopic.id)) M.set(EtcTopic.id, EtcTopic.color)
  return M
}

const hsl = (h: number, s: number, l: number): string => {
  const S = s / 100
  const L = l / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = L - S * Math.min(L, 1 - L) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
