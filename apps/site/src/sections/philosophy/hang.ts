// 전시실 벽에 액자를 건다 : 줄을 맞추지 않고 살롱식으로 흩어 걸되, 큰 액자는 벽 가운데 눈높이 근처에 모은다
// 같은 철학자 목록이면 언제나 같은 자리 (목록으로 만든 시드의 난수)
// 좌표는 모두 사진 기준 % (가로 · 세로 기준이 달라서 세로 길이는 사진 비율 16 : 9 로 바꿔 계산한다)
import type { Hung, Philosopher, Rect } from './types'

// 액자 폭 (벽 폭 대비)
const WidthOf = { 3: 0.16, 2: 0.11, 1: 0.07 } as const
// 초상화 4 : 5
const Portrait = 1.25
const Aspect = 16 / 9
// 액자 사이 여백 : 가로는 액자 폭 대비, 세로는 이름이 들어갈 틈 (벽 높이 대비)
const GapX = 0.22
const GapY = 0.05
// 같은 비중 안에서 크기를 조금씩 다르게 (± 비율)
const Jitter = 0.08
// 큰 액자 (가장 큰 비중) 의 세로 중심이 머물 범위 (벽 높이 대비, 가운데에서 ±)
const MidBand = 0.12
const Tries = 400

interface Item {
  id: string | null
  weight: 1 | 2 | 3
}

// 빈 방 : 보통 크기 빈 액자 3개
const EmptyRoom: Item[] = [
  { id: null, weight: 2 },
  { id: null, weight: 2 },
  { id: null, weight: 2 },
]

// mulberry32
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const seedOf = (Items: Item[]) => {
  let h = 2166136261
  for (const c of Items.map((it) => it.id ?? '_').join('|')) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

// 이름 틈을 포함해 두 액자가 너무 가까운지
const tooClose = (a: Rect, b: Rect, wall: Rect) => {
  const gx = Math.min(a.w, b.w) * GapX
  const gy = wall.h * GapY
  return a.x < b.x + b.w + gx && b.x < a.x + a.w + gx && a.y < b.y + b.h + gy && b.y < a.y + a.h + gy
}

const tryHang = (Items: Item[], wall: Rect, scale: number, seed: number): Hung[] | null => {
  const rand = rng(seed)
  const top = Math.max(...Items.map((it) => it.weight))
  const Out: Hung[] = []
  const cx = wall.x + wall.w / 2
  const cy = wall.y + wall.h / 2
  for (const it of Items) {
    const k = it.weight === top ? 1 : 1 + (rand() * 2 - 1) * Jitter
    const w = wall.w * WidthOf[it.weight] * scale * k
    const h = w * Portrait * Aspect
    let placed: Rect | null = null
    for (let t = 0; t < Tries && !placed; t++) {
      // 첫 시도는 정가운데, 실패할수록 더 멀리까지 흩어 본다
      const spread = t / Tries
      const x = cx - w / 2 + (rand() * 2 - 1) * spread * (wall.w - w) / 2
      const yRange = it.weight === top ? wall.h * MidBand : (wall.h - h) / 2
      const y = cy - h / 2 + (rand() * 2 - 1) * Math.min(1, spread * 1.6) * yRange
      const R = { x, y, w, h }
      const inside = x >= wall.x && y >= wall.y && x + w <= wall.x + wall.w && y + h <= wall.y + wall.h
      if (inside && Out.every((o) => !tooClose(o.rect, R, wall))) placed = R
    }
    if (!placed) return null
    Out.push({ id: it.id, weight: it.weight, rect: placed })
  }
  return Out
}

export const hangFrames = (list: Philosopher[], wall: Rect): Hung[] => {
  const Items: Item[] = list.length === 0 ? EmptyRoom : list.map((p) => ({ id: p.id, weight: p.weight }))
  // 큰 것부터 건다 (같은 비중은 목록 순서)
  const Sorted = [...Items].sort((a, b) => b.weight - a.weight)
  const seed = seedOf(Sorted)
  for (let scale = 1; scale > 0.05; scale *= 0.93) {
    const Out = tryHang(Sorted, wall, scale, seed)
    if (Out) return Out
  }
  return []
}
