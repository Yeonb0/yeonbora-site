import { describe, expect, it } from 'vitest'
import { toValues, validateValue, type ConfigField } from '../types'

const Range: ConfigField = { type: 'range', min: 0.2, max: 3, step: 0.1, value: 1, label: '속도' }
const Text: ConfigField = { type: 'text', value: { hit: 'a', miss: 'b' }, label: '라벨' }

describe('toValues', () => {
  it('keeps only values', () => {
    expect(toValues({ speed: Range, labels: { type: 'text', value: { hit: 'a' }, label: 'x' } })).toEqual({ speed: 1, labels: { hit: 'a' } })
  })
})

describe('validateValue', () => {
  it('rejects range above max', () => {
    expect(validateValue(Range, 3.5).ok).toBe(false)
  })
  it('rejects value off step', () => {
    expect(validateValue(Range, 0.25).ok).toBe(false)
  })
  it('accepts value on step despite float error', () => {
    expect(validateValue(Range, 0.7)).toEqual({ ok: true, value: 0.7 })
  })
  it('rejects non hex color', () => {
    expect(validateValue({ type: 'color', value: '#000000', label: 'c' }, 'red').ok).toBe(false)
  })
  it('accepts hex color', () => {
    expect(validateValue({ type: 'color', value: '#000000', label: 'c' }, '#7209B7').ok).toBe(true)
  })
  it('rejects text object with missing key', () => {
    expect(validateValue(Text, { hit: 'x' }).ok).toBe(false)
  })
  it('accepts text object with same keys', () => {
    expect(validateValue(Text, { hit: 'x', miss: 'y' }).ok).toBe(true)
  })
  it('rejects select outside options', () => {
    expect(validateValue({ type: 'select', options: ['a', 'b'], value: 'a', label: 's' }, 'c').ok).toBe(false)
  })
  it('rejects toggle non boolean', () => {
    expect(validateValue({ type: 'toggle', value: true, label: 't' }, 'yes').ok).toBe(false)
  })
})
