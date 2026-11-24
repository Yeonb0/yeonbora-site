// 학교 방 : 1 ~ 5학년 색 막대 계단
// 막대에 호버 (터치 기기는 탭) 하면 그 막대에서 학년 색이 화면 전체로 번지고 분류별로 쌓인 책이 나온다
// 펼친 화면은 위쪽 테두리로 마우스를 올리거나 (탭) Esc 로 닫는다
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Categories, Years, categoryColor, categoryOf, nameUnits } from './data'
import type { Year } from './data'
import './school.css'

// 계단 높이 (화면 높이 대비 %)
const StepHeights = [22, 36, 50, 64, 78]
// 책을 들쭉날쭉하게 놓는 기본 왼쪽 여백 (%)
const Offsets = [3, 9, 1, 13, 6, 11, 0, 8]

// 펼친 화면을 닫았다 열어도 옮긴 책 순서 · 위치가 남도록 페이지 단위로 기억한다
const SavedOrder = new Map<string, string[]>()
const SavedShift = new Map<string, number>()

export default function SchoolRoom() {
  const [open, setOpen] = useState<number | null>(null)
  const [from, setFrom] = useState('inset(0 0 0 0)')
  const [canHover, setCanHover] = useState(true)
  const BarRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const Query = window.matchMedia('(hover: hover) and (pointer: fine)')
    setCanHover(Query.matches)
    const onChange = () => setCanHover(Query.matches)
    Query.addEventListener('change', onChange)
    return () => Query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const openYear = (i: number) => {
    const Bar = BarRefs.current[i]
    if (Bar) {
      const R = Bar.getBoundingClientRect()
      setFrom(`inset(${R.top}px ${window.innerWidth - R.right}px ${window.innerHeight - R.bottom}px ${R.left}px)`)
    }
    setOpen(i)
  }

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
            onMouseEnter={canHover ? () => openYear(i) : undefined}
            onClick={() => openYear(i)}
          >
            {y.n}
          </button>
        ))}
      </div>
      {open !== null && <Shelf key={open} year={Years[open]} from={from} onClose={() => setOpen(null)} />}
    </div>
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

function Shelf({ year, from, onClose }: { year: Year; from: string; onClose: () => void }) {
  const Piles = Categories.map((c, index) => ({
    ...c,
    id: `${year.n}${c.key}`,
    color: categoryColor(year, index),
    books: year.courses.filter((name) => categoryOf(name) === c.key),
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
    <section className="flood" style={{ background: year.color, color: year.light ? '#000' : '#fff', ['--from' as string]: from }} aria-label={`${year.n}학년 과목`}>
      <button className="edge" type="button" aria-label="계단으로 돌아가기" onMouseEnter={onClose} onClick={onClose} />
      <span className="year-number" aria-hidden="true">
        {year.n}
      </span>
      <div className="piles">
        {Piles.map((p) => {
          const Size = p.books.length > 8 ? 16 : 18
          return (
            <div className="pile" key={p.id}>
              <ul>
                {order[p.id].map((name, i) => {
                  const Width = `clamp(50%, ${Math.round(nameUnits(name) * Size) + 96}px, 100%)`
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
    </section>
  )
}
