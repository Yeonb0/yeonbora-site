// 인문 블로그 도서관 데이터 : 책장 칸 · 책 · 왼쪽 목록
// 좌표는 모두 책장 그림 원본 (1536 x 1024) 기준. 그림 · 책 자리는 tools/shelves.py 가 만든다

export type Rect = [number, number, number, number]

// 책장 칸 : 그림이 있는 칸 (분류) 과 무늬 없는 빈 칸
export const ShelfIds = [
  'confucian',
  'buddhist',
  'taoist',
  'baijia',
  'won',
  'ancient',
  'medieval',
  'modern',
  'contemporary',
  'christian',
  'islam',
  'judaism',
  'hindu',
  'zh',
  'ja',
  'de',
  'fr',
] as const
export type ShelfId = (typeof ShelfIds)[number]
export type PlainId = 'plain1' | 'plain2' | 'plain3'
export type RowId = ShelfId | PlainId

// 도서관의 책장 네 개 (동양 · 서양 철학 · 서양 종교 · 언어), 책장마다 위에서부터 5칸
// 빈 칸은 무늬 없는 책으로 채워 두고, 분류가 늘면 그 자리에 새 칸을 끼운다
export const Cases: RowId[][] = [
  ['confucian', 'buddhist', 'taoist', 'baijia', 'won'],
  ['ancient', 'medieval', 'modern', 'contemporary', 'plain1'],
  ['christian', 'islam', 'judaism', 'hindu', 'plain2'],
  ['zh', 'ja', 'de', 'fr', 'plain3'],
]

// 도서관 배치 (책장 그림 단위)
export const Layout = {
  // 한 칸 = 그림의 y 280 (윗선반 판) ~ 603 (책 바닥)
  rowTop: 280,
  rowH: 603 - 280,
  // 책장 맨 위 · 맨 아래 판 : 그림의 y 603 ~ 672
  capTop: 603,
  capH: 69,
  caseW: 1536,
  caseGap: 220,
  tierGap: 140,
  // 칸으로 다가갔을 때 보이는 부분 (x 는 고른 책에 따라 옮긴다)
  view: [300, 300, 936, 330] as Rect,
}

export interface Book {
  id: string
  title: string
  // 원제 (원어)
  orig: string
  by: string
  year: string
  shelf: ShelfId
  // 책장 그림 안의 책 자리
  slot: Rect
  // 왼쪽 목록의 학자 항목 key : 그 학자를 고르면 이 책이 가운데 온다
  thinker?: string
  // 펼친 면 그림 : 동양 책은 한지, 서양 책은 양장
  spread: 'east' | 'west'
}

const at = (x: number): Rect => [x, 354, 47, 249]

// 책장 그림에 제목이 찍힌 책. 글은 posts frontmatter 의 book 필드로 이 id 에 연결한다
export const Books: Book[] = [
  { id: 'yulei', title: '주자어류', orig: '朱子語類', by: '주희 강론 · 여정덕 엮음', year: '1270', shelf: 'confucian', slot: at(844.5), thinker: 'zhuxi', spread: 'east' },
  { id: 'jingang', title: '금강경', orig: '金剛般若波羅蜜經', by: '구마라집 옮김', year: '402', shelf: 'buddhist', slot: at(1044.5), spread: 'east' },
  { id: 'daodejing', title: '도덕경', orig: '道德經', by: '노자', year: '', shelf: 'taoist', slot: at(594.5), spread: 'east' },
  { id: 'jeongjeon', title: '정전', orig: '正典', by: '소태산', year: '', shelf: 'won', slot: at(944.5), spread: 'east' },
  { id: 'republic', title: '국가', orig: 'Πολιτεία', by: '플라톤', year: '기원전 375년경', shelf: 'ancient', slot: at(544.5), thinker: 'plato', spread: 'west' },
  { id: 'confessions', title: '고백록', orig: 'Confessiones', by: '아우구스티누스', year: '400년경', shelf: 'medieval', slot: at(994.5), thinker: 'augustine', spread: 'west' },
  { id: 'cpr', title: '순수이성비판', orig: 'Critik der reinen Vernunft', by: '임마누엘 칸트', year: '1781', shelf: 'modern', slot: at(694.5), thinker: 'kant', spread: 'west' },
  { id: 'cprac', title: '실천이성비판', orig: 'Critik der practischen Vernunft', by: '임마누엘 칸트', year: '1788', shelf: 'modern', slot: at(744.5), thinker: 'kant', spread: 'west' },
  { id: 'cj', title: '판단력비판', orig: 'Critik der Urtheilskraft', by: '임마누엘 칸트', year: '1790', shelf: 'modern', slot: at(794.5), thinker: 'kant', spread: 'west' },
  { id: 'seinzeit', title: '존재와 시간', orig: 'Sein und Zeit', by: '마르틴 하이데거', year: '1927', shelf: 'contemporary', slot: at(394.5), thinker: 'heidegger', spread: 'west' },
  { id: 'bible', title: '성서', orig: 'Biblia', by: '', year: '', shelf: 'christian', slot: at(694.5), spread: 'west' },
  { id: 'quran', title: '꾸란', orig: 'القرآن', by: '', year: '', shelf: 'islam', slot: at(894.5), spread: 'west' },
  { id: 'talmud', title: '탈무드', orig: 'תלמוד', by: '', year: '', shelf: 'judaism', slot: at(494.5), spread: 'west' },
  { id: 'gita', title: '바가바드 기타', orig: 'भगवद्गीता', by: '', year: '', shelf: 'hindu', slot: at(794.5), spread: 'west' },
]

