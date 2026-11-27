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

describe('typographic apostrophes', () => {
  const Prim: Node = { collection: 'wiki', slug: 'prims-algorithm', title: "Prim's Algorithm", aliases: [], body: '' }
  const Pg = buildGraph([Prim])

  it.each(['\u2018', '\u2019', '\u02BC'])('resolve and href treat %s as a straight apostrophe', (Q) => {
    expect(Pg.resolve(`Prim${Q}s Algorithm`)).toBe(Prim)
    expect(Pg.href({ raw: '', target: `Prim${Q}s Algorithm` })).toBe('/wiki/prims-algorithm')
  })

  it('a note title with a curly apostrophe is found by the straight one', () => {
    const Curly: Node = { collection: 'wiki', slug: 'x', title: 'Kruskal\u2019s', aliases: ['Johnson\u2019s'], body: '' }
    const G2 = buildGraph([Curly])
    expect(G2.resolve("Kruskal's")).toBe(Curly)
    expect(G2.resolve("Johnson's")).toBe(Curly)
  })

  it('a target with no note stays unresolved', () => {
    expect(Pg.resolve('Jensen\u2019s Device')).toBeUndefined()
    expect(Pg.href({ raw: '', target: 'Jensen\u2019s Device' })).toBeUndefined()
  })
})

describe('clash-name links (R13)', () => {
  const W = (slug: string, title: string, sourcePath: string, aliases: string[] = []): Node => ({ collection: 'wiki', slug, title, aliases, body: '', sourcePath })
  const PopStack = W('pop-컴퓨터시스템개론', 'pop (컴퓨터시스템개론)', '컴퓨터시스템개론/pop.md', ['pop'])
  const PopServer = W('pop-서버', 'POP (서버 구조와 기술)', '서버 구조와 기술/POP.md', ['POP'])
  const PopLang = W('process-oriented-programming', 'Process Oriented Programming', '프로그래밍 언어/Process Oriented Programming.md', ['POP'])
  const ImpCss = W('important-css', '!important (CSS)', '멋쟁이사자처럼/css/!important.md', ['!important'])
  const ImpJs = W('important-js', '!important (JS)', '멋쟁이사자처럼/js/!important.md', ['!important'])
  const Nodes = [PopServer, PopLang, PopStack, ImpJs, ImpCss]
  const From = (sourcePath: string) => ({ sourcePath })

  it('prefers the note whose title or alias matches with exact case', () => {
    const G = buildGraph(Nodes)
    expect(G.resolve('pop', From('자료구조/시간 복잡도.md'))).toBe(PopStack)
    expect(G.resolve('POP', From('자료구조/시간 복잡도.md'))).not.toBe(PopStack)
    expect(G.resolveInfo('pop', From('자료구조/시간 복잡도.md')).ambiguous).toEqual([])
  })

  it('then picks the note nearest to the linking note', () => {
    const G = buildGraph(Nodes)
    expect(G.resolve('!important', From('멋쟁이사자처럼/css/박스.md'))).toBe(ImpCss)
    expect(G.resolve('!important', From('멋쟁이사자처럼/js/함수.md'))).toBe(ImpJs)
    const Info = G.resolveInfo('!important', From('멋쟁이사자처럼/css/박스.md'))
    expect(Info.node).toBe(ImpCss)
    expect(Info.ambiguous).toEqual(expect.arrayContaining([ImpCss, ImpJs]))
  })

  it('then falls back to a fixed order by sourcePath', () => {
    const G = buildGraph(Nodes)
    expect(G.resolve('!important', From('자료구조/x.md'))).toBe(ImpCss)
    expect(G.resolve('!important')).toBe(ImpCss)
    expect(G.resolve('POP', From('자료구조/x.md'))).toBe(PopServer)
  })

  it('gives the same result for any input order', () => {
    const A = buildGraph(Nodes)
    const B = buildGraph([...Nodes].reverse())
    for (const T of ['pop', 'POP', '!important'])
      for (const S of ['자료구조/x.md', '멋쟁이사자처럼/js/a.md', undefined]) expect(B.resolve(T, S ? From(S) : undefined)).toBe(A.resolve(T, S ? From(S) : undefined))
  })

  it('href and backlinks use the linking note as context', () => {
    const Css: Node = { ...ImpCss, body: '' }
    const Linker: Node = { collection: 'wiki', slug: 'box', title: '박스', aliases: [], body: '[[!important]]', sourcePath: '멋쟁이사자처럼/css/박스.md' }
    const G = buildGraph([ImpJs, Css, Linker])
    expect(G.href({ raw: '', target: '!important' }, From('멋쟁이사자처럼/js/a.md'))).toBe('/wiki/important-js')
    expect(G.href({ raw: '', target: '!important' }, From('멋쟁이사자처럼/css/a.md'))).toBe('/wiki/important-css')
  })
})
