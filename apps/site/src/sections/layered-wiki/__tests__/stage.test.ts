import { describe, expect, it } from 'vitest'
import { TabKeys, parseHash, resolveStart } from '../stage'
import { Weeks, pad } from '../data'

describe('parseHash', () => {
  it('탭 · 장 · 주차를 읽는다', () => {
    expect(parseHash('#slides-3')).toEqual({ tab: 'slides', n: '3' })
    expect(parseHash('#demo')).toEqual({ tab: 'demo', n: undefined })
    expect(parseHash('#wiki-07')).toEqual({ tab: 'wiki', n: '07' })
  })

  it('모르는 해시는 null', () => {
    expect(parseHash('')).toBeNull()
    expect(parseHash('#foo')).toBeNull()
    expect(parseHash('#slides-x')).toBeNull()
  })
})

describe('첫 화면 · 탭 순서', () => {
  it('숫자키 0 1 2 3', () => {
    expect(TabKeys).toEqual({ '0': 'home', '1': 'demo', '2': 'slides', '3': 'wiki' })
  })

  it('#home 과 빈 해시는 첫 화면', () => {
    expect(parseHash('#home')).toEqual({ tab: 'home', n: undefined })
    expect(resolveStart('', 2, ['01'])).toEqual({ tab: 'home', slide: 0, week: null })
  })

  it('없는 장 · 주차는 그 탭의 처음으로', () => {
    expect(resolveStart('#slides-99', 2, ['01'])).toEqual({ tab: 'slides', slide: 0, week: null })
    expect(resolveStart('#wiki-04', 2, ['01', '07'])).toEqual({ tab: 'wiki', slide: 0, week: '01' })
    expect(resolveStart('#slides-2', 2, ['01'])).toEqual({ tab: 'slides', slide: 1, week: null })
  })
})

describe('Weeks', () => {
  it('주차는 오름차순이고 겹치지 않는다', () => {
    const N = Weeks.map((w) => w.week)
    expect([...N].sort((a, b) => a - b)).toEqual(N)
    expect(new Set(N).size).toBe(N.length)
  })

  it('해시용 두 자리', () => {
    expect(pad(1)).toBe('01')
    expect(pad(11)).toBe('11')
  })
})
