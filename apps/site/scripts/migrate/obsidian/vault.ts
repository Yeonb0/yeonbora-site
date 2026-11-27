// Main 볼트를 읽어 노트 목록 · 이름 충돌 · 없는 링크 대상을 낸다
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { backlogKey } from '../../../src/lib/content/backlog'
import { buildGraph, type Node } from '../../../src/lib/content/graph'
import { parseWikilinks, slugFromPath } from '../../../src/lib/content/wikilink'

export interface VaultNote {
  relPath: string
  stem: string
  data: Record<string, unknown>
  rawFront: string | null
  body: string
}

export interface Excluded {
  relPath: string
  reason: 'infra' | 'publish-false' | 'pending'
}

// 앞의 --- 줄 사이가 frontmatter, 닫는 --- 줄 뒤는 byte 단위로 그대로 본문이다
const FrontRe = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/

const InfraRootDirs = new Set(['scripts', 'templete', 'images', '.githooks'])
const SkipDirs = new Set(['.git', '.obsidian'])
const InfraDirs = new Set(['_inbox', '_pending'])

const walk = (dir: string, prefix = ''): string[] => {
  const Out: string[] = []
  for (const E of readdirSync(dir, { withFileTypes: true })) {
    if (E.isDirectory()) {
      if (SkipDirs.has(E.name)) continue
      Out.push(...walk(join(dir, E.name), `${prefix}${E.name}/`))
    } else Out.push(prefix + E.name)
  }
  return Out
}

const stemOf = (relPath: string) => (relPath.split('/').pop() ?? relPath).replace(/\.md$/, '')

// frontmatter 를 읽지 못한 노트 : 빈 것으로 취급하면 Main 의 키가 조용히 사라지므로 따로 알린다
export interface BadFront {
  relPath: string
  message: string
}

const parseNote = (relPath: string, text: string): { note: VaultNote; bad?: string } => {
  const M = text.match(FrontRe)
  let Data: Record<string, unknown> = {}
  let Bad: string | undefined
  if (M) {
    try {
      const P = parse(M[1] ?? '')
      if (P && typeof P === 'object' && !Array.isArray(P)) Data = P as Record<string, unknown>
      else if (P !== null && P !== undefined) Bad = 'frontmatter 가 키 : 값 형태가 아닙니다'
    } catch (e) {
      Bad = `frontmatter 를 읽지 못했습니다 : ${(e instanceof Error ? e.message : String(e)).split('\n')[0]}`
    }
  }
  return {
    note: { relPath, stem: stemOf(relPath), data: Data, rawFront: M ? (M[1] ?? '') : null, body: M ? text.slice(M[0].length) : text },
    bad: Bad,
  }
}

// Ignored : .md · .base 가 아니면서 images/ 밖에 있어 조용히 건너뛴 파일
export const listVault = (vaultDir: string): { Notes: VaultNote[]; Excluded: Excluded[]; Ignored: string[]; BadFront: BadFront[] } => {
  const Notes: VaultNote[] = []
  const Excluded: Excluded[] = []
  const Ignored: string[] = []
  const BadFront: BadFront[] = []
  for (const Rel of walk(vaultDir).sort()) {
    const Parts = Rel.split('/')
    const IsMd = Rel.endsWith('.md')
    if (!IsMd) {
      if (Rel.endsWith('.base')) Excluded.push({ relPath: Rel, reason: 'infra' })
      else if (Parts[0] !== 'images') Ignored.push(Rel)
      continue
    }
    if (Rel === 'README.md' || (InfraRootDirs.has(Parts[0]) && Parts.length > 1)) {
      Excluded.push({ relPath: Rel, reason: 'infra' })
      continue
    }
    if (Parts.slice(0, -1).some((p) => InfraDirs.has(p))) {
      Excluded.push({ relPath: Rel, reason: 'infra' })
      continue
    }
    const { note: N, bad } = parseNote(Rel, readFileSync(join(vaultDir, Rel), 'utf8'))
    if (bad) BadFront.push({ relPath: Rel, message: bad })
    if (N.data.publish === false) Excluded.push({ relPath: Rel, reason: 'publish-false' })
    else if (N.data.status === 'pending') Excluded.push({ relPath: Rel, reason: 'pending' })
    else Notes.push(N)
  }
  return { Notes, Excluded, Ignored, BadFront }
}

// slug 가 같은 노트가 둘 이상인 묶음만 낸다
export const findSlugClashes = (Notes: VaultNote[]): Map<string, VaultNote[]> => {
  const By = new Map<string, VaultNote[]>()
  for (const N of Notes) {
    const S = slugFromPath(N.relPath)
    By.set(S, [...(By.get(S) ?? []), N])
  }
  return new Map([...By].filter(([, g]) => g.length >= 2))
}

// 접미사 폴더 : stem 과 이름이 다른 가장 가까운 조상 폴더 (_MOC 는 MOC)
const suffixFolder = (N: VaultNote): string => {
  const Dirs = N.relPath.split('/').slice(0, -1).reverse()
  const F = Dirs.find((d) => d !== N.stem)
  if (!F) throw new Error(`접미사로 쓸 폴더가 없음 : ${N.relPath}`)
  return F === '_MOC' ? 'MOC' : F
}

// 충돌한 노트의 새 stem : `<stem> (<접미사 폴더>)`, 새 이름도 slug 가 겹치면 던진다
export const renameMap = (Clashes: Map<string, VaultNote[]>, All: VaultNote[]): Map<string, string> => {
  const Out = new Map<string, string>()
  for (const Group of Clashes.values()) {
    const Seen = new Map<string, VaultNote>()
    for (const N of Group) {
      const Name = `${N.stem} (${suffixFolder(N)})`
      const Key = slugFromPath(Name)
      const Prev = Seen.get(Key)
      if (Prev) throw new Error(`이름 충돌을 풀 수 없음 : ${Prev.relPath} / ${N.relPath}`)
      Seen.set(Key, N)
      const Other = All.find((M) => M !== N && slugFromPath(M.relPath) === Key)
      if (Other) throw new Error(`이름 충돌을 풀 수 없음 : ${Other.relPath} / ${N.relPath}`)
      Out.set(N.relPath, Name)
    }
  }
  return Out
}

export const toNode = (N: VaultNote): Node => ({
  collection: 'wiki',
  slug: slugFromPath(N.relPath),
  title: typeof N.data.title === 'string' ? N.data.title : N.stem,
  aliases: Array.isArray(N.data.aliases) ? N.data.aliases.map(String) : [],
  body: N.body,
  sourcePath: N.relPath,
})

// 어느 노트로도 해석되지 않는 링크 대상 (소문자 · 중복 없음 · 정렬)
export const computeBacklog = (Notes: VaultNote[]): string[] => {
  const Graph = buildGraph(Notes.map(toNode))
  const Missing = new Set<string>()
  for (const N of Notes) {
    for (const L of parseWikilinks(N.body)) {
      const T = L.target.trim()
      if (!T) continue
      if (Graph.resolve(T, { sourcePath: N.relPath })) continue
      Missing.add(backlogKey(T))
    }
  }
  return [...Missing].sort()
}
