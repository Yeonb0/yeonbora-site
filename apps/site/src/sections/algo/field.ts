// 풀밭 엔진 : 원근 풀 뭉치 + 큰 얼룩 무늬 + 안개 + 마우스로 꺾이는 스프링
// 바닥 풀은 한 번 그리고, 마우스가 닿은 풀 주변만 다시 그린다
// 살랑이는 풀은 가로 띠 캔버스에 한 번 그려 두고 CSS 로 띠를 흔든다 (그래픽 카드가 처리해 가볍다)
import type { Palette } from './palettes'

// 엔진에 넘기는 꽃 자리 : 줄기 밑동 둘레 (x, y, r), 꽃 머리 (hx, hy, hr), 땅에 닿는 자리 (gx, gy) 와 줄기 길이 · 원근
export interface FieldFlower {
  x: number
  y: number
  r: number
  hx: number
  hy: number
  hr: number
  gx: number
  gy: number
  stem: number
  persp: number
}

// 줄기 잎 한 장 : 꽃마다 개수 · 길이 · 폭 · 휨 · 처짐 · 색을 다르게 뽑는다
interface LeafShape {
  side: number
  h: number
  w: number
  bend: number
  droop: number
  dx: number
  tone: number
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
  // 줄기 잎 : 풀 그림 대신 이 그림을 그대로 (s = 1) 그린다
  img?: HTMLCanvasElement
  iw?: number
  ih?: number
}

const SPR_H = 170
const SPR_W = 64
const CELL = 64
const TONES = 6
const CURVES = 6
// 풀 양 : 1 이면 처음 설계한 빽빽한 풀밭
const DENSITY = 7 / 20

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

// 꽃 한 송이의 줄기 잎 그림 : 밑동 (가운데 아래) 에서 잎이 갈라져 나간다. 풀 그림처럼 밑동은 투명하게 풀린다
const makeLeafSprite = (P: Palette, Ls: LeafShape[]) => {
  const ih = Math.ceil(Math.max(...Ls.map((L) => L.h)) + 6)
  const iw = Math.ceil(2 * Math.max(...Ls.map((L) => Math.abs(L.dx) + L.bend * L.h + L.w)) + 12)
  const c = document.createElement('canvas')
  c.width = iw * 2
  c.height = ih * 2
  const g = c.getContext('2d')!
  g.scale(2, 2)
  for (const L of Ls) {
    const bx = iw / 2 + L.dx
    const tx = bx + L.side * L.bend * L.h
    // 처진 잎은 끝이 꼭대기보다 아래로 내려온다
    const ty = ih - L.h * (1 - L.droop * 0.45)
    const ax = bx + L.side * L.bend * L.h * (0.25 + L.droop * 0.5)
    const ay = ih - L.h * (0.9 + L.droop * 0.2)
    const t2 = Math.min(TONES - 1, L.tone + 1)
    const Gr = g.createLinearGradient(0, ih, 0, ih - L.h)
    Gr.addColorStop(0, fade(P.mids[L.tone], 0))
    Gr.addColorStop(0.16, fade(P.mids[L.tone], 0.6))
    Gr.addColorStop(0.36, P.mids[L.tone])
    Gr.addColorStop(0.85, P.tips[L.tone])
    Gr.addColorStop(1, P.tips[t2])
    g.fillStyle = Gr
    g.beginPath()
    g.moveTo(bx - L.w / 2, ih)
    g.bezierCurveTo(bx - L.w * 0.5, ih - L.h * 0.45, ax - L.side * L.w * 0.6, ay - L.w * 0.3, tx, ty)
    g.bezierCurveTo(ax + L.side * L.w * 0.6, ay + L.w * 0.5, bx + L.w * 0.55, ih - L.h * 0.4, bx + L.w / 2, ih)
    g.closePath()
    g.fill()
    // 잎맥
    g.strokeStyle = P.rim
    g.lineWidth = 0.7
    g.beginPath()
    g.moveTo(bx, ih - L.h * 0.15)
    g.quadraticCurveTo(ax, ay + L.w * 0.1, tx, ty)
    g.stroke()
  }
  return { c, iw, ih }
}

