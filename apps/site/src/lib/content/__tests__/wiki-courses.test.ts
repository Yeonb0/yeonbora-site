import { describe, expect, it } from 'vitest'
import { buildGraph, type Node } from '../graph'
import { buildCourseOutlines } from '../wiki-courses'
import { buildWikiGraphData } from '../wiki-graph'
import { layoutWikiGraph } from '../wiki-layout'

const Notes = [
  { id: '/wiki/fe', sourcePath: '멋쟁이사자처럼/_MOC/프론트엔드.md', topic: 'web', courses: ['likelion'] },
  { id: '/wiki/css', sourcePath: '멋쟁이사자처럼/프론트엔드/CSS.md', topic: 'web', courses: ['likelion'] },
  { id: '/wiki/flex', sourcePath: '멋쟁이사자처럼/프론트엔드/CSS/flex.md', topic: 'web', courses: ['likelion'] },
  { id: '/wiki/bean', sourcePath: '멋쟁이사자처럼/백엔드/Spring/빈.md', topic: 'spring', courses: ['likelion'] },
  { id: '/wiki/tcp', sourcePath: '컴퓨터 네트워크/TCP.md', topic: 'network', courses: [] },
]

describe('buildCourseOutlines', () => {
  const [L, ...Rest] = buildCourseOutlines(Notes)

  it('노트가 있는 코스만', () => {
    expect(Rest).toEqual([])
    expect(L).toMatchObject({ id: 'likelion', node: '@likelion', count: 4, hubs: ['/wiki/fe'] })
  })

  it('과목 · 단원 : 배운 순서, 단원 수와 색 (가장 많은 카테고리), MOC 주소', () => {
    const [Fe, Be] = L.groups
    expect(Fe).toMatchObject({ name: '프론트엔드', href: '/wiki/fe', count: 2 })
    expect(Fe.units.find((u) => u.name === 'CSS')).toEqual({ name: 'CSS', href: '/wiki/css', count: 1, topic: 'web' })
    expect(Be.units.find((u) => u.name === 'Spring')).toMatchObject({ count: 1, topic: 'spring', href: undefined })
  })
})

describe('코스 노드', () => {
  const W = (slug: string, body: string, topic: string, course?: string[]): Node & { topic: string; course?: string[] } => ({ collection: 'wiki', slug, title: slug, aliases: [], body, topic, course })
  const Ns = [W('fe', '[[css]]', 'web', ['likelion']), W('css', '', 'web', ['likelion']), W('bean', '', 'spring', ['likelion']), W('tcp', '', 'network')]
  const D = buildWikiGraphData(Ns, buildGraph(Ns), buildCourseOutlines(Notes))

  it('마름모 노드는 카테고리 없이, 코스 MOC 와만 잇는다', () => {
    expect(D.nodes.find((n) => n.id === '@likelion')).toEqual({ id: '@likelion', title: '멋쟁이 사자처럼', kind: 'course', topic: '' })
    expect(D.links.filter((l) => l.includes('@likelion'))).toEqual([['/wiki/fe', '@likelion']])
    expect(D.nodes.find((n) => n.id === '/wiki/bean')?.courses).toEqual(['likelion'])
    expect(D.nodes.find((n) => n.id === '/wiki/tcp')?.courses).toBeUndefined()
    expect(D.topics.map((t) => t.id)).not.toContain('')
  })

  it('배치 : 코스 노드는 그 코스 노트들의 가운데', () => {
    const P = layoutWikiGraph(D, 50).nodes
    const M = P.filter((n) => n.courses?.includes('likelion'))
    const C = P.find((n) => n.id === '@likelion')!
    expect(C.x).toBeCloseTo(M.reduce((s, n) => s + n.x!, 0) / M.length, 0)
    expect(C.y).toBeCloseTo(M.reduce((s, n) => s + n.y!, 0) / M.length, 0)
  })
})
