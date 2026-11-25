import { describe, expect, it } from 'vitest'
import { Philosophers } from '../data'
import { hangFrames } from '../hang'
import type { Hung, Rect, RoomId } from '../types'

const Wall: Rect = { x: 10, y: 15, w: 80, h: 50 }
const inRoom = (room: RoomId) => Philosophers.filter((p) => p.room === room)

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const inside = (r: Rect, w: Rect) => r.x >= w.x - 1e-9 && r.y >= w.y - 1e-9 && r.x + r.w <= w.x + w.w + 1e-9 && r.y + r.h <= w.y + w.h + 1e-9
const centerY = (r: Rect) => r.y + r.h / 2
const centerX = (r: Rect) => r.x + r.w / 2

describe('hangFrames', () => {
  it('고대 8명이 모두 걸리고 서로 겹치지 않고 벽 안에 있다', () => {
    const Ancient = inRoom('ancient')
    expect(Ancient).toHaveLength(8)
    const Out = hangFrames(Ancient, Wall)
    expect(Out.map((h) => h.id).sort()).toEqual(Ancient.map((p) => p.id).sort())
    for (let i = 0; i < Out.length; i++) {
      expect(inside(Out[i].rect, Wall)).toBe(true)
      for (let j = i + 1; j < Out.length; j++) expect(overlaps(Out[i].rect, Out[j].rect)).toBe(false)
    }
  })

  it('비중 3 액자는 비중 1 액자보다 넓고 벽 세로 중앙 근처에 있다', () => {
    const Out = hangFrames(inRoom('ancient'), Wall)
    const Big = Out.filter((h) => h.weight === 3)
    const Small = Out.filter((h) => h.weight === 1)
    const Mid = Wall.y + Wall.h / 2
    for (const B of Big) {
      for (const S of Small) expect(B.rect.w).toBeGreaterThan(S.rect.w)
      expect(Math.abs(centerY(B.rect) - Mid)).toBeLessThanOrEqual(Wall.h * 0.15)
    }
  })

  it('빈 방에는 보통 크기 빈 액자가 정확히 3개', () => {
    const Out: Hung[] = hangFrames([], Wall)
    expect(Out).toHaveLength(3)
    for (const H of Out) {
      expect(H.id).toBeNull()
      expect(H.weight).toBe(2)
    }
  })

  it('근대 (칸트 한 명) 는 벽 가로 중앙에 하나', () => {
    const Out = hangFrames(inRoom('modern'), Wall)
    expect(Out).toHaveLength(1)
    expect(centerX(Out[0].rect)).toBeCloseTo(Wall.x + Wall.w / 2, 5)
  })

  it('줄 맞춰 늘어서지 않고 흩어져 걸린다 : 고대 8명의 세로 위치가 5가지 이상', () => {
    const Out = hangFrames(inRoom('ancient'), Wall)
    const Ys = new Set(Out.map((h) => Math.round(h.rect.y * 10)))
    expect(Ys.size).toBeGreaterThanOrEqual(5)
  })

  it('같은 철학자 목록이면 언제나 같은 자리에 건다', () => {
    expect(hangFrames(inRoom('ancient'), Wall)).toEqual(hangFrames(inRoom('ancient'), Wall))
  })

  it('액자 아래에 이름이 들어갈 틈 (벽 높이의 4% 이상) 을 남긴다', () => {
    const Out = hangFrames(inRoom('ancient'), Wall)
    for (const A of Out)
      for (const B of Out) {
        if (A === B) continue
        const below = B.rect.y >= A.rect.y + A.rect.h
        const sideBySide = B.rect.x >= A.rect.x + A.rect.w || A.rect.x >= B.rect.x + B.rect.w
        if (below && !sideBySide) expect(B.rect.y - (A.rect.y + A.rect.h)).toBeGreaterThanOrEqual(Wall.h * 0.04)
      }
  })

  it('유가 6명도 겹치지 않는다', () => {
    const Out = hangFrames(inRoom('confucian'), Wall)
    expect(Out).toHaveLength(6)
    for (let i = 0; i < Out.length; i++) for (let j = i + 1; j < Out.length; j++) expect(overlaps(Out[i].rect, Out[j].rect)).toBe(false)
  })
})
