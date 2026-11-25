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
  const [lit, setLit] = useState<number>(-1)
  const [spot, setSpot] = useState<{ beam: string; pool: string } | null>(null)

  const light = (i: number) => {
    const Box = stageRef.current?.getBoundingClientRect()
    if (!Box) return
    setSpot(spotFor(Frames[i].rect, Box.width, Box.height))
    setLit(i)
  }
  const dark = (i: number) => setLit((l) => (l === i ? -1 : l))

  const Vars = { '--beam': spot?.beam ?? 'none', '--pool': spot?.pool ?? 'none', '--sa': lit >= 0 && settled ? 1 : 0 } as CSSProperties

  return (
    <div className={`room room-${wing}${lit >= 0 ? ' spot' : ''}`} style={Vars}>
      <img className="lit" src={image} alt="" draggable={false} />
      <span className="beam" />
      {Frames.map((h, i) => {
        const P = h.id ? ById.get(h.id) ?? null : null
        const href = P ? postTarget(P) : null
        return (
          <button
            key={h.id ?? `empty-${i}`}
            type="button"
            className={`frame ui${lit === i ? ' on' : ''}${P ? '' : ' empty'}`}
            style={{ left: `${h.rect.x}%`, top: `${h.rect.y}%`, width: `${h.rect.w}%`, height: `${h.rect.h}%` }}
            aria-label={P ? P.name : '빈 액자'}
            aria-disabled={!href}
            tabIndex={P ? 0 : -1}
            onPointerEnter={() => light(i)}
            onPointerLeave={() => dark(i)}
            onPointerDown={() => light(i)}
            onFocus={() => light(i)}
            onBlur={() => dark(i)}
            onClick={() => {
              if (!P || !href) return
              try {
                sessionStorage.setItem(LastPortraitKey, P.id)
              } catch {
                // 저장이 막혀 있으면 돌아올 때 역연출만 빠진다
              }
              onPortrait(h.rect, href)
            }}
          >
            <span className="canvas">{P?.portrait && <img src={P.portrait} alt="" draggable={false} />}</span>
            {P && <span className="label">{P.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
