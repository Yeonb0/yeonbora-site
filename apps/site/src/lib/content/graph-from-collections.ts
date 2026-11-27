// getCollection 결과로 그래프 노드를 만든다 : 페이지의 역링크 · 관련 개념에 쓴다
import type { Node } from './graph'

interface EntryLike {
  id: string
  data: { title: string; aliases?: string[]; sourcePath?: string }
  body?: string
}

export const toNodes = (Wiki: EntryLike[], Posts: EntryLike[]): Node[] => [
  ...Wiki.map((e) => ({ collection: 'wiki' as const, slug: e.id, title: e.data.title, aliases: e.data.aliases ?? [], body: e.body ?? '', sourcePath: e.data.sourcePath })),
  ...Posts.map((e) => ({ collection: 'posts' as const, slug: e.id, title: e.data.title, aliases: [], body: e.body ?? '' })),
]
