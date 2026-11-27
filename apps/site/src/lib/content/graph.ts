// wiki · posts 노트 사이의 링크 그래프 : 빌드 (remark) 와 페이지 (역링크) 가 함께 쓴다
import { slug } from 'github-slugger'
import { headingSlug, parseWikilinks, type Wikilink } from './wikilink'

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

export interface Graph {
  resolve(target: string): Node | undefined
  href(link: Wikilink): string | undefined
  backlinks(slug: string): Node[]
  related(slug: string): Node[]
  duplicates: string[]
}

const key = (s: string) => s.trim().toLowerCase()

export const buildGraph = (Nodes: Node[]): Graph => {
  const WikiTitle = new Map<string, Node>()
  const WikiAlias = new Map<string, Node>()
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
      if (!WikiTitle.has(key(N.title))) WikiTitle.set(key(N.title), N)
      for (const A of N.aliases) if (!WikiAlias.has(key(A))) WikiAlias.set(key(A), N)
    } else if (!PostTitle.has(key(N.title))) {
      PostTitle.set(key(N.title), N)
    }
  }

  // Obsidian 은 파일명으로 링크한다 : posts 는 제목 다음에 파일명 (slug) 으로도 찾는다
  const PostSlug = new Map(Nodes.filter((n) => n.collection === 'posts').map((n) => [n.slug, n]))

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

  const resolve = (target: string) =>
    WikiTitle.get(key(target)) ?? WikiAlias.get(key(target)) ?? PostTitle.get(key(target)) ?? PostSlug.get(slug(target)) ?? byPath(target)

  // 본문에서 링크한 노드 : 중복 없이 본문 순서
  const Outgoing = new Map<Node, Node[]>()
  for (const N of Nodes) {
    const Seen = new Set<Node>()
    for (const L of parseWikilinks(N.body)) {
      const T = resolve(L.target)
      if (T && T !== N) Seen.add(T)
    }
    Outgoing.set(N, [...Seen])
  }

  const bySlug = (collection: Collection, slug: string) => Nodes.find((n) => n.collection === collection && n.slug === slug)

  return {
    resolve,
    href(link) {
      const T = resolve(link.target)
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
