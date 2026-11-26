// 창밖 장면 : 62 x 90 도트로 하늘 · 해 / 달 · 구름 · 먼 나무와 집 · 눈비를 그린다 (유리 크기로 늘려 붙인다)
import { canvas2d, pen, rnd } from './pixel'
import { lerp, lerpc } from './sky'
import type { SkyKey, Weather } from './types'

export const ViewW = 62
export const ViewH = 90

export interface ViewState {
  t: number
  sky: SkyKey
  hour: number
  phase: number
  weather: Weather
}

export const makeView = () => {
  const [Cv, Vx] = canvas2d(ViewW, ViewH)
  const Vp = pen(Vx)
  const R = rnd(11)
  const Stars = Array.from({ length: 40 }, () => [(R() * 62) | 0, (R() * 55) | 0, R()])
  const Pines = Array.from({ length: 14 }, (_, i) => [i * 5 + ((R() * 4) | 0) - 2, 62 + ((R() * 10) | 0)])
  const Houses = [
    [4, 74, 12, 9],
    [30, 72, 14, 11],
    [47, 76, 11, 8],
  ]
  const Flakes = Array.from({ length: 70 }, () => [R() * 62, R() * 90, 0.6 + R() * 0.6])
  // 유리에 맺혀 흘러내리는 물방울
  const Beads = Array.from({ length: 16 }, () => [(R() * 62) | 0, R() * 90, 0.02 + R() * 0.05])
  const Clouds = Array.from({ length: 6 }, (_, i) => [R() * 80 - 10, 6 + i * 8 + R() * 6, 5 + R() * 4])

  const draw = ({ t, sky: S, hour, phase, weather: Wt }: ViewState) => {
    const Gray = Wt === 'clear' ? 0 : Wt === 'cloudy' ? 0.45 : 0.6
    const Top = lerpc(S.top, '#5a6070', Gray * (1 - S.night * 0.7))
    const Bot = lerpc(S.bot, '#8a90a0', Gray * (1 - S.night * 0.7))
    Vp.vgrad(0, 0, ViewW, ViewH, [Top, lerpc(Top, Bot, 0.5), Bot])
    // 줄마다 하늘색 · 둘레 섞은 색을 한 번만 만든다 : 해 · 달 둘레를 칸마다 섞으면 한 번 그릴 때 색 문자열이 수백 개 생긴다
    // (한 번 그리는 동안 고리마다 섞는 색 · 비율은 같으므로 줄 y 와 고리 번호 ring 만으로 기억한다)
    const Rows = new Map<number, string>()
    const SkyAt = (y: number) => {
      let C = Rows.get(y * 4)
      if (C === undefined) Rows.set(y * 4, (C = lerpc(Top, Bot, Math.min(1, Math.max(0, y / 89)))))
      return C
    }
    const ring = (y: number, n: 1 | 2 | 3, To: string, k: number) => {
      let C = Rows.get(y * 4 + n)
      if (C === undefined) Rows.set(y * 4 + n, (C = lerpc(SkyAt(y), To, k)))
      return C
    }

    // 별 : 밤이고 맑을 때 반짝인다
    const StarA = S.night * (Wt === 'clear' ? 1 : 0.15)
    for (const [x, y, a] of Stars) if (StarA * (0.5 + 0.5 * Math.sin(t / 700 + a * 9)) > a * 0.8) Vp.px('#e6e2ff', x, y)

    // 해 · 달 : 창을 가로지르는 호. 가운데는 밝게, 가장자리는 한 톤 낮게, 둘레는 하늘색에서 빛 색으로 두 단계 섞인 고리
    const Arc = (f: number) => [lerp(6, 56, f), 58 - Math.sin(f * Math.PI) * 46]
    const Hidden = Wt === 'clear' ? 0 : Wt === 'cloudy' ? 0.5 : 1
    if (Hidden < 1 && hour >= 6 && hour <= 19) {
      const [X, Y] = Arc((hour - 6) / 13)
      const Rr = 4
      const Halo = hour > 17 || hour < 7.5 ? '#ffc890' : '#fff4d0'
      for (let yy = Math.floor(Y - Rr - 4); yy <= Y + Rr + 4; yy++)
        for (let xx = Math.floor(X - Rr - 4); xx <= X + Rr + 4; xx++) {
          const D = Math.hypot(xx + 0.5 - X, yy + 0.5 - Y)
          if (D <= Rr - 1.2) Vp.px('#fffbe8', xx, yy)
          else if (D <= Rr) Vp.px('#ffe9a6', xx, yy)
          else if (D <= Rr + 1.6) Vp.px(ring(yy, 1, Halo, 0.5), xx, yy)
          else if (D <= Rr + 3.6) Vp.px(ring(yy, 2, Halo, 0.22), xx, yy)
        }
    } else if (Hidden < 1) {
      // 달 : 해보다 조금 큰 정도로, 오늘의 위상만큼만 밝다 (안 보이는 쪽은 하늘에 살짝 비치는 어두운 면)
      const [X, Y] = Arc(((hour + 24 - 19) % 24) / 11)
      const Rr = 5
      const Lit = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase)
      for (let yy = Math.floor(Y - Rr - 4); yy <= Y + Rr + 4; yy++)
        for (let xx = Math.floor(X - Rr - 4); xx <= X + Rr + 4; xx++) {
          const Dx = xx + 0.5 - X
          const Dy = yy + 0.5 - Y
          const D = Math.hypot(Dx, Dy)
          if (D <= Rr) {
            const U = Dx / Rr
            const W = Math.sqrt(Math.max(0, 1 - (Dy / Rr) ** 2))
            // 차는 달 (0 ~ 0.5) 은 오른쪽부터, 기우는 달 (0.5 ~ 1) 은 왼쪽만 남는다
            const On = phase < 0.5 ? U > W * Math.cos(2 * Math.PI * phase) : U < W * Math.cos(2 * Math.PI * (phase - 0.5))
            const Crater = (Math.abs(Dx - 1.5) < 1 && Math.abs(Dy - 1.2) < 1) || (Math.abs(Dx + 2) < 0.8 && Math.abs(Dy + 1.5) < 0.8)
            Vp.px(On ? (Crater ? '#e2d8b8' : D > Rr - 1 ? '#e8e0c4' : '#f4efd8') : ring(yy, 3, '#3a3a58', 0.55), xx, yy)
          } else if (D <= Rr + 1.6) Vp.px(ring(yy, 1, '#9a9ac8', 0.5 * Lit), xx, yy)
          else if (D <= Rr + 3.6) Vp.px(ring(yy, 2, '#9a9ac8', 0.22 * Lit), xx, yy)
        }
    }

    // 구름 : 천천히 흘러간다
    if (Wt !== 'clear')
      Clouds.forEach(([x0, y, r], i) => {
        const X = ((x0 + t / (900 + i * 300)) % 84) - 12
        const C = lerpc(lerpc(Top, '#ffffff', 0.35), '#2a2a3a', S.night * 0.7)
        Vp.circ(C, X, y, r)
        Vp.circ(C, X + r * 0.9, y + 1, r * 0.8)
        Vp.circ(C, X - r * 0.9, y + 1, r * 0.7)
      })

    // 먼 나무 · 집 : 하늘 아래쪽보다 어둡게, 밤에는 창에 불이 켜진다
    const Sil = lerpc(Bot, '#05060f', 0.55 + S.night * 0.3)
    const Sil2 = lerpc(Bot, '#05060f', 0.7 + S.night * 0.25)
    for (const [x, y] of Pines)
      for (let k = 0; y + k < ViewH; k++) {
        const w = Math.min(4, Math.floor(k / 2))
        Vp.rect(Sil, x - w, y + k, w * 2 + 1, 1)
      }
    for (const [x, y, w] of Houses) {
      Vp.rect(Sil2, x, y, w, ViewH - y)
      for (let k = 0; k < Math.ceil(w / 2); k++) Vp.rect(Sil2, x + k, y - k, w - k * 2, 1)
      if (S.night > 0.35) {
        Vp.rect('#ffd27a', x + 2, y + 3, 2, 2)
        Vp.rect('#ffd27a', x + w - 4, y + 3, 2, 2)
      }
    }

    if (Wt === 'rain')
      for (const b of Beads) {
        b[1] = (b[1] + b[2]) % ViewH
        Vp.px('#c8d4f0', b[0], b[1] | 0)
      }
    if (Wt === 'snow') {
      Vp.rect(lerpc('#e8eef8', '#7a80a0', S.night * 0.6), 0, 86, ViewW, 4)
      Flakes.forEach((d, i) => {
        d[1] = (d[1] + d[2] * 0.35) % 92
        const X = (d[0] + Math.sin(t / 900 + i) * 1.5 + ViewW) % ViewW
        Vp.px('#f4f6ff', X | 0, d[1] | 0)
      })
    }
  }

  return { canvas: Cv, draw }
}
