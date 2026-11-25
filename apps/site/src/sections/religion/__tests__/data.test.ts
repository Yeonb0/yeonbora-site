import { describe, expect, it } from 'vitest'
import { Religions } from '../data'
import { Badges } from '../badges'

describe('종교 목록과 뱃지 도형', () => {
  it('위 줄은 동양 종교 (유 · 불 · 도 · 원불), 아래 줄은 나머지', () => {
    expect(Religions.map((r) => r.id)).toEqual(['confucianism', 'buddhism', 'taoism', 'won-buddhism', 'christianity', 'hinduism', 'islam', 'judaism'])
  })

  it('종교마다 뱃지 도형이 있고, 바탕 금속 판이 있다', () => {
    for (const r of Religions) {
      const B = Badges.find((b) => b.id === r.id)
      expect(B, r.id).toBeDefined()
      expect(B!.layers.some((L) => L.kind === 'plate' && L.polys.length > 0), r.id).toBe(true)
    }
  })

  it('불교 卍 은 왼쪽으로 도는 정방향이다 (위 팔이 왼쪽으로 꺾인다)', () => {
    const Plate = Badges.find((b) => b.id === 'buddhism')!.layers[0].polys[0][0]
    const Pts: [number, number][] = []
    for (let i = 0; i < Plate.length; i += 2) Pts.push([Plate[i], Plate[i + 1]])
    // 맨 위 (y 가장 작은) 점들은 가운데 (50) 보다 왼쪽에 있다
    const Top = Math.min(...Pts.map((p) => p[1]))
    const TopXs = Pts.filter((p) => p[1] < Top + 1).map((p) => p[0])
    expect(Math.min(...TopXs)).toBeLessThan(30)
    expect(Math.max(...TopXs)).toBeLessThanOrEqual(57)
  })
})
