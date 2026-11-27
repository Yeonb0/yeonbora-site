import { describe, expect, it } from 'vitest'
import { Projects, ProjectIds } from '../data'
import { Glyph, textWidth } from '../font'

describe('Projects', () => {
  it('id 가 겹치지 않는다', () => {
    expect(new Set(ProjectIds).size).toBe(Projects.length)
  })

  it('색은 #rrggbb', () => {
    for (const p of Projects) expect(p.color).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('여는 곳은 https 주소 또는 사이트 안 주소 (/ 로 시작)', () => {
    for (const p of Projects) expect(p.href).toMatch(/^(https:\/\/|\/(?!\/))/)
  })

  it('이름은 도트 글씨에 있는 글자로만 쓰고, 이름 캔버스 (200 칸) 안에 들어간다', () => {
    for (const p of Projects) {
      for (const ch of p.en) expect(Glyph[ch], `${p.en} 의 '${ch}'`).toBeDefined()
      expect(textWidth(p.en) + 1).toBeLessThanOrEqual(200)
    }
  })
})
