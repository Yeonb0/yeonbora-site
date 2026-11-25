import { describe, expect, it } from 'vitest'
import { parseCat } from '../route'
import { pickStage, placeFlowers } from '../layout'
import { timeOfDay } from '../palettes'

describe('목록 주소', () => {
  it('카테고리 코드와 all 만 받는다', () => {
    expect(parseCat('#cat=H')).toEqual({ cat: 'H', canonical: '#cat=H' })
    expect(parseCat('#cat=all')).toEqual({ cat: 'all', canonical: '#cat=all' })
    expect(parseCat('#cat=Z')).toEqual({ cat: null, canonical: '' })
    expect(parseCat('')).toEqual({ cat: null, canonical: '' })
  })
})

describe('꽃밭 배치', () => {
  it('세로로 긴 화면은 세로 배치를 쓴다', () => {
    expect(pickStage(390, 844).portrait).toBe(true)
    expect(pickStage(1440, 900).portrait).toBe(false)
  })

  it('꽃 12송이가 모두 화면 안에 핀다', () => {
    for (const S of [pickStage(1440, 900), pickStage(390, 844)]) {
      const Spots = placeFlowers(S)
      expect(Spots).toHaveLength(12)
      for (const F of Spots) {
        const hx = F.x + F.headX
        const hy = F.gy + F.headY
        expect(hx - F.r).toBeGreaterThan(0)
        expect(hx + F.r).toBeLessThan(S.W)
        expect(hy - F.r).toBeGreaterThan(0)
        expect(F.gy).toBeLessThan(S.H)
      }
    }
  })

  it('먼 꽃이 가까운 꽃보다 작다', () => {
    const Spots = placeFlowers(pickStage(1440, 900))
    const Far = Spots.find((f) => f.letter === 'L')!
    const Near = Spots.find((f) => f.letter === 'K')!
    expect(Far.r).toBeLessThan(Near.r)
  })
})

describe('시간대', () => {
  it('접속 시각으로 시간대를 고른다', () => {
    expect(timeOfDay(6)).toBe('dawn')
    expect(timeOfDay(12)).toBe('day')
    expect(timeOfDay(18)).toBe('sunset')
    expect(timeOfDay(22)).toBe('night')
    expect(timeOfDay(3)).toBe('night')
  })
})
