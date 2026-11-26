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

// 꽃 머리 자리 : 세 줄 x 네 칸. 아래 줄 ABCD → 가운데 EFGH → 위 줄 IJKL
// 위 줄로 갈수록 오른쪽으로 밀어 칸마다 / 모양으로 기운다
// 넓은 화면은 위아래가 잘리므로 (가로 2.2 : 1 까지 1280 x 800 에서 y 110 ~ 690 이 보인다) 그 안에 둔다
const grid = (xs: number[], ys: number[], shift: number, wobble: number[]): Record<string, [number, number]> => {
  const Out: Record<string, [number, number]> = {}
  'ABCDEFGHIJKL'.split('').forEach((l, i) => {
    const row = Math.floor(i / 4)
    const col = i % 4
    Out[l] = [xs[col] + shift * row, ys[row] + wobble[i]]
  })
  return Out
}
// 반듯한 격자처럼 보이지 않게 칸마다 조금씩 위아래로 흔든다
const Wobble = [6, -8, 10, -4, -6, 8, -10, 4, 6, -6, 8, -8]
const LANDSCAPE = grid([210, 460, 710, 960], [540, 395, 255], 70, Wobble)
const PORTRAIT = grid([130, 265, 400, 535], [960, 690, 420], 40, Wobble.map((v) => v * 1.6))

// 세로가 가로의 0.85배보다 길면 세로 배치
// 늘 같은 객체를 돌려준다 : 화면 크기가 조금 바뀔 때마다 새 객체가 되면 풀밭을 통째로 다시 만든다 (캔버스 수십 MB)
const StagePortrait: Stage = { W: 720, H: 1280, portrait: true }
const StageLandscape: Stage = { W: 1280, H: 800, portrait: false }
export const pickStage = (vw: number, vh: number): Stage => (vw / vh < 0.85 ? StagePortrait : StageLandscape)

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
  Spots.map((F) => ({ x: F.x, y: F.gy - 30 * F.persp, r: 40 * F.persp, hx: F.x + F.headX, hy: F.gy + F.headY, hr: F.r, gx: F.x, gy: F.gy, stem: F.stem, persp: F.persp }))
