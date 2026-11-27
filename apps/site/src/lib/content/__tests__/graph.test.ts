import { describe, expect, it } from 'vitest'
import { buildGraph, type Node } from '../graph'

const Gc: Node = { collection: 'wiki', slug: '가비지-컬렉션', title: '가비지 컬렉션', aliases: ['GC'], body: '' }
const Jvm: Node = { collection: 'wiki', slug: 'jvm', title: 'JVM', aliases: [], body: '' }
const Proxy: Node = { collection: 'posts', slug: 'proxy', title: '[시프] 프록시 서버 구현', aliases: [], body: '[[GC]] 와 [[JVM]] 그리고 [[GC]]' }
const Other: Node = { collection: 'posts', slug: 'other', title: 'JVM', aliases: [], body: '' }

const G = buildGraph([Gc, Jvm, Proxy, Other])

describe('buildGraph', () => {
  it('resolve order', () => {
    expect(G.resolve('JVM')).toBe(Jvm)
    expect(G.resolve('GC')).toBe(Gc)
    expect(G.resolve('[시프] 프록시 서버 구현')).toBe(Proxy)
    expect(G.resolve('없음')).toBeUndefined()
  })

  it('href', () => {
    expect(G.href({ target: 'GC', heading: '세대 구분', raw: '' })).toBe('/wiki/가비지-컬렉션#세대-구분')
    expect(G.href({ target: '[시프] 프록시 서버 구현', raw: '' })).toBe('/posts/proxy')
    expect(G.href({ target: '없음', raw: '' })).toBeUndefined()
  })

  it('backlinks', () => {
    expect(G.backlinks('가비지-컬렉션')).toEqual([Proxy])
  })

  it('related', () => {
    expect(G.related('proxy')).toEqual([Gc, Jvm])
  })

  it('duplicates', () => {
    expect(G.duplicates).toEqual([])
    const Dup = buildGraph([Gc, { ...Jvm, title: '가비지 컬렉션' }, { ...Proxy, slug: 'other' }, Other])
    expect(Dup.duplicates).toEqual(expect.arrayContaining(['가비지 컬렉션', 'other']))
  })
})
