import { describe, expect, it } from 'vitest'
import { AllScenes, parentOf, parseScene, sceneToSearch } from '../route'

describe('parseScene', () => {
  it('빈 주소는 갈림길', () => {
    expect(parseScene('').scene).toEqual({ kind: 'crossroads' })
  })

  it('wing 만 있으면 원형 홀', () => {
    expect(parseScene('?wing=west').scene).toEqual({ kind: 'hall', wing: 'west' })
  })

  it('wing 과 그 관의 room 이면 전시실', () => {
    expect(parseScene('?wing=east&room=daoist').scene).toEqual({ kind: 'room', wing: 'east', room: 'daoist' })
  })

  it('없는 wing 은 갈림길로 고친다', () => {
    expect(parseScene('?wing=north')).toEqual({ scene: { kind: 'crossroads' }, canonical: '' })
  })

  it('다른 관의 room 은 그 관의 홀로 고친다', () => {
    expect(parseScene('?wing=east&room=ancient')).toEqual({ scene: { kind: 'hall', wing: 'east' }, canonical: '?wing=east' })
  })

  it('wing 없이 room 만 있으면 갈림길', () => {
    expect(parseScene('?room=ancient').scene).toEqual({ kind: 'crossroads' })
  })

  it('올바른 주소는 canonical 이 그대로', () => {
    expect(parseScene('?wing=west&room=modern').canonical).toBe('?wing=west&room=modern')
  })
})

describe('sceneToSearch', () => {
  it('11개 장면 모두 왕복한다', () => {
    expect(AllScenes).toHaveLength(11)
    for (const S of AllScenes) expect(parseScene(sceneToSearch(S)).scene).toEqual(S)
  })
})

describe('parentOf', () => {
  it('전시실의 부모는 그 관의 홀', () => {
    expect(parentOf({ kind: 'room', wing: 'west', room: 'modern' })).toEqual({ kind: 'hall', wing: 'west' })
  })

  it('홀의 부모는 갈림길', () => {
    expect(parentOf({ kind: 'hall', wing: 'east' })).toEqual({ kind: 'crossroads' })
  })

  it('갈림길은 부모가 없다', () => {
    expect(parentOf({ kind: 'crossroads' })).toBeNull()
  })
})
