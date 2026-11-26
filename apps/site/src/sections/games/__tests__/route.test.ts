import { describe, expect, it } from 'vitest'
import { gameSearch, parseGame } from '../route'
import { GameIds } from '../data'

describe('parseGame', () => {
  it('빈 주소는 방 화면', () => {
    expect(parseGame('')).toEqual({ id: null, canonical: '' })
  })

  it('있는 게임이면 그 게임 페이지', () => {
    expect(parseGame('?game=factory')).toEqual({ id: 'factory', canonical: '?game=factory' })
  })

  it('없는 게임은 방 화면으로 고친다', () => {
    expect(parseGame('?game=tetris')).toEqual({ id: null, canonical: '' })
  })

  it('4개 게임 모두 왕복한다', () => {
    expect(GameIds).toHaveLength(4)
    for (const id of GameIds) expect(parseGame(gameSearch(id)).id).toBe(id)
  })
})
