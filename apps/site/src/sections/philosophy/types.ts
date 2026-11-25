// 철학 방에서 함께 쓰는 타입

export type Wing = 'west' | 'east'

export type RoomId =
  | 'ancient'
  | 'medieval'
  | 'modern'
  | 'contemporary'
  | 'confucian'
  | 'daoist'
  | 'buddhist'
  | 'hundred'

// 장면 : 갈림길 → 원형 홀 → 전시실
export type Scene =
  | { kind: 'crossroads' }
  | { kind: 'hall'; wing: Wing }
  | { kind: 'room'; wing: Wing; room: RoomId }

export interface Philosopher {
  id: string
  // 한국어 이름 (alt · 접근성)
  name: string
  // 이름표 : 서양관 영문 대문자, 동양관 한자
  label: string
  wing: Wing
  room: RoomId
  // 액자 크기 : 1 작게 · 2 보통 · 3 크게
  weight: 1 | 2 | 3
  portrait?: string
  // 같은 액자에 함께 거는 철학자 id : 액자 왼쪽 절반이 이 철학자, 오른쪽 절반이 pair (같은 장면의 두 사람)
  pair?: string
  // 0편 : 클릭 불가, 1편 : 그 글로, 여러 편 : 서재 목록으로
  posts: string[]
}

// 사진 기준 % (0 ~ 100)
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// 벽에 건 액자 : id 가 null 이면 빈 액자
export interface Hung {
  id: string | null
  // 한 액자를 나눠 쓰는 오른쪽 철학자 id
  partner?: string
  weight: 1 | 2 | 3
  rect: Rect
}

// 홀의 문 순서 (왼 → 오)
export const RoomsOf: Record<Wing, RoomId[]> = {
  west: ['ancient', 'medieval', 'modern', 'contemporary'],
  east: ['confucian', 'daoist', 'buddhist', 'hundred'],
}
