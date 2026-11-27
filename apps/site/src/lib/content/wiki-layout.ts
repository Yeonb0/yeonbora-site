// 위키 그래프 배치 : 빌드 때 한 번 힘 배치를 돌려 좌표를 넣는다 (브라우저에서 노드 천여 개를 처음부터 펼치면 느리다)
// d3-force 는 자체 난수 (LCG) 를 써서 같은 데이터면 같은 자리가 나온다
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import type { GNode, WikiGraphData } from './wiki-graph'

type N = GNode & SimulationNodeDatum

// 옵시디언 그래프처럼 : 같은 카테고리끼리는 짧고 센 선으로 뭉치고, 다른 카테고리를 잇는 선은 약하게 당겨
// 카테고리 무리들이 큰 원 안에 떨어져 흩어진다
export const Forces = { linkDist: 36, ghostDist: 20, linkSame: 0.5, linkCross: 0.03, charge: -120, chargeMax: 380, center: 0.055, collide: 9 }

// 카테고리 중심 : 큰 원 위에 고르게, 홀짝으로 안쪽 · 바깥 원을 번갈아 써서 무리끼리 겹치지 않게
export const topicCenters = (Topics: string[], Total: number): Map<string, { x: number; y: number }> => {
  const Ring = Topics.length > 1 ? 62 * Math.sqrt(Total) : 0
  return new Map(
    Topics.map((t, k) => {
      const A = (k / Topics.length) * Math.PI * 2 - Math.PI / 2 + (k % 2) * 0.2
      const R = Ring * (k % 2 ? 0.62 : 1)
      return [t, { x: Math.round(Math.cos(A) * R), y: Math.round(Math.sin(A) * R) }]
    }),
  )
}

// 점 크기 : 이어진 선이 많을수록 크게 (옵시디언처럼 제곱근으로 늘려 큰 허브도 지나치게 커지지 않게)
export const nodeRadius = (n: Pick<GNode, 'kind'>, deg: number) => (n.kind === 'ghost' ? 3 : Math.min(16, 3.5 + 1.6 * Math.sqrt(deg)))

// 선 세기 · 길이 : 같은 카테고리면 세게, 다르면 약하게. 빈 점으로 가는 선은 짧게
export const linkStrength = (a: GNode, b: GNode) => (a.topic === b.topic ? Forces.linkSame : Forces.linkCross)
export const linkDistance = (a: GNode, b: GNode) => (a.kind === 'ghost' || b.kind === 'ghost' ? Forces.ghostDist : Forces.linkDist)

export const layoutWikiGraph = (D: WikiGraphData, Ticks = 500): WikiGraphData => {
  const Center = topicCenters(
    D.topics.map((t) => t.id),
    D.nodes.length,
  )
  const at = (n: GNode) => Center.get(n.topic) ?? { x: 0, y: 0 }
  const Nodes: N[] = D.nodes.map((n) => ({ ...n, x: undefined, y: undefined }))
  type L = { source: string | N; target: string | N }
  const Links: L[] = D.links.map(([source, target]) => ({ source, target }))
  const Deg = new Map<string, number>()
  for (const [a, b] of D.links) {
    Deg.set(a, (Deg.get(a) ?? 0) + 1)
    Deg.set(b, (Deg.get(b) ?? 0) + 1)
  }
  const Sim = forceSimulation<N>(Nodes)
    .force(
      'link',
      forceLink<N, L>(Links)
        .id((d) => d.id)
        .distance((l) => linkDistance(l.source as N, l.target as N))
        .strength((l) => linkStrength(l.source as N, l.target as N)),
    )
    .force('charge', forceManyBody<N>().strength(Forces.charge).distanceMax(Forces.chargeMax))
    .force('x', forceX<N>((d) => at(d).x).strength(Forces.center))
    .force('y', forceY<N>((d) => at(d).y).strength(Forces.center))
    // 큰 점은 그만큼 넓게 비켜서게
    .force('collide', forceCollide<N>((d) => Math.max(Forces.collide, nodeRadius(d, Deg.get(d.id) ?? 0) + 5)))
    .stop()
  // 처음 자리 : 카테고리 중심 근처 (d3 기본 해바라기 배치를 중심으로 옮긴다)
  for (const n of Nodes) {
    const C = at(n)
    n.x = (n.x ?? 0) * 0.3 + C.x
    n.y = (n.y ?? 0) * 0.3 + C.y
  }
  Sim.tick(Ticks)
  return { ...D, nodes: Nodes.map(({ index: _i, vx: _vx, vy: _vy, fx: _fx, fy: _fy, x, y, ...n }) => ({ ...n, x: Math.round(x! * 10) / 10, y: Math.round(y! * 10) / 10 })) }
}
