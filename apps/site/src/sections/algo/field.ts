// 풀밭 엔진 : 원근 풀 뭉치 + 큰 얼룩 무늬 + 안개 + 마우스로 꺾이는 스프링
// 바닥 풀은 한 번 그리고, 마우스가 닿은 풀 주변만 다시 그린다
// 살랑이는 풀은 가로 띠 캔버스에 한 번 그려 두고 CSS 로 띠를 흔든다 (그래픽 카드가 처리해 가볍다)
import type { Palette } from './palettes'

// 엔진에 넘기는 꽃 자리 : 줄기 밑동 (x, y, r) 과 꽃 머리 (hx, hy, hr)
export interface FieldFlower {
  x: number
  y: number
  r: number
  hx: number
  hy: number
  hr: number
}

export interface FieldCanvases {
  back: HTMLCanvasElement
  bands: HTMLCanvasElement[]
  front: HTMLCanvasElement
  fore: HTMLCanvasElement
}

export interface Field {
  setPalette(p: Palette): void
  pointer(x: number, y: number): void
  leave(): void
  stop(): void
}

interface Blade {
  x: number
  y: number
  s: number
  len: number
  spr: number
  tone: number
  f: number
  lean: number
  k: number
  v: number
  front: boolean
  sway: boolean
}

const SPR_H = 170
const SPR_W = 64
const CELL = 64
const TONES = 6
const CURVES = 6

