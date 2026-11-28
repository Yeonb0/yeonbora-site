// 위키 그래프 섬 : 첫 화면은 전체 그래프 (카테고리 · 코스 확대), 글 화면은 지금 글 중심 로컬 그래프
// 페이지를 넘어 살아남아 (transition:persist) 노드 자리를 유지한다
// 그리기는 캔버스 한 장 : 점 · 선 · 이름이 수천 개라 SVG 요소로 두면 움직일 때마다 브라우저가 무거워진다 (옵시디언 그래프와 같은 방식)
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force'
import { useEffect, useRef } from 'react'
import { navigate } from 'astro:transitions/client'
import type { GNode, WikiGraphData } from '@/lib/content/wiki-graph'
import { placeLabels, type LabelItem, type Spot } from './labels'
import { Forces, linkDistance, linkStrength, nodeRadius, topicCenters } from '@/lib/content/wiki-layout'
import './graph.css'

interface Props {
  // 지금 글의 노드 id (/wiki/<slug>), 첫 화면이면 null
  current: string | null
}

// 그래프 데이터는 /wiki-graph.json 하나를 한 번만 받는다 (노트가 많아 페이지마다 넣으면 빌드가 커진다)
let DataP: Promise<WikiGraphData> | undefined
const loadData = () =>
  (DataP ??= fetch('/wiki-graph.json').then((r) => {
    if (!r.ok) throw new Error(`wiki-graph.json ${r.status}`)
    return r.json() as Promise<WikiGraphData>
  }))

type SNode = GNode & SimulationNodeDatum & { deg: number; color: string; w?: number; bold?: boolean; spot?: Spot | null; at?: number }
type SLink = SimulationLinkDatum<SNode> & { a: string; b: string }
interface View {
  x: number
  y: number
  w: number
  h: number
}

const Store = 'wiki-posts'
const Ease = (t: number) => 1 - Math.pow(1 - t, 4)
// 나타날 때 살짝 튀어 오르는 곡선 (cubic-bezier(0.34, 1.56, 0.64, 1) 과 비슷)
const Back = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2)

// 색 : sections/wiki/tokens.css 의 위키 토큰과 같다
const C = { bg: '#232236', pane: '#1c1b2d', fg: '#eaeaea', sub: '#b4b3c8', node: '#8e8da6', ghost: '#6e6d86', post: '#f0c674', accent: '#aa93c2', line: '#565569' }

const readPosts = (): { home: boolean; card: boolean } => {
  try {
    return { home: false, card: true, ...JSON.parse(localStorage.getItem(Store) ?? '{}') }
  } catch {
    return { home: false, card: true }
  }
}

// 같은 노드는 늘 같은 자리에서 출발한다
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

