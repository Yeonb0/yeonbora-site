// 전시실 스포트라이트 : 천장 조명에서 좁게 시작해 아래로 퍼지고, 액자 아래로 길게 내려와 둥글게 사라진다
// 목업 10차 (docs/design/philosophy-room/mockup.html) 와 같은 값
import type { Rect } from './types'

// 천장 조명 높이 (사진 기준 %)
const LampY = 3

export interface Spot {
  beam: string
  pool: string
  // 원뿔 꼭짓점 · 웅덩이 중심의 가로 위치 (px) : CSS 변수 --sx 로 넘겨 옮길 때 부드럽게 이어지게 한다
  cx: number
}

// stageW · stageH : 사진 상자의 실제 px 크기 (원뿔 각도를 px 로 계산해야 화면 비율과 무관하게 같은 모양이 된다)
export const spotFor = (f: Rect, stageW: number, stageH: number): Spot => {
  const X = f.x + f.w / 2
  const End = Math.min(96, f.y + f.h * 1.9)
  const cx = (X / 100) * stageW
  const top = (LampY / 100) * stageH
  const mid = ((f.y + f.h / 2) / 100) * stageH
  // 액자 높이에서 폭이 액자 폭의 1.5배, 가장자리는 넓게 흐린다
  const a = (Math.atan2((f.w / 100) * stageW * 0.75, mid - top) * 180) / Math.PI
  const soft = a * 0.45
  return {
    cx,
    beam: `conic-gradient(from ${180 - a}deg at var(--sx) ${top}px, transparent 0deg, #000 ${soft}deg, #000 ${a * 2 - soft}deg, transparent ${a * 2}deg)`,
    pool: `radial-gradient(ellipse ${f.w * 1.6}% ${(End - LampY) / 2 + 2}% at var(--sx) ${(LampY + End) / 2}%, #000 0%, #000 62%, rgba(0,0,0,.45) 82%, transparent 100%)`,
  }
}
