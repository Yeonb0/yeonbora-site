// 위키 그래프 섬 : 첫 화면은 전체 그래프 (카테고리 확대), 글 화면은 지금 글 중심 로컬 그래프
// 페이지를 넘어 살아남아 (transition:persist) 노드 자리를 유지한다. 그리기는 SVG 를 직접 다룬다
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force'
import { useEffect, useRef } from 'react'
import { navigate } from 'astro:transitions/client'
import type { GNode, WikiGraphData } from '@/lib/content/wiki-graph'
import { placeLabels, type LabelItem } from './labels'
import './graph.css'

interface Props {
  data: WikiGraphData
  // 지금 글의 노드 id (/wiki/<slug>), 첫 화면이면 null
  current: string | null
}

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

export default function WikiGraph({ data, current }: Props) {
  const HostRef = useRef<HTMLDivElement>(null)
  const ToggleRef = useRef<HTMLButtonElement>(null)
  const Api = useRef<{ setCurrent(c: string | null): void } | null>(null)

  // 처음 한 번 : 시뮬레이션과 SVG 를 만든다. 페이지를 옮겨도 다시 만들지 않는다
  useEffect(() => {
    const Host = HostRef.current!
    const Toggle = ToggleRef.current!
    const Reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'wg-svg')
    Host.prepend(svg)
    const gE = document.createElementNS(NS, 'g')
    const gN = document.createElementNS(NS, 'g')
    svg.append(gE, gN)

    const Topics = data.topics.map((t) => t.id)
    const Ring = Topics.length > 1 ? 150 + 22 * Topics.length : 0
    const Center = new Map(Topics.map((t, k) => {
      const A = (k / Topics.length) * Math.PI * 2 - Math.PI / 2
      return [t, { x: Math.cos(A) * Ring, y: Math.sin(A) * Ring }]
    }))
    const centerOf = (n: SNode) => Center.get(n.topic) ?? { x: 0, y: 0 }

    const Nodes: SNode[] = data.nodes.map((n) => {
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
      gE.append(L.el)
    }
    for (const N of Nodes) {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('class', `wg-node ${N.kind}`)
      const Dot = document.createElementNS(NS, N.kind === 'post' ? 'rect' : 'circle')
      const T = document.createElementNS(NS, 'text')
      T.textContent = N.title
      g.append(Dot, T)
      gN.append(g)
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

    // 힘 배치 : 링크 + 밀어내기 + 카테고리 중심으로 살짝
    const Sim: Simulation<SNode, SLink> = forceSimulation<SNode>([])
      .force('link', forceLink<SNode, SLink>([]).id((d) => d.id).distance((l) => ((l.source as SNode).kind === 'ghost' || (l.target as SNode).kind === 'ghost' ? 40 : 66)).strength(0.6))
      .force('charge', forceManyBody<SNode>().strength(-140).distanceMax(400))
      .force('x', forceX<SNode>((d) => centerOf(d).x).strength(0.07))
      .force('y', forceY<SNode>((d) => centerOf(d).y).strength(0.07))
      .force('collide', forceCollide<SNode>(14))
      .stop()
    Sim.on('tick', draw)
    const feed = () => {
      Sim.nodes(Nodes.filter(live))
      ;(Sim.force('link') as ReturnType<typeof forceLink<SNode, SLink>>).links(Links.filter((l) => live(ById.get(l.a)!) && live(ById.get(l.b)!)).map((l) => ({ ...l, source: l.a, target: l.b })))
    }

    // 그리기
    const k = () => V.w / Math.max(1, HW)
    function draw() {
      for (const L of Links) {
        const A = ById.get(L.a)!
        const B = ById.get(L.b)!
        L.el!.setAttribute('x1', String(A.x))
        L.el!.setAttribute('y1', String(A.y))
        L.el!.setAttribute('x2', String(B.x))
        L.el!.setAttribute('y2', String(B.y))
      }
      const S = k()
      for (const N of Nodes) N.el!.setAttribute('transform', `translate(${N.x},${N.y}) scale(${S})`)
      layoutLabels()
    }
    const shown = (n: SNode) => live(n) && (!Local || Local.has(n.id))
    const inFocus = (n: SNode) => shown(n) && (Local ? true : !Topic || n.topic === Topic)
    function labelVisible(n: SNode) {
      if (!shown(n)) return false
      if (n.kind !== 'ghost') return true
      return Hot.has(n.id) || (!!Topic && !Cur && n.topic === Topic)
    }
    function layoutLabels() {
      const S = k()
      const sx = (n: SNode) => (n.x! - V.x) / S
      const sy = (n: SNode) => (n.y! - V.y) / S
      const Dots = Nodes.filter(shown).map((n) => {
        const r = radius(n) + 1
        return { id: n.id, x: sx(n) - r, y: sy(n) - r, w: r * 2, h: r * 2 }
      })
      const score = (n: SNode) => (n.id === Cur ? 1e6 : 0) + (Hot.has(n.id) ? 1e5 : 0) + (inFocus(n) ? 0 : -1e4) + (n.kind === 'ghost' ? -1e3 : 0) + n.deg
      const Order = Nodes.filter(labelVisible).sort((a, b) => score(b) - score(a))
      const Items: LabelItem[] = Order.map((n) => {
        n.w ??= n.label!.getComputedTextLength() || n.title.length * 6
        return { id: n.id, x: sx(n), y: sy(n), r: radius(n), w: n.w + 4, force: n.id === Cur || Hot.has(n.id) }
      })
      const Spots = placeLabels(Items, Dots, HW, HH)
      for (const N of Nodes) {
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
      const F = { ...V }
      const T0 = performance.now()
      const step = (now: number) => {
        const t = Reduced || ms <= 0 ? 1 : Math.min(1, (now - T0) / ms)
        const e = Ease(t)
        V = { x: F.x + (T.x - F.x) * e, y: F.y + (T.y - F.y) * e, w: F.w + (T.w - F.w) * e, h: F.h + (T.h - F.h) * e }
        svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`)
        draw()
        if (t < 1) VRaf = requestAnimationFrame(step)
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

    // 지금 글에서 2단계까지 : 2단계의 빈 점은 뺀다
    function localSet(root: string) {
      const Seen = new Map([[root, 0]])
      const Q = [root]
      while (Q.length) {
        const c = Q.shift()!
        if (Seen.get(c) === 2) continue
        for (const n of Adj.get(c) ?? []) {
          const N = ById.get(n)!
          if (!live(N) || Seen.has(n) || (Seen.get(c) === 1 && N.kind === 'ghost')) continue
          Seen.set(n, Seen.get(c)! + 1)
          Q.push(n)
        }
      }
      return Seen
    }

    function apply(ms: number) {
      Local = Cur && ById.has(Cur) ? localSet(Cur) : null
      svg.classList.toggle('zoomed', !!(Topic || Local))
      svg.classList.toggle('card', !!Cur)
      for (const N of Nodes) {
        N.el!.classList.toggle('me', N.id === Cur)
        N.el!.classList.toggle('off', !live(N))
        N.el!.classList.toggle('hidden', live(N) && !!Local && !Local.has(N.id))
        N.el!.classList.toggle('out', !inFocus(N))
        setR(N, radius(N))
      }
      for (const L of Links) {
        const A = ById.get(L.a)!
        const B = ById.get(L.b)!
        L.el!.classList.toggle('off', !live(A) || !live(B))
        L.el!.classList.toggle('hidden', live(A) && live(B) && !!Local && !(Local.has(L.a) && Local.has(L.b)))
        L.el!.classList.toggle('out', !(inFocus(A) && inFocus(B)))
      }
      Toggle.setAttribute('aria-pressed', String(postsOn()))
      Toggle.setAttribute('aria-label', postsOn() ? '글 노드 숨기기' : '글 노드 보이기')
      setView(target(), ms)
    }

    function focus(id: string | null) {
      Hot = new Set(id && ById.has(id) ? [id, ...Adj.get(id)!] : [])
      svg.classList.toggle('focus', Hot.size > 0)
      for (const N of Nodes) N.el!.classList.toggle('hot', Hot.has(N.id))
      for (const L of Links) L.el!.classList.toggle('hot', !!id && (L.a === id || L.b === id))
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
          Sim.alpha(1)
          if (Cur || Reduced) {
            Sim.tick(300)
            apply(0)
          } else {
            Sim.tick(40)
            apply(0)
            Sim.restart()
            setTimeout(() => apply(900), 1200)
          }
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
  }, [])

  useEffect(() => {
    Api.current?.setCurrent(current)
  }, [current])

  return (
    <div className="wiki-graph" ref={HostRef}>
      <button type="button" className="wg-posts" ref={ToggleRef} />
    </div>
  )
}
