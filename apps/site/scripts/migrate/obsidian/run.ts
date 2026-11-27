// Main 최상위 폴더 하나를 사이트 content 로 옮기고, 결과를 모은다
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { parse } from 'yaml'
import { loadBacklog } from '../../../src/lib/content/backlog'
import { buildGraph, type Node } from '../../../src/lib/content/graph'
import { loadNodes } from '../../../src/lib/content/index-fs'
import { WikiSchema } from '../../../src/lib/content/schemas'
import { maskCode, parseWikilinks, slugFromPath } from '../../../src/lib/content/wikilink'
import { copyImages } from './assets'
import { convertNote } from './convert'
import { readCreatedDates } from './git-dates'
import { Topics } from './topics'
import { computeBacklog, findSlugClashes, listVault, renameMap, type Excluded, type VaultNote } from './vault'
import { renderReport } from './report'

export type SuspectKind = 'math' | 'callout' | 'html' | 'table-link' | 'dataview' | 'embed-note'

export interface BatchResult {
  folder: string
  topic: string
  total: number
  written: string[]
  skipped: { path: string; reason: 'same' | 'conflict' }[]
  excluded: Excluded[]
  renamed: [string, string][]
  images: ReturnType<typeof copyImages>
  noDate: string[]
  links: { broken: number; backlog: number; notYetMigrated: number }
  brokenList: { target: string; files: string[] }[]
  suspects: { path: string; kinds: SuspectKind[] }[]
  ignored: string[]
}

export interface BatchOpts {
  dryRun: boolean
  backlogPath?: string
}

const FrontRe = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/
const ImageExt = /\.(?:png|jpe?g|gif|webp|svg|avif)$/i

const bodyOf = (text: string): string => {
  const M = text.match(FrontRe)
  return M ? text.slice(M[0].length) : text
}

// 비교용 : viz 블록 (뒤 빈 줄 하나까지) 과 %% 주석만 있는 줄을 빼고 끝 줄바꿈을 정리한다
const comparable = (body: string): string =>
  body
    .replace(/^```viz[^\n]*\n[\s\S]*?^```[ \t]*(?:\n|$)(?:[ \t]*\n)?/gm, '')
    .replace(/^[ \t]*%%.*%%[ \t]*(?:\n|$)/gm, '')
    .replace(/\n+$/, '')

// 이미 있는 파일과 새 본문이 같은지 (frontmatter 는 보지 않는다)
const sameBody = (existingText: string, newBody: string): boolean => comparable(bodyOf(existingText)) === newBody.replace(/\n+$/, '')

const parseFront = (text: string): Record<string, unknown> => {
  const M = text.match(FrontRe)
  const P = M ? parse(M[1] ?? '') : {}
  return P && typeof P === 'object' && !Array.isArray(P) ? (P as Record<string, unknown>) : {}
}

const toVaultNode = (N: VaultNote): Node => ({
  collection: 'wiki',
  slug: slugFromPath(N.relPath),
  title: typeof N.data.title === 'string' ? N.data.title : N.stem,
  aliases: Array.isArray(N.data.aliases) ? N.data.aliases.map(String) : [],
  body: N.body,
  sourcePath: N.relPath,
})

const toSiteNode = (path: string, text: string): Node => {
  const D = parseFront(text)
  return {
    collection: 'wiki',
    slug: slugFromPath(path),
    title: typeof D.title === 'string' ? D.title : path,
    aliases: Array.isArray(D.aliases) ? D.aliases.map(String) : [],
    body: bodyOf(text),
    sourcePath: typeof D.sourcePath === 'string' ? D.sourcePath : undefined,
  }
}

export const topicOfFolder = (folder: string): string => (folder === '.' ? 'etc-root' : Topics[folder])

