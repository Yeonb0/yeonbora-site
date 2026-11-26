// 알고리즘 방 섬 : 꽃밭 (카테고리 하나 = 꽃 한 송이) 과, 꽃을 누르면 열리는 Algoristro 목록 화면
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Algorithms, Categories, ClassColors, Tiers, algoHref, findCategory } from './data'
import { mountField, type Field } from './field'
import { fieldFlowers, pickStage, placeFlowers, type FlowerSpot as Spot, type Stage } from './layout'
import { Palettes, timeOfDay, type Palette, type TimeOfDay } from './palettes'
import { catHash, parseCat, type CatView } from './route'
import './garden.css'

interface Props {
  // 카테고리 코드 → 꽃 그림 주소
  flowers: Record<string, string>
}

interface HistoryState {
  // Astro 화면 전환 라우터의 기록 번호 : 앞 · 뒤로 가기 방향을 이 값으로 가린다
  index?: number
  algoDepth?: number
  algoCat?: string | null
}

type ListView = 'boj' | 'class'

// 살랑이는 풀 띠 수 : 띠마다 화면 크기 층이 하나씩 합성되므로 적게 둔다
const BANDS = 3
// 화면 아래 비치는 빛 · 가장자리 어둠 · 위에서 비치는 빛을 막 하나에 겹친다 (화면 크기 층을 하나만 합성)
const VIGNETTE = 'radial-gradient(ellipse 85% 95% at 50% 78%, rgba(0, 0, 0, 0) 62%, rgba(10, 30, 5, 0.16) 100%)'
const ZOOM = 3
const Tabs: { id: ListView; label: string }[] = [
  { id: 'boj', label: 'BOJ 기준' },
  { id: 'class', label: 'solved.ac class 기준' },
]
const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${a})`

export default function Garden({ flowers }: Props) {
  const RootRef = useRef<HTMLDivElement>(null)
  const BackRef = useRef<HTMLCanvasElement>(null)
  const FrontRef = useRef<HTMLCanvasElement>(null)
  const ForeRef = useRef<HTMLCanvasElement>(null)
  const BandRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const FieldRef = useRef<Field | null>(null)

  const [size, setSize] = useState({ vw: 1280, vh: 800 })
  const [tod] = useState<TimeOfDay>(() => timeOfDay(new Date().getHours()))
  // 목록 화면 : null 이면 꽃밭
  const [cat, setCat] = useState<CatView>(null)
  // 꽃밭에서 눌러 연 것인지 (확대 연출을 할지)
  const [zoomed, setZoomed] = useState(false)
  const [view, setView] = useState<ListView>('boj')
  const [hov, setHov] = useState<string | null>(null)
  // 허브에서 들어오는 연출 : hold (칸 색으로 덮고 풀밭을 그리는 중) → reveal (가운데부터 드러남) → null
  // 첫 화면부터 막이 있어야 바탕이 비치지 않으므로 처음 값에서 바로 정한다 (client:only 라 document 를 쓸 수 있다)
  const [entering, setEntering] = useState<'hold' | 'reveal' | null>(() =>
    document.documentElement.hasAttribute('data-enter-hub') && !parseCat(location.hash).cat ? 'hold' : null,
  )
  // 풀밭을 다 그렸는지 : 그리는 동안은 꽃밭을 숨긴다
  const [ready, setReady] = useState(false)

  const Stage: Stage = useMemo(() => pickStage(size.vw, size.vh), [size.vw, size.vh])
  const Spots = useMemo(() => placeFlowers(Stage), [Stage])
  const Pal = Palettes[tod]
  // 설계 크기를 화면에 꽉 차게 (넘치는 쪽은 가운데를 기준으로 자른다)
  const Scale = Math.max(size.vw / Stage.W, size.vh / Stage.H)
  const Ox = (size.vw - Stage.W * Scale) / 2
  const Oy = (size.vh - Stage.H * Scale) / 2

  // 화면 크기
  useEffect(() => {
    const Root = RootRef.current
    if (!Root) return
    const measure = () => setSize({ vw: Root.clientWidth || window.innerWidth, vh: Root.clientHeight || window.innerHeight })
    measure()
    const RO = new ResizeObserver(measure)
    RO.observe(Root)
    return () => RO.disconnect()
  }, [])

  // 풀밭 : 설계 크기가 바뀔 때만 다시 심는다
  useEffect(() => {
    const Bands = BandRefs.current.slice(0, BANDS)
    if (!BackRef.current || !FrontRef.current || !ForeRef.current || Bands.some((b) => !b)) return
    setReady(false)
    const F = mountField({ back: BackRef.current, bands: Bands as HTMLCanvasElement[], front: FrontRef.current, fore: ForeRef.current }, Stage.W, Stage.H, fieldFlowers(Spots), Pal, () => setReady(true))
    FieldRef.current = F
    return () => {
      F.stop()
      FieldRef.current = null
    }
    // 시간대는 들어올 때 한 번 정해지므로 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Stage, Spots])

  // 기록 : 이 방 안에서 쌓은 깊이 (algoDepth). 0 이면 뒤로가기 대신 바로 꽃밭으로 바꾼다
  const St = (): HistoryState => (history.state ?? {}) as HistoryState
  const open = useCallback((c: string, fromFlower: boolean) => {
    setHov(null)
    setZoomed(fromFlower)
    setCat(c)
    history.pushState({ ...history.state, index: (St().index ?? 0) + 1, algoDepth: (St().algoDepth ?? 0) + 1, algoCat: c }, '', location.pathname + catHash(c))
  }, [])
  const pick = useCallback((c: string) => {
    setCat(c)
    history.replaceState({ ...history.state, algoCat: c }, '', location.pathname + catHash(c))
  }, [])
  const close = useCallback(() => {
    if ((St().algoDepth ?? 0) > 0) return history.back()
    history.replaceState({ ...history.state, algoCat: null }, '', location.pathname)
    setCat(null)
  }, [])

  useEffect(() => {
    const Root = RootRef.current
    // 목록 화면 주소로 바로 들어오면 : 확대 연출 없이 목록을 연다
    const { cat: Deep, canonical } = parseCat(location.hash)
    history.replaceState({ ...history.state, algoDepth: St().algoDepth ?? 0, algoCat: Deep }, '', location.pathname + canonical)
    if (Deep) {
      setZoomed(false)
      setCat(Deep)
    }
    const onPop = (e: PopStateEvent) => {
      if (!Root?.isConnected || !location.pathname.startsWith('/algo')) return
      const S = (e.state ?? {}) as HistoryState
      setZoomed(true)
      setCat(S.algoCat ?? null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // 허브에서 들어올 때 : 칸 색 (자주) 막을 덮은 채 풀밭을 다 그리고, 다 그리면 가운데부터 걷어 낸다
  // (그리기가 너무 오래 걸리면 기다리지 않고 걷는다)
  useEffect(() => {
    if (entering !== 'hold') return
    if (ready) return setEntering('reveal')
    const T = window.setTimeout(() => setEntering('reveal'), 2500)
    return () => clearTimeout(T)
  }, [entering, ready])
  useEffect(() => {
    if (entering !== 'reveal') return
    const Reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const T = window.setTimeout(() => {
      setEntering(null)
      document.documentElement.removeAttribute('data-enter-hub')
    }, Reduce ? 250 : 1150)
    return () => clearTimeout(T)
  }, [entering])

  // 꽃도 풀처럼 커서를 피해 고개를 숙인다 : 땅에 닿은 자리를 축으로 기울인다
  // 매 프레임 React 를 다시 그리지 않게 꽃마다 감싼 요소의 transform 만 바꾼다
  const BendRefs = useRef<(HTMLDivElement | null)[]>([])
  const Nod = useRef({ mx: -9999, my: -9999, raf: 0, k: [] as number[], v: [] as number[] })
  const SpotsRef = useRef(Spots)
  SpotsRef.current = Spots
  const nodTick = useCallback(() => {
    const N = Nod.current
    N.raf = 0
    let busy = false
    SpotsRef.current.forEach((F, i) => {
      const dx = N.mx - (F.x + F.headX)
      const d = Math.hypot(dx, N.my - (F.gy + F.headY))
      const R = F.r * 2.4
      // 커서가 머리 오른쪽이면 왼쪽으로 (가운데에서 방향이 튀지 않게 tanh 로 부드럽게)
      const target = d < R ? -7 * Math.tanh(dx / F.r) * Math.pow(1 - d / R, 1.2) : 0
      let k = N.k[i] ?? 0
      let v = N.v[i] ?? 0
      v = (v + (target - k) * 0.25) * 0.68
      k += v
      if (target === 0 && Math.abs(v) < 0.01 && Math.abs(k) < 0.02) k = v = 0
      else busy = true
      N.k[i] = k
      N.v[i] = v
      const El = BendRefs.current[i]
      if (El) El.style.transform = k ? `rotate(${k.toFixed(2)}deg)` : ''
    })
    if (busy) N.raf = requestAnimationFrame(nodTick)
  }, [])
  const nodKick = () => {
    if (!Nod.current.raf && !matchMedia('(prefers-reduced-motion: reduce)').matches) Nod.current.raf = requestAnimationFrame(nodTick)
  }
  useEffect(() => () => cancelAnimationFrame(Nod.current.raf), [])

  // 마우스 · 손가락 위치를 풀밭 좌표로 바꿔 넘긴다
  const onMove = (e: React.PointerEvent) => {
    if (cat || !FieldRef.current) return
    const R = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - R.left - Ox) / Scale
    const y = (e.clientY - R.top - Oy) / Scale
    FieldRef.current.pointer(x, y)
    Nod.current.mx = x
    Nod.current.my = y
    nodKick()
  }
  const onLeave = () => {
    FieldRef.current?.leave()
    Nod.current.mx = -9999
    Nod.current.my = -9999
    nodKick()
  }

  // 누른 꽃으로 확대된다 (전체 목록은 가운데로)
  const Target = cat && cat !== 'all' ? Spots.find((s) => s.letter === cat) : undefined
  const fx = Target ? Target.x + Target.headX : Stage.W / 2
  const fy = Target ? Target.gy + Target.headY : Stage.H / 2
  const World = cat ? `translate(${Stage.W / 2 - fx * ZOOM}px, ${Stage.H / 2 - fy * ZOOM}px) scale(${ZOOM})` : 'none'

  const Hov = Spots.find((s) => s.letter === hov)

  return (
    <div className={`algo-garden ${cat ? 'is-open' : ''} ${zoomed ? 'is-zoomed' : ''} ${ready ? 'is-ready' : ''}`} ref={RootRef} onPointerMove={onMove} onPointerLeave={onLeave} data-tod={tod}>
      <div className="field" aria-hidden={cat ? true : undefined} style={{ width: Stage.W, height: Stage.H, transform: `translate(${Ox}px, ${Oy}px) scale(${Scale})` }}>
        <div className="world" style={{ transform: World }}>
          <canvas ref={BackRef} className="layer" aria-hidden="true" />
          {Array.from({ length: BANDS }, (_, i) => (
            <canvas key={i} ref={(el) => void (BandRefs.current[i] = el)} className="band" aria-hidden="true" style={{ animationDelay: `${-i * 0.9}s` }} />
          ))}
          {Spots.map((F, i) => (
            <div key={F.letter} className={`flower ${hov && hov !== F.letter ? 'dim' : ''}`} style={{ left: F.x, top: F.gy, animationDuration: `${F.dur}s`, animationDelay: `${F.delay}s` }}>
              <div className="bend" ref={(el) => void (BendRefs.current[i] = el)}>
                <Stalk F={F} P={Pal} />
                <div className="head" style={{ left: F.headX, top: F.headY }}>
                  <div className={`face ${hov === F.letter ? 'hot' : ''}`} style={{ filter: `${F.depth} ${Pal.flower === 'none' ? '' : Pal.flower} drop-shadow(0 ${(4 * F.persp).toFixed(1)}px ${(5 * F.persp).toFixed(1)}px rgba(20,50,10,.38))` }}>
                    <img src={flowers[F.letter]} alt="" draggable={false} style={{ left: -F.r, top: -F.r * 0.8, width: F.r * 2, height: F.r * 1.6 }} />
                  </div>
                  <button
                    type="button"
                    className="hit"
                    aria-label={`${F.name} (${F.count}개)`}
                    tabIndex={cat ? -1 : 0}
                    style={{ left: -F.r * 1.05, top: -F.r * 1.05, width: F.r * 2.1, height: F.r * 2.1 }}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setHov(F.letter)}
                    onPointerLeave={() => setHov(null)}
                    onFocus={() => setHov(F.letter)}
                    onBlur={() => setHov(null)}
                    onClick={() => open(F.letter, true)}
                  />
                </div>
              </div>
            </div>
          ))}
          <canvas ref={FrontRef} className="layer" aria-hidden="true" />
          <canvas ref={ForeRef} className="layer fore" aria-hidden="true" />
          <div className="veil" style={{ background: `${Pal.tint}, ${VIGNETTE}, ${Pal.low}` }} />
          {Hov && !cat && (
            <span className="label" style={{ left: Hov.x + Hov.headX, top: Hov.gy + Hov.headY - Hov.r * 0.9 - 10, fontSize: 14 * Math.max(1, 1 / Scale) }}>
              <b style={{ color: Hov.hover }}>{Hov.letter}</b>
              <span>{Hov.name}</span>
              <small>{Hov.count}</small>
            </span>
          )}
        </div>
      </div>

      <ListScreen cat={cat} view={view} setView={setView} pick={pick} close={close} />

      {entering && <div className={`enter ${entering === 'reveal' ? 'go' : ''}`} aria-hidden="true" />}
    </div>
  )
}

// 목록 화면 : Algoristro 의 Notion 다크 테마
// 카드가 수백 장이라 꽃 호버 · 마우스 움직임으로 다시 그리지 않게 따로 떼어 memo 한다
interface ListProps {
  cat: CatView
  view: ListView
  setView: (v: ListView) => void
  pick: (c: string) => void
  close: () => void
}
const ListScreen = memo(function ListScreen({ cat, view, setView, pick, close }: ListProps) {
  const Pool = cat && cat !== 'all' ? Algorithms.filter((a) => a[2] === cat) : Algorithms
  const SelCat = cat && cat !== 'all' ? findCategory(cat) : undefined
  return (
    <section className="list" aria-hidden={cat ? undefined : true} onKeyDown={(e) => e.key === 'Escape' && close()}>
      <nav className="side">
        <button type="button" className="row home-row" onClick={close} tabIndex={cat ? 0 : -1} aria-label="꽃밭으로 돌아가기">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="2.6" />
            <ellipse cx="12" cy="5.2" rx="2.4" ry="3.4" />
            <ellipse cx="12" cy="18.8" rx="2.4" ry="3.4" />
            <ellipse cx="5.2" cy="12" rx="3.4" ry="2.4" />
            <ellipse cx="18.8" cy="12" rx="3.4" ry="2.4" />
          </svg>
          <span className="grow">Algoristro</span>
        </button>
        <button type="button" className={`row ${cat === 'all' ? 'on' : ''}`} onClick={() => pick('all')} tabIndex={cat ? 0 : -1}>
          <span className="mark">Σ</span>
          <span className="grow">전체</span>
          <span className="count">{Algorithms.length}</span>
        </button>
        {Categories.map((c) => (
          <button key={c.letter} type="button" className={`row ${cat === c.letter ? 'on' : ''}`} onClick={() => pick(c.letter)} tabIndex={cat ? 0 : -1}>
            <span className="mark" style={{ color: c.hover }}>
              {c.letter}
            </span>
            <span className="grow">{c.name}</span>
            <span className="count">{Algorithms.filter((a) => a[2] === c.letter).length}</span>
          </button>
        ))}
      </nav>
      <main className="body">
        <header className="title">
          <span className="badge" style={SelCat ? { background: rgba(SelCat.hover, 0.14), color: SelCat.hover } : undefined}>
            {SelCat ? SelCat.letter : 'Σ'}
          </span>
          <h1>{SelCat ? SelCat.name : 'Algoristro'}</h1>
        </header>
        <div className="tabs" role="tablist">
          {Tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={view === t.id} className={view === t.id ? 'on' : ''} onClick={() => setView(t.id)} tabIndex={cat ? 0 : -1}>
              {t.label}
            </button>
          ))}
        </div>
        {view === 'boj' ? (
          <div className="board" key={`boj-${cat}`}>
            {Tiers.map((t, ti) => {
              const Items = Pool.filter((a) => a[3] === ti)
              return (
                <section key={t.name} className="col">
                  <h2>
                    <i style={{ background: t.color }} />
                    <span style={{ color: t.color }}>{t.name}</span>
                    <small>{Items.length}</small>
                  </h2>
                  <div className="cards" style={{ background: rgba(t.color, 0.06) }}>
                    {Items.map((a) => (
                      <a key={a[0]} className="card" href={algoHref(a)} tabIndex={cat ? 0 : -1}>
                        {a[1]}
                      </a>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="classes" key={`class-${cat}`}>
            {ClassColors.map((color, i) => {
              const Items = Pool.filter((a) => a[4] === i + 1)
              if (!Items.length) return null
              return (
                <div key={i} className="class-row">
                  <span className="class-name" style={{ color }}>
                    Class {i + 1}
                  </span>
                  <div className="chips">
                    {Items.map((a) => (
                      <a key={a[0]} className="chip" href={algoHref(a)} style={{ background: rgba(color, 0.1) }} tabIndex={cat ? 0 : -1}>
                        {a[1]}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </section>
  )
})

// 줄기 : 풀잎처럼 끝으로 갈수록 가늘고 살짝 휘며, 밑동은 투명하게 풀어 땅과 섞인다
// 잎은 풀 캔버스에 깊이 순서대로 그린다 (field.ts) : 앞쪽 풀이 잎을 덮는다. 색은 풀 그림과 같은 팔레트
const r1 = (v: number) => Math.round(v * 10) / 10
function Stalk({ F, P }: { F: Spot; P: Palette }) {
  const hx = F.headX
  const hy = F.headY
  // 줄기는 곧게 서다가 위에서 머리 쪽으로 기운다. 꽃마다 조금씩 반대로 휜다
  const bow = ((F.letter.charCodeAt(0) % 3) - 1) * F.stem * 0.05
  const cx = hx * 0.15 + bow
  const cy = hy * 0.55
  const w0 = Math.max(3, 6 * F.persp)
  const w1 = w0 * 0.5
  const L: string[] = []
  const R: string[] = []
  const Rim: string[] = []
  const N = 14
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const u = 1 - t
    const x = u * u * 0 + 2 * u * t * cx + t * t * hx
    const y = 2 * u * t * cy + t * t * hy
    // 접선에 수직인 방향으로 폭을 벌린다
    const tx = 2 * u * (cx - 0) + 2 * t * (hx - cx)
    const ty = 2 * u * cy + 2 * t * (hy - cy)
    const len = Math.hypot(tx, ty) || 1
    const nx = -ty / len
    const ny = tx / len
    const w = (w0 + (w1 - w0) * t) / 2
    L.push(`${r1(x - nx * w)} ${r1(y - ny * w)}`)
    R.push(`${r1(x + nx * w)} ${r1(y + ny * w)}`)
    if (t >= 0.25) Rim.push(`${r1(x + nx * w * 0.6)} ${r1(y + ny * w * 0.6)}`)
  }
  const stem = `M ${L.join(' L ')} L ${R.reverse().join(' L ')} Z`
  const id = `algo-stalk-${F.letter}`
  return (
    <svg className="stalk" width="1" height="1" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={P.mids[2]} stopOpacity="0" />
          <stop offset="0.16" stopColor={P.mids[2]} stopOpacity="0.6" />
          <stop offset="0.34" stopColor={P.mids[3]} />
          <stop offset="0.8" stopColor={P.tips[2]} />
          <stop offset="1" stopColor={P.tips[3]} />
        </linearGradient>
      </defs>
      <path d={stem} fill={`url(#${id})`} />
      <polyline points={Rim.join(' ')} fill="none" stroke={P.rim} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}
