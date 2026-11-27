// 위키 그래프 배치 : 빌드 때 한 번 힘 배치를 돌려 좌표를 넣는다 (브라우저에서 노드 천여 개를 처음부터 펼치면 느리다)
// d3-force 는 자체 난수 (LCG) 를 써서 같은 데이터면 같은 자리가 나온다
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import type { GNode, WikiGraphData } from './wiki-graph'

type N = GNode & SimulationNodeDatum

// 넓게 퍼뜨린다 : 멀리서는 점을 작게 그리고 (WikiGraph), 확대하면 이웃 사이가 넉넉하다
export const Forces = { linkDist: 70, ghostDist: 36, linkStrength: 0.3, charge: -150, chargeMax: 500, center: 0.1, collide: 16 }

// 카테고리 중심 : 원 위에 고르게, 노트가 많을수록 원이 커진다
export const topicCenters = (Topics: string[], Total: number): Map<string, { x: number; y: number }> => {
  const Ring = Topics.length > 1 ? 120 + 30 * Math.sqrt(Total) : 0
  return new Map(
    Topics.map((t, k) => {
      const A = (k / Topics.length) * Math.PI * 2 - Math.PI / 2
      return [t, { x: Math.round(Math.cos(A) * Ring), y: Math.round(Math.sin(A) * Ring) }]
    }),
  )
}

export const layoutWikiGraph = (D: WikiGraphData, Ticks = 400): WikiGraphData => {
  const Center = topicCenters(
    D.topics.map((t) => t.id),
    D.nodes.length,
  )
  const at = (n: GNode) => Center.get(n.topic) ?? { x: 0, y: 0 }
  const Nodes: N[] = D.nodes.map((n) => ({ ...n }))
  const Links = D.links.map(([source, target]) => ({ source, target }))
  const Ghost = new Set(D.nodes.filter((n) => n.kind === 'ghost').map((n) => n.id))
  const Sim = forceSimulation<N>(Nodes)
    .force('link', forceLink<N, { source: string | N; target: string | N }>(Links).id((d) => d.id).distance((l) => (Ghost.has((l.source as N).id) || Ghost.has((l.target as N).id) ? Forces.ghostDist : Forces.linkDist)).strength(Forces.linkStrength))
    .force('charge', forceManyBody<N>().strength(Forces.charge).distanceMax(Forces.chargeMax))
    .force('x', forceX<N>((d) => at(d).x).strength(Forces.center))
    .force('y', forceY<N>((d) => at(d).y).strength(Forces.center))
    .force('collide', forceCollide<N>(Forces.collide))
    .stop()
  // 처음 자리 : 카테고리 중심 근처 (d3 기본 해바라기 배치를 중심으로 옮긴다)
  for (const n of Nodes) {
    const C = at(n)
    n.x = (n.x ?? 0) * 0.3 + C.x
    n.y = (n.y ?? 0) * 0.3 + C.y
  }
  Sim.tick(Ticks)
  return { ...D, nodes: Nodes.map(({ id, title, kind, topic, x, y }) => ({ id, title, kind, topic, x: Math.round(x! * 10) / 10, y: Math.round(y! * 10) / 10 })) }
}