const suspectsOf = (body: string): SuspectKind[] => {
  const M = maskCode(body)
  const Kinds: SuspectKind[] = []
  if (M.includes('$')) Kinds.push('math')
  if (/>[ \t]*\[!/.test(M)) Kinds.push('callout')
  if (/<(?:br|div|span|img|details)\b/i.test(M)) Kinds.push('html')
  if (/\[\[[^\]\n]*\\\|/.test(M)) Kinds.push('table-link')
  if (/^```dataview/m.test(body)) Kinds.push('dataview')
  for (const E of M.matchAll(/!\[\[([^\]\n]+?)\]\]/g)) {
    const Target = E[1].split(/\\?\|/)[0].split('#')[0].trim()
    if (!ImageExt.test(Target)) {
      Kinds.push('embed-note')
      break
    }
  }
  return Kinds
}

export const runBatch = (vaultDir: string, folder: string, contentDir: string, Opts: BatchOpts): BatchResult => {
  if (folder !== '.' && !Topics[folder]) throw new Error(`Main 최상위 폴더가 아닙니다 : ${folder} (루트 파일은 . )`)
  const { Notes: All, Excluded, Ignored } = listVault(vaultDir)
  const Batch = All.filter((n) => {
    const Parts = n.relPath.split('/')
    return folder === '.' ? Parts.length === 1 : Parts.length > 1 && Parts[0] === folder
  })
  const Renames = renameMap(findSlugClashes(All), All)

  // 작성일 : Main frontmatter 에 없을 때만 git 기록을 읽는다
  const NeedGit = Batch.some((n) => convertNote(n, {}).text.indexOf('\ncreated:') < 0)
  const Dates = NeedGit ? readCreatedDates(vaultDir) : new Map<string, string>()

  const Converted = Batch.map((N) => {
    const C = convertNote(N, { created: Dates.get(N.relPath), newStem: Renames.get(N.relPath) })
    return { Note: N, ...C, hasDate: parseFront(C.text).created !== undefined }
  })

  // 쓰기 전에 전부 검사한다 : 하나라도 틀리면 아무것도 쓰지 않는다
  const Bad: string[] = []
  for (const C of Converted) {
    const R = WikiSchema.safeParse(parseFront(C.text))
    if (!R.success) Bad.push(`${C.Note.relPath} (${R.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`).join(', ')})`)
  }
  if (Bad.length > 0) throw new Error(`frontmatter 검사에 실패해 아무것도 쓰지 않았습니다 :\n${Bad.join('\n')}`)

  const Written: string[] = []
  const Skipped: BatchResult['skipped'] = []
  for (const C of Converted) {
    const Abs = join(contentDir, C.path)
    if (existsSync(Abs)) {
      Skipped.push({ path: C.path, reason: sameBody(readFileSync(Abs, 'utf8'), C.Note.body) ? 'same' : 'conflict' })
      continue
    }
    Written.push(C.path)
    if (!Opts.dryRun) {
      mkdirSync(dirname(Abs), { recursive: true })
      writeFileSync(Abs, C.text)
    }
  }

  const Images = copyImages(Batch, join(vaultDir, 'images'), join(contentDir, '_assets'), Opts.dryRun)

  // 링크 분류 : 사이트 그래프 → backlog → Main 그래프 → 깨짐
  const SiteNodes = loadNodes(contentDir)
  if (Opts.dryRun) for (const C of Converted) if (Written.includes(C.path)) SiteNodes.push(toSiteNode(C.path, C.text))
  const SiteGraph = buildGraph(SiteNodes)
  const VaultGraph = buildGraph(All.map(toVaultNode))
  const Backlog = Opts.backlogPath ? loadBacklog(Opts.backlogPath) : new Set<string>()
  const Links = { broken: 0, backlog: 0, notYetMigrated: 0 }
  const Broken = new Map<string, Set<string>>()
  for (const N of Batch) {
    for (const L of parseWikilinks(N.body)) {
      const T = L.target.trim()
      if (!T) continue
      if (SiteGraph.resolve(T)) continue
      if (Backlog.has(T.toLowerCase())) Links.backlog++
      else if (VaultGraph.resolve(T)) Links.notYetMigrated++
      else {
        Links.broken++
        Broken.set(T, (Broken.get(T) ?? new Set()).add(N.relPath))
      }
    }
  }

  const Suspects = Batch.map((N) => ({ path: N.relPath, kinds: suspectsOf(N.body) })).filter((s) => s.kinds.length > 0)

  return {
    folder,
    topic: topicOfFolder(folder),
    total: Batch.length,
    written: Written,
    skipped: Skipped,
    excluded: Excluded.filter((e) => (folder === '.' ? !Topics[e.relPath.split('/')[0]] : e.relPath.startsWith(`${folder}/`))),
    renamed: Batch.filter((n) => Renames.has(n.relPath)).map((n) => [n.relPath, Renames.get(n.relPath)!] as [string, string]),
    images: Images,
    noDate: Converted.filter((c) => !c.hasDate).map((c) => c.Note.relPath),
    links: Links,
    brokenList: [...Broken].map(([target, files]) => ({ target, files: [...files].sort() })).sort((a, b) => a.target.localeCompare(b.target)),
    suspects: Suspects,
    ignored: Ignored.filter((p) => (folder === '.' ? !p.includes('/') : p.startsWith(`${folder}/`))),
  }
}

export interface CommandOpts {
  contentDir: string
  reportsDir: string
  backlogPath?: string
  dryRun: boolean
}

// 묶음을 옮기고 리포트를 쓴다 (dry-run 은 리포트도 쓰지 않는다)
export const runCommand = (vaultDir: string, folder: string, Opts: CommandOpts): BatchResult => {
  const R = runBatch(vaultDir, folder, Opts.contentDir, { dryRun: Opts.dryRun, backlogPath: Opts.backlogPath })
  if (!Opts.dryRun) {
    mkdirSync(Opts.reportsDir, { recursive: true })
    writeFileSync(join(Opts.reportsDir, `migrate-obsidian-${R.topic}.md`), renderReport(R))
  }
  return R
}

// Main 의 이전 대상 노트마다 사이트 파일이 있고 본문이 같은지
export const verifyVault = (vaultDir: string, contentDir: string): { ok: number; missing: string[]; changed: string[] } => {
  const { Notes } = listVault(vaultDir)
  const Renames = renameMap(findSlugClashes(Notes), Notes)
  const Missing: string[] = []
  const Changed: string[] = []
  let Ok = 0
  for (const N of Notes) {
    const C = convertNote(N, { newStem: Renames.get(N.relPath) })
    const Abs = join(contentDir, C.path)
    if (!existsSync(Abs)) Missing.push(N.relPath)
    else if (sameBody(readFileSync(Abs, 'utf8'), N.body)) Ok++
    else Changed.push(N.relPath)
  }
  return { ok: Ok, missing: Missing, changed: Changed }
}

// backlog 파일을 쓰고 대상 수를 돌려준다
export const writeBacklog = (vaultDir: string, outPath: string): number => {
  const List = computeBacklog(listVault(vaultDir).Notes)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(List, null, 2) + '\n')
  return List.length
}
