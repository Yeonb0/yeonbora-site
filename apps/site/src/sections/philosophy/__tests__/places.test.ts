import { describe, expect, it } from 'vitest'
import { CrossroadsArches, GlowOf, HallDoors, imageKey, originOf } from '../places'
import { AllScenes } from '../route'

describe('places', () => {
  it('11개 장면이 저마다 다른 사진을 쓴다', () => {
    expect(new Set(AllScenes.map(imageKey)).size).toBe(11)
  })

  it('모든 장면에 뒤로가기 빛 색이 있다 (r g b)', () => {
    for (const S of AllScenes) expect(GlowOf(S)).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/)
  })

  it('전시실은 홀의 그 문에서, 홀은 갈림길의 그 아치에서 들어온다', () => {
    expect(originOf({ kind: 'room', wing: 'west', room: 'ancient' })).toEqual(HallDoors.west[0])
    expect(originOf({ kind: 'room', wing: 'east', room: 'hundred' })).toEqual(HallDoors.east[3])
    expect(originOf({ kind: 'hall', wing: 'east' })).toEqual(CrossroadsArches.east)
    expect(originOf({ kind: 'crossroads' })).toBeNull()
  })
})
