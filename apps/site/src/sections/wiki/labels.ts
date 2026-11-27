// 그래프 이름표 자리 : 화면 픽셀 기준으로 서로 · 점과 겹치지 않는 첫 자리를 고른다
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface LabelItem {
  id: string
  // 노드 중심 (화면 픽셀) · 반지름 · 이름표 너비
  x: number
  y: number
  r: number
  w: number
  // 자리가 없어도 아래에 둔다 (지금 글 · 호버한 노드)
  force?: boolean
}

export type Side = 'below' | 'above' | 'right' | 'left'

export interface Spot {
  side: Side
  // 노드 중심 기준 글자 기준점과 정렬
  dx: number
  dy: number
  anchor: 'middle' | 'start' | 'end'
}

const LineH = 13
const Pad = 2

const spots = (it: LabelItem): (Spot & { box: Box })[] => {
  const { x, y, r, w } = it
  return [
    { side: 'below', dx: 0, dy: r + 12, anchor: 'middle', box: { x: x - w / 2, y: y + r + 2, w, h: LineH } },
    { side: 'above', dx: 0, dy: -r - 5, anchor: 'middle', box: { x: x - w / 2, y: y - r - 2 - LineH, w, h: LineH } },
    { side: 'right', dx: r + 5, dy: 4, anchor: 'start', box: { x: x + r + 3, y: y - LineH / 2, w, h: LineH } },
    { side: 'left', dx: -r - 5, dy: 4, anchor: 'end', box: { x: x - r - 3 - w, y: y - LineH / 2, w, h: LineH } },
  ]
}

const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

// Items 는 우선순위 순서. Obstacles 는 노드 점들 (자기 점은 Items 의 id 로 빠진다)
// 겹침은 격자 칸 (Cell px) 에 나눠 담아 근처 상자만 비교한다 : 노드가 천 개를 넘어도 빠르다
const Cell = 48

export const placeLabels = (Items: LabelItem[], Obstacles: (Box & { id?: string })[], W: number, H: number): Map<string, Spot | null> => {
  const Grid = new Map<number, (Box & { id?: string })[]>()
  const keys = (b: Box) => {
    const K: number[] = []
    for (let gx = Math.floor(b.x / Cell); gx <= Math.floor((b.x + b.w) / Cell); gx++)
      for (let gy = Math.floor(b.y / Cell); gy <= Math.floor((b.y + b.h) / Cell); gy++) K.push(gx * 100003 + gy)
    return K
  }
  const add = (b: Box & { id?: string }) => {
    for (const k of keys(b)) {
      const L = Grid.get(k)
      if (L) L.push(b)
      else Grid.set(k, [b])
    }
  }
  for (const O of Obstacles) add(O)
  const Out = new Map<string, Spot | null>()
  for (const It of Items) {
    const Cands = spots(It)
    const free = (b: Box) => b.x >= Pad && b.y >= Pad && b.x + b.w <= W - Pad && b.y + b.h <= H - Pad && !keys(b).some((k) => Grid.get(k)?.some((t) => t.id !== It.id && overlap(b, t)))
    const Pick = Cands.find((c) => free(c.box)) ?? (It.force ? Cands[0] : undefined)
    if (!Pick) {
      Out.set(It.id, null)
      continue
    }
    const { box, ...S } = Pick
    Out.set(It.id, S)
    add(box)
  }
  return Out
}
