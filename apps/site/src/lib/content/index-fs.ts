// 콘텐츠 폴더를 직접 읽어 그래프를 만든다 : remark 플러그인은 astro:content 를 쓸 수 없어서
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { backlogKey, loadBacklog } from './backlog'
import { buildGraph, type Collection, type Graph, type Node } from './graph'
import type { BrokenLink } from './broken-report'
import { maskCode, parseInner, slugFromPath } from './wikilink'

const FrontRe = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

const listFiles = (dir: string): string[] => {
  try {
    return (readdirSync(dir, { recursive: true }) as string[]).map((f) => f.split('\\').join('/'))
  } catch {
    return []
  }
}

const parseNote = (collection: Collection, path: string, text: string): Node => {
  const M = text.match(FrontRe)
  let Data: Record<string, unknown> = {}
  try {
    Data = (M && parse(M[1])) || {}
  } catch {
    // frontmatter 오류는 스키마 검사가 잡는다
  }
  const Stem = (path.split('/').pop() ?? path).replace(/\.md$/, '')
  return {
    collection,
    slug: slugFromPath(path),
    title: typeof Data.title === 'string' ? Data.title : Stem,
    aliases: Array.isArray(Data.aliases) ? Data.aliases.map(String) : [],
    body: M ? text.slice(M[0].length) : text,
    sourcePath: typeof Data.sourcePath === 'string' ? Data.sourcePath : undefined,
  }
}

export const loadNodes = (contentDir: string): Node[] => {
  const Nodes: Node[] = []
  for (const C of ['wiki', 'posts'] as const) {
    for (const F of listFiles(join(contentDir, C))) {
      if (!F.endsWith('.md')) continue
      Nodes.push(parseNote(C, F, readFileSync(join(contentDir, C, F), 'utf8')))
    }
  }
  return Nodes
}

// 한 번 읽으면 invalidateContentIndex 전까지 그대로 쓴다 : 렌더마다 폴더를 다시 훑지 않는다
// 개발 서버에서는 graph-loader 의 watcher 가 노트가 바뀔 때 무효화한다
type Indexed = { graph: Graph; assets: Map<string, string>; nodes: Node[]; backlog: Set<string> }
// astro.config (remark) 와 content.config (loader) 가 서로 다른 모듈 인스턴스로 불러도 같은 캐시를 보게 globalThis 에 둔다
const Global = globalThis as typeof globalThis & { __contentIndex?: Map<string, Indexed> }
const Cache = (Global.__contentIndex ??= new Map<string, Indexed>())

// backlog 파일 경로 : 콘텐츠 폴더마다 astro.config 가 한 번 정한다 (색인이 다시 만들어질 때 파일을 읽는다)
const GlobalBacklog = globalThis as typeof globalThis & { __contentBacklogPath?: Map<string, string> }
const BacklogPaths = (GlobalBacklog.__contentBacklogPath ??= new Map<string, string>())

export const setBacklogPath = (contentDir: string, path: string) => {
  if (BacklogPaths.get(contentDir) === path) return
  BacklogPaths.set(contentDir, path)
  Cache.delete(contentDir)
}

export const invalidateContentIndex = (contentDir: string) => {
  Cache.delete(contentDir)
}

const load = (contentDir: string) => {
  const Hit = Cache.get(contentDir)
  if (Hit) return Hit
  const Assets = new Map<string, string>()
  for (const F of listFiles(join(contentDir, '_assets'))) {
    const Name = F.split('/').pop() ?? F
    if (Name.includes('.') && !Assets.has(Name)) Assets.set(Name, `_assets/${F}`)
  }
  const Nodes = loadNodes(contentDir)
  const BacklogPath = BacklogPaths.get(contentDir)
  const Entry = { graph: buildGraph(Nodes), assets: Assets, nodes: Nodes, backlog: BacklogPath ? loadBacklog(BacklogPath) : new Set<string>() }
  Cache.set(contentDir, Entry)
  return Entry
}

// 링크 해석에 영향을 주는 것만 (제목 · aliases · slug · sourcePath · 첨부 이름 · backlog) : 본문은 빠진다
export const getGraphSignature = (contentDir: string): string => {
  const { nodes, assets, backlog } = load(contentDir)
  const Lines = nodes.map((n) => [n.collection, n.slug, n.title, n.sourcePath ?? '', ...n.aliases].join('\u0001')).sort()
  return createHash('sha1')
    .update([...Lines, ...[...assets.keys()].sort(), ...[...backlog].sort().map((b) => `backlog:${b}`)].join('\n'))
    .digest('hex')
}

export const getGraph = (contentDir: string): Graph => load(contentDir).graph

// 아직 쓰지 않은 노트로 가는 링크인가 (이름은 소문자 · 앞뒤 공백 제거로 맞춘다)
export const isBacklog = (contentDir: string, target: string): boolean => load(contentDir).backlog.has(backlogKey(target))

// 첨부 파일 이름 → 콘텐츠 폴더 기준 경로 (Obsidian 처럼 파일명만으로 찾는다)
export const getAssets = (contentDir: string): Map<string, string> => load(contentDir).assets

const EmbedRe = /(!?)\[\[([^\[\]\n]+?)\]\]/g
const ImageRe = /\.(png|jpe?g|gif|webp|svg|avif)$/i

// 깨진 링크 목록 : 렌더 결과는 캐시되므로 리포트는 파일에서 직접 계산한다
export const findBrokenLinks = (contentDir: string): BrokenLink[] => {
  const { graph, assets, backlog } = load(contentDir)
  const Out = new Map<string, BrokenLink>()
  for (const C of ['wiki', 'posts'] as const) {
    for (const F of listFiles(join(contentDir, C))) {
      if (!F.endsWith('.md')) continue
      const Text = readFileSync(join(contentDir, C, F), 'utf8')
      const Body = maskCode(Text.replace(FrontRe, '')).replace(/%%[\s\S]*?%%/g, (m) => ' '.repeat(m.length))
      for (const M of Body.matchAll(EmbedRe)) {
        const L = parseInner(M[0], M[2])
        // [[#소제목]] 은 같은 노트 안 링크
        if (!M[1] && !L.target && L.heading) continue
        const Missing = M[1] ? ImageRe.test(L.target) && !assets.has(L.target) : !graph.resolve(L.target)
        if (!Missing) continue
        // 이미지 임베드는 backlog 가 아니다
        const Kind = !M[1] && backlog.has(backlogKey(L.target)) ? 'backlog' : 'broken'
        Out.set(`${C}/${F}\u0000${L.target}`, { file: `${C}/${F}`, target: L.target, kind: Kind })
      }
    }
  }
  return [...Out.values()].sort((x, y) => x.file.localeCompare(y.file) || x.target.localeCompare(y.target))
}
