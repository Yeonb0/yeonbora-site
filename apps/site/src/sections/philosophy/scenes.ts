// 장면 사진 위의 자리 : 모두 사진 (1536 × 864) 기준 % 로 잰 값
import type { ImageMetadata } from 'astro'
import Crossroads from './assets/01-crossroads.png'
import WestHall from './assets/02-west-hall.png'
import EastHall from './assets/03-east-hall.png'
import Ancient from './assets/10-west-ancient.png'
import Medieval from './assets/11-west-medieval.png'
import Modern from './assets/12-west-modern.png'
import Contemporary from './assets/13-west-contemporary.png'
import Confucian from './assets/20-east-confucian.png'
import Daoist from './assets/21-east-daoist.png'
import Buddhist from './assets/22-east-buddhist.png'
import Hundred from './assets/23-east-hundred.png'
import type { Rect, RoomId, Scene, Wing } from './types'

// 갈림길의 아치 : 왼쪽이 동양관, 오른쪽이 서양관
export const CrossroadsArches: Record<Wing, Rect> = {
  east: { x: 10, y: 14, w: 22, h: 60 },
  west: { x: 68, y: 14, w: 24, h: 60 },
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

// 문 위 명판 자리 : 서양관은 가로형, 동양관은 한자 한 글자가 들어가는 작은 판
export const HallPlaques: Record<Wing, Rect[]> = {
  west: HallDoors.west.map((d) => ({ x: d.x + d.w / 2 - 5.5, y: d.y - 6.4, w: 11, h: 3.8 })),
  east: HallDoors.east.map((d) => ({ x: d.x + d.w / 2 - 2, y: d.y - 7.6, w: 4, h: 5.6 })),
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

const RoomImages: Record<RoomId, ImageMetadata> = {
  ancient: Ancient,
  medieval: Medieval,
  modern: Modern,
  contemporary: Contemporary,
  confucian: Confucian,
  daoist: Daoist,
  buddhist: Buddhist,
  hundred: Hundred,
}

export const roomImage = (room: RoomId): ImageMetadata => RoomImages[room]

export const SceneImage = (s: Scene): ImageMetadata => {
  if (s.kind === 'crossroads') return Crossroads
  if (s.kind === 'hall') return s.wing === 'west' ? WestHall : EastHall
  return RoomImages[s.room]
}
