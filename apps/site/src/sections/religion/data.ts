// 종교학 방 임시 데이터 : Phase 2 에서 posts collection (field : religion, topic) 으로 옮긴다
// 순서 = 방석 위 자리 순서. 위 줄은 동양 종교, 아래 줄은 나머지
import type { Religion, ReligionId } from './types'

export const Religions: Religion[] = [
  { id: 'confucianism', name: '유교', posts: [] },
  { id: 'buddhism', name: '불교', posts: [] },
  { id: 'taoism', name: '도교', posts: [] },
  { id: 'won-buddhism', name: '원불교', posts: [] },
  { id: 'christianity', name: '기독교', posts: [] },
  { id: 'hinduism', name: '힌두교', posts: [] },
  { id: 'islam', name: '이슬람', posts: [] },
  { id: 'judaism', name: '유대교', posts: [] },
]

export const ReligionIds = Religions.map((r) => r.id) as ReligionId[]
