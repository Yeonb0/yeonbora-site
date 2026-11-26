import { describe, expect, it } from 'vitest'
import { Keys, atHour, lerpc, moonLit, moonPhase, roomLook, weatherOf } from '../sky'

describe('atHour', () => {
  it('기준점 시각에서는 그 기준점 값 그대로', () => {
    for (const K of Keys.slice(0, -1)) expect(atHour(K.h)).toMatchObject({ top: K.top, bot: K.bot, night: K.night })
  })

  it('한밤과 한낮', () => {
    expect(atHour(2).night).toBe(1)
    expect(atHour(12).night).toBe(0)
    expect(atHour(12).br).toBeCloseTo(2.05)
  })

  it('24 시와 음수 시각도 하루 안으로 접는다', () => {
    expect(atHour(24)).toEqual(atHour(0))
    expect(atHour(-1)).toEqual(atHour(23))
  })

  it('두 기준점 사이는 섞인다', () => {
    const S = atHour(7.4)
    expect(S.night).toBeGreaterThan(0)
    expect(S.night).toBeLessThan(0.25)
  })
})

describe('lerpc', () => {
  it('양 끝과 가운데', () => {
    expect(lerpc('#000000', '#ffffff', 0)).toBe('#000000')
    expect(lerpc('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(lerpc('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
})

describe('moonPhase', () => {
  it('기준 삭은 0, 반 삭망월 뒤는 보름', () => {
    const New = Date.UTC(2000, 0, 6, 18, 14)
    expect(moonPhase(New)).toBeCloseTo(0, 5)
    expect(moonPhase(New + 29.53059 * 0.5 * 86400000)).toBeCloseTo(0.5, 5)
    expect(moonLit(0.5)).toBeCloseTo(1)
    expect(moonLit(0)).toBeCloseTo(0)
  })

  it('알려진 보름 (2024-12-15) 근처', () => {
    expect(moonPhase(Date.UTC(2024, 11, 15, 9, 0))).toBeGreaterThan(0.46)
    expect(moonPhase(Date.UTC(2024, 11, 15, 9, 0))).toBeLessThan(0.54)
  })
})

describe('weatherOf', () => {
  it('WMO 코드를 네 가지로', () => {
    expect(weatherOf(0)).toBe('clear')
    expect(weatherOf(1)).toBe('clear')
    expect(weatherOf(3)).toBe('cloudy')
    expect(weatherOf(45)).toBe('cloudy')
    expect(weatherOf(61)).toBe('rain')
    expect(weatherOf(95)).toBe('rain')
    expect(weatherOf(73)).toBe('snow')
    expect(weatherOf(86)).toBe('snow')
  })
})

describe('roomLook', () => {
  it('밤에는 TV 빛이 진하고 낮에는 거의 없다', () => {
    expect(roomLook(atHour(23), 'clear').tvLight).toBeGreaterThan(0.7)
    expect(roomLook(atHour(12), 'clear').tvLight).toBeLessThan(0.05)
  })

  it('비 오면 방이 어둡고 푸르다', () => {
    const L = roomLook(atHour(12), 'rain')
    expect(L.filter).toContain('brightness(1.640)')
    expect(L.tint).toBe('#6a80b0')
  })
})
