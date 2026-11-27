import { describe, expect, it } from 'vitest'
import { parseHash } from '../stage'
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
