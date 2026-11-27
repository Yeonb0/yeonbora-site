// 기술 블로그 바탕화면의 계산 : 폴더 · 책 · 글 목록 · 주소 해시 (화면과 분리한 순수 함수)
import { Tiers } from '../../lib/content/schemas'
import { DefaultFolder, EtcFolder, Folders, RecentFolder, type Folder } from './data'

export type Tier = (typeof Tiers)[number]

export interface DeskPost {
  id: string
  title: string
  // YYYY-MM-DD
  date: string
  topic?: string
  series?: string
  step?: number
  tier?: Tier
  tags: string[]
  summary: string
  // 카드 썸네일 주소 : 본문 첫 그림, 없으면 폴더 글리프
  thumb?: string
}

export interface BookIcon {
  // 고를 때 넘기는 값 : 전체는 null
  key: string | null
  title: string
  kind: 'all' | 'book' | 'loose' | 'tier'
  tier?: Tier
}

export type Row =
  | { kind: 'head'; title: string; n: number; book: boolean }
  | {
      kind: 'post'
      id: string
      title: string
      summary: string
      tags: string[]
      date: string
      // 시리즈 안 순서, 시리즈 밖 글은 목록 안 순서, BOJ 는 티어 첫 글자
      num: number | string
      loose: boolean
      folder: string
      where?: string
      tier?: Tier
      thumb?: string
    }

export interface FolderView {
  books: BookIcon[]
  rows: Row[]
  count: number
  book: string | null
}

export const Loose = '__loose'
const LooseTitle = '시리즈 밖의 글'

const ByTopic = new Map(Folders.flatMap((f) => f.topics.map((t) => [t, f.id] as const)))

export const folderOf = (topic?: string): string => (topic && ByTopic.get(topic.toLowerCase())) || EtcFolder.id

export const visibleFolders = (posts: DeskPost[]): Folder[] =>
  posts.some((p) => folderOf(p.topic) === EtcFolder.id) ? [...Folders, EtcFolder] : Folders

export const folderName = (id: string): string =>
  id === RecentFolder.id ? RecentFolder.name : ([...Folders, EtcFolder].find((f) => f.id === id)?.name ?? id)

const byStep = (a: DeskPost, b: DeskPost) => (a.step ?? Infinity) - (b.step ?? Infinity) || a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
const newest = (a: DeskPost, b: DeskPost) => b.date.localeCompare(a.date) || (b.step ?? 0) - (a.step ?? 0) || b.id.localeCompare(a.id, undefined, { numeric: true })

export const rankInSeries = (posts: DeskPost[], p: DeskPost): number | null => {
  if (!p.series) return null
  return posts.filter((q) => q.series === p.series).sort(byStep).indexOf(p) + 1
}

const postRow = (all: DeskPost[], p: DeskPost, i: number, where?: string): Row => {
  const Rank = rankInSeries(all, p)
  return {
    kind: 'post',
    id: p.id,
    title: cleanTitle(p.title),
    summary: p.summary,
    tags: p.tags.slice(0, 3),
    date: p.date,
    num: Rank ?? i + 1,
    loose: Rank === null,
    folder: folderOf(p.topic),
    where,
    thumb: p.thumb,
  }
}

const bojView = (posts: DeskPost[], book: string | null): FolderView => {
  const Tier = Tiers.find((t) => t === book) ?? null
  const List = posts.filter((p) => !Tier || p.tier === Tier).sort(newest)
  return {
    books: [{ key: null, title: '전체', kind: 'all' }, ...Tiers.map((t) => ({ key: t, title: t, kind: 'tier' as const, tier: t }))],
    rows: List.map((p) => ({ ...(postRow(posts, p, 0) as Extract<Row, { kind: 'post' }>), num: p.tier?.[0] ?? '·', loose: false, tier: p.tier, where: Tier ? undefined : p.tier })),
    count: List.length,
    book: Tier,
  }
}

