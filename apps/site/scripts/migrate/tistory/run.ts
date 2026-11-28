// 받아 둔 티스토리 원문 (raw/tistory) 을 posts/tistory 로 옮기고, 결과를 모은다
// raw.json : 관리 페이지 글 목록 + 받은 그림 (base64) · source.json : 편집기 원본 HTML (글 id → HTML)
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Element, Root as HastRoot, RootContent as HastContent } from 'hast'
import type { Nodes as MdastNodes } from 'mdast'
import rehypeParse from 'rehype-parse'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { loadBacklog, backlogKey } from '../../../src/lib/content/backlog'
import { buildGraph } from '../../../src/lib/content/graph'
import { loadNodes } from '../../../src/lib/content/index-fs'
import { PostSchema } from '../../../src/lib/content/schemas'
import { parseWikilinks } from '../../../src/lib/content/wikilink'
import { splitPost } from '../jekyll/convert'
import { unwrapLinks } from '../jekyll/run'
import { BatchNames, Categories, Excluded } from './categories'
import { convertPost, replaceImageMarks, type Converted, type ImageFile, type NoteKind, type TistoryMeta } from './convert'

export interface RawDump {
  posts: (TistoryMeta & { html?: string })[]
  images: Record<string, { type: string; size: number; data: string }>
  failedImages: string[]
}

export interface Raw {
  posts: TistoryMeta[]
  source: Record<string, string>
  images: Map<string, ImageFile>
  failedImages: string[]
}

