// 장면 사진 위의 자리 : 모두 사진 (1536 × 864) 기준 % 로 잰 값
import { RoomsOf } from './types'
import type { Rect, RoomId, Scene, Wing } from './types'

// 갈림길의 아치 : 왼쪽이 서양관, 오른쪽이 동양관
export const CrossroadsArches: Record<Wing, Rect> = {
  west: { x: 10, y: 14, w: 22, h: 60 },
  east: { x: 68, y: 14, w: 24, h: 60 },
}

// 홀의 문짝 영역 (RoomsOf 순서) : 서양관은 위쪽이 반원 아치, 동양관은 창살 부분
export const HallDoors: Record<Wing, Rect[]> = {
  west: [
    { x: 6.4, y: 17.6, w: 15.6, h: 58.4 },
    { x: 31.4, y: 21.6, w: 14.3, h: 54 },
    { x: 54.3, y: 21.6, w: 14.3, h: 54 },
    { x: 78, y: 17.6, w: 15.6, h: 58.4 },
  ],
  east: [
    { x: 10, y: 32.5, w: 12.3, h: 39.5 },
    { x: 33.5, y: 35, w: 11.5, h: 36.5 },
    { x: 55.4, y: 35, w: 11.1, h: 36.5 },
    { x: 77.8, y: 32.5, w: 12.2, h: 39.5 },
  ],
}

// 문틈 너머 벽에 떠오르는 이름
export const DoorTitles: Record<Wing, string[]> = {
  west: ['ANCIENT', 'MEDIEVAL', 'MODERN', 'CONTEMPORARY'],
  east: ['儒', '道', '佛', '百'],
}

// 액자를 걸 벽 영역 (빛 웅덩이 띠, 벤치 위)
export const RoomWalls: Record<RoomId, Rect> = {
  ancient: { x: 12, y: 12, w: 76, h: 46 },
  medieval: { x: 12, y: 10, w: 74, h: 54 },
  modern: { x: 8, y: 10, w: 84, h: 42 },
  contemporary: { x: 11, y: 13, w: 77, h: 49 },
  confucian: { x: 16, y: 11, w: 68, h: 47 },
  daoist: { x: 13, y: 13, w: 78, h: 49 },
  buddhist: { x: 12, y: 10, w: 76, h: 52 },
  hundred: { x: 12, y: 10, w: 76, h: 44 },
}

// 장면 사진 이름 (assets/ 의 파일과 짝)
export const imageKey = (s: Scene): 'crossroads' | Wing | RoomId => {
  if (s.kind === 'crossroads') return 'crossroads'
  if (s.kind === 'hall') return s.wing
  return s.room
}

// 뒤로가기 바닥 빛 색 (r g b) : 각 장면 사진의 조명 색을 따른다
const Glow: Record<ReturnType<typeof imageKey>, string> = {
  crossroads: '255 226 186',
  west: '255 222 176',
  east: '255 196 128',
  ancient: '255 214 160',
  medieval: '214 220 232',
  modern: '226 232 206',
  contemporary: '232 238 246',
  confucian: '255 204 150',
  daoist: '238 236 226',
  buddhist: '255 184 112',
  hundred: '255 212 158',
}

export const GlowOf = (s: Scene): string => Glow[imageKey(s)]

// 이 장면으로 들어온 입구 (부모 장면 사진 위의 자리) : 돌아갈 때 이 자리로 줄어든다
export const originOf = (s: Scene): Rect | null => {
  if (s.kind === 'hall') return CrossroadsArches[s.wing]
  if (s.kind === 'room') return HallDoors[s.wing][RoomsOf[s.wing].indexOf(s.room)]
  return null
}