export const folderView = (all: DeskPost[], folder: string, book: string | null): FolderView => {
  const Ps = all.filter((p) => folderOf(p.topic) === folder)
  if (folder === 'boj') return bojView(Ps, book)
  const Names = [...new Set(Ps.flatMap((p) => (p.series ? [p.series] : [])))].sort((a, b) => a.localeCompare(b))
  const LooseP = Ps.filter((p) => !p.series).sort(byStep)
  let Book = book === Loose && LooseP.length ? Loose : book && Names.includes(book) ? book : null
  if (Book === null && Names.length === 1) Book = Names[0]

  const Books: BookIcon[] = []
  if (Names.length && (Names.length > 1 || LooseP.length)) Books.push({ key: null, title: '전체', kind: 'all' })
  for (const n of Names) Books.push({ key: n, title: n, kind: 'book' })
  if (Names.length && LooseP.length) Books.push({ key: Loose, title: LooseTitle, kind: 'loose' })

  const Rows: Row[] = []
  if (Book === Loose) LooseP.forEach((p, i) => Rows.push(postRow(all, p, i)))
  else if (Book) Ps.filter((p) => p.series === Book).sort(byStep).forEach((p, i) => Rows.push(postRow(all, p, i)))
  else {
    for (const n of Names) {
      const Sp = Ps.filter((p) => p.series === n).sort(byStep)
      Rows.push({ kind: 'head', title: n, n: Sp.length, book: true })
      Sp.forEach((p, i) => Rows.push(postRow(all, p, i)))
    }
    if (LooseP.length && Names.length) Rows.push({ kind: 'head', title: LooseTitle, n: LooseP.length, book: false })
    LooseP.forEach((p, i) => Rows.push(postRow(all, p, i)))
  }
  const Count = Book === Loose ? LooseP.length : Book ? Ps.filter((p) => p.series === Book).length : Ps.length
  return { books: Books, rows: Rows, count: Count, book: Book }
}

// 목록에서는 제목 앞 [카테고리] 머리말을 뗀다 : 폴더 · 경로가 이미 알려 준다
export const cleanTitle = (title: string): string => title.replace(/^\[[^\]]*\]\s*(?=\S)/, '')

export const bookTitle = (book: string | null): string | null => (book === Loose ? LooseTitle : book)

export const recent = (all: DeskPost[], n = 8): Row[] =>
  [...all]
    .sort(newest)
    .slice(0, n)
    .map((p, i) => {
      const Rank = rankInSeries(all, p)
      const Where = [folderName(folderOf(p.topic)), ...(p.series ? [p.series, String(Rank)] : [])].join(' / ')
      return postRow(all, p, i, Where)
    })

const Known = new Set([RecentFolder.id, EtcFolder.id, ...Folders.map((f) => f.id)])

export const parseHash = (hash: string): { folder: string; book: string | null } => {
  const [F, B] = hash.replace(/^#/, '').split('/').map((s) => decodeURIComponent(s))
  if (!F || !Known.has(F)) return { folder: DefaultFolder, book: null }
  return { folder: F, book: B || null }
}

export const toHash = (folder: string, book: string | null): string =>
  '#' + encodeURIComponent(folder) + (book ? '/' + encodeURIComponent(book) : '')

// 목록 카드의 요약 : 본문 앞부분에서 주석 · 이미지 · 코드 · 태그 · 제목을 빼고 max 자까지
export const summarize = (body: string, max = 140): string => {
  const Text = body
    .replace(/%%[\s\S]*?%%/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .split('\n')
    .filter((l) => !/^\s*(#|\||---|\{)/.test(l))
    .map((l) => l.replace(/^\s*(?:[-*+]|\d+\.|>)\s*/, ''))
    .join(' ')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`$\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return Text.length > max ? Text.slice(0, max - 1).trimEnd() + '…' : Text
}