// 그림 주소 blog.kakaocdn.net/dna/<a>/<id>/... 의 <id> 로 찾는다 (편집기 원본의 kage@<a>/<id>/... 와 같은 값)
export const imageKey = (url: string): string | undefined => url.match(/\/dna\/[^/]+\/([^/]+)\//)?.[1]

export const loadRaw = (rawDir: string): Raw => {
  const Dump = JSON.parse(readFileSync(join(rawDir, 'raw.json'), 'utf8')) as RawDump
  const Source = JSON.parse(readFileSync(join(rawDir, 'source.json'), 'utf8')) as { content: Record<string, string> }
  const Images = new Map<string, ImageFile>()
  for (const [Url, V] of Object.entries(Dump.images)) {
    const K = imageKey(Url)
    if (K) Images.set(K, { type: V.type, data: Buffer.from(V.data, 'base64') })
  }
  const Posts = Dump.posts.map(({ html: _html, ...m }) => m as TistoryMeta)
  return { posts: Posts, source: Source.content, images: Images, failedImages: Dump.failedImages ?? [] }
}

export interface TistoryBatch {
  category: string
  total: number
  written: string[]
  skipped: { path: string; reason: 'same' | 'conflict' }[]
  excluded: { id: string; title: string; reason: string }[]
  missingSource: string[]
  slugClash: { slug: string; titles: string[] }[]
  badFront: { title: string; error: string }[]
  images: { copied: number; same: number; clash: string[]; missing: { post: string; id: string }[] }
  links: { broken: { target: string; files: string[] }[]; backlog: number }
  notes: { path: string; kind: NoteKind; detail: string }[]
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')

// 본문 대조 : 공백 (줄바꿈 · nbsp 포함) 을 뺀 글자만 비교한다. 위키 링크 · 표시 주석 · viz 블록은 원문에 없으므로 지운다
const squash = (s: string) => s.replace(/\s+/gu, '')

const hastText = (nodes: HastContent[]): string => {
  let Out = ''
  for (const N of nodes) {
    if (N.type === 'text') Out += N.value
    else if (N.type === 'element') {
      const E = N as Element
      const Type = E.properties?.dataKeType
      if (Type === 'html') Out += String(E.properties?.dataSource ?? '')
      else if (Type === 'opengraph') Out += String(E.properties?.dataOgTitle || E.properties?.dataOgUrl || '')
      else if (Type === 'moreLess') {
        const Content = E.children.find((c): c is Element => c.type === 'element' && String(c.properties?.className ?? '').includes('moreless-content'))
        Out += String(E.properties?.dataTextMore ?? '더보기') + (Content ? hastText(Content.children) : '')
      } else if (E.tagName === 'img') Out += String(E.properties?.alt ?? '')
      else Out += hastText(E.children)
    }
  }
  return Out
}

export const originalText = (html: string): string => {
  const Tree = unified().use(rehypeParse, { fragment: true }).parse(replaceImageMarks(html)) as HastRoot
  return squash(hastText(Tree.children))
}

const mdText = (node: MdastNodes): string => {
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') return node.value
  if (node.type === 'image') return node.alt ?? ''
  if (node.type === 'html') {
    const Tree = unified().use(rehypeParse, { fragment: true }).parse(node.value) as HastRoot
    return hastText(Tree.children)
  }
  if ('children' in node) return (node.children as MdastNodes[]).map(mdText).join('')
  return ''
}

export const siteText = (siteFile: string): string => {
  const Body = unwrapLinks(splitPost(siteFile).body)
    .replace(/^[ \t>]*%%.*%%[ \t]*\n/gm, '')
    .replace(/^```viz[^\n]*\n[\s\S]*?^```[ \t]*\n?/gm, '')
  const Tree = unified().use(remarkParse).use(remarkGfm).parse(Body)
  return squash(mdText(Tree))
}

export const sameBody = (siteFile: string, html: string): boolean => siteText(siteFile) === originalText(html)

export const runBatch = (Raw: Raw, category: string, contentDir: string, Opts: { dryRun: boolean; backlogPath?: string }): TistoryBatch => {
  if (!Object.hasOwn(Categories, category)) throw new Error(`categories.ts 에 없는 카테고리입니다 : ${category}\n쓸 수 있는 카테고리 : ${Object.keys(Categories).join(' · ')}`)
  const R: TistoryBatch = {
    category,
    total: 0,
    written: [],
    skipped: [],
    excluded: [],
    missingSource: [],
    slugClash: [],
    badFront: [],
    images: { copied: 0, same: 0, clash: [], missing: [] },
    links: { broken: [], backlog: 0 },
    notes: [],
  }
  const Posts = Raw.posts.filter((p) => p.category === category).sort((a, b) => a.published.localeCompare(b.published))
  const Done: { meta: TistoryMeta; C: Converted; final: string }[] = []
  for (const P of Posts) {
    if (Excluded[P.id]) {
      R.excluded.push({ id: P.id, title: P.title, reason: Excluded[P.id] })
      continue
    }
    R.total++
    const Html = Raw.source[P.id]
    if (Html === undefined) {
      R.missingSource.push(P.title)
      continue
    }
    try {
      const C = convertPost(P, Html, { image: (id) => Raw.images.get(id) })
      const Parsed = PostSchema.safeParse(splitPost(C.text).data)
      if (!Parsed.success) throw new Error(Parsed.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`).join(' · '))
      Done.push({ meta: P, C, final: C.text })
    } catch (e) {
      R.badFront.push({ title: P.title, error: e instanceof Error ? e.message : String(e) })
    }
  }

  // slug 가 겹치면 (이 묶음 안 또는 이미 있는 다른 출처 글) 그 글들은 쓰지 않는다
  const BySlug = new Map<string, string[]>()
  for (const X of Done) BySlug.set(X.C.slug, [...(BySlug.get(X.C.slug) ?? []), X.meta.title])
  for (const [slug, titles] of BySlug) if (titles.length > 1) R.slugClash.push({ slug, titles })
  const Clashing = new Set(R.slugClash.map((c) => c.slug))

  for (const X of Done) {
    if (Clashing.has(X.C.slug)) continue
    const Abs = join(contentDir, X.C.path)
    if (existsSync(Abs)) {
      X.final = readFileSync(Abs, 'utf8')
      R.skipped.push({ path: X.C.path, reason: sameBody(X.final, Raw.source[X.meta.id]) ? 'same' : 'conflict' })
    } else {
      if (!Opts.dryRun) {
        mkdirSync(dirname(Abs), { recursive: true })
        writeFileSync(Abs, X.C.text)
      }
      R.written.push(X.C.path)
    }
    for (const I of X.C.images) {
      const F = Raw.images.get(I.id)
      if (!F) {
        R.images.missing.push({ post: X.C.path, id: I.id })
        continue
      }
      const Dest = join(contentDir, '_assets', 'tistory', X.C.slug, I.name)
      if (existsSync(Dest)) {
        if (sha(readFileSync(Dest)) === sha(F.data)) R.images.same++
        else R.images.clash.push(`${X.C.slug}/${I.name}`)
      } else {
        if (!Opts.dryRun) {
          mkdirSync(dirname(Dest), { recursive: true })
          writeFileSync(Dest, F.data)
        }
        R.images.copied++
      }
    }
    for (const N of X.C.notes) R.notes.push({ path: X.C.path, ...N })
  }

  // 링크 : 원문에는 위키 링크가 없다. 나중에 [[ ]] 를 걸었을 때 깨진 것이 없는지 본다
  const Graph = buildGraph(loadNodes(contentDir))
  const Backlog = Opts.backlogPath ? loadBacklog(Opts.backlogPath) : new Set<string>()
  const Broken = new Map<string, Set<string>>()
  for (const X of Done) {
    if (Clashing.has(X.C.slug)) continue
    for (const L of parseWikilinks(X.final)) {
      const T = L.target.trim()
      if (!T || Graph.resolve(T)) continue
      if (Backlog.has(backlogKey(T))) R.links.backlog++
      else Broken.set(T, (Broken.get(T) ?? new Set()).add(X.C.path))
    }
  }
  R.links.broken = [...Broken].map(([target, files]) => ({ target, files: [...files].sort() }))
  return R
}

export const reportFileName = (category: string, dryRun: boolean) => `migrate-tistory-${BatchNames[category] ?? category}${dryRun ? '.dry-run' : ''}.md`

const NoteTitle: Record<NoteKind, string> = {
  'html-demo': 'HTML 삽입 → html demo 블록 (사이트에서 iframe)',
  'link-card': '링크 카드 → 제목 링크 한 줄',
  'more-less': '더보기 → <details>',
  color: '글자 색 · 바탕색 → <span style> 그대로',
  mark: '밝은 회색 바탕 (#dddddd) → <mark> (다크 모드에서 글자가 안 보이므로)',
  'dropped-color': '지운 색 (기본 글자색 · 흰 바탕 + 검은 글자 : 붙여넣기 흔적)',
  table: '표 → HTML 표 (모양 속성만 지움, 머리 행이 없어 GFM 표로 바꾸지 않음)',
  caption: '그림 설명 (caption) → 그림 alt',
}

export const renderReport = (R: TistoryBatch, dryRun: boolean): string => {
  const L: string[] = [`# 티스토리 이전 리포트 : ${R.category}${dryRun ? ' (dry-run)' : ''}`, '']
  L.push(`- 대상 ${R.total}편 · 옮김 ${R.written.length} · 같음 ${R.skipped.filter((s) => s.reason === 'same').length} · 충돌 ${R.skipped.filter((s) => s.reason === 'conflict').length} · 제외 ${R.excluded.length}`)
  L.push(`- 그림 : 복사 ${R.images.copied} · 같음 ${R.images.same} · 충돌 ${R.images.clash.length} · 없음 ${R.images.missing.length}`)
  L.push(`- 링크 : 깨짐 ${R.links.broken.length} · backlog ${R.links.backlog}`, '')
  const section = (title: string, Items: string[]) => {
    if (!Items.length) return
    L.push(`## ${title}`, '', ...Items.map((i) => `- ${i}`), '')
  }
  section('충돌', R.skipped.filter((s) => s.reason === 'conflict').map((s) => s.path))
  section('제외', R.excluded.map((e) => `${e.title} (id ${e.id}) : ${e.reason}`))
  section('편집기 원본 없음', R.missingSource)
  section('slug 겹침', R.slugClash.map((c) => `${c.slug} : ${c.titles.join(', ')}`))
  section('frontmatter 오류', R.badFront.map((b) => `${b.title} : ${b.error}`))
  section('그림 충돌', R.images.clash)
  section('못 찾은 그림', R.images.missing.map((m) => `${m.post} : ${m.id}`))
  section('깨진 링크', R.links.broken.map((b) => `${b.target} (${b.files.join(', ')})`))
  for (const Kind of Object.keys(NoteTitle) as NoteKind[]) {
    const Items = R.notes.filter((n) => n.kind === Kind)
    if (!Items.length) continue
    const ByPath = new Map<string, string[]>()
    for (const N of Items) ByPath.set(N.path, [...(ByPath.get(N.path) ?? []), N.detail])
    section(`변환 : ${NoteTitle[Kind]} (${Items.length})`, [...ByPath].map(([p, d]) => `${p} : ${d.filter(Boolean).join(' · ') || d.length + '곳'}`))
  }
  return L.join('\n')
}

export const needsCheck = (R: TistoryBatch): number =>
  R.skipped.filter((s) => s.reason === 'conflict').length + R.missingSource.length + R.slugClash.length + R.badFront.length + R.images.clash.length + R.images.missing.length + R.links.broken.length

// 이전 대상 글마다 사이트 파일이 있고 본문 글자가 원문과 같은지
export const verifyAll = (Raw: Raw, contentDir: string): { ok: number; missing: string[]; changed: string[] } => {
  const Out = { ok: 0, missing: [] as string[], changed: [] as string[] }
  for (const P of Raw.posts) {
    if (Excluded[P.id] || !Categories[P.category]) continue
    const Html = Raw.source[P.id]
    const Path = join(contentDir, 'posts', 'tistory', `${convertPost(P, Html ?? '', { image: () => undefined }).slug}.md`)
    if (Html === undefined || !existsSync(Path)) Out.missing.push(P.title)
    else if (sameBody(readFileSync(Path, 'utf8'), Html)) Out.ok++
    else Out.changed.push(P.title)
  }
  return Out
}
