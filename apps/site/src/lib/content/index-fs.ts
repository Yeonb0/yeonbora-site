// 콘텐츠 폴더를 직접 읽어 그래프를 만든다 : remark 플러그인은 astro:content 를 쓸 수 없어서
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { buildGraph, type Collection, type Graph, type Node } from './graph'
import { slugFromPath } from './wikilink'

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

// 파일 수 + 가장 늦은 mtime : 개발 서버에서 노트를 더하거나 고치면 바뀐다
const signature = (contentDir: string): string => {
  let Count = 0
  let Latest = 0
  for (const C of ['wiki', 'posts', '_assets']) {
    for (const F of listFiles(join(contentDir, C))) {
      Count++
      Latest = Math.max(Latest, statSync(join(contentDir, C, F)).mtimeMs)
    }
  }
  return `${Count}:${Latest}`
}

const Cache = new Map<string, { sig: string; graph: Graph; assets: Map<string, string> }>()

const load = (contentDir: string) => {
  const Sig = signature(contentDir)
  const Hit = Cache.get(contentDir)
  if (Hit && Hit.sig === Sig) return Hit
  const Assets = new Map<string, string>()
  for (const F of listFiles(join(contentDir, '_assets'))) {
    const Name = F.split('/').pop() ?? F
    if (Name.includes('.') && !Assets.has(Name)) Assets.set(Name, `_assets/${F}`)
  }
  const Entry = { sig: Sig, graph: buildGraph(loadNodes(contentDir)), assets: Assets }
  Cache.set(contentDir, Entry)
  return Entry
}

export const getGraph = (contentDir: string): Graph => load(contentDir).graph

// 첨부 파일 이름 → 콘텐츠 폴더 기준 경로 (Obsidian 처럼 파일명만으로 찾는다)
export const getAssets = (contentDir: string): Map<string, string> => load(contentDir).assets
