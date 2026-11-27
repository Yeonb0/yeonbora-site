import { describe, expect, it } from 'vitest'
import { Books, Cases, Layout, ShelfIds, Tabs, allItems, booksOf, viewX } from '../data'

describe('도서관 데이터', () => {
  it('그림이 있는 칸은 모두 도서관 어딘가에 한 번씩 놓인다', () => {
    const Placed = Cases.flat().filter((id) => !id.startsWith('plain'))
    expect([...Placed].sort()).toEqual([...ShelfIds].sort())
  })

  it('책장은 모두 5칸이다', () => {
    for (const rows of Cases) expect(rows).toHaveLength(5)
  })

  it('목록의 모든 항목은 있는 칸을 가리킨다', () => {
    for (const it of allItems()) expect(ShelfIds, it.key).toContain(it.shelf)
  })

  it('항목 key 는 겹치지 않는다', () => {
    const Keys = allItems().map((i) => i.key)
    expect(new Set(Keys).size).toBe(Keys.length)
  })

  it('책 id 는 겹치지 않고, 학자가 있는 책은 목록에 그 학자가 있다', () => {
    expect(new Set(Books.map((b) => b.id)).size).toBe(Books.length)
    const Thinkers = new Set(allItems().flatMap((i) => (i.thinker ? [i.thinker] : [])))
    for (const b of Books.filter((b) => b.thinker)) expect(Thinkers, b.id).toContain(b.thinker)
  })

  it('유가 (철학) 와 유교 (종교) 는 같은 칸이다', () => {
    const Find = (k: string) => allItems().find((i) => i.key === k)!
    expect(Find('ru').shelf).toBe(Find('confucianism').shelf)
  })
})

describe('보는 자리 (viewX)', () => {
  const Find = (k: string) => allItems().find((i) => i.key === k)!
  const Center = (x: number) => x + Layout.view[2] / 2

  it('갈래는 칸 가운데를 본다', () => {
    expect(Center(viewX(Find('ru')))).toBe(768)
  })

  it('학자는 그 학자의 책이 가운데 온다', () => {
    const Zhu = booksOf(Find('zhuxi'))
    expect(Zhu.map((b) => b.id)).toEqual(['yulei'])
    expect(Center(viewX(Find('zhuxi')))).toBeCloseTo(Zhu[0].slot[0] + Zhu[0].slot[2] / 2)
  })

  it('책이 없는 학자는 칸 가운데, 칸 밖으로는 나가지 않는다', () => {
    expect(Center(viewX(Find('wonhyo')))).toBe(768)
    for (const it of allItems()) {
      const X = viewX(it)
      expect(X).toBeGreaterThanOrEqual(0)
      expect(X + Layout.view[2]).toBeLessThanOrEqual(1536)
    }
  })

  it('탭은 철학 · 종교 · 언어', () => {
    expect(Tabs.map((t) => t.name)).toEqual(['철학', '종교', '언어'])
  })
})
