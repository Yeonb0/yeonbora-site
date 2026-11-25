// 전시실 : 불이 꺼진 방, 벽 전체에 흩어 건 나무 액자
// 액자에 호버하면 천장 조명에서 그 액자로 스포트라이트가 켜지고 액자 아래 벽에 이름이 보인다
// 누르면 그 액자로 확대된 뒤 글로 간다 (글이 없으면 누를 수 없다)
import { useMemo, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { hangFrames } from './hang'
import { spotFor } from './light'
import { postTarget } from './links'
import { RoomWalls } from './places'
import type { Hung, Philosopher, Rect, RoomId, Wing } from './types'

// 글로 떠날 때 어느 초상화였는지 남겨 두는 키 (돌아오면 그 액자에서 줄어드는 역연출)
export const LastPortraitKey = 'philosophy:lastPortrait'

export const framesOf = (room: RoomId, philosophers: Philosopher[]): Hung[] =>
  hangFrames(
    philosophers.filter((p) => p.room === room),
    RoomWalls[room],
  )

interface RoomProps {
  wing: Wing
  room: RoomId
  image: string
  philosophers: Philosopher[]
  stageRef: RefObject<HTMLDivElement | null>
  settled: boolean
  onPortrait: (rect: Rect, href: string) => void
}

export function Room({ wing, room, image, philosophers, stageRef, settled, onPortrait }: RoomProps) {
  const Frames = useMemo(() => framesOf(room, philosophers), [room, philosophers])
  const ById = useMemo(() => new Map(philosophers.map((p) => [p.id, p])), [philosophers])
  // lit : 마지막으로 불이 들어온 액자. 꺼질 때도 남겨 두어 액자 밝기가 빛과 같은 속도로 어두워지게 한다
  const [lit, setLit] = useState<number>(-1)
  const [on, setOn] = useState(false)
  const [spot, setSpot] = useState<{ beam: string; pool: string; w: number } | null>(null)
  // 같은 액자 안에서 빛이 옆 사람으로 옮겨 갈 때만 미끄러진다 (다른 액자로 갈 때 먼 거리를 훑지 않게)
  const [slide, setSlide] = useState(false)

  // 한 액자를 나눠 쓰는 두 사람 : 0 이면 왼쪽 (액자의 주인), 1 이면 오른쪽 (partner)
  const [side, setSide] = useState<0 | 1>(0)
  const sideAt = (e: { clientX: number; currentTarget: HTMLElement }): 0 | 1 => {
    const R = e.currentTarget.getBoundingClientRect()
    return e.clientX - R.left > R.width / 2 ? 1 : 0
  }
  const moveSide = (s: 0 | 1) => {
    if (s === side) return
    setSide(s)
    setSlide(true)
  }

  const light = (i: number) => {
    const Box = stageRef.current?.getBoundingClientRect()
    if (!Box) return
    const R = Frames[i].rect
    // 짝이 있는 액자는 한 사람 몫 (절반 폭) 만 비춘다
    setSpot({ ...spotFor(Frames[i].partner ? { ...R, w: R.w / 2 } : R, Box.width, Box.height), w: Box.width })
    setSlide(false)
    setLit(i)
    setOn(true)
  }
  const dark = (i: number) => {
    if (lit === i) setOn(false)
  }

  // 빛이 향하는 가로 위치 (px) : 짝이 있는 액자는 마우스가 있는 쪽 사람 (왼쪽 35% · 오른쪽 65%)
  const LitFrame = lit >= 0 ? Frames[lit] : null
  const SpotX = LitFrame && spot ? ((LitFrame.rect.x + LitFrame.rect.w * (LitFrame.partner ? (side === 1 ? 0.65 : 0.35) : 0.5)) / 100) * spot.w : 0
  const Vars = {
    '--sx': `${SpotX}px`, '--beam': spot?.beam ?? 'none', '--pool': spot?.pool ?? 'none', '--sa': on && settled ? 1 : 0 } as CSSProperties

  return (
    <div className={`room room-${wing}${on ? ' spot' : ''}${slide ? ' slide' : ''}`} data-lit={on && settled} style={Vars}>
      <img className="lit" src={image} alt="" draggable={false} />
      <span className="beam" />
      {Frames.map((h, i) => {
        const Owner = h.id ? ById.get(h.id) ?? null : null
        const Partner = h.partner ? ById.get(h.partner) ?? null : null
        // 짝이 있는 액자는 마우스가 있는 쪽 사람이 이 액자의 주인공
        const Cur = Partner && lit === i && side === 1 ? Partner : Owner
        const href = Cur ? postTarget(Cur) : null
        const Name = Partner ? `${Owner?.name} · ${Partner.name}` : Owner ? Owner.name : '빈 액자'
        return (
          <button
            key={h.id ?? `empty-${i}`}
            type="button"
            className={`frame ui${lit === i ? ' on' : ''}${Owner ? '' : ' empty'}${Partner ? ' pair' : ''}`}
            data-side={lit === i ? side : 0}
            style={{ left: `${h.rect.x}%`, top: `${h.rect.y}%`, width: `${h.rect.w}%`, height: `${h.rect.h}%`, '--px': lit === i && side === 1 ? '65%' : '35%' } as CSSProperties}
            aria-label={Name}
            aria-disabled={!href}
            tabIndex={Owner ? 0 : -1}
            onPointerEnter={(e) => {
              if (Partner) setSide(sideAt(e))
              light(i)
            }}
            onPointerMove={(e) => {
              if (Partner) moveSide(sideAt(e))
            }}
            onPointerLeave={() => dark(i)}
            onPointerDown={(e) => {
              if (Partner) setSide(sideAt(e))
              light(i)
            }}
            onFocus={() => light(i)}
            onBlur={() => dark(i)}
            onKeyDown={(e) => {
              if (!Partner) return
              if (e.key === 'ArrowLeft') moveSide(0)
              if (e.key === 'ArrowRight') moveSide(1)
            }}
            onClick={() => {
              if (!Cur || !href) return
              try {
                sessionStorage.setItem(LastPortraitKey, Cur.id)
              } catch {
                // 저장이 막혀 있으면 돌아올 때 역연출만 빠진다
              }
              onPortrait(h.rect, href)
            }}
          >
            <span className="canvas">
              {Owner?.portrait && <img src={Owner.portrait} alt="" draggable={false} />}
              {Partner && <span className="dim" />}
            </span>
            {Owner && <span className="label">{Cur?.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
