// 위키 그래프 화면용 데이터 : 위키 노트 + 위키를 링크한 글 + 아직 없는 노트 (빈 점)
import type { Graph, Node } from './graph'
import { parseWikilinks } from './wikilink'
import { EtcTopic, normalizeTopic, sortTopics, topicColors, topicName } from './wiki-topics'

export type GKind = 'wiki' | 'post' | 'ghost'

export interface GNode {
  // 위키 /wiki/<slug>, 글 /posts/<slug>, 빈 점 ?<소문자 이름>
  id: string
  title: string
  kind: GKind
  topic: string
  // 작성 시각 (ms) : 첫 화면에서 노드가 이 순서로 나타난다
  t?: number
  // 빌드 때 미리 잡은 자리 (wiki-layout.ts)
  x?: number
  y?: number
}

export interface WikiGraphData {
  nodes: GNode[]
  links: [string, string][]
  topics: { id: string; name: string; color: string }[]
}

type WikiNode = Node & { topic?: string; created?: Date }

const idOf = (n: Node) => `/${n.collection}/${n.slug}`
const ghostId = (target: string) => `?${target.trim().toLowerCase()}`

export const buildWikiGraphData = (Nodes: WikiNode[], G: Graph): WikiGraphData => {
  const Out = new Map<string, GNode>()
  const Links = new Map<string, [string, string]>()
  const Topic = new Map<string, string>()

  for (const N of Nodes) if (N.collection === 'wiki') Topic.set(idOf(N), normalizeTopic(N.topic))

  const link = (a: string, b: string) => {
    if (a === b) return
    const Key = a < b ? `${a}\n${b}` : `${b}\n${a}`
    if (!Links.has(Key)) Links.set(Key, a < b ? [a, b] : [b, a])
  }

  for (const N of Nodes) {
    const Me = idOf(N)
    const Targets: string[] = []
    for (const L of parseWikilinks(N.body)) {
      if (!L.target) continue
      const T = G.resolve(L.target)
      if (T) {
        // 글은 위키를 링크했을 때만 그래프에 들어온다 : 글 → 글 선은 그리지 않는다
        if (N.collection === 'posts' && T.collection !== 'wiki') continue
        Targets.push(idOf(T))
      } else if (N.collection === 'wiki') {
        const Id = ghostId(L.target)
        if (!Out.has(Id)) Out.set(Id, { id: Id, title: L.target.trim(), kind: 'ghost', topic: '' })
        Targets.push(Id)
      }
    }
    for (const T of Targets) link(Me, T)
    const T = N.created ? { t: N.created.getTime() } : {}
    if (N.collection === 'wiki') Out.set(Me, { id: Me, title: N.title, kind: 'wiki', topic: Topic.get(Me)!, ...T })
    else if (Targets.some((t) => t !== Me)) Out.set(Me, { id: Me, title: N.title, kind: 'post', topic: '', ...T })
  }

  // 글 · 빈 점은 이어진 위키 노트 중 첫 번째의 카테고리를 따른다
  const Pairs = [...Links.values()]
  for (const N of Out.values()) {
    if (N.kind === 'wiki') continue
    const Near = Pairs.map(([a, b]) => (a === N.id ? b : b === N.id ? a : '')).find((x) => Topic.has(x))
    N.topic = Near ? Topic.get(Near)! : EtcTopic.id
  }

  const Used = sortTopics([...new Set([...Out.values()].filter((n) => n.kind === 'wiki').map((n) => n.topic))])
  const Colors = topicColors(Used)
  return {
    nodes: [...Out.values()],
    links: Pairs.filter(([a, b]) => Out.has(a) && Out.has(b)),
    topics: Used.map((id) => ({ id, name: topicName(id), color: Colors.get(id)! })),
  }
}
