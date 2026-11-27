// 위키 그래프 섬 : 첫 화면은 전체 그래프 (카테고리 확대), 글 화면은 지금 글 중심 로컬 그래프
// 페이지를 넘어 살아남아 (transition:persist) 노드 자리를 유지한다. 그리기는 SVG 를 직접 다룬다
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force'
import { useEffect, useRef } from 'react'
import { navigate } from 'astro:transitions/client'
import type { GNode, WikiGraphData } from '@/lib/content/wiki-graph'
import { placeLabels, type LabelItem } from './labels'
import { Forces, topicCenters } from '@/lib/content/wiki-layout'
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

type SNode = GNode & SimulationNodeDatum & { el?: SVGGElement; dot?: SVGElement; label?: SVGTextElement; deg: number; w?: number }
type SLink = SimulationLinkDatum<SNode> & { el?: SVGLineElement; a: string; b: string }
interface View {
  x: number
  y: number
  w: number
  h: number
}

const NS = 'http://www.w3.org/2000/svg'
const Store = 'wiki-posts'
const Ease = (t: number) => 1 - Math.pow(1 - t, 4)

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

  // 처음 한 번 : 데이터를 받아 시뮬레이션과 SVG 를 만든다. 페이지를 옮겨도 다시 만들지 않는다
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
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'wg-svg')
    Host.prepend(svg)
    // 그룹 : 뒤 (전체) · 앞 (확대한 카테고리 · 로컬 그래프) · 호버 (강조한 노드와 이웃)
    // 노드 천여 개에 하나씩 클래스를 바꾸면 스타일 계산이 느려서, 흐리기는 그룹 하나에 걸고 대상만 앞으로 옮긴다
    const group = (cls: string) => {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('class', cls)
      return g
    }
    const World = group('wg-world')
    const Back = group('wg-back')
    const Front = group('wg-front')
    const HotG = group('wg-hot')
    const [BackE, BackN, FrontE, FrontN, HotE, HotN] = [group(''), group(''), group(''), group(''), group(''), group('')]
    Back.append(BackE, BackN)
    Front.append(FrontE, FrontN)
    HotG.append(HotE, HotN)
    World.append(Back, Front)
    svg.append(World, HotG)
    // 요소가 평소 머무는 그룹 (호버가 끝나면 돌아갈 곳)
    const Rest = new Map<Element, SVGGElement>()
    const moveTo = (el: Element, g: SVGGElement) => {
      Rest.set(el, g)
      g.append(el)
    }

    // 카테고리 중심 · 힘 세기는 빌드 때 배치 (wiki-layout.ts) 와 같게 둔다
    const Center = topicCenters(
      data.topics.map((t) => t.id),
      data.nodes.length,
    )
    const centerOf = (n: SNode) => Center.get(n.topic) ?? { x: 0, y: 0 }
    // 빌드 때 자리를 받았으면 그대로 쓰고, 없으면 카테고리 중심 근처에서 출발한다
    const Placed = data.nodes.every((n) => n.x !== undefined)
    const Nodes: SNode[] = data.nodes.map((n) => {
      if (Placed) return { ...n, deg: 0 }
      const C = Center.get(n.topic) ?? { x: 0, y: 0 }
      const A = hash(n.id) * Math.PI * 2
      return { ...n, deg: 0, x: C.x + Math.cos(A) * 60 * hash(n.id + '.'), y: C.y + Math.sin(A) * 60 * hash(n.id + '.') }
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
    const PostNodes = Nodes.filter((n) => n.kind === 'post')
    const PostLinks = Links.filter((l) => ById.get(l.a)!.kind === 'post' || ById.get(l.b)!.kind === 'post')
    const radius = (n: SNode) => (n.id === Cur ? 9 : n.kind === 'ghost' ? 3.5 : 4.5 + Math.min(n.deg, 6) * 0.7)

    // 상태
    let Cur: string | null = null
    let Topic: string | null = null
    let Hot = new Set<string>()
    let Posts = readPosts()
    let Local: Map<string, number> | null = null
    let HW = 1
    let HH = 1
    let V: View = { x: -300, y: -300, w: 600, h: 600 }
    let VRaf = 0
    const postsOn = () => (Cur ? Posts.card : Posts.home)
    const live = (n: SNode) => n.kind !== 'post' || postsOn()

    // DOM
    for (const L of Links) {
      L.el = document.createElementNS(NS, 'line')
      L.el.setAttribute('class', 'wg-edge')
      moveTo(L.el, BackE)
    }
    for (const N of Nodes) {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('class', `wg-node ${N.kind}`)
      const Dot = document.createElementNS(NS, N.kind === 'post' ? 'rect' : 'circle')
      const T = document.createElementNS(NS, 'text')
      T.textContent = N.title
      g.append(Dot, T)
      moveTo(g, BackN)
      Object.assign(N, { el: g, dot: Dot, label: T })
      g.addEventListener('pointerenter', () => focus(N.id))
      g.addEventListener('pointerleave', () => focus(null))
      g.addEventListener('pointerdown', (e) => startDrag(e, N))
    }
    const setR = (n: SNode, r: number) => {
      if (n.kind !== 'post') return n.dot!.setAttribute('r', String(r))
      const h = r * 0.9
      n.dot!.setAttribute('x', String(-h))
      n.dot!.setAttribute('y', String(-h))
      n.dot!.setAttribute('width', String(h * 2))
      n.dot!.setAttribute('height', String(h * 2))
      n.dot!.setAttribute('rx', '1.5')
    }

    for (const N of Nodes) setR(N, radius(N))

    // 힘 배치 : 링크 + 밀어내기 + 카테고리 중심으로 살짝
    const Sim: Simulation<SNode, SLink> = forceSimulation<SNode>([])
      .force('link', forceLink<SNode, SLink>([]).id((d) => d.id).distance((l) => ((l.source as SNode).kind === 'ghost' || (l.target as SNode).kind === 'ghost' ? Forces.ghostDist : Forces.linkDist)).strength(Forces.linkStrength))
      .force('charge', forceManyBody<SNode>().strength(Forces.charge).distanceMax(Forces.chargeMax))
      .force('x', forceX<SNode>((d) => centerOf(d).x).strength(Forces.center))
      .force('y', forceY<SNode>((d) => centerOf(d).y).strength(Forces.center))
      .force('collide', forceCollide<SNode>(Forces.collide))
      .stop()
    // 노드가 움직일 때만 선을 다시 그린다. 이름표는 몇 번에 한 번, 멈추면 마지막으로
    let TickN = 0
    Sim.on('tick', () => {
      drawLinks()
      drawNodes()
      if (++TickN % 6 === 0) layoutLabels()
    })
    Sim.on('end', layoutLabels)
    const feed = () => {
      Sim.nodes(Nodes.filter(live))
      ;(Sim.force('link') as ReturnType<typeof forceLink<SNode, SLink>>).links(Links.filter((l) => live(ById.get(l.a)!) && live(ById.get(l.b)!)).map((l) => ({ ...l, source: l.a, target: l.b })))
    }

    // 그리기
    // k : 화면 1px 이 그래프 좌표 몇인지. f : 점 · 글씨를 원래 크기의 몇 배로 그릴지 (멀리서 보면 작게, 최소 0.4)
    const k = () => V.w / Math.max(1, HW)
    const f = () => Math.min(1, Math.max(0.4, 1 / k()))
    // 멀리서도 이름을 보여 줄 노드 : 링크가 많은 위쪽 8%
    const HubDeg = (() => {
      const D = Nodes.filter((n) => n.kind === 'wiki').map((n) => n.deg).sort((a, b) => b - a)
      return D[Math.floor(D.length * 0.08)] ?? 0
    })()
    function draw() {
      drawLinks()
      drawNodes()
      layoutLabels()
    }
    function drawLinks() {
      for (const L of Links) {
        const A = ById.get(L.a)!
        const B = ById.get(L.b)!
        L.el!.setAttribute('x1', String(A.x))
        L.el!.setAttribute('y1', String(A.y))
        L.el!.setAttribute('x2', String(B.x))
        L.el!.setAttribute('y2', String(B.y))
      }
    }
    // 확대해도 점 · 글씨 크기가 그대로이도록 노드마다 거꾸로 축소한다
    // 글씨는 늘 같은 크기, 점만 f 배 (점 크기는 CSS 변수 하나로 한꺼번에)
    let LastF = -1
    function drawNodes() {
      const S = k()
      // 점 크기 변수는 0.1 단위로 바뀔 때만 (바꿀 때마다 점 수천 개의 스타일을 다시 계산한다)
      const F = Math.round(f() * 10) / 10
      if (F !== LastF) {
        LastF = F
        World.style.setProperty('--wg-f', String(F))
        HotG.style.setProperty('--wg-f', String(F))
      }
      for (const N of Nodes) if (shown(N)) N.el!.setAttribute('transform', `translate(${N.x},${N.y}) scale(${S})`)
    }
    // 선 진하기 : 멀리서 보면 옅게 (애니메이션이 끝날 때만 바꾼다, 선 수천 개를 매 프레임 다시 그리지 않게)
    function edgeTone() {
      World.style.setProperty('--wg-edge-o', String(Math.min(1, Math.max(0.3, 1.2 / k()))))
    }
    const shown = (n: SNode) => live(n) && (!Local || Local.has(n.id))
    const inFocus = (n: SNode) => shown(n) && (Local ? true : !Topic || n.topic === Topic)
    function labelVisible(n: SNode) {
      if (!shown(n)) return false
      if (Hot.has(n.id) || n.id === Cur) return true
      // 멀리서는 링크가 많은 노드만, 가까이 갈수록 모두
      if (f() < 0.75 && !Local && n.deg < HubDeg) return false
      if (n.kind !== 'ghost') return true
      return !!Topic && !Cur && n.topic === Topic
    }
    function layoutLabels() {
      const S = k()
      const sx = (n: SNode) => (n.x! - V.x) / S
      const sy = (n: SNode) => (n.y! - V.y) / S
      const F = f()
      const Dots = Nodes.filter((n) => shown(n) && sx(n) > -20 && sx(n) < HW + 20 && sy(n) > -20 && sy(n) < HH + 20).map((n) => {
        const r = radius(n) * F + 1
        return { id: n.id, x: sx(n) - r, y: sy(n) - r, w: r * 2, h: r * 2 }
      })
      const score = (n: SNode) => (n.id === Cur ? 1e6 : 0) + (Hot.has(n.id) ? 1e5 : 0) + (inFocus(n) ? 0 : -1e4) + (n.kind === 'ghost' ? -1e3 : 0) + n.deg
      const inView = (n: SNode) => {
        const x = sx(n)
        const y = sy(n)
        return x > -40 && x < HW + 40 && y > -20 && y < HH + 20
      }
      const Order = Nodes.filter((n) => labelVisible(n) && inView(n)).sort((a, b) => score(b) - score(a))
      for (const N of Nodes) if (!Order.includes(N)) N.el!.classList.add('nolabel')
      const Items: LabelItem[] = Order.map((n) => {
        n.w ??= n.label!.getComputedTextLength() || n.title.length * 6
        return { id: n.id, x: sx(n), y: sy(n), r: radius(n) * F, w: n.w + 4, force: n.id === Cur || Hot.has(n.id) }
      })
      const Spots = placeLabels(Items, Dots, HW, HH)
      for (const N of Order) {
        const Sp = Spots.get(N.id)
        N.el!.classList.toggle('nolabel', !Sp)
        if (!Sp) continue
        N.label!.setAttribute('x', String(Sp.dx))
        N.label!.setAttribute('y', String(Sp.dy))
        N.label!.setAttribute('text-anchor', Sp.anchor)
      }
    }

    // 보이는 범위 (viewBox) 를 부드럽게 옮긴다
    function setView(T: View, ms: number) {
      cancelAnimationFrame(VRaf)
      if (Reduced || ms <= 0) {
        V = { ...T }
        svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`)
        drawNodes()
        edgeTone()
        layoutLabels()
        return
      }
      const F = { ...V }
      const T0 = performance.now()
      const step = (now: number) => {
        const t = Reduced || ms <= 0 ? 1 : Math.min(1, (now - T0) / ms)
        const e = Ease(t)
        V = { x: F.x + (T.x - F.x) * e, y: F.y + (T.y - F.y) * e, w: F.w + (T.w - F.w) * e, h: F.h + (T.h - F.h) * e }
        svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`)
        drawNodes()
        if (t < 1) VRaf = requestAnimationFrame(step)
        else {
          edgeTone()
          layoutLabels()
        }
      }
      VRaf = requestAnimationFrame(step)
    }
    const aspect = (x0: number, y0: number, w: number, h: number): View => {
      if (w / h > HW / HH) {
        const nh = (w * HH) / HW
        return { x: x0, y: y0 - (nh - h) / 2, w, h: nh }
      }
      const nw = (h * HW) / HH
      return { x: x0 - (nw - w) / 2, y: y0, w: nw, h }
    }
    function target(): View {
      const List = Nodes.filter(inFocus)
      if (List.length === 0) return aspect(-200, -200, 400, 400)
      if (Cur && ById.has(Cur)) {
        const C = ById.get(Cur)!
        const rx = Math.max(60, ...List.map((n) => Math.abs(n.x! - C.x!))) + 40
        const ry = Math.max(60, ...List.map((n) => Math.abs(n.y! - C.y!))) + 40
        return aspect(C.x! - rx, C.y! - ry, rx * 2, ry * 2)
      }
      const xs = List.map((n) => n.x!)
      const ys = List.map((n) => n.y!)
      const Pad = 70
      const x0 = Math.min(...xs) - Pad
      const y0 = Math.min(...ys) - Pad
      return aspect(x0, y0, Math.max(...xs) + Pad - x0, Math.max(...ys) + Pad - y0)
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

    let FrontEls: Element[] = []
    let MeNode: SNode | undefined
    function apply(ms: number) {
      focus(null)
      Local = Cur && ById.has(Cur) ? localSet(Cur) : null
      svg.classList.toggle('card', !!Cur)
      // 지금 글 표시는 바뀐 두 노드만
      if (MeNode?.id !== Cur) {
        const Prev = MeNode
        MeNode = Cur ? ById.get(Cur) : undefined
        for (const N of [Prev, MeNode]) {
          if (!N) continue
          N.el!.classList.toggle('me', N === MeNode)
          setR(N, radius(N))
        }
      }
      for (const N of PostNodes) N.el!.classList.toggle('off', !live(N))
      for (const L of PostLinks) L.el!.classList.toggle('off', !live(ById.get(L.a)!) || !live(ById.get(L.b)!))
      // 앞 그룹 : 확대한 카테고리 또는 로컬 그래프
      for (const El of FrontEls) moveTo(El, El.tagName === 'line' ? BackE : BackN)
      FrontEls = []
      if (Topic || Local) {
        for (const N of Nodes) if (inFocus(N)) FrontEls.push(N.el!)
        for (const L of Links) if (inFocus(ById.get(L.a)!) && inFocus(ById.get(L.b)!)) FrontEls.push(L.el!)
        for (const El of FrontEls) moveTo(El, El.tagName === 'line' ? FrontE : FrontN)
      }
      Back.classList.toggle('dim', !!Topic && !Local)
      Back.classList.toggle('gone', !!Local)
      Fit = target()
      Toggle.setAttribute('aria-pressed', String(postsOn()))
      Toggle.setAttribute('aria-label', postsOn() ? '글 노드 숨기기' : '글 노드 보이기')
      setView(Fit, ms)
    }

    let HotEls: Element[] = []
    function focus(id: string | null) {
      for (const El of HotEls) {
        El.classList.remove('hot')
        Rest.get(El)!.append(El)
      }
      HotEls = []
      Hot = new Set(id && ById.has(id) ? [id, ...Adj.get(id)!] : [])
      for (const h of Hot) {
        const N = ById.get(h)!
        if (shown(N)) HotEls.push(N.el!)
      }
      if (id && ById.has(id)) for (const L of LinksOf.get(id)!) if (shown(ById.get(L.a)!) && shown(ById.get(L.b)!)) HotEls.push(L.el!)
      for (const El of HotEls) {
        El.classList.add('hot')
        ;(El.tagName === 'line' ? HotE : HotN).append(El)
      }
      svg.classList.toggle('focus', HotEls.length > 0)
      layoutLabels()
    }

    // 끌기 · 누르기
    let Moved = false
    function startDrag(e: PointerEvent, N: SNode) {
      if (!live(N)) return
      const g = N.el!
      g.setPointerCapture(e.pointerId)
      Moved = false
      const X0 = e.clientX
      const Y0 = e.clientY
      const move = (ev: PointerEvent) => {
        if (Math.hypot(ev.clientX - X0, ev.clientY - Y0) > 3) Moved = true
        if (!Moved) return
        const R = svg.getBoundingClientRect()
        N.fx = V.x + ((ev.clientX - R.left) / R.width) * V.w
        N.fy = V.y + ((ev.clientY - R.top) / R.height) * V.h
        if (Sim.alpha() < 0.2) Sim.alpha(0.2).restart()
      }
      const up = () => {
        g.removeEventListener('pointermove', move)
        g.removeEventListener('pointerup', up)
        g.removeEventListener('pointercancel', up)
        N.fx = N.fy = null
        if (!Moved && N.kind !== 'ghost') navigate(N.id)
      }
      g.addEventListener('pointermove', move)
      g.addEventListener('pointerup', up)
      g.addEventListener('pointercancel', up)
    }

    // 휠 확대 · 빈 곳을 끌어 옮기기 (옵시디언 그래프처럼)
    let Fit: View = V
    const settle = (() => {
      let T = 0
      return () => {
        clearTimeout(T)
        T = window.setTimeout(() => {
          edgeTone()
          layoutLabels()
        }, 120)
      }
    })()
    const setNow = (Nv: View) => {
      cancelAnimationFrame(VRaf)
      V = Nv
      svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`)
      drawNodes()
      settle()
    }
    svg.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const R = svg.getBoundingClientRect()
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
    svg.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('.wg-node') || e.button !== 0) return
      svg.setPointerCapture(e.pointerId)
      svg.classList.add('panning')
      let X = e.clientX
      let Y = e.clientY
      const move = (ev: PointerEvent) => {
        const S = k()
        setNow({ ...V, x: V.x - (ev.clientX - X) * S, y: V.y - (ev.clientY - Y) * S })
        X = ev.clientX
        Y = ev.clientY
      }
      const up = () => {
        svg.classList.remove('panning')
        svg.removeEventListener('pointermove', move)
        svg.removeEventListener('pointerup', up)
        svg.removeEventListener('pointercancel', up)
      }
      svg.addEventListener('pointermove', move)
      svg.addEventListener('pointerup', up)
      svg.addEventListener('pointercancel', up)
    })

    Toggle.addEventListener('click', () => {
      Posts = { ...Posts, [Cur ? 'card' : 'home']: !postsOn() }
      try {
        localStorage.setItem(Store, JSON.stringify(Posts))
      } catch {}
      feed()
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

    const onTopic = (e: Event) => {
      if (Cur) return
      Topic = (e as CustomEvent<string | null>).detail
      apply(700)
    }
    const onFocus = (e: Event) => focus((e as CustomEvent<string | null>).detail)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !Cur && Topic) {
        Topic = null
        window.dispatchEvent(new CustomEvent('wiki:topic-changed', { detail: null }))
        apply(700)
      }
    }
    window.addEventListener('wiki:topic', onTopic)
    window.addEventListener('wiki:focus', onFocus)
    window.addEventListener('keydown', onKey)

    let First = true
    Api.current = {
      setCurrent(c) {
        Cur = c && ById.has(c) ? c : null
        Topic = Cur ? null : new URLSearchParams(location.search).get('topic')
        Hot = new Set()
        svg.classList.remove('focus')
        feed()
        if (First) {
          First = false
          // 첫 화면 처음 : 한 번 퍼지며 자리를 잡는다. 글 화면으로 바로 들어오면 미리 자리를 잡아 둔다
          drawLinks()
          if (!Placed) {
            Sim.alpha(1).tick(300)
            drawLinks()
          }
          if (Cur || Reduced) return apply(0)
          apply(0)
          const T = { ...V }
          V = { x: T.x + T.w * 0.08, y: T.y + T.h * 0.08, w: T.w * 0.84, h: T.h * 0.84 }
          setView(T, 900)
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
      window.removeEventListener('wiki:topic', onTopic)
      window.removeEventListener('wiki:focus', onFocus)
      window.removeEventListener('keydown', onKey)
      svg.remove()
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
