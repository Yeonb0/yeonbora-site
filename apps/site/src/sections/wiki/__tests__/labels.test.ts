import { describe, expect, it } from 'vitest'
import { placeLabels, type LabelItem } from '../labels'

const Item = (id: string, x: number, y: number, w = 40, force = false): LabelItem => ({ id, x, y, r: 5, w, force })

describe('placeLabels', () => {
  it('붙어 있는 두 노드 : 둘째 이름표는 아래 대신 다른 자리', () => {
    const Out = placeLabels([Item('a', 100, 100), Item('b', 130, 100)], [], 300, 300)
    expect(Out.get('a')?.side).toBe('below')
    expect(Out.get('b')?.side).not.toBe('below')
    expect(Out.get('b')).not.toBeNull()
  })

  it('칸 밖으로 나가는 자리는 고르지 않는다', () => {
    const Out = placeLabels([Item('a', 150, 295)], [], 300, 300)
    expect(Out.get('a')?.side).toBe('above')
  })

  it('사방이 막히면 null, force 면 아래', () => {
    const Wall = [{ x: 0, y: 0, w: 300, h: 300 }]
    const Out = placeLabels([Item('a', 150, 150), Item('b', 150, 150, 40, true)], Wall, 300, 300)
    expect(Out.get('a')).toBeNull()
    expect(Out.get('b')?.side).toBe('below')
  })
})
