// 깃블로그 _posts 폴더 하나를 posts/jekyll 로 옮기고, 결과를 모은다
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { loadBacklog, backlogKey } from '../../../src/lib/content/backlog'
import { buildGraph } from '../../../src/lib/content/graph'
import { loadNodes } from '../../../src/lib/content/index-fs'
import { PostSchema } from '../../../src/lib/content/schemas'
import { maskCode, parseWikilinks } from '../../../src/lib/content/wikilink'
import { comparable } from '../obsidian/run'
import { Categories, Excluded } from './categories'
import { convertPost, removeRaw, rewriteImages, splitPost, type Converted } from './convert'

export type SuspectKind = 'math' | 'html' | 'table' | 'liquid'

export interface JekyllBatch {
  category: string
  total: number
  written: string[]
  // 이미 있던 글에서 새로 받은 외부 그림 경로만 바꾼 글
  relinked: string[]
  skipped: { path: string; reason: 'same' | 'conflict' }[]
  excluded: { file: string; reason: string }[]
  slugClash: { slug: string; files: string[] }[]
  badFront: { file: string; error: string }[]
  images: { copied: number; same: number; clash: string[]; missing: { post: string; src: string }[] }
  external: { post: string; url: string; dest: string; fetched: boolean }[]
  links: { broken: { target: string; files: string[] }[]; backlog: number }
  suspects: { path: string; kinds: SuspectKind[] }[]
}

const sha = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

