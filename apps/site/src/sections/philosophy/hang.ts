// 전시실 벽에 액자를 건다 : 줄을 맞추지 않고 살롱식으로 흩어 걸되, 큰 액자는 벽 가운데 눈높이 근처에 모은다
// 같은 철학자 목록이면 언제나 같은 자리 (목록으로 만든 시드의 난수)
// 좌표는 모두 사진 기준 % (가로 · 세로 기준이 달라서 세로 길이는 사진 비율 16 : 9 로 바꿔 계산한다)
import type { Hung, Philosopher, Rect } from './types'

// 액자 폭 (벽 폭 대비)
const WidthOf = { 3: 0.16, 2: 0.11, 1: 0.07 } as const
// 초상화 4 : 5, 둘이 함께 걸리는 액자는 가로로 넓은 6 : 5 에 가깝다 (세로 / 가로)
const Portrait = 1.25
const PairPortrait = 0.85
// 둘이 함께 걸리는 액자는 한 사람 액자의 이 배율만큼 넓다
const PairWidth = 1.65
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
  partner?: string
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

// 가장 멀리 떨어진 후보 고르기 (best-candidate) : 액자가 벽 전체에 고르게 흩어진다
const Candidates = 48

const tryHang = (Items: Item[], wall: Rect, scale: number, seed: number): Hung[] | null => {
  const rand = rng(seed)
  const top = Math.max(...Items.map((it) => it.weight))
  const Out: Hung[] = []
  const cx = wall.x + wall.w / 2
  const cy = wall.y + wall.h / 2
  // 가로 · 세로 단위를 맞춘 거리 (세로는 사진 비율로 늘린다)
  const dist = (a: Rect, b: Rect) => Math.hypot(a.x + a.w / 2 - (b.x + b.w / 2), (a.y + a.h / 2 - (b.y + b.h / 2)) / Aspect)
  for (const it of Items) {
    const k = it.weight === top ? 1 : 1 + (rand() * 2 - 1) * Jitter
    const w = wall.w * WidthOf[it.weight] * (it.partner ? PairWidth : 1) * scale * k
    const h = w * (it.partner ? PairPortrait : Portrait) * Aspect
    // 액자가 하나뿐이면 정가운데
    if (Items.length === 1) {
      Out.push({ id: it.id, partner: it.partner, weight: it.weight, rect: { x: cx - w / 2, y: cy - h / 2, w, h } })
      continue
    }
    const yRange = it.weight === top ? wall.h * MidBand : (wall.h - h) / 2
    let best: Rect | null = null
    let bestScore = -1
    let found = 0
    for (let t = 0; t < Tries && found < Candidates; t++) {
      const R = { x: wall.x + rand() * (wall.w - w), y: cy - h / 2 + (rand() * 2 - 1) * yRange, w, h }
      const inside = R.y >= wall.y && R.y + h <= wall.y + wall.h
      if (!inside || Out.some((o) => tooClose(o.rect, R, wall))) continue
      found++
      // 이미 건 액자들과 가장 멀리, 벽 가장자리에는 너무 붙지 않게
      const near = Out.length ? Math.min(...Out.map((o) => dist(o.rect, R))) : wall.w
      const edge = Math.min(R.x - wall.x, wall.x + wall.w - (R.x + w))
      const score = near + Math.min(edge, wall.w * 0.04)
      if (score > bestScore) {
        bestScore = score
        best = R
      }
    }
    if (!best) return null
    Out.push({ id: it.id, partner: it.partner, weight: it.weight, rect: best })
  }
  return Out
}

export const hangFrames = (list: Philosopher[], wall: Rect): Hung[] => {
  // pair 로 묶인 철학자는 따로 걸지 않고 짝의 액자 오른쪽 절반을 쓴다
  const Partners = new Set(list.map((p) => p.pair).filter((id): id is string => !!id && list.some((q) => q.id === id)))
  const Items: Item[] =
    list.length === 0
      ? EmptyRoom
      : list
          .filter((p) => !Partners.has(p.id))
          .map((p) => ({ id: p.id, weight: p.weight, partner: p.pair && Partners.has(p.pair) ? p.pair : undefined }))
  // 큰 것부터 건다 (같은 비중은 목록 순서)
  const Sorted = [...Items].sort((a, b) => b.weight - a.weight)
  const seed = seedOf(Sorted)
  for (let scale = 1; scale > 0.05; scale *= 0.93) {
    const Out = tryHang(Sorted, wall, scale, seed)
    if (Out) return Out
  }
  return []
}
