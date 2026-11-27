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

  it('related', () => {
    expect(G.related('proxy')).toEqual([Gc, Jvm])
  })

  it('duplicates', () => {
    expect(G.duplicates).toEqual([])
    const Dup = buildGraph([Gc, { ...Jvm, title: '가비지 컬렉션' }, { ...Proxy, slug: 'other' }, Other])
    expect(Dup.duplicates).toEqual(expect.arrayContaining(['가비지 컬렉션', 'other']))
  })
})

describe('path-style targets', () => {
  const W = (slug: string, title: string, sourcePath: string): Node => ({ collection: 'wiki', slug, title, aliases: [], body: '', sourcePath })
  const Css = W('important-css', '!important (CSS)', '멋쟁이사자처럼/프론트엔드/css/!important.md')
  const Js = W('important-js', '!important (JS)', '멋쟁이사자처럼/프론트엔드/js/!important.md')
  const Nn = W('신경망', '신경망', '머신러닝/신경망.md')
  const Other = W('신경망-2', '신경망 (기초)', '기초/머신러닝/신경망.md')
  const G = buildGraph([Css, Js, Nn, Other])

  it('resolves full path to a renamed note, with or without .md', () => {
    expect(G.resolve('멋쟁이사자처럼/프론트엔드/css/!important')).toBe(Css)
    expect(G.resolve('멋쟁이사자처럼/프론트엔드/js/!important.md')).toBe(Js)
  })

  it('resolves a suffix on a slash boundary, case-insensitively', () => {
    expect(G.resolve('Css/!Important')).toBe(Css)
    expect(G.resolve('프론트엔드/js/!important')).toBe(Js)
  })

  it('prefers exact full path over suffix matches', () => {
    expect(G.resolve('머신러닝/신경망')).toBe(Nn)
  })

  it('returns undefined when ambiguous or when only a partial segment matches', () => {
    expect(buildGraph([Css, W('x', 'x', '다른/css/!important.md')]).resolve('css/!important')).toBeUndefined()
    expect(G.resolve('레닝/신경망')).toBeUndefined()
    expect(G.resolve('없는/경로')).toBeUndefined()
  })

  it('does not apply to targets without a slash', () => {
    expect(G.resolve('!important')).toBeUndefined()
  })
})
