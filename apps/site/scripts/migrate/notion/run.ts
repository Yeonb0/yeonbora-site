// Notion 마크다운 내보내기 → posts/notion : 읽기 · 묶음 실행 · 리포트 · 원문 대조
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Root as HastRoot, RootContent as HastContent } from 'hast'
import type { Nodes as MdastNodes } from 'mdast'
import rehypeParse from 'rehype-parse'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { backlogKey, loadBacklog } from '../../../src/lib/content/backlog'
import { buildGraph } from '../../../src/lib/content/graph'
import { loadNodes } from '../../../src/lib/content/index-fs'
import { PostSchema } from '../../../src/lib/content/schemas'
import { parseWikilinks } from '../../../src/lib/content/wikilink'
import { splitPost } from '../jekyll/convert'
import { unwrapLinks } from '../jekyll/run'
import { convertPage, splitExport, type Converted, type NoteKind } from './convert'
import { Excluded, Groups, Pages } from './pages'

export interface Raw {
  // 페이지 id → 내보내기 md 파일 (절대 경로) 과 내용
  pages: Map<string, { file: string; md: string }>
}

// 파일 이름 끝의 Notion 페이지 id
export const pageIdOf = (fileName: string): string | undefined => fileName.match(/ ([0-9a-f]{32})\.md$/)?.[1]

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const P = join(dir, n)
    return statSync(P).isDirectory() ? walk(P) : [P]
  })

export const loadRaw = (rawDir: string): Raw => {
  const Out: Raw = { pages: new Map() }
  for (const File of walk(rawDir)) {
    const Id = pageIdOf(File.split('/').at(-1) ?? '')
    if (!Id) continue
    if (Out.pages.has(Id)) throw new Error(`같은 페이지 id 의 파일이 둘입니다 : ${Id}`)
    Out.pages.set(Id, { file: File, md: readFileSync(File, 'utf8') })
  }
  return Out
}

