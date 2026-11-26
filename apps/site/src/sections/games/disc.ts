// 도트 CD : 디스크 전체를 72 x 72 칸으로 그린다. 인쇄면은 64 x 64 키 아트를 돌려 가장 가까운 칸을 읽고,
// 빛은 고정된 방향에서 와서 그 방향과 반대쪽에 무지갯빛 줄이 선다
import { Bayer } from './pixel'
import { hex } from './sky'

export const DiscSize = 72
const Hf = DiscSize / 2

const Rainbow = ['#ff5a5a', '#ffb84d', '#ffe66d', '#6dff9a', '#5ac8ff', '#8a7dff', '#d06dff'].map(hex)

// 디스크 모양 칸표 : 0 바깥, 1 어두운 외곽선, 2 밝은 테두리, 3 안쪽
// 원을 도트로 찍을 때 어느 방향이든 1 칸 두께가 되도록 위아래 · 양옆 이웃 칸으로 판정한다
export const DotMask = (() => {
  const In = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < DiscSize && y < DiscSize && Math.hypot((x + 0.5 - Hf) / Hf, (y + 0.5 - Hf) / Hf) <= 0.955
  const Near = (x: number, y: number) => [In(x + 1, y), In(x - 1, y), In(x, y + 1), In(x, y - 1)]
  const M = new Uint8Array(DiscSize * DiscSize)
  for (let y = 0; y < DiscSize; y++)
    for (let x = 0; x < DiscSize; x++) {
      if (In(x, y)) M[y * DiscSize + x] = Near(x, y).every(Boolean) ? 3 : 2
      else if (Near(x, y).some(Boolean)) M[y * DiscSize + x] = 1
    }
  return M
})()

// out : 72 x 72 RGBA, art : 64 x 64 RGBA, deg : 인쇄면 회전, light : 디스크 중심에서 본 빛의 방향 (라디안)
export const drawDisc = (out: Uint8ClampedArray, art: Uint8ClampedArray, deg: number, light: number) => {
  const A = (deg * Math.PI) / 180
  const Ca = Math.cos(-A)
  const Sa = Math.sin(-A)
  for (let y = 0; y < DiscSize; y++)
    for (let x = 0; x < DiscSize; x++) {
      const K = (y * DiscSize + x) * 4
      const Px = (x + 0.5 - Hf) / Hf
      const Py = (y + 0.5 - Hf) / Hf
      const Rr = Math.hypot(Px, Py)
      const Mk = DotMask[y * DiscSize + x]
      // 바깥과 가운데 구멍은 비운다
      if (!Mk || Rr < 0.075) {
        out[K + 3] = 0
        continue
      }
      let Col: readonly number[]
      if (Mk === 1) Col = [30, 22, 40]
      else if (Mk === 2) Col = [215, 215, 228]
      else if (Rr < 0.16) Col = Rr < 0.12 ? [150, 150, 165] : [205, 205, 218]
      else if (Rr < 0.22) {
        // 거울 고리 : 빛 쪽 · 반대쪽에 무지갯빛 줄. 각도 차이가 작을수록 진하다 (디더링)
        const Th = Math.atan2(Py, Px)
        let Dt = Math.abs(((Th - light + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
        Dt = Math.min(Dt, Math.PI - Dt)
        const Streak = Math.max(0, 1 - Dt / 0.16)
        const G = 150 + 60 * Math.cos(Th * 2 - light * 2)
        Col = Streak > Bayer[y & 3][x & 3] / 16 ? Rainbow[Math.min(6, Math.floor(Rr * 7.5) % 7)] : [G * 0.9, G * 0.9, G]
      } else {
        const Ux = Px * Ca - Py * Sa
        const Uy = Px * Sa + Py * Ca
        const Ax = Math.min(63, Math.max(0, Math.floor((Ux * 0.994 + 1) * 32)))
        const Ay = Math.min(63, Math.max(0, Math.floor((Uy * 0.994 + 1) * 32)))
        const Q = (Ay * 64 + Ax) * 4
        Col = [art[Q], art[Q + 1], art[Q + 2]]
      }
      out[K] = Col[0]
      out[K + 1] = Col[1]
      out[K + 2] = Col[2]
      out[K + 3] = 255
    }
}
