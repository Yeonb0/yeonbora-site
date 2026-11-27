import { describe, expect, it } from 'vitest'
import { layoutWikiGraph } from '../wiki-layout'
import type { WikiGraphData } from '../wiki-graph'

const D: WikiGraphData = {
  nodes: [
    { id: '/wiki/a', title: 'A', kind: 'wiki', topic: 'network' },
    { id: '/wiki/b', title: 'B', kind: 'wiki', topic: 'network' },
    { id: '/wiki/c', title: 'C', kind: 'wiki', topic: 'os' },
    { id: '?d', title: 'D', kind: 'ghost', topic: 'os' },
  ],
  links: [
    ['/wiki/a', '/wiki/b'],
    ['/wiki/c', '?d'],
  ],
  topics: [
    { id: 'network', name: '네트워크', color: '#5cc8e6' },
    { id: 'os', name: '운영체제', color: '#ff9e64' },
  ],
}

describe('layoutWikiGraph', () => {
  it('모든 노드에 좌표, 같은 데이터면 같은 자리', () => {
    const A = layoutWikiGraph(D, 100)
    expect(A.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true)
    expect(layoutWikiGraph(D, 100).nodes).toEqual(A.nodes)
  })

  it('같은 카테고리 노드끼리가 다른 카테고리보다 가깝다', () => {
    const P = new Map(layoutWikiGraph(D, 200).nodes.map((n) => [n.id, n]))
    const d = (a: string, b: string) => Math.hypot(P.get(a)!.x! - P.get(b)!.x!, P.get(a)!.y! - P.get(b)!.y!)
    expect(d('/wiki/a', '/wiki/b')).toBeLessThan(d('/wiki/a', '/wiki/c'))
  })
})
