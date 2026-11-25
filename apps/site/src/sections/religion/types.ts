// 종교학 방에서 함께 쓰는 타입

export type ReligionId =
  | 'confucianism'
  | 'buddhism'
  | 'taoism'
  | 'won-buddhism'
  | 'christianity'
  | 'hinduism'
  | 'islam'
  | 'judaism'

// 평면 도형 한 층 : polys 는 [외곽, 구멍 ...] 의 목록, 각 고리는 [x0, y0, x1, y1, ...]
export interface BadgeLayer {
  kind: 'plate' | 'enamel' | 'lines'
  // 금속이면 gold · brushed, 색 면이면 '#rrggbb'
  mat: string
  polys: number[][][]
}

export interface BadgeShape {
  id: string
  name: string
  layers: BadgeLayer[]
}

export interface Religion {
  id: ReligionId
  name: string
  // 이 종교로 정리한 글의 slug : 문서 화면에 이 순서로 나온다
  posts: { slug: string; title: string }[]
}

// 화면 상태 : 상자 → 뱃지를 들고 만지는 중 → 그 종교의 문서 화면
export type View = 'box' | 'held' | 'docs'
