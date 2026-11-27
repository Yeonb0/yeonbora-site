import { describe, expect, it } from 'vitest'
import { stuff } from '../stuff'

describe('stuff', () => {
  it('inserts 0 after five 1s (원문 예)', () => {
    expect(stuff('1111110')).toEqual({ out: '11111010', Inserted: [5] })
  })
  it('restarts count after stuffed bit', () => {
    expect(stuff('0111111111')).toEqual({ out: '01111101111', Inserted: [6] })
  })
  it('stuffs twice for ten 1s', () => {
    expect(stuff('1111111111')).toEqual({ out: '111110111110', Inserted: [5, 11] })
  })
  it('empty input', () => {
    expect(stuff('')).toEqual({ out: '', Inserted: [] })
  })
  it('throws on non bit chars', () => {
    expect(() => stuff('1102')).toThrow()
  })
})