export interface NotionBatch {
  batch: string
  total: number
  written: string[]
  skipped: { path: string; reason: 'same' | 'conflict' }[]
  excluded: { id: string; reason: string }[]
  missingSource: string[]
  slugClash: { slug: string; ids: string[] }[]
  badFront: { id: string; error: string }[]
  images: { copied: number; same: number; clash: string[]; missing: { post: string; src: string }[] }
  links: { broken: { target: string; files: string[] }[]; backlog: number }
  notes: { path: string; kind: NoteKind; detail: string }[]
  unlisted: number
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const squash = (s: string) => s.replace(/\s+/gu, '')

const hastText = (Nodes: HastContent[]): string =>
  Nodes.map((n) => (n.type === 'text' ? n.value : 'children' in n ? hastText(n.children as HastContent[]) : '')).join('')

const mdText = (node: MdastNodes): string => {
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code' || node.type === 'math' || node.type === 'inlineMath') return node.value
  if (node.type === 'image') return node.alt ?? ''
  if (node.type === 'html') return hastText((unified().use(rehypeParse, { fragment: true }).parse(node.value) as HastRoot).children)
  if ('children' in node) return (node.children as MdastNodes[]).map(mdText).join('')
  return ''
}

const textOf = (md: string) => squash(mdText(unified().use(remarkParse).use(remarkGfm).parse(md)))

// 원문 글자 : 제목 · 속성 줄과 템플릿 목차 토글 (- Index) 을 뺀 본문
export const originalText = (md: string): string => {
  const Body = splitExport(md).body.replace(/^- Index\n/m, '')
  return textOf(Body)
}

// 사이트 글자 : 위키 링크를 글자로, 표시 주석 · viz 블록 · 콜아웃 머리표를 뺀 본문
export const siteText = (siteFile: string): string => {
  const Body = unwrapLinks(splitPost(siteFile).body)
    .replace(/^[ \t>]*%%.*%%[ \t]*\n/gm, '')
    .replace(/^```viz[^\n]*\n[\s\S]*?^```[ \t]*\n?/gm, '')
    .replace(/^((?:> ?)+)\[![a-z]+\][-+]?/gm, '$1')
  return textOf(Body)
}

export const sameBody = (siteFile: string, md: string) => siteText(siteFile) === originalText(md)

const pagesOf = (batch: string) =>
  Object.entries(Pages)
    .filter(([, p]) => Groups[p.group]?.batch === batch)
    .sort((a, b) => a[1].date.localeCompare(b[1].date))

export const runBatch = (Raw: Raw, batch: string, contentDir: string, Opts: { dryRun: boolean; backlogPath?: string }): NotionBatch => {
  const R: NotionBatch = {
    batch,
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
    unlisted: [...Raw.pages.keys()].filter((id) => !Pages[id] && !Excluded[id]).length,
  }
  const Done: { id: string; C: Converted; file: string; final: string }[] = []
  for (const [Id, P] of pagesOf(batch)) {
    if (Excluded[Id]) {
      R.excluded.push({ id: Id, reason: Excluded[Id] })
      continue
    }
    R.total++
    const Src = Raw.pages.get(Id)
    if (!Src) {
      R.missingSource.push(Id)
      continue
    }
    try {
      const C = convertPage(Src.md, { id: Id, ...P })
      const Parsed = PostSchema.safeParse(splitPost(C.text).data)
      if (!Parsed.success) throw new Error(Parsed.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`).join(' · '))
      Done.push({ id: Id, C, file: Src.file, final: C.text })
    } catch (e) {
      R.badFront.push({ id: Id, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const BySlug = new Map<string, string[]>()
  for (const X of Done) BySlug.set(X.C.slug, [...(BySlug.get(X.C.slug) ?? []), X.id])
  for (const [slug, ids] of BySlug) if (ids.length > 1) R.slugClash.push({ slug, ids })
  const Clashing = new Set(R.slugClash.map((c) => c.slug))

  for (const X of Done) {
    if (Clashing.has(X.C.slug)) continue
    const Abs = join(contentDir, X.C.path)
    if (existsSync(Abs)) {
      X.final = readFileSync(Abs, 'utf8')
      R.skipped.push({ path: X.C.path, reason: sameBody(X.final, Raw.pages.get(X.id)!.md) ? 'same' : 'conflict' })
    } else {
      if (!Opts.dryRun) {
        mkdirSync(dirname(Abs), { recursive: true })
        writeFileSync(Abs, X.C.text)
      }
      R.written.push(X.C.path)
    }
    for (const I of X.C.images) {
      const From = join(dirname(X.file), I.src)
      if (!existsSync(From)) {
        R.images.missing.push({ post: X.C.path, src: I.src })
        continue
      }
      const Data = readFileSync(From)
      const Dest = join(contentDir, '_assets', 'notion', X.C.slug, I.name)
      if (existsSync(Dest)) {
        if (sha(readFileSync(Dest)) === sha(Data)) R.images.same++
        else R.images.clash.push(`${X.C.slug}/${I.name}`)
      } else {
        if (!Opts.dryRun) {
          mkdirSync(dirname(Dest), { recursive: true })
          writeFileSync(Dest, Data)
        }
        R.images.copied++
      }
    }
    for (const N of X.C.notes) R.notes.push({ path: X.C.path, ...N })
  }

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

export const reportFileName = (batch: string, dryRun: boolean) => `migrate-notion-${batch}${dryRun ? '.dry-run' : ''}.md`

const NoteTitle: Record<NoteKind, string> = {
  toc: '템플릿 목차 토글 (- Index) 지움 : 안의 목차 블록은 내보내기에 남지 않음',
  callout: '콜아웃 (<aside>) → > [!note] 아이콘',
  'page-link': 'Notion 페이지 링크 → 글자만',
  'external-image': '바깥 주소 그림 (내려받지 않음)',
}

export const renderReport = (R: NotionBatch, dryRun: boolean): string => {
  const L: string[] = [`# Notion 이전 리포트 : ${R.batch}${dryRun ? ' (dry-run)' : ''}`, '']
  L.push(`- 대상 ${R.total}편 · 옮김 ${R.written.length} · 같음 ${R.skipped.filter((s) => s.reason === 'same').length} · 충돌 ${R.skipped.filter((s) => s.reason === 'conflict').length} · 제외 ${R.excluded.length}`)
  L.push(`- 그림 : 복사 ${R.images.copied} · 같음 ${R.images.same} · 충돌 ${R.images.clash.length} · 없음 ${R.images.missing.length}`)
  L.push(`- 링크 : 깨짐 ${R.links.broken.length} · backlog ${R.links.backlog}`)
  L.push(`- 내보내기에 있지만 pages.ts 에 없는 페이지 ${R.unlisted}편 (옮기지 않음)`, '')
  const section = (title: string, Items: string[]) => {
    if (!Items.length) return
    L.push(`## ${title}`, '', ...Items.map((i) => `- ${i}`), '')
  }
  section('충돌', R.skipped.filter((s) => s.reason === 'conflict').map((s) => s.path))
  section('제외', R.excluded.map((e) => `${e.id} : ${e.reason}`))
  section('내보내기에 없음', R.missingSource)
  section('slug 겹침', R.slugClash.map((c) => `${c.slug} : ${c.ids.join(', ')}`))
  section('frontmatter 오류', R.badFront.map((b) => `${b.id} : ${b.error}`))
  section('그림 충돌', R.images.clash)
  section('못 찾은 그림', R.images.missing.map((m) => `${m.post} : ${m.src}`))
  section('깨진 링크', R.links.broken.map((b) => `${b.target} (${b.files.join(', ')})`))
  for (const Kind of Object.keys(NoteTitle) as NoteKind[]) {
    const Items = R.notes.filter((n) => n.kind === Kind)
    if (!Items.length) continue
    const ByPath = new Map<string, string[]>()
    for (const N of Items) ByPath.set(N.path, [...(ByPath.get(N.path) ?? []), N.detail])
    section(`변환 : ${NoteTitle[Kind]} (${Items.length})`, [...ByPath].map(([p, d]) => `${p}${d.some(Boolean) ? ` : ${d.filter(Boolean).join(' · ')}` : ''}`))
  }
  return L.join('\n')
}

export const needsCheck = (R: NotionBatch): number =>
  R.skipped.filter((s) => s.reason === 'conflict').length + R.missingSource.length + R.slugClash.length + R.badFront.length + R.images.clash.length + R.images.missing.length + R.links.broken.length

export const verifyAll = (Raw: Raw, contentDir: string): { ok: number; missing: string[]; changed: string[] } => {
  const Out = { ok: 0, missing: [] as string[], changed: [] as string[] }
  for (const [Id, P] of Object.entries(Pages)) {
    if (Excluded[Id]) continue
    const Src = Raw.pages.get(Id)
    if (!Src) {
      Out.missing.push(Id)
      continue
    }
    const C = convertPage(Src.md, { id: Id, ...P })
    const Path = join(contentDir, C.path)
    if (!existsSync(Path)) Out.missing.push(C.path)
    else if (sameBody(readFileSync(Path, 'utf8'), Src.md)) Out.ok++
    else Out.changed.push(C.path)
  }
  return Out
}
