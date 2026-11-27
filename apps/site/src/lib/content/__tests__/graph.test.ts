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
    // Obsidian 은 파일명으로 링크한다 : posts 는 제목 다음에 파일명 (slug) 으로도 찾는다
    expect(G.resolve('proxy')).toBe(Proxy)
  })

  it('href', () => {
    expect(G.href({ target: 'GC', heading: '세대 구분', raw: '' })).toBe('/wiki/가비지-컬렉션#세대-구분')
    expect(G.href({ target: '[시프] 프록시 서버 구현', raw: '' })).toBe('/posts/proxy')
    expect(G.href({ target: '없음', raw: '' })).toBeUndefined()
  })

  it('backlinks', () => {
    expect(G.backlinks('가비지-컬렉션')).toEqual([Proxy])
  })

  it('backlinks : 위키 노트끼리도 들어간다', () => {
    const Heap: Node = { collection: 'wiki', slug: 'heap', title: '힙', aliases: [], body: '[[GC]] 가 정리한다' }
    expect(buildGraph([Gc, Heap, Proxy]).backlinks('가비지-컬렉션')).toEqual([Heap, Proxy])
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
