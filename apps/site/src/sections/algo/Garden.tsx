// 알고리즘 방 섬 : 꽃밭 (카테고리 하나 = 꽃 한 송이) 과, 꽃을 누르면 열리는 Algoristro 목록 화면
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Algorithms, Categories, ClassColors, Tiers, algoHref, findCategory } from './data'
import { mountField, type Field } from './field'
import { fieldFlowers, pickStage, placeFlowers, type Stage } from './layout'
import { Palettes, leafPaint, stemPaint, timeOfDay, type TimeOfDay } from './palettes'
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

const BANDS = 5
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
  const [entering, setEntering] = useState(false)

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
    const F = mountField({ back: BackRef.current, bands: Bands as HTMLCanvasElement[], front: FrontRef.current, fore: ForeRef.current }, Stage.W, Stage.H, fieldFlowers(Spots), Pal)
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
    const fromHub = document.documentElement.hasAttribute('data-enter-hub')
    const Reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    // 목록 화면 주소로 바로 들어오면 : 확대 연출 없이 목록을 연다
    const { cat: Deep, canonical } = parseCat(location.hash)
    history.replaceState({ ...history.state, algoDepth: St().algoDepth ?? 0, algoCat: Deep }, '', location.pathname + canonical)
    if (Deep) {
      setZoomed(false)
      setCat(Deep)
    }
    // 허브 칸 색 (자주) 에서 꽃밭이 가운데부터 드러난다. 끝나면 스크립트가 막을 걷어 낸다
    let T = 0
    if (fromHub && !Deep) {
      setEntering(true)
      T = window.setTimeout(() => setEntering(false), Reduce ? 250 : 1300)
    }
    const onPop = (e: PopStateEvent) => {
      if (!Root?.isConnected || !location.pathname.startsWith('/algo')) return
      const S = (e.state ?? {}) as HistoryState
      setZoomed(true)
      setCat(S.algoCat ?? null)
    }
    window.addEventListener('popstate', onPop)
    return () => {
      clearTimeout(T)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  // 마우스 · 손가락 위치를 풀밭 좌표로 바꿔 넘긴다
  const onMove = (e: React.PointerEvent) => {
    if (cat || !FieldRef.current) return
    const R = e.currentTarget.getBoundingClientRect()
    FieldRef.current.pointer((e.clientX - R.left - Ox) / Scale, (e.clientY - R.top - Oy) / Scale)
  }
  const onLeave = () => FieldRef.current?.leave()

  // 누른 꽃으로 확대된다 (전체 목록은 가운데로)
  const Target = cat && cat !== 'all' ? Spots.find((s) => s.letter === cat) : undefined
  const fx = Target ? Target.x + Target.headX : Stage.W / 2
  const fy = Target ? Target.gy + Target.headY : Stage.H / 2
  const World = cat ? `translate(${Stage.W / 2 - fx * ZOOM}px, ${Stage.H / 2 - fy * ZOOM}px) scale(${ZOOM})` : 'none'

  const Hov = Spots.find((s) => s.letter === hov)
  const Pool = cat && cat !== 'all' ? Algorithms.filter((a) => a[2] === cat) : Algorithms
  const SelCat = cat && cat !== 'all' ? findCategory(cat) : undefined

  return (
    <div className={`algo-garden ${cat ? 'is-open' : ''} ${zoomed ? 'is-zoomed' : ''}`} ref={RootRef} onPointerMove={onMove} onPointerLeave={onLeave} data-tod={tod}>
      <div className="field" aria-hidden={cat ? true : undefined} style={{ width: Stage.W, height: Stage.H, transform: `translate(${Ox}px, ${Oy}px) scale(${Scale})` }}>
        <div className="world" style={{ transform: World }}>
          <canvas ref={BackRef} className="layer" aria-hidden="true" />
          {Array.from({ length: BANDS }, (_, i) => (
            <canvas key={i} ref={(el) => void (BandRefs.current[i] = el)} className="band" aria-hidden="true" style={{ animationDelay: `${-i * 0.9}s` }} />
          ))}
          {Spots.map((F) => (
            <div key={F.letter} className={`flower ${hov && hov !== F.letter ? 'dim' : ''}`} style={{ left: F.x, top: F.gy, animationDuration: `${F.dur}s`, animationDelay: `${F.delay}s` }}>
              <span className="shadow" style={{ left: -F.r * 0.8, top: -6 * F.persp, width: F.r * 1.6, height: 12 * F.persp }} />
              <span className="stem" style={{ left: -Math.max(4, 7 * F.persp) / 2, top: -F.stem, width: Math.max(4, 7 * F.persp), height: F.stem, transform: `rotate(${F.lean}deg)`, background: stemPaint(Pal) }} />
              <Leaf F={F} paint={leafPaint(Pal)} />
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
          ))}
          <canvas ref={FrontRef} className="layer" aria-hidden="true" />
          <canvas ref={ForeRef} className="layer fore" aria-hidden="true" />
          <div className="veil" style={{ background: Pal.low }} />
          <div className="veil vignette" />
          <div className="veil" style={{ background: Pal.tint }} />
          {Hov && !cat && (
            <span className="label" style={{ left: Hov.x + Hov.headX, top: Hov.gy + Hov.headY - Hov.r * 0.9 - 10, fontSize: 14 * Math.max(1, 1 / Scale) }}>
              <b style={{ color: Hov.hover }}>{Hov.letter}</b>
              <span>{Hov.name}</span>
              <small>{Hov.count}</small>
            </span>
          )}
        </div>
      </div>

      {/* 목록 화면 : Algoristro 의 Notion 다크 테마 */}
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

      {entering && <div className="enter" aria-hidden="true" />}
    </div>
  )
}

// 줄기에 달린 잎 한 장 : 줄기가 기운 반대쪽으로 뻗는다
function Leaf({ F, paint }: { F: ReturnType<typeof placeFlowers>[number]; paint: string }) {
  const right = F.lean > 0
  const lw = 40 * F.persp
  const lh = 16 * F.persp
  const r1 = (v: number) => Math.round(v * 10) / 10
  const clip = `path('M ${right ? r1(lw) : 0} ${r1(lh * 0.6)} Q ${r1(lw * 0.5)} ${r1(-lh * 0.2)} ${right ? 0 : r1(lw)} ${r1(lh * 0.25)} Q ${r1(lw * 0.5)} ${r1(lh * 1.1)} ${right ? r1(lw) : 0} ${r1(lh * 0.6)} Z')`
  return (
    <span
      className="leaf"
      style={{ left: right ? -lw : 0, top: -F.stem * 0.42, width: lw, height: lh, transformOrigin: right ? '100% 50%' : '0 50%', transform: `rotate(${right ? 18 : -18}deg)`, clipPath: clip, background: paint }}
    />
  )
}