const fade = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${a})`

// 풀 뭉치 그림 : 밝기 6 x 모양 6. 한 장에 풀잎 5 ~ 8장을 부채처럼 모아 그린다 (그리는 횟수를 크게 줄인다)
// 밑동은 투명하게 풀어 땅과 섞이고, 끝은 햇빛을 받아 밝다
const makeSprites = (P: Palette): HTMLCanvasElement[] => {
  const Out: HTMLCanvasElement[] = []
  let Sd = 17
  const r = () => {
    Sd = (Sd * 16807) % 2147483647
    return (Sd - 1) / 2147483646
  }
  for (let tone = 0; tone < TONES; tone++) {
    for (let curve = 0; curve < CURVES; curve++) {
      const c = document.createElement('canvas')
      c.width = SPR_W * 2
      c.height = SPR_H * 2
      const g = c.getContext('2d')!
      g.scale(2, 2)
      const n = 5 + Math.floor(r() * 4)
      for (let b = 0; b < n; b++) {
        const t2 = Math.max(0, Math.min(TONES - 1, tone + Math.round((r() - 0.5) * 2)))
        const hh = SPR_H * (0.55 + r() * 0.45)
        const w = 7 + r() * 4
        const cx = SPR_W / 2 + (r() - 0.5) * SPR_W * 0.36
        const bend = (curve - 2) * 5 + (r() - 0.5) * 16 + (cx - SPR_W / 2) * 0.8
        const Gr = g.createLinearGradient(0, SPR_H, 0, SPR_H - hh)
        Gr.addColorStop(0, fade(P.mids[t2], 0))
        Gr.addColorStop(0.16, fade(P.mids[t2], 0.55))
        Gr.addColorStop(0.34, P.mids[t2])
        Gr.addColorStop(0.78, P.tips[t2])
        Gr.addColorStop(1, P.glow)
        g.fillStyle = Gr
        g.beginPath()
        g.moveTo(cx - w / 2, SPR_H)
        g.bezierCurveTo(cx - w * 0.45, SPR_H - hh * 0.4, cx - w * 0.1 + bend * 0.4, SPR_H - hh * 0.75, cx + bend, SPR_H - hh)
        g.bezierCurveTo(cx + w * 0.2 + bend * 0.45, SPR_H - hh * 0.7, cx + w * 0.5, SPR_H - hh * 0.38, cx + w / 2, SPR_H)
        g.closePath()
        g.fill()
        // 햇빛 받는 쪽 가장자리
        g.strokeStyle = P.rim
        g.lineWidth = 0.8
        g.beginPath()
        g.moveTo(cx + w * 0.42, SPR_H - hh * 0.2)
        g.bezierCurveTo(cx + w * 0.35, SPR_H - hh * 0.5, cx + w * 0.1 + bend * 0.45, SPR_H - hh * 0.75, cx + bend, SPR_H - hh + 1)
        g.stroke()
      }
      Out.push(c)
    }
  }
  return Out
}

export function mountField(C: FieldCanvases, W: number, H: number, Flowers: FieldFlower[], P: Palette): Field {
  // 같은 화면 크기면 언제나 같은 풀밭이 되도록 씨앗을 고정한다
  let Seed = 5
  const rnd = () => {
    Seed = (Seed * 16807) % 2147483647
    return (Seed - 1) / 2147483646
  }

  // 큰 얼룩 무늬 : 값 노이즈 두 겹
  const noiseGrid = (cw: number, ch: number) => Array.from({ length: cw + 1 }, () => Array.from({ length: ch + 1 }, () => rnd()))
  const N1 = noiseGrid(7, 5)
  const N2 = noiseGrid(17, 11)
  const sm = (t: number) => t * t * (3 - 2 * t)
  const sample = (G: number[][], cw: number, ch: number, x: number, y: number) => {
    const fx = Math.min(cw - 0.001, Math.max(0, (x / W) * cw))
    const fy = Math.min(ch - 0.001, Math.max(0, (y / H) * ch))
    const i = Math.floor(fx)
    const j = Math.floor(fy)
    const u = sm(fx - i)
    const v = sm(fy - j)
    return G[i][j] * (1 - u) * (1 - v) + G[i + 1][j] * u * (1 - v) + G[i][j + 1] * (1 - u) * v + G[i + 1][j + 1] * u * v
  }
  const patch = (x: number, y: number) => sample(N1, 7, 5, x, y) * 0.7 + sample(N2, 17, 11, x, y) * 0.3

  // 원근 : 화면 아래로 갈수록 풀 뭉치가 크고 성기다 (세로 화면은 가로 폭 기준으로 줄인다)
  const U = Math.min(W, H) / 800
  const scaleAt = (y: number) => (0.3 + 0.75 * Math.pow(Math.max(0, y) / H, 1.25)) * U
  const Blades: Blade[] = []
  for (let y = -10; y < H + 140 * U; ) {
    const s = scaleAt(y)
    const per = Math.round(W / (26 * s + 8))
    for (let i = 0; i < per; i++) {
      const x = rnd() * (W + 60) - 30
      const yy = y + rnd() * 3 * s
      const tone = Math.max(0, Math.min(TONES - 1, Math.floor(patch(x, yy) * TONES * 1.5 - 1.6 + (rnd() - 0.5) * 1.3)))
      const bs = s * (0.75 + rnd() * 0.6)
      Blades.push({ x, y: yy, s: bs, len: SPR_H * bs, spr: Math.floor(rnd() * CURVES), tone, f: 1, lean: 0.24 + (rnd() - 0.5) * 0.36, k: 0, v: 0, front: false, sway: false })
    }
    y += 7 * s + 2.6
  }
  // 맨 앞 흐린 풀 (초점 밖)
  const Fore: Blade[] = Array.from({ length: Math.round((16 * W) / 1280) }, () => {
    const s = (1.2 + rnd() * 0.9) * U
    return { x: rnd() * (W + 200) - 100, y: H + (40 + rnd() * 40) * U, s, len: SPR_H * s, spr: Math.floor(rnd() * CURVES), tone: 3 + Math.floor(rnd() * 3), f: 1, lean: 0.1 + (rnd() - 0.5) * 0.5, k: 0, v: 0, front: false, sway: false }
  })

  // 꽃 줄기 밑동 앞 풀 : 밑동이 풀에 묻히게
  for (const B of Blades) {
    B.front = Flowers.some((F) => rnd() < 0.6 && B.y > F.y + F.r * 0.7 && B.y < F.y + F.r * 1.05 && Math.abs(B.x - F.x) < F.r * 0.85)
    if (B.front) {
      B.s *= 0.5
      B.len = SPR_H * B.s
    }
    B.sway = !B.front && rnd() < 0.03 + (0.07 * B.s) / U
  }
  // 꽃 머리 앞을 지나가는 풀 : 머리 아래쪽을 살짝 가려 꽃이 풀 속에 있는 것처럼 보이게
  for (const F of Flowers) {
    for (let i = 0; i < 2; i++) {
      const s = (F.hr * (0.95 + rnd() * 0.25)) / SPR_H
      Blades.push({ x: F.hx + (i ? 0.45 : -0.4) * F.hr + (rnd() - 0.5) * F.hr * 0.2, y: F.hy + F.hr * 1.05, s, len: SPR_H * s, spr: Math.floor(rnd() * CURVES), tone: 3 + Math.floor(rnd() * 3), f: rnd() < 0.5 ? -1 : 1, lean: 0.2 + (rnd() - 0.5) * 0.4, k: 0, v: 0, front: true, sway: false })
    }
  }
  Blades.sort((a, b) => a.y - b.y)
  const MAXLEN = Math.max(...Blades.map((B) => B.len))

  const Dpr = 1
  for (const c of [C.back, C.front, C.fore]) {
    c.width = W * Dpr
    c.height = H * Dpr
  }
  const gb = C.back.getContext('2d')!
  const gf = C.front.getContext('2d')!
  const go = C.fore.getContext('2d')!
  let Spr = makeSprites(P)
  let Pal = P

  // 살랑이는 띠 : 띠마다 밑동이 그 띠에 있는 풀만 그리고, 풀이 위로 뻗은 만큼 캔버스를 위로 늘린다
  const NB = C.bands.length
  const BH = H / NB
  const Band = C.bands.map((c, k) => {
    const y0 = k * BH
    const y1 = (k + 1) * BH + (k === NB - 1 ? 140 * U : 0)
    const top = Math.max(-40, Math.floor(y0 - MAXLEN - 8))
    const h = Math.ceil(y1 - top + 4)
    c.width = Math.round((W + 80) * Dpr)
    c.height = Math.round(h * Dpr)
    Object.assign(c.style, { left: '-40px', top: `${top}px`, width: `${W + 80}px`, height: `${h}px` })
    return { c, g: c.getContext('2d')!, top, List: [] as Blade[] }
  })
  for (const B of Blades) if (B.sway) Band[Math.min(NB - 1, Math.max(0, Math.floor(B.y / BH)))].List.push(B)

  // 마우스 근처 풀을 빨리 찾는 칸 나누기
  const Grid = new Map<string, Blade[]>()
  for (const B of Blades) {
    if (B.sway) continue
    const key = `${Math.floor(B.x / CELL)},${Math.floor((B.y - B.len * 0.55) / CELL)}`
    if (!Grid.has(key)) Grid.set(key, [])
    Grid.get(key)!.push(B)
  }
  const lowerBound = (y: number) => {
    let lo = 0
    let hi = Blades.length
    while (lo < hi) {
      const m = (lo + hi) >> 1
      if (Blades[m].y < y) lo = m + 1
      else hi = m
    }
    return lo
  }

  const put = (g: CanvasRenderingContext2D, B: Blade, ox: number, oy: number) => {
    const s = B.s
    g.setTransform(Dpr * s * B.f, 0, -Dpr * s * (B.lean + B.k), Dpr * s * (1 - Math.min(0.45, Math.abs(B.k) * 0.4)), Dpr * (B.x - ox), Dpr * (B.y - oy))
    g.drawImage(Spr[B.tone * CURVES + B.spr], -SPR_W / 2, -SPR_H, SPR_W, SPR_H)
  }
  // 멀수록 안개 (oy : 캔버스가 화면에서 내려온 만큼, atop : 이미 그린 풀 위에만)
  const haze = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, oy: number, atop: boolean) => {
    if (y0 >= H * 0.6) return
    g.setTransform(Dpr, 0, 0, Dpr, 0, -Dpr * oy)
    if (atop) g.globalCompositeOperation = 'source-atop'
    const Hz = g.createLinearGradient(0, 0, 0, H * 0.6)
    Hz.addColorStop(0, Pal.haze)
    Hz.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = Hz
    g.fillRect(x0, y0, x1 - x0, Math.min(y1, H * 0.6) - y0)
    g.globalCompositeOperation = 'source-over'
  }
  const paintRect = (x0: number, y0: number, x1: number, y1: number) => {
    x0 = Math.max(0, Math.floor(x0))
    y0 = Math.max(0, Math.floor(y0))
    x1 = Math.min(W, Math.ceil(x1))
    y1 = Math.min(H, Math.ceil(y1))
    if (x1 <= x0 || y1 <= y0) return
    const From = lowerBound(y0)
    const To = lowerBound(y1 + MAXLEN + 4)
    for (const [g, isFront] of [
      [gb, false],
      [gf, true],
    ] as const) {
      g.save()
      g.setTransform(Dpr, 0, 0, Dpr, 0, 0)
      g.beginPath()
      g.rect(x0, y0, x1 - x0, y1 - y0)
      g.clip()
      g.clearRect(x0, y0, x1 - x0, y1 - y0)
      if (!isFront) {
        // 땅 : 풀 가운데 톤 계열, 아래로 갈수록 밝게
        const Gr = g.createLinearGradient(0, 0, 0, H)
        Gr.addColorStop(0, Pal.ground0)
        Gr.addColorStop(0.45, Pal.mids[2])
        Gr.addColorStop(1, Pal.mids[4])
        g.fillStyle = Gr
        g.fillRect(x0, y0, x1 - x0, y1 - y0)
      }
      for (let i = From; i < To; i++) {
        const B = Blades[i]
        if (B.front !== isFront || B.sway || B.y - B.len > y1 || B.x + B.len * 0.8 < x0 || B.x - B.len * 0.8 > x1) continue
        put(g, B, 0, 0)
      }
      haze(g, x0, y0, x1, y1, 0, isFront)
      g.restore()
    }
  }
  const paintBands = () => {
    for (const b of Band) {
      b.g.setTransform(1, 0, 0, 1, 0, 0)
      b.g.clearRect(0, 0, b.c.width, b.c.height)
      for (const B of b.List) put(b.g, B, -40, b.top)
      haze(b.g, -40, b.top, W + 40, b.top + b.c.height / Dpr, b.top, true)
    }
  }
  // 맨 앞 흐린 풀은 한 번만 흐리게 그린다 (매 프레임 CSS 흐림을 다시 계산하지 않게)
  const paintFore = () => {
    go.setTransform(1, 0, 0, 1, 0, 0)
    go.clearRect(0, 0, C.fore.width, C.fore.height)
    go.filter = `blur(${3 * Dpr * U}px)`
    for (const B of Fore) put(go, B, 0, 0)
    go.filter = 'none'
  }

  let mx = -9999
  let my = -9999
  let Raf = 0
  const Active = new Set<Blade>()
  const step = () => {
    Raf = 0
    const R0 = 120 * U
    const cx0 = Math.floor((mx - R0) / CELL)
    const cx1 = Math.floor((mx + R0) / CELL)
    const cy0 = Math.floor((my - R0) / CELL)
    const cy1 = Math.floor((my + R0) / CELL)
    for (let a = cx0; a <= cx1; a++) {
      for (let b = cy0; b <= cy1; b++) {
        const L = Grid.get(`${a},${b}`)
        // 커서가 실제로 닿는 풀만 움직이는 목록에 넣는다 (다시 그리는 범위를 좁힌다)
        if (L) for (const B of L) if (Math.hypot(B.x - mx, (B.y - B.len * 0.55 - my) * 1.3) < 30 * U + B.len * 0.6) Active.add(B)
      }
    }
    let x0 = 1e9
    let y0 = 1e9
    let x1 = -1e9
    let y1 = -1e9
    for (const B of Active) {
      const dx = B.x - mx
      const d = Math.hypot(dx, (B.y - B.len * 0.55 - my) * 1.3)
      const R = 30 * U + B.len * 0.6
      const target = d < R ? Math.sign(dx || 1) * Math.pow(1 - d / R, 1.4) * 1.25 : 0
      B.v += (target - B.k) * 0.16
      B.v *= 0.76
      B.k += B.v
      const reach = B.len * (Math.abs(B.lean) + Math.abs(B.k) + 0.25) * 1.1 + 8
      x0 = Math.min(x0, B.x - reach)
      x1 = Math.max(x1, B.x + reach)
      y0 = Math.min(y0, B.y - B.len - 4)
      y1 = Math.max(y1, B.y + 2)
      if (target === 0 && Math.abs(B.v) < 0.003 && Math.abs(B.k) < 0.006) {
        B.k = 0
        B.v = 0
        Active.delete(B)
      }
    }
    if (x1 > x0) paintRect(x0, y0, x1, y1)
    if (Active.size) Raf = requestAnimationFrame(step)
  }
  const kick = () => {
    if (!Raf) Raf = requestAnimationFrame(step)
  }
  paintRect(0, 0, W, H)
  paintBands()
  paintFore()

  return {
    setPalette(Q) {
      Pal = Q
      Spr = makeSprites(Q)
      paintRect(0, 0, W, H)
      paintBands()
      paintFore()
    },
    pointer(x, y) {
      mx = x
      my = y
      kick()
    },
    leave() {
      mx = -9999
      my = -9999
      kick()
    },
    stop() {
      cancelAnimationFrame(Raf)
      Raf = 0
    },
  }
}
