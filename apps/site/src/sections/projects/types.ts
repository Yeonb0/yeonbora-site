// 프로젝트 방에서 함께 쓰는 타입

export type ProjectId = 'ppugi-saju' | 'skinteller' | 'pintos' | 'carorie-war' | 'layered-wiki'

export interface Project {
  id: ProjectId
  // CD 아래 도트 글씨
  en: string
  // CD 대표 색 : TV 빛에 섞인다
  color: string
  // 가운데 CD 를 누르면 새 탭으로 여는 곳 (깃허브 저장소 또는 서비스 주소)
  href: string
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
