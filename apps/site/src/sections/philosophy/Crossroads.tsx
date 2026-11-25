// 갈림길 : 왼쪽 아치는 서양관, 오른쪽 아치는 동양관
// 아치에 호버하면 안쪽 복도가 밝아지고 아치 둘레와 바닥으로 빛이 번진다
import { CrossroadsArches } from './places'
import type { Rect, Scene, Wing } from './types'

const pos = (r: Rect) => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` })

export function Crossroads({ onGo }: { onGo: (to: Scene, origin: Rect) => boolean }) {
  const Wings: [Wing, string][] = [
    ['west', '서양관'],
    ['east', '동양관'],
  ]
  return (
    <>
      {Wings.map(([wing, label]) => (
        <button key={wing} type="button" className="arch" style={pos(CrossroadsArches[wing])} aria-label={label} onClick={() => onGo({ kind: 'hall', wing }, CrossroadsArches[wing])}>
          <span className="spill" />
          <span className="inner" />
        </button>
      ))}
    </>
  )
}