// onReady : 첫 풀밭을 다 그렸을 때 (여러 프레임에 나눠 그린다)
export function mountField(C: FieldCanvases, W: number, H: number, Flowers: FieldFlower[], P: Palette, onReady?: () => void): Field {
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
    // 한 줄에 심는 풀 뭉치 수 (DENSITY 로 전체 양을 조절한다)
    const per = Math.round((W / (26 * s + 8)) * DENSITY)
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
  const Fore: Blade[] = Array.from({ length: Math.round(((16 * W) / 1280) * DENSITY) }, () => {
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
  // 줄기 잎 : 풀과 같은 캔버스에 깊이 순서대로 그려, 꽃 앞쪽 풀이 잎을 덮게 한다
  const LeafSets: LeafShape[][] = Flowers.map((F) => {
    const n = 2 + (rnd() < 0.45 ? 1 : 0)
    const first = rnd() < 0.5 ? -1 : 1
    return Array.from({ length: n }, (_, j) => ({
      side: j % 2 ? -first : first,
      h: F.stem * (0.22 + rnd() * 0.38),
      w: (5 + rnd() * 6) * F.persp,
      bend: 0.15 + rnd() * 0.5,
      droop: rnd() < 0.5 ? rnd() * 0.8 : 0,
      dx: (rnd() - 0.5) * 6 * F.persp,
      tone: 1 + Math.floor(rnd() * (TONES - 2)),
    }))
  })
  const LeafBlades: Blade[] = Flowers.map((F) => {
    const B: Blade = { x: F.gx, y: F.gy - 1, s: 1, len: 0, spr: 0, tone: 0, f: 1, lean: 0, k: 0, v: 0, front: false, sway: false }
    Blades.push(B)
    return B
  })
  const paintLeaves = (Q: Palette) =>
    LeafBlades.forEach((B, i) => {
      const { c, iw, ih } = makeLeafSprite(Q, LeafSets[i])
      Object.assign(B, { img: c, iw, ih, len: Math.max(ih, iw * 0.65) })
    })
  paintLeaves(P)
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
    if (B.img) {
      g.setTransform(Dpr, 0, -Dpr * B.k * 0.6, Dpr * (1 - Math.min(0.3, Math.abs(B.k) * 0.25)), Dpr * (B.x - ox), Dpr * (B.y - oy))
      g.drawImage(B.img, -B.iw! / 2, -B.ih!, B.iw!, B.ih!)
      return
    }
    const s = B.s
    g.setTransform(Dpr * s * B.f, 0, -Dpr * s * (B.lean + B.k), Dpr * s * (1 - Math.min(0.45, Math.abs(B.k) * 0.4)), Dpr * (B.x - ox), Dpr * (B.y - oy))
    g.drawImage(Spr[B.tone * CURVES + B.spr], -SPR_W / 2, -SPR_H, SPR_W, SPR_H)
  }
  // 그라디언트는 캔버스마다 한 번만 만든다 (팔레트가 바뀌면 비운다)
  let HazeG = new Map<CanvasRenderingContext2D, CanvasGradient>()
  let GroundG: CanvasGradient | null = null
  const hazeFill = (g: CanvasRenderingContext2D) => {
    let Hz = HazeG.get(g)
    if (!Hz) {
      Hz = g.createLinearGradient(0, 0, 0, H * 0.6)
      Hz.addColorStop(0, Pal.haze)
      Hz.addColorStop(1, 'rgba(0,0,0,0)')
      HazeG.set(g, Hz)
    }
    return Hz
  }
  // 땅 : 풀 가운데 톤 계열, 아래로 갈수록 밝게 (뒤 캔버스에만 칠한다)
  const groundFill = () => {
    if (!GroundG) {
      GroundG = gb.createLinearGradient(0, 0, 0, H)
      GroundG.addColorStop(0, Pal.ground0)
      GroundG.addColorStop(0.45, Pal.mids[2])
      GroundG.addColorStop(1, Pal.mids[4])
    }
    return GroundG
  }
  // 멀수록 안개 (oy : 캔버스가 화면에서 내려온 만큼, atop : 이미 그린 풀 위에만)
  const haze = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, oy: number, atop: boolean) => {
    if (y0 >= H * 0.6) return
    g.setTransform(Dpr, 0, 0, Dpr, 0, -Dpr * oy)
    if (atop) g.globalCompositeOperation = 'source-atop'
    g.fillStyle = hazeFill(g)
    g.fillRect(x0, y0, x1 - x0, Math.min(y1, H * 0.6) - y0)
    g.globalCompositeOperation = 'source-over'
  }
  const hits = (B: Blade, isFront: boolean, x0: number, x1: number, y1: number) => B.front === isFront && !B.sway && B.y - B.len <= y1 && B.x + B.len * 0.8 >= x0 && B.x - B.len * 0.8 <= x1
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
      // 앞 캔버스는 줄기 밑동 풀만 있어 대개 비어 있다 : 닿는 풀이 없으면 건너뛴다
      if (isFront) {
        let any = false
        for (let i = From; i < To && !any; i++) any = hits(Blades[i], true, x0, x1, y1)
        if (!any) continue
      }
      g.save()
      g.setTransform(Dpr, 0, 0, Dpr, 0, 0)
      g.beginPath()
      g.rect(x0, y0, x1 - x0, y1 - y0)
      g.clip()
      if (isFront) g.clearRect(x0, y0, x1 - x0, y1 - y0)
      else {
        g.fillStyle = groundFill()
        g.fillRect(x0, y0, x1 - x0, y1 - y0)
      }
      for (let i = From; i < To; i++) if (hits(Blades[i], isFront, x0, x1, y1)) put(g, Blades[i], 0, 0)
      haze(g, x0, y0, x1, y1, 0, isFront)
      g.restore()
    }
  }

  // 처음 그리기 : 풀잎이 수천 장이라 한 번에 그리면 화면이 멈춘다
  // 순서대로 그리는 일을 쪼개 프레임마다 20ms 씩만 쓴다 (그동안은 칸 색 막이 덮고 있어 끊김이 안 보이므로 넉넉히 써서 빨리 끝낸다) (풀은 y 순으로 정렬돼 있어 잘라 그려도 겹침 순서가 같다)
  const CHUNK = 48
  function* paintAll(): Generator<void, void, void> {
    for (const [g, isFront] of [
      [gb, false],
      [gf, true],
    ] as const) {
      g.setTransform(Dpr, 0, 0, Dpr, 0, 0)
      g.clearRect(0, 0, W, H)
      if (!isFront) {
        g.fillStyle = groundFill()
        g.fillRect(0, 0, W, H)
      }
      let n = 0
      for (const B of Blades) {
        if (B.front !== isFront || B.sway) continue
        put(g, B, 0, 0)
        if (++n % CHUNK === 0) yield
      }
      haze(g, 0, 0, W, H, 0, isFront)
      yield
    }
    // 살랑이는 띠
    for (const b of Band) {
      b.g.setTransform(1, 0, 0, 1, 0, 0)
      b.g.clearRect(0, 0, b.c.width, b.c.height)
      let n = 0
      for (const B of b.List) {
        put(b.g, B, -40, b.top)
        if (++n % CHUNK === 0) yield
      }
      haze(b.g, -40, b.top, W + 40, b.top + b.c.height / Dpr, b.top, true)
      yield
    }
    // 맨 앞 흐린 풀은 한 번만 흐리게 그린다 (매 프레임 CSS 흐림을 다시 계산하지 않게)
    go.setTransform(1, 0, 0, 1, 0, 0)
    go.clearRect(0, 0, C.fore.width, C.fore.height)
    go.filter = `blur(${3 * Dpr * U}px)`
    for (const B of Fore) put(go, B, 0, 0)
    go.filter = 'none'
  }
  let Job = 0
  let Ready = false
  // stop() 뒤에는 어떤 호출로도 다시 그리지 않는다
  let Stopped = false
  const build = () => {
    if (Stopped) return
    cancelAnimationFrame(Job)
    Ready = false
    const It = paintAll()
    const tick = () => {
      const t0 = performance.now()
      while (performance.now() - t0 < 20) {
        if (It.next().done) {
          Job = 0
          Ready = true
          onReady?.()
          kick()
          return
        }
      }
      Job = requestAnimationFrame(tick)
    }
    Job = requestAnimationFrame(tick)
  }

  let mx = -9999
  let my = -9999
  let Raf = 0
  const Active = new Set<Blade>()
  // 다시 그릴 칸 표시판
  const TILE = 80
  const TC = Math.ceil(W / TILE)
  const TR = Math.ceil(H / TILE)
  const Dirty = new Uint8Array(TC * TR)
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
    // 움직이는 풀이 덮는 칸만 표시한다 : 커서가 지나간 자취 전체를 큰 사각형 하나로 다시 그리지 않게
    Dirty.fill(0)
    let any = false
    for (const B of Active) {
      const dx = B.x - mx
      const d = Math.hypot(dx, (B.y - B.len * 0.55 - my) * 1.3)
      const R = 30 * U + B.len * 0.6
      const target = d < R ? Math.sign(dx || 1) * Math.pow(1 - d / R, 1.4) * 1.25 : 0
      // 스프링 : 커서를 빨리 따라가고 금방 가라앉는다
      B.v += (target - B.k) * 0.4
      B.v *= 0.6
      B.k += B.v
      const reach = B.len * (Math.abs(B.lean) + Math.abs(B.k) + 0.25) * 1.1 + 8
      const c0 = Math.max(0, Math.floor((B.x - reach) / TILE))
      const c1 = Math.min(TC - 1, Math.floor((B.x + reach) / TILE))
      const r0 = Math.max(0, Math.floor((B.y - B.len - 4) / TILE))
      const r1 = Math.min(TR - 1, Math.floor((B.y + 2) / TILE))
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) Dirty[r * TC + c] = 1
      any = true
      if (target === 0 && Math.abs(B.v) < 0.003 && Math.abs(B.k) < 0.006) {
        B.k = 0
        B.v = 0
        Active.delete(B)
      }
    }
    // 줄마다 이어진 칸을 묶어 한 번에 그린다
    if (any) {
      for (let r = 0; r < TR; r++) {
        for (let c = 0; c < TC; c++) {
          if (!Dirty[r * TC + c]) continue
          let e = c
          while (e + 1 < TC && Dirty[r * TC + e + 1]) e++
          paintRect(c * TILE, r * TILE, (e + 1) * TILE, (r + 1) * TILE)
          c = e
        }
      }
    }
    if (Active.size) Raf = requestAnimationFrame(step)
  }
  // 다 그리기 전에는 풀을 꺾지 않는다 (다 그린 뒤 마지막 마우스 위치로 한 번 움직인다)
  const kick = () => {
    if (Ready && !Stopped && !Raf) Raf = requestAnimationFrame(step)
  }
  build()

  return {
    setPalette(Q) {
      if (Stopped) return
      Pal = Q
      Spr = makeSprites(Q)
      paintLeaves(Q)
      HazeG = new Map()
      GroundG = null
      build()
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
      Stopped = true
      cancelAnimationFrame(Raf)
      cancelAnimationFrame(Job)
      Raf = 0
      Job = 0
      // 화면 밖 그림 캔버스를 바로 비운다 (Safari 는 캔버스 메모리를 GC 전까지 한도에 센다)
      for (const c of Spr) c.width = c.height = 0
      for (const B of LeafBlades) if (B.img) B.img.width = B.img.height = 0
    },
  }
}