export default function WikiGraph({ current }: Props) {
  const HostRef = useRef<HTMLDivElement>(null)
  const ToggleRef = useRef<HTMLButtonElement>(null)
  const Api = useRef<{ setCurrent(c: string | null): void } | null>(null)
  const CurRef = useRef(current)
  CurRef.current = current

  // 처음 한 번 : 데이터를 받아 시뮬레이션과 캔버스를 만든다. 페이지를 옮겨도 다시 만들지 않는다
  useEffect(() => {
    let Dispose: (() => void) | undefined
    let Gone = false
    loadData()
      .then((data) => {
        if (Gone) return
        Dispose = init(data)
        Api.current?.setCurrent(CurRef.current)
      })
      .catch(() => {
        DataP = undefined
      })
    return () => {
      Gone = true
      Dispose?.()
    }
  }, [])

  function init(data: WikiGraphData) {
    const Host = HostRef.current!
    const Toggle = ToggleRef.current!
    const Reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const Cv = document.createElement('canvas')
    Cv.className = 'wg-canvas'
    Cv.setAttribute('role', 'img')
    Cv.setAttribute('aria-label', '위키 노트 연결 그래프')
    Host.prepend(Cv)
    const Ctx = Cv.getContext('2d')!
    const Root = getComputedStyle(document.documentElement)
    const FontBase = Root.getPropertyValue('--font-base').trim() || 'sans-serif'
    const FontBold = Root.getPropertyValue('--font-base-bold').trim() || FontBase

    // 카테고리 중심 · 힘 세기는 빌드 때 배치 (wiki-layout.ts) 와 같게 둔다
    const Center = topicCenters(
      data.topics.map((t) => t.id),
      data.nodes.length,
    )
    const centerOf = (n: SNode) => Center.get(n.topic) ?? { x: 0, y: 0 }
    const ColorOf = new Map(data.topics.map((t) => [t.id, t.color]))
    // 빌드 때 자리를 받았으면 그대로 쓰고, 없으면 카테고리 중심 근처에서 출발한다
    const Placed = data.nodes.every((n) => n.x !== undefined)
    const Nodes: SNode[] = data.nodes.map((n) => {
      const Base = { ...n, deg: 0, color: ColorOf.get(n.topic) ?? C.node }
      if (Placed) return Base
      const P = Center.get(n.topic) ?? { x: 0, y: 0 }
      const A = hash(n.id) * Math.PI * 2
      return { ...Base, x: P.x + Math.cos(A) * 60 * hash(n.id + '.'), y: P.y + Math.sin(A) * 60 * hash(n.id + '.') }
    })
    const ById = new Map(Nodes.map((n) => [n.id, n]))
    const Links: SLink[] = data.links.map(([a, b]) => ({ a, b, source: a, target: b }))
    const Adj = new Map(Nodes.map((n) => [n.id, new Set<string>()]))
    for (const L of Links) {
      Adj.get(L.a)!.add(L.b)
      Adj.get(L.b)!.add(L.a)
    }
    for (const N of Nodes) N.deg = Adj.get(N.id)!.size
    const LinksOf = new Map(Nodes.map((n) => [n.id, [] as SLink[]]))
    for (const L of Links) {
      LinksOf.get(L.a)!.push(L)
      LinksOf.get(L.b)!.push(L)
    }
    // 코스 노드 (마름모) 와 그 코스 노트들 : 호버하면 코스 노트 전체가, 고르면 그 노트들로 확대된다
    const CourseMembers = new Map(
      Nodes.filter((n) => n.kind === 'course').map((c) => [c.id, new Set(Nodes.filter((n) => n.courses?.includes(c.id.slice(1))).map((n) => n.id))]),
    )
    const inCourse = (n: SNode, id: string) => n.id === `@${id}` || !!n.courses?.includes(id)
    // 점 크기 : 이어진 선이 많을수록 크게 (지금 글은 한 단계 더)
    const radius = (n: SNode) => (n.id === Cur ? Math.max(9, nodeRadius(n, n.deg) + 2) : nodeRadius(n, n.deg))

    // 상태
    let Cur: string | null = null
    let Topic: string | null = null
    let Course: string | null = null
    let Hot = new Set<string>()
    let HotId: string | null = null
    // 코스 강조 중이면 강조한 노드끼리의 선을 모두 밝힌다 (보통은 호버한 노드에 닿은 선만)
    let HotAll = false
    let Posts = readPosts()
    let Local: Map<string, number> | null = null
    // 첫 화면 연출 중이면 지금까지 나타난 노드
    let Visible: Set<SNode> | null = null
    let HW = 1
    let HH = 1
    let V: View = { x: -300, y: -300, w: 600, h: 600 }
    let VRaf = 0
    const postsOn = () => (Cur ? Posts.card : Posts.home)
    const live = (n: SNode) => n.kind !== 'post' || postsOn()
    // 힘 배치에는 코스 노드를 넣지 않는다 (빌드 때 배치와 같게, 자리는 코스 노트들의 가운데)
    const simmed = (n: SNode) => live(n) && n.kind !== 'course'

    // 힘 배치 : 링크 + 밀어내기 + 카테고리 중심으로 살짝 (끌 때만 돌린다)
    const Sim: Simulation<SNode, SLink> = forceSimulation<SNode>([])
      .force(
        'link',
        forceLink<SNode, SLink>([])
          .id((d) => d.id)
          .distance((l) => linkDistance(l.source as SNode, l.target as SNode))
          .strength((l) => linkStrength(l.source as SNode, l.target as SNode)),
      )
      .force('charge', forceManyBody<SNode>().strength(Forces.charge).distanceMax(Forces.chargeMax))
      .force('x', forceX<SNode>((d) => centerOf(d).x).strength(Forces.center))
      .force('y', forceY<SNode>((d) => centerOf(d).y).strength(Forces.center))
      .force('collide', forceCollide<SNode>((d) => Math.max(Forces.collide, nodeRadius(d, d.deg) + 5)))
      .stop()
    let TickN = 0
    Sim.on('tick', () => {
      queue()
      if (++TickN % 6 === 0) layoutLabels()
    })
    Sim.on('end', layoutLabels)
    const feed = () => {
      Sim.nodes(Nodes.filter(simmed))
      ;(Sim.force('link') as ReturnType<typeof forceLink<SNode, SLink>>).links(Links.filter((l) => simmed(ById.get(l.a)!) && simmed(ById.get(l.b)!)).map((l) => ({ ...l, source: l.a, target: l.b })))
    }

    // 보기 상태
    // k : 화면 1px 이 그래프 좌표 몇인지. f : 점을 원래 크기의 몇 배로 그릴지 (멀리서 보면 작게, 최소 0.4. 글씨는 늘 같은 크기)
    const k = () => V.w / Math.max(1, HW)
    const f = () => Math.min(1, Math.max(0.4, 1 / k()))
    const far = () => f() < 0.75 && !Local
    const sx = (n: SNode) => (n.x! - V.x) / k()
    const sy = (n: SNode) => (n.y! - V.y) / k()
    // 멀리서도 이름을 보여 줄 노드 : 링크가 많은 위쪽 8%
    const HubDeg = (() => {
      const D = Nodes.filter((n) => n.kind === 'wiki').map((n) => n.deg).sort((a, b) => b - a)
      return D[Math.floor(D.length * 0.08)] ?? 0
    })()
    const shown = (n: SNode) => live(n) && (!Local || Local.has(n.id))
    const inFocus = (n: SNode) => shown(n) && (Local ? true : Topic ? n.topic === Topic : Course ? inCourse(n, Course) : true)
    // 그릴 노드 : 연출 중이면 나타난 것만, 멀리서는 빈 점 빼고 (강조한 것은 그대로)
    const drawn = (n: SNode) => shown(n) && (!Visible || Visible.has(n)) && !(n.kind === 'ghost' && far() && !Hot.has(n.id))
    // 이름표를 꼭 보일 노드 : 지금 글과 호버한 노드만. 이웃은 먼저 자리를 잡되 겹치면 뺀다
    const forced = (n: SNode) => n.id === Cur || n.id === HotId

    // 흐리기 정도 : 카테고리 · 코스 확대 (DimP) 와 호버 강조 (FocP) 를 0 → 1 로 부드럽게
    const Tween = { dim: 0, dimTo: 0, foc: 0, focTo: 0 }
    let LastT = 0

    // 그리기 : 한 프레임에 한 번만
    let Raf = 0
    function queue() {
      if (!Raf) Raf = requestAnimationFrame(paint)
    }
    function paint(now: number) {
      Raf = 0
      const Dt = LastT ? Math.min(64, now - LastT) : 16
      LastT = now
      const step = (v: number, to: number, ms: number) => (Reduced ? to : v + Math.sign(to - v) * Math.min(Math.abs(to - v), Dt / ms))
      Tween.dim = step(Tween.dim, Tween.dimTo, 400)
      Tween.foc = step(Tween.foc, Tween.focTo, 250)
      let Again = Tween.dim !== Tween.dimTo || Tween.foc !== Tween.focTo

      const Dpr = window.devicePixelRatio || 1
      const W = Math.round(HW * Dpr)
      const H = Math.round(HH * Dpr)
      if (Cv.width !== W || Cv.height !== H) {
        Cv.width = W
        Cv.height = H
      }
      Ctx.setTransform(1, 0, 0, 1, 0, 0)
      Ctx.clearRect(0, 0, W, H)
      const K = k()
      const F = f()
      const Dimming = !!(Topic || Course) && !Local
      const DimA = 1 - 0.88 * Tween.dim
      const FocA = 1 - 0.78 * Tween.foc

      // 선 : 모양 (보통 · 다른 카테고리 · 흐림 · 강조) 마다 경로 하나로 모아 긋는다
      const S = Dpr / K
      Ctx.setTransform(S, 0, 0, S, -V.x * S, -V.y * S)
      const Paths = { same: new Path2D(), cross: new Path2D(), dimSame: new Path2D(), dimCross: new Path2D(), hot: new Path2D() }
      for (const L of Links) {
        const A = ById.get(L.a)!
        const B = ById.get(L.b)!
        if (!drawn(A) || !drawn(B)) continue
        const Cross = A.topic !== B.topic
        const P =
          HotId && (HotAll ? Hot.has(L.a) && Hot.has(L.b) : L.a === HotId || L.b === HotId)
            ? Paths.hot
            : !Dimming || (inFocus(A) && inFocus(B))
              ? Cross
                ? Paths.cross
                : Paths.same
              : Cross
                ? Paths.dimCross
                : Paths.dimSame
        P.moveTo(A.x!, A.y!)
        P.lineTo(B.x!, B.y!)
      }
      // 멀리서 보면 옅게, 다른 카테고리를 잇는 선은 더 옅게, 강조 중이면 나머지는 흐리게
      const Base = Math.min(1, Math.max(0.3, 1.2 / K)) * FocA
      Ctx.lineWidth = K
      Ctx.strokeStyle = C.line
      const stroke = (P: Path2D, Alpha: number) => {
        Ctx.globalAlpha = Alpha
        Ctx.stroke(P)
      }
      stroke(Paths.dimCross, Base * 0.3 * DimA)
      stroke(Paths.dimSame, Base * DimA)
      stroke(Paths.cross, Base * 0.3)
      stroke(Paths.same, Base)
      Ctx.strokeStyle = C.accent
      // 코스 강조는 선이 많아 옅게
      stroke(Paths.hot, HotAll ? 0.45 : 1)

      // 점과 이름 : 화면 px 좌표로 (글씨 크기를 늘 같게). 흐린 것 → 보통 → 강조 → 지금 글 순서로 위에 쌓는다
      Ctx.setTransform(Dpr, 0, 0, Dpr, 0, 0)
      const List = Nodes.filter((n) => {
        if (!drawn(n)) return false
        const x = sx(n)
        const y = sy(n)
        return x > -60 && x < HW + 260 && y > -30 && y < HH + 30
      })
      const layer = (n: SNode) => (n.id === Cur ? 3 : Hot.has(n.id) ? 2 : Dimming && !inFocus(n) ? 0 : 1)
      List.sort((a, b) => layer(a) - layer(b))
      for (const N of List) {
        let Alpha = 1
        let Grow = 1
        if (N.at !== undefined) {
          const t = Math.min(1, (now - N.at) / 500)
          if (t < 1) Again = true
          else N.at = undefined
          Alpha = t
          Grow = Back(t)
        }
        if (Dimming && !inFocus(N)) Alpha *= DimA
        if (Hot.size && !Hot.has(N.id)) Alpha *= FocA
        if (Alpha <= 0.01) continue
        Ctx.globalAlpha = Alpha
        drawDot(N, sx(N), sy(N), radius(N) * F * Math.max(0, Grow))
        const Sp = N.spot
        if (!Sp) continue
        Ctx.font = N.bold ? `12px ${FontBold}` : `11px ${FontBase}`
        Ctx.fillStyle = N.bold || Hot.has(N.id) ? C.fg : C.sub
        Ctx.textAlign = Sp.anchor === 'middle' ? 'center' : Sp.anchor === 'start' ? 'left' : 'right'
        Ctx.fillText(N.title, sx(N) + Sp.dx, sy(N) + Sp.dy)
      }
      Ctx.globalAlpha = 1
      if (Again) queue()
    }
    function drawDot(N: SNode, x: number, y: number, r: number) {
      if (r <= 0) return
      Ctx.beginPath()
      if (N.kind === 'post') {
        const h = r * 0.9
        Ctx.roundRect(x - h, y - h, h * 2, h * 2, 1.5)
        Ctx.fillStyle = C.post
        Ctx.fill()
        return
      }
      if (N.kind === 'course') {
        // 트리 코스 칸과 같은 마름모 테두리
        Ctx.moveTo(x, y - r)
        Ctx.lineTo(x + r, y)
        Ctx.lineTo(x, y + r)
        Ctx.lineTo(x - r, y)
        Ctx.closePath()
        Ctx.fillStyle = C.pane
        Ctx.fill()
        Ctx.lineWidth = 1.5
        Ctx.strokeStyle = C.fg
        Ctx.stroke()
        return
      }
      Ctx.arc(x, y, r, 0, Math.PI * 2)
      if (N.kind === 'ghost') {
        Ctx.fillStyle = C.bg
        Ctx.fill()
        Ctx.setLineDash([2, 2])
        Ctx.lineWidth = 1
        Ctx.strokeStyle = C.ghost
        Ctx.stroke()
        Ctx.setLineDash([])
        return
      }
      Ctx.fillStyle = N.id === Cur ? C.accent : N.color
      Ctx.fill()
    }

    // 이름표 자리 : 화면 px 기준으로 서로 · 점과 겹치지 않게 (labels.ts)
    function labelVisible(n: SNode) {
      if (!drawn(n)) return false
      if (forced(n) || n.kind === 'course' || (Hot.has(n.id) && !HotAll)) return true
      // 멀리서는 링크가 많은 노드만, 가까이 갈수록 모두
      if (f() < 0.75 && !Local && n.deg < HubDeg) return false
      if (n.kind !== 'ghost') return true
      return !!Topic && !Cur && n.topic === Topic
    }
    function measure(n: SNode) {
      if (n.w === undefined) {
        n.bold = n.id === Cur || n.kind === 'course'
        Ctx.font = n.bold ? `12px ${FontBold}` : `11px ${FontBase}`
        n.w = Ctx.measureText(n.title).width
      }
      return n.w
    }
    function layoutLabels() {
      const F = f()
      const inView = (n: SNode) => sx(n) > -40 && sx(n) < HW + 40 && sy(n) > -20 && sy(n) < HH + 20
      const Dots = Nodes.filter((n) => drawn(n) && inView(n)).map((n) => {
        const r = radius(n) * F + 1
        return { id: n.id, x: sx(n) - r, y: sy(n) - r, w: r * 2, h: r * 2 }
      })
      const score = (n: SNode) => (n.id === Cur ? 1e6 : 0) + (forced(n) ? 1e5 : 0) + (n.kind === 'course' ? 5e4 : 0) + (Hot.has(n.id) ? 1e3 : 0) + (inFocus(n) ? 0 : -1e4) + (n.kind === 'ghost' ? -1e3 : 0) + n.deg
      const Order = Nodes.filter((n) => labelVisible(n) && inView(n)).sort((a, b) => score(b) - score(a))
      for (const N of Nodes) N.spot = null
      const Items: LabelItem[] = Order.map((n) => ({ id: n.id, x: sx(n), y: sy(n), r: radius(n) * F, w: measure(n) + 4, force: forced(n) }))
      const Spots = placeLabels(Items, Dots, HW, HH)
      for (const N of Order) N.spot = Spots.get(N.id) ?? null
      queue()
    }

    // 보이는 범위를 부드럽게 옮긴다
    function setView(T: View, ms: number) {
      cancelAnimationFrame(VRaf)
      if (Reduced || ms <= 0) {
        V = { ...T }
        layoutLabels()
        return
      }
      const From = { ...V }
      const T0 = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - T0) / ms)
        const e = Ease(t)
        V = { x: From.x + (T.x - From.x) * e, y: From.y + (T.y - From.y) * e, w: From.w + (T.w - From.w) * e, h: From.h + (T.h - From.h) * e }
        queue()
        // 이름표는 움직이는 동안 몇 번만 다시 잡고, 끝에서 마지막으로
        if (t < 1) {
          if (Math.floor(t * 6) !== Math.floor(((now - 16 - T0) / ms) * 6)) layoutLabels()
          VRaf = requestAnimationFrame(step)
        } else layoutLabels()
      }
      VRaf = requestAnimationFrame(step)
    }
    const aspect = (x0: number, y0: number, w: number, h: number, BW = HW, BH = HH): View => {
      if (w / h > BW / BH) {
        const nh = (w * BH) / BW
        return { x: x0, y: y0 - (nh - h) / 2, w, h: nh }
      }
      const nw = (h * BW) / BH
      return { x: x0 - (nw - w) / 2, y: y0, w: nw, h }
    }
    // 첫 화면에서 코스를 고르면 배운 순서 패널 (CoursePanel.astro) 이 오른쪽 (모바일은 아래) 을 가린다 : 남은 칸에 맞춘다
    const fitBeside = (x0: number, y0: number, w: number, h: number): View => {
      if (!Course || Cur) return aspect(x0, y0, w, h)
      const Wide = innerWidth > 860
      const BW = Wide ? HW - Math.min(300, HW * 0.8) : HW
      const BH = Wide ? HH : HH * 0.55
      const T = aspect(x0, y0, w, h, BW, BH)
      return { x: T.x, y: T.y, w: (T.w * HW) / BW, h: (T.h * HH) / BH }
    }
    function target(Pos?: Map<SNode, { x: number; y: number }>): View {
      const List = Nodes.filter(inFocus)
      if (List.length === 0) return aspect(-200, -200, 400, 400)
      if (Cur && ById.has(Cur)) {
        const at = (n: SNode) => Pos?.get(n) ?? { x: n.x!, y: n.y! }
        const P = at(ById.get(Cur)!)
        const rx = Math.max(60, ...List.map((n) => Math.abs(at(n).x - P.x))) + 40
        const ry = Math.max(60, ...List.map((n) => Math.abs(at(n).y - P.y))) + 40
        return aspect(P.x - rx, P.y - ry, rx * 2, ry * 2)
      }
      const q = (A: number[]) => {
        const S = [...A].sort((a, b) => a - b)
        if (S.length <= 50) return [S[0], S[S.length - 1]]
        return [S[Math.floor(S.length * 0.01)], S[Math.ceil(S.length * 0.99) - 1]]
      }
      const xs = q(List.map((n) => n.x!))
      const ys = q(List.map((n) => n.y!))
      const Pad = 70
      const x0 = Math.min(...xs) - Pad
      const y0 = Math.min(...ys) - Pad
      return fitBeside(x0, y0, Math.max(...xs) + Pad - x0, Math.max(...ys) + Pad - y0)
    }

    // 지금 글에서 2단계까지 : 2단계의 빈 점은 뺀다. 2단계까지가 너무 많으면 (카드가 빽빽해서) 1단계만
    const LocalMax = 40
    function localSet(root: string) {
      const Two = localSetDepth(root, 2)
      return Two.size <= LocalMax ? Two : localSetDepth(root, 1)
    }
    function localSetDepth(root: string, Depth: number) {
      const Seen = new Map([[root, 0]])
      const Q = [root]
      while (Q.length) {
        const c = Q.shift()!
        if (Seen.get(c) === Depth) continue
        for (const n of Adj.get(c) ?? []) {
          const N = ById.get(n)!
          if (!live(N) || Seen.has(n) || (Seen.get(c) === 1 && N.kind === 'ghost')) continue
          Seen.set(n, Seen.get(c)! + 1)
          Q.push(n)
        }
      }
      return Seen
    }

    // 로컬 그래프 : 글 화면에서는 이웃만 따로 작게 배치해 카드에 고르게 편다 (옵시디언 로컬 그래프처럼)
    // 첫 화면으로 돌아가면 원래 (전체 그래프) 자리로 돌아간다
    const Home = new Map<SNode, { x: number; y: number }>()
    let MRaf = 0
    function localTargets(Set: Map<string, number>) {
      const P = ById.get(Cur!)!
      const O = Home.get(P) ?? { x: P.x!, y: P.y! }
      type LN = SimulationNodeDatum & { id: string }
      const Copies: LN[] = [...Set.keys()].map((id) => {
        const G = Home.get(ById.get(id)!) ?? { x: ById.get(id)!.x!, y: ById.get(id)!.y! }
        return { id, x: O.x + (G.x - O.x) * 0.15, y: O.y + (G.y - O.y) * 0.15, ...(id === Cur ? { fx: O.x, fy: O.y } : {}) }
      })
      const LL = Links.filter((l) => Set.has(l.a) && Set.has(l.b)).map((l) => ({ source: l.a, target: l.b }))
      forceSimulation<LN>(Copies)
        .force('link', forceLink<LN, { source: string; target: string }>(LL).id((d) => d.id).distance(46).strength(0.7))
        .force('charge', forceManyBody<LN>().strength(-180))
        .force('collide', forceCollide<LN>(14))
        .force('x', forceX<LN>(O.x).strength(0.06))
        .force('y', forceY<LN>(O.y).strength(0.06))
        .stop()
        .tick(220)
      return new Map(Copies.map((c) => [ById.get(c.id)!, { x: c.x!, y: c.y! }]))
    }
    function moveNodes(T: Map<SNode, { x: number; y: number }>, ms: number) {
      cancelAnimationFrame(MRaf)
      const From = new Map([...T.keys()].map((n) => [n, { x: n.x!, y: n.y! }]))
      const T0 = performance.now()
      const step = (now: number) => {
        const t = Reduced || ms <= 0 ? 1 : Math.min(1, (now - T0) / ms)
        const e = Ease(t)
        for (const [n, p] of T) {
          const Fr = From.get(n)!
          n.x = Fr.x + (p.x - Fr.x) * e
          n.y = Fr.y + (p.y - Fr.y) * e
        }
        queue()
        if (t < 1) MRaf = requestAnimationFrame(step)
        else layoutLabels()
      }
      step(T0)
    }

    let Revealing = false
    function apply(ms: number) {
      focus(null)
      Local = Cur && ById.has(Cur) ? localSet(Cur) : null
      // 로컬 그래프로 옮길 자리 (또는 첫 화면으로 돌아갈 원래 자리)
      let Moves: Map<SNode, { x: number; y: number }> | null = null
      if (Local) {
        Sim.stop()
        // 지난 글의 로컬에만 있던 노드는 원래 자리로 바로 (지금은 그리지 않는다)
        for (const [n, g] of Home) {
          if (Local.has(n.id)) continue
          n.x = g.x
          n.y = g.y
          Home.delete(n)
        }
        for (const id of Local.keys()) {
          const n = ById.get(id)!
          if (!Home.has(n)) Home.set(n, { x: n.x!, y: n.y! })
        }
        Moves = localTargets(Local)
      } else if (Home.size) {
        Moves = new Map(Home)
        Home.clear()
      }
      // 지금 글 이름은 굵게 : 너비를 다시 잰다
      for (const N of Nodes) if (N.bold !== undefined && N.bold !== (N.id === Cur || N.kind === 'course')) N.w = undefined
      Tween.dimTo = (Topic || Course) && !Local ? 1 : 0
      Toggle.setAttribute('aria-pressed', String(postsOn()))
      Toggle.setAttribute('aria-label', postsOn() ? '글 노드 숨기기' : '글 노드 보이기')
      Fit = target(Local && !Revealing ? (Moves ?? undefined) : undefined)
      setView(Fit, ms)
      if (Moves) moveNodes(Moves, ms)
      queue()
    }

    function focus(id: string | null) {
      const Members = id ? CourseMembers.get(id) : undefined
      HotAll = !!Members
      Hot = new Set(id && ById.has(id) ? [id, ...(Members ?? Adj.get(id)!)] : [])
      HotId = id && ById.has(id) ? id : null
      Tween.focTo = HotId ? 1 : 0
      layoutLabels()
    }

    // 마우스 아래 노드 : 위에 그려진 것 (강조 · 지금 글) 부터, 점 반지름 + 여유 4px 안
    function hit(e: PointerEvent | MouseEvent): SNode | null {
      const R = Cv.getBoundingClientRect()
      const X = e.clientX - R.left
      const Y = e.clientY - R.top
      const F = f()
      let Best: SNode | null = null
      let BestD = Infinity
      for (const N of Nodes) {
        if (!drawn(N) || N.kind === 'ghost') continue
        const d = Math.hypot(sx(N) - X, sy(N) - Y)
        const r = Math.max(6, radius(N) * F + 4)
        if (d <= r && d < BestD) {
          Best = N
          BestD = d
        }
      }
      return Best
    }
    let HoverId: string | null = null
    const setHover = (N: SNode | null) => {
      const Id = N?.id ?? null
      Cv.classList.toggle('over', !!N)
      if (Id === HoverId) return
      HoverId = Id
      focus(Id)
    }

    // 끌기 · 누르기 · 빈 곳을 끌어 옮기기
    let Fit: View = V
    const settle = (() => {
      let T = 0
      return () => {
        clearTimeout(T)
        T = window.setTimeout(layoutLabels, 120)
      }
    })()
    const setNow = (Nv: View) => {
      cancelAnimationFrame(VRaf)
      V = Nv
      queue()
      settle()
    }
    let Busy = false
    Cv.addEventListener('pointermove', (e) => {
      if (!Busy && e.pointerType === 'mouse') setHover(hit(e))
    })
    Cv.addEventListener('pointerleave', () => {
      if (!Busy) setHover(null)
    })
    Cv.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      const N = hit(e)
      Cv.setPointerCapture(e.pointerId)
      Busy = true
      if (N && live(N)) return dragNode(e, N)
      Cv.classList.add('panning')
      let X = e.clientX
      let Y = e.clientY
      const move = (ev: PointerEvent) => {
        const S = k()
        setNow({ ...V, x: V.x - (ev.clientX - X) * S, y: V.y - (ev.clientY - Y) * S })
        X = ev.clientX
        Y = ev.clientY
      }
      const up = () => {
        Busy = false
        Cv.classList.remove('panning')
        Cv.removeEventListener('pointermove', move)
        Cv.removeEventListener('pointerup', up)
        Cv.removeEventListener('pointercancel', up)
      }
      Cv.addEventListener('pointermove', move)
      Cv.addEventListener('pointerup', up)
      Cv.addEventListener('pointercancel', up)
    })
    function dragNode(e: PointerEvent, N: SNode) {
      let Moved = false
      const X0 = e.clientX
      const Y0 = e.clientY
      if (e.pointerType !== 'mouse') focus(N.id)
      const move = (ev: PointerEvent) => {
        if (Math.hypot(ev.clientX - X0, ev.clientY - Y0) > 3) Moved = true
        if (!Moved || N.kind === 'course') return
        const R = Cv.getBoundingClientRect()
        const X = V.x + (ev.clientX - R.left) * k()
        const Y = V.y + (ev.clientY - R.top) * k()
        // 글 화면 (로컬 그래프) 에서는 그 노드만 옮긴다 : 전체 그래프 시뮬레이션을 돌리면 다른 노드 자리가 바뀐다
        if (Local) {
          N.x = X
          N.y = Y
          queue()
          return
        }
        N.fx = X
        N.fy = Y
        if (Sim.alpha() < 0.2) Sim.alpha(0.2).restart()
      }
      const up = () => {
        Busy = false
        Cv.removeEventListener('pointermove', move)
        Cv.removeEventListener('pointerup', up)
        Cv.removeEventListener('pointercancel', up)
        N.fx = N.fy = null
        if (Moved) return layoutLabels()
        if (N.kind === 'ghost') return
        if (N.kind !== 'course') return void navigate(N.id)
        const Key = N.id.slice(1)
        if (Cur) return void navigate(`/wiki/?course=${encodeURIComponent(Key)}`)
        pickCourse(Course === Key ? null : Key)
      }
      Cv.addEventListener('pointermove', move)
      Cv.addEventListener('pointerup', up)
      Cv.addEventListener('pointercancel', up)
    }
    // 휠 확대 (커서 기준)
    Cv.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const R = Cv.getBoundingClientRect()
        const px = (e.clientX - R.left) / R.width
        const py = (e.clientY - R.top) / R.height
        const Z = Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015))
        // 가장 가까이 : 1px = 0.3 좌표 (3배), 가장 멀리 : 전체가 보이는 범위의 2배
        const W = Math.min(Fit.w * 2, Math.max(HW * 0.3, V.w * Z))
        const H = (W * HH) / HW
        setNow({ x: V.x + (V.w - W) * px, y: V.y + (V.h - H) * py, w: W, h: H })
      },
      { passive: false },
    )

    Toggle.addEventListener('click', () => {
      Posts = { ...Posts, [Cur ? 'card' : 'home']: !postsOn() }
      try {
        localStorage.setItem(Store, JSON.stringify(Posts))
      } catch {}
      feed()
      if (Cur) return apply(500)
      if (Reduced) {
        Sim.alpha(0.4).tick(150)
        apply(0)
      } else {
        apply(500)
        Sim.alpha(0.4).restart()
        setTimeout(() => apply(600), 700)
      }
    })

    // 크기 : 칸이 바뀌면 같은 자리를 다시 맞춘다
    const RO = new ResizeObserver(() => {
      HW = Host.clientWidth || 1
      HH = Host.clientHeight || 1
      apply(0)
    })
    HW = Host.clientWidth || 1
    HH = Host.clientHeight || 1
    // 글꼴이 늦게 오면 이름표 너비를 다시 잰다
    document.fonts?.ready.then(() => {
      for (const N of Nodes) N.w = undefined
      layoutLabels()
    })

    const onTopic = (e: Event) => {
      if (Cur) return
      Topic = (e as CustomEvent<string | null>).detail
      if (Topic) Course = null
      apply(700)
    }
    // 코스 고르기 : 트리 (wiki:course) 또는 그래프의 마름모. 트리 · 주소 · 배운 순서 패널은 wiki.ts 가 맞춘다
    function pickCourse(id: string | null) {
      Course = id
      if (id) Topic = null
      window.dispatchEvent(new CustomEvent('wiki:course-changed', { detail: id }))
      apply(700)
    }
    const onCourse = (e: Event) => {
      if (Cur) return
      Course = (e as CustomEvent<string | null>).detail
      if (Course) Topic = null
      apply(700)
    }
    const onFocus = (e: Event) => focus((e as CustomEvent<string | null>).detail)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || Cur) return
      if (Topic) {
        Topic = null
        window.dispatchEvent(new CustomEvent('wiki:topic-changed', { detail: null }))
        apply(700)
      } else if (Course) pickCourse(null)
    }
    window.addEventListener('wiki:topic', onTopic)
    window.addEventListener('wiki:course', onCourse)
    window.addEventListener('wiki:focus', onFocus)
    window.addEventListener('keydown', onKey)

    // 첫 화면 : 노트가 작성 순서대로 하나씩 나타난다 (옵시디언 그래프처럼). 빈 점은 이웃이 나타날 때 같이
    const reveal = (done: () => void) => {
      Revealing = true
      const Order = Nodes.map((n, i) => [n, i] as const)
        .filter(([n]) => n.kind !== 'ghost')
        .sort((a, b) => (a[0].t ?? Infinity) - (b[0].t ?? Infinity) || a[1] - b[1])
        .map(([n]) => n)
      const Seen = new Set<SNode>()
      Visible = Seen
      // 몇 개를 보여 줄지는 흐른 시간으로 정한다 : 느린 기기에서도 Dur 안에 끝난다
      const Dur = 2400
      let T0 = 0
      let At = 0
      let Frame = 0
      const show = (N: SNode, now: number) => {
        if (Seen.has(N)) return
        Seen.add(N)
        N.at = now
        for (const L of LinksOf.get(N.id)!) {
          const O = ById.get(L.a === N.id ? L.b : L.a)!
          if (O.kind === 'ghost') show(O, now)
        }
      }
      const step = (now: number) => {
        T0 ||= now
        const To = Math.ceil(Order.length * Math.min(1, (now - T0) / Dur))
        for (const N of Order.slice(At, To)) show(N, now)
        At = Math.max(At, To)
        queue()
        if (++Frame % 20 === 0) layoutLabels()
        if (At < Order.length) return void requestAnimationFrame(step)
        Visible = null
        Revealing = false
        done()
      }
      requestAnimationFrame(step)
    }

    let First = true
    Api.current = {
      setCurrent(c) {
        Cur = c && ById.has(c) ? c : null
        const Q = new URLSearchParams(location.search)
        Topic = Cur ? null : Q.get('topic')
        Course = Cur || Topic ? null : Q.get('course')
        Hot = new Set()
        HotId = null
        HoverId = null
        feed()
        if (First) {
          First = false
          if (!Placed) Sim.alpha(1).tick(300)
          // 첫 화면 처음 : 노트가 작성 순서로 나타난다. 글 화면으로 바로 들어오면 바로 다 보인다
          if (Cur || Reduced) return apply(0)
          Revealing = true
          apply(0)
          reveal(() => apply(Topic || Course ? 700 : 0))
          return
        }
        apply(650)
      },
    }
    RO.observe(Host)

    return () => {
      RO.disconnect()
      Sim.stop()
      cancelAnimationFrame(VRaf)
      cancelAnimationFrame(MRaf)
      cancelAnimationFrame(Raf)
      window.removeEventListener('wiki:topic', onTopic)
      window.removeEventListener('wiki:course', onCourse)
      window.removeEventListener('wiki:focus', onFocus)
      window.removeEventListener('keydown', onKey)
      Cv.remove()
      Api.current = null
    }
  }

  useEffect(() => {
    Api.current?.setCurrent(current)
  }, [current])

  return (
    <div className="wiki-graph" ref={HostRef}>
      <button type="button" className="wg-posts" ref={ToggleRef} />
    </div>
  )
}
