import { describe, expect, it } from 'vitest'
import { Ramp, drawPlanet } from '../planet'

const plain = (s: string) => s.replace(/<span class="star">(.)<\/span>/g, '$1')

describe('drawPlanet', () => {
  it('줄 수와 줄마다 칸 수가 맞다 (별 태그를 벗기면)', () => {
    const Lines = plain(drawPlanet(104, 44, 0, { x: 0.6, y: -0.5 })).split('\n')
    expect(Lines.at(-1)).toBe('')
    expect(Lines.slice(0, -1)).toHaveLength(44)
    for (const L of Lines.slice(0, -1)) expect([...L]).toHaveLength(104)
  })

  it('행성 그림 문자는 subset 글꼴에 든 문자만 쓴다', () => {
    const Used = new Set(plain(drawPlanet(104, 44, 3.7, { x: -1, y: 1 })).replace(/\n/g, ''))
    for (const Ch of Used) expect(Ramp + '*').toContain(Ch)
  })

  it('빛이 오는 쪽이 반대쪽보다 밝다', () => {
    const Rows = plain(drawPlanet(104, 44, 0, { x: 1, y: 0 })).split('\n')
    const Mid = Rows[22]
    const level = (ch: string) => Ramp.indexOf(ch)
    // 행성 중심 (52열) 에서 좌우로 같은 거리
    expect(level(Mid[60])).toBeGreaterThan(level(Mid[44]))
  })
})
