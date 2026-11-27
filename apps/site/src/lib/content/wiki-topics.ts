// 위키 카테고리 : frontmatter topic 값 → 보이는 이름. 목록 순서가 왼쪽 트리 순서
export const Topics: { id: string; name: string }[] = [
  { id: 'network', name: '네트워크' },
  { id: 'os', name: '운영체제' },
  { id: 'system-programming', name: '시스템 프로그래밍' },
  { id: 'architecture', name: '컴퓨터 구조' },
  { id: 'algorithm', name: '알고리즘' },
  { id: 'data-structure', name: '자료구조' },
  { id: 'database', name: '데이터베이스' },
  { id: 'graphics', name: '컴퓨터 그래픽스' },
  { id: 'pl', name: '프로그래밍 언어' },
  { id: 'ml', name: '머신러닝' },
]

// topic 이 없는 노트가 모이는 곳 : 늘 맨 뒤
export const EtcTopic = { id: 'etc', name: '기타' }

export const topicName = (id: string): string => Topics.find((t) => t.id === id)?.name ?? (id === EtcTopic.id ? EtcTopic.name : id)

// 목록에 없는 topic 은 아는 것 뒤, 기타 앞에 이름 순으로
export const sortTopics = (Ids: string[]): string[] => {
  const rank = (id: string) => (id === EtcTopic.id ? 2e3 : Topics.findIndex((t) => t.id === id) + 1 || 1e3)
  return [...Ids].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}
