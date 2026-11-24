// 학교 방 : 1 ~ 5학년 색 막대 계단 + 5학년 위 노란 원 (활동)
// 막대에 호버 (터치는 탭) 하면 그 막대에서 학년 색이 화면 전체로 번지고, 다 번진 뒤에 분류별로 쌓인 책이 나온다
// 노란 원은 같은 방식으로 원에서 화면 전체로 번지며 활동 목록을 연다
// 펼친 화면은 마우스가 화면 테두리 (위 · 오른쪽 · 아래 · 왼쪽) 로 가거나 Esc 를 누르면 왔던 모양으로 다시 줄어들며 닫힌다
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AnimationEvent, CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { ActivityCategories, ActivityYear, Activities, Categories, Years, categoryColor, categoryOf, nameUnits } from './data'
import type { Year } from './data'
import './school.css'

// 계단 높이 (화면 높이 대비 %)
const StepHeights = [18, 29, 40, 51, 62]
// 책을 들쭉날쭉하게 놓는 기본 왼쪽 여백 (%)
const Offsets = [3, 9, 1, 13, 6, 11, 0, 8]
const ActivityColor = '#FFB400'

// 펼친 화면을 닫았다 열어도 옮긴 책 순서 · 위치가 남도록 페이지 단위로 기억한다
const SavedOrder = new Map<string, string[]>()
const SavedShift = new Map<string, number>()

// 열린 화면 : 학년 (0 ~ 4) 또는 활동
type Target = { kind: 'year'; index: number } | { kind: 'activity' }

interface Opened {
  target: Target
  // 번지기 시작 모양과 다 번진 모양 (clip-path)
  from: string
  to: string
  closing: boolean
}

const keyOf = (t: Target) => (t.kind === 'year' ? `year-${t.index}` : 'activity')

