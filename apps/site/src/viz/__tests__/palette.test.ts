import { describe, expect, it } from 'vitest'
import { AllSwatches, Navy, Purple, PurpleTint, Role, Yellow, contrast } from '../palette'

const Hex = /^#[0-9A-F]{6}$/

describe('palette', () => {
  it('every swatch is #RRGGBB uppercase', () => {
    for (const c of AllSwatches) expect(c).toMatch(Hex)
  })
  it('sizes match the source images', () => {
    expect(Object.keys(Purple)).toHaveLength(21)
    expect(PurpleTint).toHaveLength(25)
    expect(Yellow).toHaveLength(5)
    expect(Navy).toHaveLength(5)
  })
  it('roles come from the palette or the dark base', () => {
    const Base = ['#1A1A1A', '#E0E0E0', '#8A8A8A', '#3A3A3A']
    for (const c of Object.values(Role)) expect([...AllSwatches, ...Base]).toContain(c)
  })
  it('text roles are readable on the dark background', () => {
    expect(contrast(Role.fg, Role.bg)).toBeGreaterThanOrEqual(7)
    expect(contrast(Role.point, Role.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(Role.onPoint, Role.point)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(Role.primary, Role.bg)).toBeGreaterThanOrEqual(3)
    expect(contrast(Role.navyPoint, Role.bg)).toBeGreaterThanOrEqual(3)
  })
})