export const listCategory = (blogDir: string, category: string): string[] => {
  const Dir = join(blogDir, '_posts', category)
  if (!existsSync(Dir)) throw new Error(`_posts 아래에 폴더가 없습니다 : ${category}`)
  return readdirSync(Dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
}

const bodyOf = (text: string) => splitPost(text).body

// 위키 링크를 표시 글자로 되돌린다 : 원문 대조용
export const unwrapLinks = (body: string): string => {
  const Masked = maskCode(body)
  let Out = ''
  let At = 0
  for (const M of Masked.matchAll(/(?<!!)\[\[([^\[\]\n]+?)\]\]/g)) {
    const Inner = body.slice(M.index + 2, M.index + M[0].length - 2)
    const Bar = Inner.search(/\\?\|/)
    const Label = Bar >= 0 ? Inner.slice(Inner.indexOf('|', Bar) + 1) : Inner.split('#')[0]
    Out += body.slice(At, M.index) + Label
    At = M.index + M[0].length
  }
  return Out + body.slice(At)
}

// 원문과 사이트 글을 같은 모양으로 : raw 태그 · 그림 경로 · 위키 링크 · 표시 줄 · viz 블록을 맞춘다
const normalizeOriginal = (body: string) => comparable(rewriteImages(removeRaw(body), 'X', () => true).body)
const normalizeSite = (body: string) => comparable(rewriteImages(unwrapLinks(comparable(body)), 'X', () => true).body)

export const sameBody = (siteText: string, originalBody: string): boolean => normalizeSite(bodyOf(siteText)) === normalizeOriginal(originalBody)

const suspectsOf = (body: string): SuspectKind[] => {
  const M = maskCode(body)
  const Kinds: SuspectKind[] = []
  if (M.includes('$')) Kinds.push('math')
  if (/<(?:br|div|span|img|details|table|p)\b/i.test(M)) Kinds.push('html')
  if (/^\s*\|.*\|\s*$/m.test(M)) Kinds.push('table')
  if (/\{%|\{\{/.test(M)) Kinds.push('liquid')
  return Kinds
}

export const runBatch = (blogDir: string, category: string, contentDir: string, Opts: { dryRun: boolean; backlogPath?: string }): JekyllBatch => {
  if (!Object.hasOwn(Categories, category)) throw new Error(`categories.ts 에 없는 폴더입니다 : ${category}\n쓸 수 있는 폴더 : ${Object.keys(Categories).join(' · ')}`)
  const Files = listCategory(blogDir, category)
  const R: JekyllBatch = {
    category,
    total: 0,
    written: [],
    relinked: [],
    skipped: [],
    excluded: [],
    slugClash: [],
    badFront: [],
    images: { copied: 0, same: 0, clash: [], missing: [] },
    external: [],
    links: { broken: [], backlog: 0 },
    suspects: [],
  }

  const assetPath = (slug: string, name: string) => join(contentDir, '_assets', 'jekyll', slug, name)
  const Converted: { file: string; C: Converted; body: string; final?: string }[] = []
  for (const F of Files) {
    const Rel = `${category}/${F}`
    if (Excluded[Rel]) {
      R.excluded.push({ file: Rel, reason: Excluded[Rel] })
      continue
    }
    R.total++
    const Text = readFileSync(join(blogDir, '_posts', category, F), 'utf8')
    try {
      const C = convertPost({ category, fileName: F, text: Text }, { hasFile: (slug, name) => existsSync(assetPath(slug, name)) })
      const Front = splitPost(C.text).data
      const Parsed = PostSchema.safeParse(Front)
      if (!Parsed.success) throw new Error(Parsed.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`).join(' · '))
      Converted.push({ file: Rel, C, body: splitPost(Text).body })
    } catch (e) {
      R.badFront.push({ file: Rel, error: e instanceof Error ? e.message : String(e) })
    }
  }

  // slug 가 겹치면 그 글들은 쓰지 않는다
  const BySlug = new Map<string, string[]>()
  for (const X of Converted) BySlug.set(X.C.slug, [...(BySlug.get(X.C.slug) ?? []), X.file])
  for (const [slug, files] of BySlug) if (files.length > 1) R.slugClash.push({ slug, files })
  const Clashing = new Set(R.slugClash.flatMap((c) => c.files))

  for (const X of Converted) {
    if (Clashing.has(X.file)) continue
    const Abs = join(contentDir, X.C.path)
    if (existsSync(Abs)) {
      X.final = readFileSync(Abs, 'utf8')
      const Same = sameBody(X.final, X.body)
      R.skipped.push({ path: X.C.path, reason: Same ? 'same' : 'conflict' })
      // 같은 글이면 그동안 받아 둔 외부 그림의 경로만 바꾼다
      if (Same && X.C.external.some((e) => e.fetched)) {
        const Old = splitPost(X.final).body
        const New = rewriteImages(Old, X.C.slug, (name) => existsSync(assetPath(X.C.slug, name))).body
        if (New !== Old) {
          X.final = X.final.slice(0, X.final.length - Old.length) + New
          if (!Opts.dryRun) writeFileSync(Abs, X.final)
          R.relinked.push(X.C.path)
        }
      }
    } else {
      if (!Opts.dryRun) {
        mkdirSync(dirname(Abs), { recursive: true })
        writeFileSync(Abs, X.C.text)
      }
      R.written.push(X.C.path)
    }
    for (const I of X.C.local) {
      const Src = join(blogDir, I.src)
      const Dest = assetPath(X.C.slug, I.name)
      if (!existsSync(Src)) R.images.missing.push({ post: X.C.path, src: I.src })
      else if (existsSync(Dest)) {
        if (sha(Src) === sha(Dest)) R.images.same++
        else R.images.clash.push(`${X.C.slug}/${I.name}`)
      } else {
        if (!Opts.dryRun) {
          mkdirSync(dirname(Dest), { recursive: true })
          copyFileSync(Src, Dest)
        }
        R.images.copied++
      }
    }
    for (const E of X.C.external) R.external.push({ post: X.C.path, url: E.url, dest: `_assets/jekyll/${X.C.slug}/${E.name}`, fetched: E.fetched })
    const Kinds = suspectsOf(X.body)
    if (Kinds.length) R.suspects.push({ path: X.C.path, kinds: Kinds })
  }

  // 링크 : 사이트 그래프 (이번 글 포함) → backlog → 깨짐
  const Nodes = loadNodes(contentDir)
  const Graph = buildGraph(Nodes)
  const Backlog = Opts.backlogPath ? loadBacklog(Opts.backlogPath) : new Set<string>()
  const Broken = new Map<string, Set<string>>()
  for (const X of Converted) {
    if (Clashing.has(X.file)) continue
    for (const L of parseWikilinks(X.final ?? X.C.text)) {
      const T = L.target.trim()
      if (!T || Graph.resolve(T)) continue
      if (Backlog.has(backlogKey(T))) R.links.backlog++
      else Broken.set(T, (Broken.get(T) ?? new Set()).add(X.C.path))
    }
  }
  R.links.broken = [...Broken].map(([target, files]) => ({ target, files: [...files].sort() }))
  return R
}

export const reportFileName = (category: string, dryRun: boolean) => `migrate-jekyll-${category}${dryRun ? '.dry-run' : ''}.md`

export const renderReport = (R: JekyllBatch, dryRun: boolean): string => {
  const L: string[] = [`# 깃블로그 이전 리포트 : ${R.category}${dryRun ? ' (dry-run)' : ''}`, '']
  L.push(`- 대상 ${R.total}편 · 옮김 ${R.written.length} · 같음 ${R.skipped.filter((s) => s.reason === 'same').length} (그림 경로만 바꿈 ${R.relinked.length}) · 충돌 ${R.skipped.filter((s) => s.reason === 'conflict').length} · 제외 ${R.excluded.length}`)
  L.push(`- 그림 : 복사 ${R.images.copied} · 같음 ${R.images.same} · 충돌 ${R.images.clash.length} · 없음 ${R.images.missing.length} · 외부 ${R.external.length} (받음 ${R.external.filter((e) => e.fetched).length})`)
  L.push(`- 링크 : 깨짐 ${R.links.broken.length} · backlog ${R.links.backlog}`, '')
  const section = (title: string, Items: string[]) => {
    if (!Items.length) return
    L.push(`## ${title}`, '', ...Items.map((i) => `- ${i}`), '')
  }
  section('충돌', R.skipped.filter((s) => s.reason === 'conflict').map((s) => s.path))
  section('제외', R.excluded.map((e) => `${e.file} : ${e.reason}`))
  section('slug 겹침', R.slugClash.map((c) => `${c.slug} : ${c.files.join(', ')}`))
  section('frontmatter 오류', R.badFront.map((b) => `${b.file} : ${b.error}`))
  section('그림 충돌', R.images.clash)
  section('못 찾은 그림', R.images.missing.map((m) => `${m.post} : ${m.src}`))
  section('아직 받지 않은 외부 그림', R.external.filter((e) => !e.fetched).map((e) => `${e.post} : ${e.url} → ${e.dest}`))
  section('깨진 링크', R.links.broken.map((b) => `${b.target} (${b.files.join(', ')})`))
  section('변환 의심', R.suspects.map((s) => `${s.path} : ${s.kinds.join(' · ')}`))
  return L.join('\n')
}

// 확인할 것 : 충돌 · slug 겹침 · frontmatter 오류 · 그림 문제 · 받지 않은 외부 그림 · 깨진 링크
export const needsCheck = (R: JekyllBatch): number =>
  R.skipped.filter((s) => s.reason === 'conflict').length +
  R.slugClash.length +
  R.badFront.length +
  R.images.clash.length +
  R.images.missing.length +
  R.external.filter((e) => !e.fetched).length +
  R.links.broken.length

// 이전 대상 글마다 사이트 파일이 있고 본문이 같은지
export const verifyBlog = (blogDir: string, contentDir: string): { ok: number; missing: string[]; changed: string[] } => {
  const Out = { ok: 0, missing: [] as string[], changed: [] as string[] }
  for (const Cat of Object.keys(Categories)) {
    if (!existsSync(join(blogDir, '_posts', Cat))) continue
    for (const F of listCategory(blogDir, Cat)) {
      const Rel = `${Cat}/${F}`
      if (Excluded[Rel]) continue
      const Text = readFileSync(join(blogDir, '_posts', Cat, F), 'utf8')
      const C = convertPost({ category: Cat, fileName: F, text: Text }, { hasFile: () => true })
      const Abs = join(contentDir, C.path)
      if (!existsSync(Abs)) Out.missing.push(Rel)
      else if (sameBody(readFileSync(Abs, 'utf8'), splitPost(Text).body)) Out.ok++
      else Out.changed.push(Rel)
    }
  }
  return Out
}
