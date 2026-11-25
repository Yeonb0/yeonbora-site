import { describe, expect, it } from 'vitest'
import { docsSearch, parseDocs } from '../route'
import { ReligionIds } from '../data'

describe('parseDocs', () => {
  it('빈 주소는 상자 화면', () => {
    expect(parseDocs('')).toEqual({ id: null, canonical: '' })
  })

  it('있는 종교면 그 문서 화면', () => {
    expect(parseDocs('?religion=taoism')).toEqual({ id: 'taoism', canonical: '?religion=taoism' })
  })

  it('없는 종교는 상자 화면으로 고친다', () => {
    expect(parseDocs('?religion=shinto')).toEqual({ id: null, canonical: '' })
  })

  it('8개 종교 모두 왕복한다', () => {
    expect(ReligionIds).toHaveLength(8)
    for (const id of ReligionIds) expect(parseDocs(docsSearch(id)).id).toBe(id)
  })
})
