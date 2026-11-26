import { describe, expect, it } from 'vitest'
import { Games, GameIds } from '../data'
import { Glyph, textWidth } from '../font'

describe('Games', () => {
  it('id 가 겹치지 않는다', () => {
    expect(new Set(GameIds).size).toBe(Games.length)
  })

  it('색은 #rrggbb', () => {
    for (const g of Games) expect(g.color).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('이름은 도트 글씨에 있는 글자로만 쓰고, 이름 캔버스 (200 칸) 안에 들어간다', () => {
    for (const g of Games) {
      for (const ch of g.en) expect(Glyph[ch], `${g.en} 의 '${ch}'`).toBeDefined()
      expect(textWidth(g.en) + 1).toBeLessThanOrEqual(200)
    }
  })
})
