// 원형 홀 : 문 4개 (RoomsOf 순서)
// 문에 호버하면 사진 속 문짝이 실제로 열리고 (서양관은 안쪽으로 회전, 동양관은 옆으로 밀림), 문틈 너머 어두운 벽에 방 이름이 떠오른다
// 누르면 열린 문틈으로 확대되며 전시실로 들어간다
import { useEffect, useRef, useState } from 'react'
import { DoorTitles, HallDoors } from './places'
import { RoomsOf } from './types'
import type { Rect, Scene, Wing } from './types'

// 문이 다 열리는 시간 (ms) : hall.css 의 transition 과 같다
const OpenMs = 600

interface HallProps {
  wing: Wing
  image: string
  // 전시실에서 돌아왔으면 그 문이 열린 채로 시작해 닫힌다
  openFrom: Rect | null
  // 받아들였으면 true
  onGo: (to: Scene, origin: Rect) => boolean
}

export function Hall({ wing, image, openFrom, onGo }: HallProps) {
  const Doors = HallDoors[wing]
  const startOpen = openFrom ? Doors.findIndex((d) => d.x === openFrom.x && d.y === openFrom.y) : -1
  const [open, setOpen] = useState<number>(startOpen)
  const Leaving = useRef(false)
  const Timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const T = startOpen >= 0 ? setTimeout(() => setOpen((o) => (o === startOpen ? -1 : o)), 900) : null
    return () => {
      if (T) clearTimeout(T)
      if (Timer.current) clearTimeout(Timer.current)
    }
  }, [])

  const enter = (i: number) => {
    if (Leaving.current) return
    Leaving.current = true
    const wasOpen = open === i
    setOpen(i)
    Timer.current = setTimeout(
      () => {
        Timer.current = null
        // 거절되면 (그사이 뒤로가기 등) 문을 닫고 다시 누를 수 있게 한다
        if (!onGo({ kind: 'room', wing, room: RoomsOf[wing][i] }, Doors[i])) {
          Leaving.current = false
          setOpen(-1)
        }
      },
      wasOpen ? 120 : OpenMs,
    )
  }

  return (
    <>
      {Doors.map((d, i) => {
        const half = d.w / 2
        // 사진에서 문짝 반쪽을 잘라 쓴다 : background-size 는 상자 대비 사진 크기, position 은 잘라 낼 자리
        const leaf = (offX: number) => ({
          backgroundImage: `url(${image})`,
          backgroundSize: `${(100 / half) * 100}% ${(100 / d.h) * 100}%`,
          backgroundPosition: `${((d.x + offX) / (100 - half)) * 100}% ${(d.y / (100 - d.h)) * 100}%`,
        })
        return (
          <div key={RoomsOf[wing][i]} className="door-wrap">
            <span className={`floorglow${open === i ? ' on' : ''}`} style={{ left: `${d.x - d.w * 0.3}%`, top: `${d.y + d.h}%`, width: `${d.w * 1.6}%` }} />
            <button
              type="button"
              className={`door door-${wing}${open === i ? ' open' : ''}`}
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%` }}
              aria-label={DoorTitles[wing][i]}
              onPointerEnter={(e) => e.pointerType === 'mouse' && !Leaving.current && setOpen(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && !Leaving.current && setOpen((o) => (o === i ? -1 : o))}
              onFocus={() => !Leaving.current && setOpen(i)}
              onBlur={() => !Leaving.current && setOpen((o) => (o === i ? -1 : o))}
              onClick={() => enter(i)}
            >
              <span className="behind" />
              <span className="glow" />
              <span className="title">{DoorTitles[wing][i]}</span>
              <span className="leaf l" style={leaf(0)} />
              <span className="leaf r" style={leaf(half)} />
            </button>
            <span className="floortitle ui" style={{ left: `${d.x}%`, top: `${d.y + d.h + 3}%`, width: `${d.w}%` }}>
              {DoorTitles[wing][i]}
            </span>
          </div>
        )
      })}
    </>
  )
}
