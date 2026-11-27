import { describe, expect, it } from 'vitest'
import { buildGraph, type Node } from '../graph'
import { buildWikiGraphData } from '../wiki-graph'

const W = (slug: string, title: string, body: string, topic?: string): Node & { topic?: string } => ({ collection: 'wiki', slug, title, aliases: [], body, topic })
const P = (slug: string, title: string, body: string): Node => ({ collection: 'posts', slug, title, aliases: [], body })

const Nodes = [
  W('a', 'A', '[[B]] 와 [[B]] 그리고 [[없음]] [[#소제목]] ![[a.png]] [[A]]', 'network'),
  W('b', 'B', '[[A]]', 'network'),
  W('c', 'C', '본문', undefined),
  P('p', '글', '[[A]] 설명'),
  P('q', '상관없는 글', '[[글]]'),
]
const D = buildWikiGraphData(Nodes, buildGraph(Nodes))
const ids = () => D.nodes.map((n) => n.id).sort()

describe('buildWikiGraphData', () => {
  it('nodes', () => {
    expect(ids()).toEqual(['/posts/p', '/wiki/a', '/wiki/b', '/wiki/c', '?없음'])
    expect(D.nodes.find((n) => n.id === '?없음')).toMatchObject({ kind: 'ghost', title: '없음', topic: 'network' })
    expect(D.nodes.find((n) => n.id === '/posts/p')).toMatchObject({ kind: 'post', title: '글', topic: 'network' })
  })

  it('links : 중복 · 양방향은 한 번, 자기 링크 · 소제목 · 임베드는 무시', () => {
    expect(D.links).toHaveLength(3)
    expect(D.links).toEqual(expect.arrayContaining([['/wiki/a', '/wiki/b'], ['/wiki/a', '?없음'], ['/posts/p', '/wiki/a']]))
  })

  it('topic 이 없으면 etc, topics 는 노트가 있는 것만', () => {
    expect(D.nodes.find((n) => n.id === '/wiki/c')?.topic).toBe('etc')
    expect(D.topics).toEqual([
      { id: 'network', name: '네트워크' },
      { id: 'etc', name: '기타' },
    ])
  })
})
