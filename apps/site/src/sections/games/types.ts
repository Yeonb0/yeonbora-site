// 게임 방에서 함께 쓰는 타입

export type GameId = 'exorcism-school' | 'factory' | 'fake-mmo' | 'cheer-typing'

export interface Game {
  id: GameId
  // CD 아래 도트 글씨 · 게임 페이지 제목
  en: string
  // CD 대표 색 : TV 빛과 게임 페이지 바탕에 섞인다
  color: string
}

export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow'

// 시간대 기준점 하나 : 하늘 (위 / 아래), 방 필터 (밝기 · 채도 · 세피아 · 색상 회전), 방 덧칠 색과 세기, 밤 정도
export interface SkyKey {
  h: number
  top: string
  bot: string
  br: number
  sa: number
  se: number
  hr: number
  tint: string
  ta: number
  night: number
}
