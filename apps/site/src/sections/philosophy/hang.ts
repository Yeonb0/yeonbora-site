// 전시실 벽에 액자를 건다 : 가장 큰 비중의 액자를 벽 세로 중앙 한 줄에, 나머지는 위아래 줄에 살롱식으로
// 좌표는 모두 사진 기준 % (가로 · 세로 기준이 달라서 세로 길이는 사진 비율 16 : 9 로 바꿔 계산한다)
import type { Hung, Philosopher, Rect } from './types'

// 액자 폭 (벽 폭 대비)
const WidthOf = { 3: 0.16, 2: 0.11, 1: 0.07 } as const
// 초상화 4 : 5
const Portrait = 1.25
const Aspect = 16 / 9
// 액자 사이 가로 간격 (그 줄에서 가장 넓은 액자 폭 대비) 과 줄 사이 세로 간격 (%)
const GapX = 0.25
const GapY = 3

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

const sizeOf = (weight: 1 | 2 | 3, wall: Rect, scale: number) => {
  const w = wall.w * WidthOf[weight] * scale
  return { w, h: w * Portrait * Aspect }
}

// 한 줄을 가로 가운데 정렬로 놓는다 : 줄의 너비와 높이도 돌려준다
const layRow = (row: Item[], wall: Rect, scale: number) => {
  const Sizes = row.map((it) => sizeOf(it.weight, wall, scale))
  const gap = Math.max(0, ...Sizes.map((s) => s.w)) * GapX
  const width = Sizes.reduce((a, s) => a + s.w, 0) + gap * Math.max(0, row.length - 1)
  const height = Math.max(0, ...Sizes.map((s) => s.h))
  return { Sizes, gap, width, height }
}

export const hangFrames = (list: Philosopher[], wall: Rect): Hung[] => {
  const Items: Item[] = list.length === 0 ? EmptyRoom : list.map((p) => ({ id: p.id, weight: p.weight }))
  const top = Math.max(...Items.map((it) => it.weight))
  const Middle = Items.filter((it) => it.weight === top)
  // 나머지는 큰 것부터 위 · 아래 줄에 번갈아 넣는다
  const Rest = Items.filter((it) => it.weight !== top).sort((a, b) => b.weight - a.weight)
  const Above: Item[] = []
  const Below: Item[] = []
  Rest.forEach((it, i) => (i % 2 === 0 ? Above : Below).push(it))
  const Rows = [Above, Middle, Below]

  // 벽에 들어갈 때까지 전체 크기를 줄인다
  let scale = 1
  for (;;) {
    const Laid = Rows.map((r) => layRow(r, wall, scale))
    const fitsX = Laid.every((l) => l.width <= wall.w)
    const fitsY = Laid[1].height + 2 * Math.max(Laid[0].height + (Above.length ? GapY : 0), Laid[2].height + (Below.length ? GapY : 0)) <= wall.h
    if ((fitsX && fitsY) || scale < 0.05) return place(Rows, Laid, wall)
    scale *= 0.95
  }
}

const place = (Rows: Item[][], Laid: ReturnType<typeof layRow>[], wall: Rect): Hung[] => {
  const midY = wall.y + wall.h / 2
  const midTop = midY - Laid[1].height / 2
  const midBottom = midY + Laid[1].height / 2
  // 가운데 줄은 세로 중앙, 위 줄은 바닥을 맞추고, 아래 줄은 위를 맞춘다
  const RowTop = [midTop - GapY - Laid[0].height, midTop, midBottom + GapY]
  const Out: Hung[] = []
  Rows.forEach((row, r) => {
    const L = Laid[r]
    let x = wall.x + (wall.w - L.width) / 2
    row.forEach((it, i) => {
      const S = L.Sizes[i]
      const y = r === 0 ? RowTop[0] + (L.height - S.h) : r === 1 ? RowTop[1] + (L.height - S.h) / 2 : RowTop[2]
      Out.push({ id: it.id, weight: it.weight, rect: { x, y, w: S.w, h: S.h } })
      x += S.w + L.gap
    })
  })
  return Out
}
