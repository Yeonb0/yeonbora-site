import { describe, expect, it } from 'vitest'
import { cleanTitle, folderOf, folderView, parseHash, rankInSeries, recent, summarize, toHash, visibleFolders, type DeskPost } from '../desk'

const P = (o: Partial<DeskPost> & { id: string }): DeskPost => ({ title: o.id, date: '2026-06-24', tags: [], summary: '', ...o })

const Net = [
  P({ id: 'a', topic: 'network', series: '컴퓨터 네트워크', step: 2, date: '2026-06-24' }),
  P({ id: 'b', topic: 'network', series: '컴퓨터 네트워크', step: 1, date: '2026-06-24' }),
  P({ id: 'c', topic: 'network', series: '혼자 공부하는 네트워크', step: 1, date: '2026-02-05' }),
  P({ id: 'd', topic: 'network', date: '2026-01-01' }),
]

describe('folderOf', () => {
  it('topic 이 폴더 목록에 없으면 기타', () => {
    expect(folderOf('network')).toBe('network')
    expect(folderOf('Computer-System')).toBe('system')
    expect(folderOf('quantum')).toBe('etc')
    expect(folderOf(undefined)).toBe('etc')
  })

  it('기타 폴더는 기타 글이 있을 때만 보인다', () => {
    expect(visibleFolders(Net).some((f) => f.id === 'etc')).toBe(false)
    expect(visibleFolders([P({ id: 'x', topic: 'quantum' })]).some((f) => f.id === 'etc')).toBe(true)
  })
})

describe('rankInSeries', () => {
  it('step 이 0 부터여도 순서는 1 부터', () => {
    const Log = [P({ id: 'p0', series: '공장', step: 0 }), P({ id: 'p1', series: '공장', step: 1 })]
    expect(rankInSeries(Log, Log[0])).toBe(1)
    expect(rankInSeries(Log, Log[1])).toBe(2)
  })

  it('시리즈 밖 글은 null', () => {
    expect(rankInSeries(Net, Net[3])).toBeNull()
  })
})

describe('folderView', () => {
  it('책이 둘이면 전체가 맨 앞, 시리즈 밖이 맨 뒤', () => {
    const V = folderView(Net, 'network', null)
    expect(V.books.map((b) => b.kind)).toEqual(['all', 'book', 'book', 'loose'])
    expect(V.book).toBeNull()
    expect(V.count).toBe(4)
    expect(V.rows.filter((r) => r.kind === 'head').map((r) => r.title)).toEqual(['컴퓨터 네트워크', '혼자 공부하는 네트워크', '시리즈 밖의 글'])
  })

  it('책을 고르면 그 책 글만 순서대로', () => {
    const V = folderView(Net, 'network', '컴퓨터 네트워크')
    expect(V.rows.map((r) => (r.kind === 'post' ? r.id : r.title))).toEqual(['b', 'a'])
    expect(V.rows.map((r) => (r.kind === 'post' ? r.num : ''))).toEqual([1, 2])
  })

  it('책이 하나면 그 책이 선택된 채로 열린다', () => {
    const One = [P({ id: 'h', topic: 'algorithm', series: '알고리즘 설계와 분석', step: 6 })]
    const V = folderView(One, 'algorithm', null)
    expect(V.book).toBe('알고리즘 설계와 분석')
    expect(V.books.map((b) => b.kind)).toEqual(['book'])
  })

  it('없는 책은 무시한다', () => {
    expect(folderView(Net, 'network', '없는 책').book).toBeNull()
  })

  it('빈 폴더는 책도 글도 없다', () => {
    const V = folderView(Net, 'java', null)
    expect(V.books).toEqual([])
    expect(V.rows).toEqual([])
    expect(V.count).toBe(0)
  })

  it('BOJ 는 티어가 책이고 최신 순', () => {
    const Boj = [
      P({ id: '1000', topic: 'boj', tier: 'Bronze', date: '2026-01-18' }),
      P({ id: '1238', topic: 'boj', tier: 'Gold', date: '2026-03-27' }),
    ]
    const V = folderView(Boj, 'boj', null)
    expect(V.books.map((b) => b.title)).toEqual(['전체', 'Bronze', 'Silver', 'Gold', 'Platinum'])
    expect(V.rows.map((r) => (r.kind === 'post' ? r.id : ''))).toEqual(['1238', '1000'])
    expect(folderView(Boj, 'boj', 'Gold').rows).toHaveLength(1)
  })
})

describe('recent', () => {
  it('최신 순, 위치는 폴더 / 시리즈 / 순서', () => {
    const R = recent(Net, 2)
    expect(R.map((r) => (r.kind === 'post' ? r.id : ''))).toEqual(['a', 'b'])
    expect(R[0].kind === 'post' && R[0].where).toBe('Network / 컴퓨터 네트워크 / 2')
  })
})

describe('hash', () => {
  it('폴더와 책을 오간다', () => {
    expect(parseHash(toHash('network', '컴퓨터 네트워크'))).toEqual({ folder: 'network', book: '컴퓨터 네트워크' })
    expect(parseHash('#recent')).toEqual({ folder: 'recent', book: null })
  })

  it('없는 폴더면 기본 폴더', () => {
    expect(parseHash('')).toEqual({ folder: 'network', book: null })
    expect(parseHash('#nowhere/x')).toEqual({ folder: 'network', book: null })
  })
})

describe('summarize', () => {
  it('주석 · 이미지 · 코드 · 태그 · 제목을 빼고 자른다', () => {
    const Body = [
      '%% check : 메모 %%',
      '## ✦ Framing',
      '![](/a.png)',
      '- 데이터 **끊어** 보내기 → <img src="x"> 도착 시에 합치기',
      '```c',
      'int x;',
      '```',
      '[[ARQ|재전송]] 과 [링크](http://a) 를 본다',
    ].join('\n')
    expect(summarize(Body)).toBe('데이터 끊어 보내기 → 도착 시에 합치기 재전송 과 링크 를 본다')
    expect(summarize('가'.repeat(200), 10)).toBe('가'.repeat(9) + '…')
  })
})

describe('cleanTitle', () => {
  it('제목 앞 [카테고리] 머리말을 뗀다', () => {
    expect(cleanTitle('[Network] Framing / Error Control')).toBe('Framing / Error Control')
    expect(cleanTitle('[공장 게임] Phase 0 : 뼈대')).toBe('Phase 0 : 뼈대')
    expect(cleanTitle('[Network]')).toBe('[Network]')
    expect(cleanTitle('Hash Tables')).toBe('Hash Tables')
  })
})
