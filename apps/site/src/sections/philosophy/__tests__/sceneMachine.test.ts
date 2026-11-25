import { describe, expect, it } from 'vitest'
import { idle, reduce } from '../sceneMachine'
import type { Rect, Scene } from '../types'

const Crossroads: Scene = { kind: 'crossroads' }
const WestHall: Scene = { kind: 'hall', wing: 'west' }
const EastHall: Scene = { kind: 'hall', wing: 'east' }
const ArchW: Rect = { x: 70, y: 30, w: 15, h: 40 }
const ArchE: Rect = { x: 15, y: 30, w: 15, h: 40 }

describe('sceneMachine', () => {
  it('go 는 떠나기를 시작하고 left · entered 를 거쳐 새 장면에서 멈춘다', () => {
    let S = reduce(idle(Crossroads), { type: 'go', to: WestHall, origin: ArchW })
    expect(S).toMatchObject({ scene: Crossroads, phase: 'leaving', next: WestHall, origin: ArchW })
    S = reduce(S, { type: 'left' })
    expect(S).toMatchObject({ scene: WestHall, phase: 'entering' })
    S = reduce(S, { type: 'entered' })
    expect(S).toMatchObject({ scene: WestHall, phase: 'idle', next: null })
  })

  it('transition lock : 전환 중 go 는 무시한다', () => {
    const S = reduce(idle(Crossroads), { type: 'go', to: WestHall, origin: ArchW })
    expect(reduce(S, { type: 'go', to: EastHall, origin: ArchE })).toEqual(S)
    const E = reduce(S, { type: 'left' })
    expect(reduce(E, { type: 'go', to: EastHall, origin: ArchE })).toEqual(E)
  })

  it('전환 중 pop 은 지금 전환을 끝낸 뒤 그 장면으로 이어 간다', () => {
    let S = reduce(idle(Crossroads), { type: 'go', to: WestHall, origin: ArchW })
    S = reduce(S, { type: 'pop', to: Crossroads })
    S = reduce(reduce(S, { type: 'left' }), { type: 'entered' })
    expect(S).toMatchObject({ scene: WestHall, phase: 'leaving', next: Crossroads })
  })

  it('멈춰 있을 때 pop 은 바로 떠나기를 시작한다', () => {
    const S = reduce(idle(WestHall), { type: 'pop', to: Crossroads })
    expect(S).toMatchObject({ phase: 'leaving', next: Crossroads })
  })

  it('지금 장면과 같은 곳으로 가는 go 는 무시한다', () => {
    const I = idle(WestHall)
    expect(reduce(I, { type: 'go', to: { kind: 'hall', wing: 'west' }, origin: null })).toEqual(I)
  })
})
