import { describe, expect, it } from 'vitest'
import { DotMask, DiscSize } from '../disc'
import { Ih, Iw, Tvr, baseLayout, isSky, tvClip, zoomLayout } from '../scene'

describe('baseLayout', () => {
  it('그림이 화면을 빈틈없이 덮는다', () => {
    for (const [W, H] of [
      [1920, 1080],
      [1280, 1000],
      [390, 844],
    ]) {
      const B = baseLayout(W, H)
      expect(Iw * B.k).toBeGreaterThanOrEqual(W - 0.001)
      expect(Ih * B.k).toBeGreaterThanOrEqual(H - 0.001)
      expect(B.ox).toBeLessThanOrEqual(0)
      expect(B.ox + Iw * B.k).toBeGreaterThanOrEqual(W - 0.001)
    }
  })

  it('휴대폰에서는 TV 가 가운데 온다', () => {
    const B = baseLayout(390, 844)
    expect(B.ox + (Tvr.x + Tvr.w / 2) * B.k).toBeCloseTo(195, 0)
  })
})

describe('zoomLayout', () => {
  it('확대해도 줄어들지 않고 그림 밖이 드러나지 않는다', () => {
    for (const [W, H] of [
      [1920, 1080],
      [390, 844],
    ]) {
      const B = baseLayout(W, H)
      const Z = zoomLayout(W, H, B, true)
      expect(Z.s).toBeGreaterThanOrEqual(1)
      expect(Z.tx).toBeLessThanOrEqual(0)
      expect(Z.ty).toBeLessThanOrEqual(0)
      expect(Z.tx + Iw * B.k * Z.s).toBeGreaterThanOrEqual(W - 0.001)
      expect(Z.ty + Ih * B.k * Z.s).toBeGreaterThanOrEqual(H - 0.001)
    }
  })

  it('데스크톱에서는 TV 화면이 창 너비 62% 나 높이 64% 에 맞춰진다', () => {
    const B = baseLayout(1920, 1080)
    const Z = zoomLayout(1920, 1080, B, true)
    const Fw = (Tvr.w * B.k * Z.s) / 1920
    const Fh = (Tvr.h * B.k * Z.s) / 1080
    expect(Fw).toBeLessThanOrEqual(0.6201)
    expect(Fh).toBeLessThanOrEqual(0.6401)
    expect(Math.max(Fw / 0.62, Fh / 0.64)).toBeCloseTo(1, 3)
  })
})

describe('tvClip', () => {
  it('모서리를 4 칸 계단으로 깎은 다각형', () => {
    const C = tvClip()
    expect(C.startsWith('polygon(')).toBe(true)
    const Pts = C.slice(8, -1).split(', ')
    expect(Pts.length % 4).toBe(0)
    // 계단 : 이웃한 두 점은 x 나 y 중 하나만 바뀐다
    const Num = Pts.map((p) => p.split(' ').map((v) => parseFloat(v)))
    for (let i = 1; i < Num.length / 4; i++) {
      const [a, b] = [Num[i - 1], Num[i]]
      expect(a[0] === b[0] || a[1] === b[1]).toBe(true)
    }
  })
})

describe('isSky', () => {
  it('유리 칸은 다시 그리고, 창살 · 잎은 그대로 둔다', () => {
    expect(isSky(200, 100)).toBe(true)
    // 가운데 세로 창살
    expect(isSky(100, 100)).toBe(false)
    // 왼쪽 아래 잎
    expect(isSky(47 + 20, 31 + 370)).toBe(false)
  })
})

describe('DotMask', () => {
  it('어느 방향이든 테두리가 1 칸', () => {
    const At = (x: number, y: number) => DotMask[y * DiscSize + x]
    const Mid = DiscSize / 2
    for (const Line of [
      (k: number) => At(k, Mid),
      (k: number) => At(Mid, k),
    ]) {
      const Row = Array.from({ length: DiscSize }, (_, k) => Line(k))
      expect(Row.filter((v) => v === 2)).toHaveLength(2)
      expect(Row.filter((v) => v === 1)).toHaveLength(2)
    }
  })
})
