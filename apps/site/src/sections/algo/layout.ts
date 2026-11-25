// 꽃밭 배치 : 화면 방향에 따라 설계 크기 (W x H) 와 꽃 자리를 고른다
// 꽃 자리는 꽃 머리 위치이고, 줄기 길이만큼 아래가 땅에 닿는 자리 (gy) 다
import { Categories, inCategory } from './data'
import type { FieldFlower } from './field'

export interface Stage {
  W: number
  H: number
  portrait: boolean
}

export interface FlowerSpot {
  letter: string
  name: string
  hover: string
  count: number
  // 땅에 닿는 자리
  x: number
  gy: number
  stem: number
  lean: number
  // 꽃 머리 반지름 · 줄기 밑동에서 본 머리 위치
  r: number
  headX: number
  headY: number
  // 원근 : 멀수록 작고 옅다
  depth: string
  persp: number
  dur: number
  delay: number
}

// 가로 화면 (1280 x 800) 과 세로 화면 (720 x 1280) 의 꽃 머리 자리 (0 ~ 1 비율)
const LANDSCAPE: Record<string, [number, number]> = {
  H: [300, 280], D: [690, 195], I: [1020, 300], K: [540, 470], A: [150, 505], B: [880, 490],
  C: [1160, 515], E: [470, 140], F: [1170, 130], G: [250, 400], J: [730, 365], L: [930, 110],
}
const PORTRAIT: Record<string, [number, number]> = {
  L: [520, 150], F: [190, 190], E: [380, 300], D: [590, 380], H: [170, 460], J: [430, 540],
  I: [600, 680], G: [150, 720], K: [380, 830], A: [140, 960], B: [420, 1010], C: [610, 1080],
}

// 세로가 가로의 0.85배보다 길면 세로 배치
export const pickStage = (vw: number, vh: number): Stage => (vw / vh < 0.85 ? { W: 720, H: 1280, portrait: true } : { W: 1280, H: 800, portrait: false })

export const placeFlowers = (S: Stage): FlowerSpot[] => {
  const Spots = S.portrait ? PORTRAIT : LANDSCAPE
  const BaseW = S.portrait ? 720 : 1280
  const BaseH = S.portrait ? 1280 : 800
  const U = Math.min(S.W, S.H) / 800
  return Categories.map((c, ci) => {
    const [px, py] = Spots[c.letter]
    const x = (px / BaseW) * S.W
    const y = (py / BaseH) * S.H
    const stem = (88 + ((ci * 29) % 34)) * (0.6 + 0.5 * (y / S.H)) * U
    const gy = y + stem
    const persp = (0.62 + 0.48 * (gy / S.H)) * U
    const sz = 0.42 + 0.78 * Math.pow(gy / S.H, 1.3)
    const far = Math.min(1, Math.max(0, (gy - S.H * 0.31) / (S.H * 0.56)))
    const count = inCategory(c.letter).length
    const r = (34 + 3.6 * Math.sqrt(count)) * sz * U
    const lean = (((ci * 17) % 9) - 4) * 1.2
    return {
      letter: c.letter,
      name: c.name,
      hover: c.hover,
      count,
      x,
      gy,
      stem,
      lean,
      r,
      headX: Math.sin((lean * Math.PI) / 180) * stem,
      headY: -stem,
      depth: `saturate(${(0.62 + 0.38 * far).toFixed(2)}) contrast(${(0.8 + 0.2 * far).toFixed(2)}) brightness(${(1.07 - 0.07 * far).toFixed(2)})`,
      persp,
      dur: 3.4 + (ci % 5) * 0.5,
      delay: -ci * 0.7,
    }
  })
}

// 풀밭 엔진에 넘기는 자리 : 줄기 밑동 둘레와 꽃 머리
export const fieldFlowers = (Spots: FlowerSpot[]): FieldFlower[] =>
  Spots.map((F) => ({ x: F.x, y: F.gy - 30 * F.persp, r: 40 * F.persp, hx: F.x + F.headX, hy: F.gy + F.headY, hr: F.r }))
