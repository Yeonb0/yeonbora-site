// wiki · posts 노트 사이의 링크 그래프 : 빌드 (remark) 와 페이지 (역링크) 가 함께 쓴다
import { slug } from 'github-slugger'
import { exactKey, headingSlug, linkKey, parseWikilinks, type Wikilink } from './wikilink'

export type Collection = 'wiki' | 'posts'

export interface Node {
  collection: Collection
  slug: string
  title: string
  aliases: string[]
  body: string
  // wiki 의 Main 상대 경로 : [[폴더/노트]] 형태 링크를 찾는 데 쓴다
  sourcePath?: string
}

// 링크를 건 노트 : 가까운 폴더의 노트를 고르는 데 쓴다
export interface From {
  sourcePath?: string
}

export interface Resolved {
  node?: Node
  // 지정 가능한 후보가 여럿이라 가까운 폴더 · 정렬 순서로 고른 경우의 후보 전체 (아니면 빈 배열)
  ambiguous: Node[]
}

export interface Graph {
  resolve(target: string, from?: From): Node | undefined
  resolveInfo(target: string, from?: From): Resolved
  href(link: Wikilink, from?: From): string | undefined
  backlinks(slug: string): Node[]
  related(slug: string): Node[]
  duplicates: string[]
}

const key = linkKey

// 같은 이름 후보를 하나로 : (a) 대소문자까지 맞는 노트 → (b) 링크를 건 노트와 폴더가 가장 많이 겹치는 노트 → (c) sourcePath 순
const dirsOf = (p?: string): string[] => (p ? p.split('/').slice(0, -1) : [])
const shared = (a: string[], b: string[]): number => {
  let N = 0
  while (N < a.length && N < b.length && a[N] === b[N]) N++
  return N
}

const pick = (Pool: Node[], target: string, from?: From): Resolved => {
  if (Pool.length === 1) return { node: Pool[0], ambiguous: [] }
  const T = exactKey(target)
  const Exact = Pool.filter((n) => exactKey(n.title) === T || n.aliases.some((a) => exactKey(a) === T))
  if (Exact.length === 1) return { node: Exact[0], ambiguous: [] }
  const Cands = Exact.length > 1 ? Exact : Pool
  const Mine = dirsOf(from?.sourcePath)
  let Best = -1
  let Chosen = Cands[0]
  // Pool 은 이미 정렬돼 있어 같은 점수면 앞의 노트 (c)
  for (const C of Cands) {
    const S = shared(Mine, dirsOf(C.sourcePath))
    if (S > Best) {
      Best = S
      Chosen = C
    }
  }
  return { node: Chosen, ambiguous: Cands }
}

const order = (a: Node, b: Node): number => {
  const Ca = a.collection === 'wiki' ? 0 : 1
  const Cb = b.collection === 'wiki' ? 0 : 1
  return Ca - Cb || (a.sourcePath ?? a.slug).localeCompare(b.sourcePath ?? b.slug, 'en') || a.slug.localeCompare(b.slug, 'en')
}

const push = (M: Map<string, Node[]>, k: string, n: Node) => {
  const L = M.get(k)
  if (!L) M.set(k, [n])
  else if (!L.includes(n)) L.push(n)
}

export const buildGraph = (Input: Node[]): Graph => {
  // 읽은 순서와 상관없이 같은 결과가 나오게 먼저 정렬한다
  const Nodes = [...Input].sort(order)
  const WikiTitle = new Map<string, Node[]>()
  const WikiAlias = new Map<string, Node[]>()
  const PostTitle = new Map<string, Node>()
  const Duplicates = new Set<string>()

  // collection 안에서만 제목 · slug 중복을 본다
  for (const C of ['wiki', 'posts'] as const) {
    const Titles = new Set<string>()
    const Slugs = new Set<string>()
    for (const N of Nodes.filter((n) => n.collection === C)) {
      if (Titles.has(key(N.title))) Duplicates.add(N.title)
      if (Slugs.has(N.slug)) Duplicates.add(N.slug)
      Titles.add(key(N.title))
      Slugs.add(N.slug)
    }
  }

  for (const N of Nodes) {
    if (N.collection === 'wiki') {
      push(WikiTitle, key(N.title), N)
      for (const A of N.aliases) push(WikiAlias, key(A), N)
    } else if (!PostTitle.has(key(N.title))) {
      PostTitle.set(key(N.title), N)
    }
  }

  // Obsidian 은 파일명으로 링크한다 : posts 는 제목 다음에 파일명 (slug) 으로도 찾는다
  const PostSlug = new Map<string, Node>()
  for (const N of Nodes) if (N.collection === 'posts' && !PostSlug.has(N.slug)) PostSlug.set(N.slug, N)

  // [[폴더/노트]] : 경로 전체 또는 `/` 경계의 뒷부분이 sourcePath 와 맞는 wiki 노트 (이름이 바뀐 노트도 원래 경로로 찾는다)
  const PathKeys = Nodes.filter((n) => n.collection === 'wiki' && n.sourcePath).map((n) => ({ node: n, path: key(n.sourcePath!).replace(/\.md$/, '') }))
  const byPath = (target: string): Node | undefined => {
    const T = key(target).replace(/\.md$/, '').replace(/^\/+/, '')
    if (!T.includes('/')) return undefined
    const Exact = PathKeys.filter((p) => p.path === T)
    if (Exact.length > 0) return Exact.length === 1 ? Exact[0].node : undefined
    const Tail = PathKeys.filter((p) => p.path.endsWith(`/${T}`))
    return Tail.length === 1 ? Tail[0].node : undefined
  }

  const resolveInfo = (target: string, from?: From): Resolved => {
    const K = key(target)
    const Titles = WikiTitle.get(K)
    if (Titles) return pick(Titles, target, from)
    const Aliases = WikiAlias.get(K)
    if (Aliases) return pick(Aliases, target, from)
    const Other = PostTitle.get(K) ?? PostSlug.get(slug(target)) ?? byPath(target)
    return { node: Other, ambiguous: [] }
  }
  const resolve = (target: string, from?: From) => resolveInfo(target, from).node

  // 본문에서 링크한 노드 : 중복 없이 본문 순서
  const Outgoing = new Map<Node, Node[]>()
  for (const N of Nodes) {
    const Seen = new Set<Node>()
    for (const L of parseWikilinks(N.body)) {
      const T = resolve(L.target, N)
      if (T && T !== N) Seen.add(T)
    }
    Outgoing.set(N, [...Seen])
  }

  const bySlug = (collection: Collection, slug: string) => Nodes.find((n) => n.collection === collection && n.slug === slug)

  return {
    resolve,
    resolveInfo,
    href(link, from) {
      const T = resolve(link.target, from)
      if (!T) return undefined
      return `/${T.collection}/${T.slug}` + (link.heading ? `#${headingSlug(link.heading)}` : '')
    },
    backlinks(slug) {
      const Me = bySlug('wiki', slug)
      if (!Me) return []
      return Nodes.filter((n) => n.collection === 'posts' && Outgoing.get(n)?.includes(Me))
    },
    related(slug) {
      const Me = bySlug('posts', slug)
      if (!Me) return []
      return (Outgoing.get(Me) ?? []).filter((n) => n.collection === 'wiki')
    },
    duplicates: [...Duplicates],
  }
}
