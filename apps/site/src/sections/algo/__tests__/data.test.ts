import { describe, expect, it } from 'vitest'
import { Algorithms, Categories, algoHref, inCategory } from '../data'

describe('알고리즘 방 데이터', () => {
  it('Algoristro 의 290개를 모두 옮겼다', () => {
    expect(Algorithms).toHaveLength(290)
  })

  it('모든 알고리즘이 12개 카테고리 가운데 하나에 속한다', () => {
    const Letters = Categories.map((c) => c.letter)
    expect(Categories).toHaveLength(12)
    for (const Row of Algorithms) expect(Letters).toContain(Row[2])
    expect(Categories.reduce((n, c) => n + inCategory(c.letter).length, 0)).toBe(290)
  })

  it('slug 가 겹치지 않는다', () => {
    expect(new Set(Algorithms.map((a) => a[0])).size).toBe(290)
  })

  it('글 주소는 Algoristro 의 카테고리 slug 를 쓴다', () => {
    const Row = Algorithms.find((a) => a[0] === 'binary-search')
    expect(Row && algoHref(Row)).toBe('/algo/algorithm/sorting-and-search/binary-search/')
  })
})