// 책 모양 : 책등 · 표지 그림의 가로 / 세로
export const SpineAspect = 0.1888
export const CoverAspect = 0.6787
// 펼친 면 그림에서 종이만 있는 부분 : 넘기는 한 장은 가죽 · 책 배 없이 종이만 움직인다
export const PaperArea = { west: { frac: 0.86, inset: 0.025 }, east: { frac: 0.93, inset: 0.025 } }

// 왼쪽 목록 : 탭 → 구역 (동양 · 서양) → 갈래 (책장 칸) → 학자
// 같은 칸을 여러 탭이 가리킬 수 있다 (유가 · 유교는 같은 칸)
export interface Item {
  key: string
  label: string
  shelf: ShelfId
  // 학자 항목이면 그 학자 key (Book.thinker 와 같다)
  thinker?: string
  subs?: Item[]
}
export interface Group {
  head: string
  items: Item[]
}
export interface Tab {
  name: string
  groups: Group[]
}

const who = (key: string, label: string, shelf: ShelfId): Item => ({ key, label, shelf, thinker: key })

export const Tabs: Tab[] = [
  {
    name: '철학',
    groups: [
      {
        head: '동양',
        items: [
          { key: 'ru', label: '유가', shelf: 'confucian', subs: [who('zhuxi', '주희', 'confucian')] },
          { key: 'fo', label: '불가', shelf: 'buddhist', subs: [who('wonhyo', '원효', 'buddhist')] },
          { key: 'dao', label: '도가', shelf: 'taoist' },
          { key: 'baijia', label: '제자백가', shelf: 'baijia' },
        ],
      },
      {
        head: '서양',
        items: [
          { key: 'ancient', label: '고대', shelf: 'ancient', subs: [who('plato', '플라톤', 'ancient')] },
          { key: 'medieval', label: '중세', shelf: 'medieval', subs: [who('augustine', '아우구스티누스', 'medieval')] },
          { key: 'modern', label: '근대', shelf: 'modern', subs: [who('kant', '칸트', 'modern')] },
          { key: 'contemporary', label: '현대', shelf: 'contemporary', subs: [who('heidegger', '하이데거', 'contemporary')] },
        ],
      },
    ],
  },
  {
    name: '종교',
    groups: [
      {
        head: '동양',
        items: [
          { key: 'confucianism', label: '유교', shelf: 'confucian' },
          { key: 'buddhism', label: '불교', shelf: 'buddhist' },
          { key: 'taoism', label: '도교', shelf: 'taoist' },
          { key: 'won-buddhism', label: '원불교', shelf: 'won' },
        ],
      },
      {
        head: '서양',
        items: [
          { key: 'christianity', label: '기독교', shelf: 'christian' },
          { key: 'islam', label: '이슬람', shelf: 'islam' },
          { key: 'judaism', label: '유대교', shelf: 'judaism' },
          { key: 'hinduism', label: '힌두교', shelf: 'hindu' },
        ],
      },
    ],
  },
  {
    name: '언어',
    groups: [
      {
        head: '',
        items: [
          { key: 'chinese', label: '중국어', shelf: 'zh' },
          { key: 'japanese', label: '일본어', shelf: 'ja' },
          { key: 'german', label: '독일어', shelf: 'de' },
          { key: 'french', label: '프랑스어', shelf: 'fr' },
        ],
      },
    ],
  },
]

// 항목이 가리키는 책 : 학자면 그 학자의 책, 갈래면 그 칸의 모든 책
export const booksOf = (item: Item): Book[] =>
  Books.filter((b) => b.shelf === item.shelf && (!item.thinker || b.thinker === item.thinker))

// 칸 안에서 보는 자리 (x) : 학자는 그 책들이 가운데, 갈래 · 책 없는 학자는 칸 가운데
export const viewX = (item: Item): number => {
  const [, , W] = Layout.view
  const Mine = item.thinker ? booksOf(item) : []
  const Xs = Mine.map((b) => b.slot[0] + b.slot[2] / 2)
  const Cx = Xs.length ? (Math.min(...Xs) + Math.max(...Xs)) / 2 : 1536 / 2
  return Math.min(1536 - W, Math.max(0, Cx - W / 2))
}

export const allItems = (): Item[] => Tabs.flatMap((t) => t.groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.subs ?? [])])))