export default function SchoolRoom() {
  const [opened, setOpened] = useState<Opened | null>(null)
  const [canHover, setCanHover] = useState(true)
  const BarRefs = useRef<(HTMLButtonElement | null)[]>([])
  // 막대 안 학년 숫자 : 펼친 화면의 큰 숫자가 여기서 그대로 커진다
  const NumRefs = useRef<(HTMLSpanElement | null)[]>([])
  const SunRef = useRef<HTMLButtonElement | null>(null)
  // 닫힌 직후 커서 아래에 있는 입구는 커서가 한 번 벗어날 때까지 호버로 다시 열지 않는다
  const Blocked = useRef<string | null>(null)
  const LastPointer = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const Query = window.matchMedia('(hover: hover) and (pointer: fine)')
    setCanHover(Query.matches)
    const onChange = () => setCanHover(Query.matches)
    const onMove = (e: PointerEvent) => {
      LastPointer.current = { x: e.clientX, y: e.clientY }
    }
    Query.addEventListener('change', onChange)
    window.addEventListener('pointermove', onMove)
    return () => {
      Query.removeEventListener('change', onChange)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  const close = () => setOpened((o) => (o && !o.closing ? { ...o, closing: true } : o))

  useEffect(() => {
    if (!opened) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [opened])

  const open = (target: Target, viaHover: boolean) => {
    if (opened) return
    if (viaHover && Blocked.current === keyOf(target)) return
    const W = window.innerWidth
    const H = window.innerHeight
    if (target.kind === 'year') {
      const R = BarRefs.current[target.index]?.getBoundingClientRect()
      if (!R) return
      setOpened({ target, from: `inset(${R.top}px ${W - R.right}px ${H - R.bottom}px ${R.left}px)`, to: 'inset(0px 0px 0px 0px)', closing: false })
    } else {
      const R = SunRef.current?.getBoundingClientRect()
      if (!R) return
      const Cx = R.left + R.width / 2
      const Cy = R.top + R.height / 2
      const Far = Math.hypot(Math.max(Cx, W - Cx), Math.max(Cy, H - Cy))
      setOpened({ target, from: `circle(${R.width / 2}px at ${Cx}px ${Cy}px)`, to: `circle(${Far}px at ${Cx}px ${Cy}px)`, closing: false })
    }
  }

  const finishClose = () => {
    // 닫힌 자리 아래에 커서가 있으면 그 입구는 커서가 벗어날 때까지 막는다
    const { x, y } = LastPointer.current
    const Under = x >= 0 ? document.elementFromPoint(x, y)?.closest('[data-entry]') : null
    Blocked.current = Under ? Under.getAttribute('data-entry') : null
    setOpened(null)
  }

  const entryProps = (target: Target) => ({
    'data-entry': keyOf(target),
    onMouseEnter: canHover ? () => open(target, true) : undefined,
    onMouseLeave: () => {
      if (Blocked.current === keyOf(target)) Blocked.current = null
    },
    onClick: () => open(target, false),
  })

  return (
    <div className="school">
      <h1 className="sr-only">학교</h1>
      <div className="stairs">
        {Years.map((y, i) => (
          <button
            key={y.n}
            ref={(el) => {
              BarRefs.current[i] = el
            }}
            className="step"
            type="button"
            aria-label={`${y.n}학년`}
            style={{ height: `${StepHeights[i]}%`, background: y.color, color: y.light ? '#000' : '#fff' }}
            {...entryProps({ kind: 'year', index: i })}
          >
            <span
              className="step-n"
              ref={(el) => {
                NumRefs.current[i] = el
              }}
            >
              {y.n}
            </span>
          </button>
        ))}
        <button
          ref={SunRef}
          className="sun"
          type="button"
          aria-label="활동"
          style={{ bottom: `calc(${StepHeights[4]}% + clamp(80px, 16vh, 160px))`, background: ActivityColor }}
          {...entryProps({ kind: 'activity' })}
        />
      </div>
      {opened && (
        <Flood
          key={keyOf(opened.target)}
          opened={opened}
          color={opened.target.kind === 'year' ? Years[opened.target.index].color : ActivityColor}
          ink={opened.target.kind === 'year' && !Years[opened.target.index].light ? '#fff' : '#000'}
          label={opened.target.kind === 'year' ? `${Years[opened.target.index].n}학년 과목` : '활동'}
          touch={!canHover}
          number={opened.target.kind === 'year' ? Years[opened.target.index].n : undefined}
          numberFrom={opened.target.kind === 'year' ? NumRefs.current[opened.target.index] : null}
          onClose={close}
          onClosed={finishClose}
        >
          {(lock) => (opened.target.kind === 'year' ? <Shelf year={Years[opened.target.index]} lock={lock} /> : <Shelf year={ActivityYear} activity lock={lock} />)}
        </Flood>
      )}
    </div>
  )
}

// 번지며 열리고 줄어들며 닫히는 전체 화면. 내용은 다 번진 뒤에 나타나고 닫기 전에 먼저 사라진다
function Flood({
  opened,
  color,
  ink,
  label,
  touch,
  number,
  numberFrom,
  onClose,
  onClosed,
  children,
}: {
  opened: Opened
  color: string
  ink: string
  label: string
  touch: boolean
  number?: number
  numberFrom?: HTMLElement | null
  onClose: () => void
  onClosed: () => void
  children: (lock: (on: boolean) => void) => ReactNode
}) {
  // 책을 들고 있는 동안에는 테두리로 가도 닫지 않는다
  const Locked = useRef(false)
  // 펼친 화면 색에 맞춰 공용 홈 버튼 색을 바꾼다 (노랑 · 하늘색 위에서도 보이게)
  useEffect(() => {
    const Root = document.documentElement.style
    Root.setProperty('--home-fg', ink)
    Root.setProperty('--home-bg', ink === '#000' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)')
    return () => {
      Root.removeProperty('--home-fg')
      Root.removeProperty('--home-bg')
    }
  }, [ink])
  const leave = () => {
    if (!Locked.current) onClose()
  }
  // 학년 숫자 : 막대 안 숫자 모양에서 큰 숫자로 커지고, 닫을 때는 같은 자리로 줄어든다 (사라지지 않는다)
  const NumRef = useRef<HTMLSpanElement | null>(null)
  const NumAnim = (reverse: boolean) => {
    const To = NumRef.current
    if (!To || !numberFrom) return
    const F = numberFrom.getBoundingClientRect()
    const T = To.getBoundingClientRect()
    const Scale = parseFloat(getComputedStyle(numberFrom).fontSize) / parseFloat(getComputedStyle(To).fontSize)
    const Small = `translate(${F.left - T.left}px, ${F.top - T.top}px) scale(${Scale})`
    const Frames = [{ transform: Small }, { transform: 'none' }]
    const Still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    To.animate(reverse ? Frames.reverse() : Frames, {
      duration: Still ? 10 : reverse ? 400 : 450,
      delay: reverse && !Still ? 100 : 0,
      easing: 'cubic-bezier(0.7, 0, 0.2, 1)',
      fill: 'both',
    })
  }
  useLayoutEffect(() => {
    NumAnim(false)
    // 열릴 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (opened.closing) NumAnim(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened.closing])
  const onEnd = (e: AnimationEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && e.animationName === 'school-unflood') onClosed()
  }
  const Style = { background: color, color: ink, '--from': opened.from, '--to': opened.to } as CSSProperties
  return (
    <section className={`flood${opened.closing ? ' closing' : ''}`} style={Style} aria-label={label} onAnimationEnd={onEnd}>
      <button className="edge edge-top" type="button" aria-label="계단으로 돌아가기" onMouseEnter={leave} onClick={onClose} />
      {!touch && (
        <>
          <div className="edge edge-right" aria-hidden="true" onMouseEnter={leave} />
          <div className="edge edge-bottom" aria-hidden="true" onMouseEnter={leave} />
          <div className="edge edge-left" aria-hidden="true" onMouseEnter={leave} />
        </>
      )}
      {number !== undefined && (
        <span className="year-number" ref={NumRef} aria-hidden="true">
          {number}
        </span>
      )}
      <div className="flood-content">
        {children((on) => {
          Locked.current = on
        })}
      </div>
    </section>
  )
}

interface Held {
  name: string
  pile: string
  offX: number
  offY: number
  x: number
  y: number
  w: number
  pileLeft: number
  pileWidth: number
  color: string
  size: number
}

function Shelf({ year, activity, lock }: { year: Year; activity?: boolean; lock: (on: boolean) => void }) {
  const Source: { key: string; label: string; books: string[] }[] = activity
    ? ActivityCategories.map((c) => ({ ...c, books: Activities[c.key] }))
    : Categories.map((c) => ({ ...c, books: year.courses.filter((name) => categoryOf(name) === c.key) }))
  const Piles = Source.map((c, index) => ({
    ...c,
    id: `${activity ? 'a' : year.n}${c.key}`,
    color: categoryColor(year, index),
  })).filter((p) => p.books.length)

  const initialOrder = () => {
    const O: Record<string, string[]> = {}
    for (const p of Piles) O[p.id] = SavedOrder.get(p.id) ?? [...p.books].sort((a, b) => nameUnits(b) - nameUnits(a))
    return O
  }
  const [order, setOrder] = useState<Record<string, string[]>>(initialOrder)
  const [shift, setShift] = useState<Record<string, number>>({})
  const [held, setHeld] = useState<Held | null>(null)
  const HeldRef = useRef<Held | null>(null)
  const OrderRef = useRef(order)
  const BookRefs = useRef(new Map<string, HTMLLIElement>())
  const PrevTops = useRef<Map<string, number> | null>(null)
  const LockUntil = useRef(0)
  OrderRef.current = order

  // 순서가 바뀌면 다른 책들이 원래 자리에서 새 자리로 미끄러진다 (FLIP)
  useLayoutEffect(() => {
    const Prev = PrevTops.current
    if (!Prev) return
    PrevTops.current = null
    Prev.forEach((top, name) => {
      const El = BookRefs.current.get(name)
      if (!El) return
      const Dy = top - El.getBoundingClientRect().top
      if (Math.abs(Dy) < 0.5) return
      El.style.transition = 'none'
      El.style.transform = `translateY(${Dy}px)`
      El.getBoundingClientRect()
      El.style.transition = 'transform 220ms cubic-bezier(.2, .7, .2, 1)'
      El.style.transform = ''
    })
  }, [order])

  const grab = (e: ReactPointerEvent<HTMLLIElement>, name: string, pile: string, color: string, size: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    const B = e.currentTarget.getBoundingClientRect()
    const P = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    const Start: Held = { name, pile, offX: e.clientX - B.left, offY: e.clientY - B.top, x: e.clientX, y: e.clientY, w: B.width, pileLeft: P.left, pileWidth: P.width, color, size }
    HeldRef.current = Start
    setHeld(Start)
    lock(true)

    const move = (ev: PointerEvent) => {
      const Cur = HeldRef.current
      if (!Cur) return
      const Next = { ...Cur, x: ev.clientX, y: ev.clientY }
      HeldRef.current = Next
      setHeld(Next)
      // 커서보다 아래에 중심이 있는 책 수 = 들고 있는 책이 들어갈 자리 (아래가 0번)
      const O = OrderRef.current[Cur.pile]
      const Others = O.filter((x) => x !== Cur.name)
      const Idx = Others.filter((x) => {
        const El = BookRefs.current.get(x)
        if (!El) return false
        const R = El.getBoundingClientRect()
        return R.top + R.height / 2 > ev.clientY
      }).length
      const N = [...Others]
      N.splice(Idx, 0, Cur.name)
      if (N.join('|') !== O.join('|') && Date.now() > LockUntil.current) {
        LockUntil.current = Date.now() + 120
        const Tops = new Map<string, number>()
        for (const x of O) {
          const El = BookRefs.current.get(x)
          if (El) Tops.set(x, El.getBoundingClientRect().top)
        }
        PrevTops.current = Tops
        SavedOrder.set(Cur.pile, N)
        setOrder((prev) => ({ ...prev, [Cur.pile]: N }))
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      lock(false)
      const D = HeldRef.current
      HeldRef.current = null
      setHeld(null)
      if (!D) return
      // 놓은 가로 위치를 칸 안으로 제한해 기억한다
      const Pct = Math.max(0, Math.min(100 - (D.w / D.pileWidth) * 100, ((D.x - D.offX - D.pileLeft) / D.pileWidth) * 100))
      SavedShift.set(D.name, Pct)
      setShift((prev) => ({ ...prev, [D.name]: Pct }))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <>
      <div className="piles">
        {Piles.map((p) => {
          const Size = p.books.length > 8 ? 16 : 18
          return (
            <div className="pile" key={p.id}>
              <ul>
                {order[p.id].map((name, i) => {
                  // 책 길이 : 칸의 60% 에서 시작해 글자 폭 (24 글자분이 100%) 에 비례해 늘어난다. 더미끼리 기준이 같다
                  const Width = `${60 + 40 * Math.min(1, nameUnits(name) / 24)}%`
                  const Left = shift[name] ?? SavedShift.get(name)
                  return (
                    <li
                      key={name}
                      ref={(el) => {
                        if (el) BookRefs.current.set(name, el)
                        else BookRefs.current.delete(name)
                      }}
                      className="book"
                      style={{
                        width: Width,
                        marginLeft: `min(${Left ?? Offsets[i % Offsets.length]}%, calc(100% - ${Width}))`,
                        opacity: held?.name === name ? 0.15 : 1,
                        background: p.color,
                        fontSize: Size,
                      }}
                      onPointerDown={(e) => grab(e, name, p.id, p.color, Size)}
                    >
                      {name}
                    </li>
                  )
                })}
              </ul>
              <div className="floor" />
              <h2>{p.label}</h2>
            </div>
          )
        })}
      </div>
      {held && (
        <div className="book held" aria-hidden="true" style={{ left: held.x - held.offX, top: held.y - held.offY, width: held.w, background: held.color, fontSize: held.size }}>
          {held.name}
        </div>
      )}
    </>
  )
}
