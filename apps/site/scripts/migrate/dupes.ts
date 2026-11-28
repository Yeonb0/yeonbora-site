// 출처 사이 중복 글 찾기 : 같은 제목 (posts 끼리) 또는 거의 같은 본문 (posts · wiki 모두)
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { linkKey } from '../../src/lib/content/wikilink'

export interface Dupe {
  pair: [string, string]
  reason: 'title' | 'body'
  // 본문 3-gram Jaccard
  score: number
}

interface Doc {
  path: string
  source: string
  post: boolean
  titleKey: string
  grams: Set<number>
  sketch: number[]
}

const FrontRe = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const SketchSize = 64
const BodyMin = 0.8

const hash32 = (s: string) => createHash('md5').update(s).digest().readUInt32LE(0)

// 비교용 글자 : 코드 · 링크 문법 · 표시 주석 · 공백 · 문장부호를 뺀 글자만
const plain = (Body: string) =>
  Body.replace(/%%[^\n]*?%%/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
    .replace(/\]\([^)]*\)/g, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '')

const toDoc = (Rel: string, Text: string): Doc => {
  const M = Text.match(FrontRe)
  let Data: Record<string, unknown> = {}
  try {
    Data = (M && parse(M[1])) || {}
  } catch {
    // frontmatter 오류는 스키마 검사가 잡는다
  }
  const Chars = [...plain(M ? Text.slice(M[0].length) : Text)]
  const Grams = new Set<number>()
  for (let i = 0; i + 3 <= Chars.length; i++) Grams.add(hash32(Chars.slice(i, i + 3).join('')))
  const Title = String(Data.title ?? Rel.split('/').pop()?.replace(/\.md$/, '') ?? '')
  return {
    path: Rel,
    source: String(Data.source ?? Rel.split('/')[1] ?? ''),
    post: Rel.startsWith('posts/'),
    titleKey: linkKey(Title.replace(/^\[[^\]]*\]\s*/, '')),
    grams: Grams,
    sketch: [...Grams].sort((a, b) => a - b).slice(0, SketchSize),
  }
}

const jaccard = (A: Set<number>, B: Set<number>) => {
  if (!A.size || !B.size) return 0
  const [Small, Big] = A.size < B.size ? [A, B] : [B, A]
  let Both = 0
  for (const G of Small) if (Big.has(G)) Both++
  return Both / (A.size + B.size - Both)
}

export const loadDocs = (contentDir: string): Doc[] =>
  ['posts', 'wiki'].flatMap((Top) => {
    let Files: string[] = []
    try {
      Files = (readdirSync(join(contentDir, Top), { recursive: true }) as string[]).map((f) => f.split('\\').join('/'))
    } catch {
      return []
    }
    return Files.filter((f) => f.endsWith('.md')).map((f) => toDoc(`${Top}/${f}`, readFileSync(join(contentDir, Top, f), 'utf8')))
  })

export const findDupes = (contentDir: string, Opts: { only?: string } = {}): Dupe[] => {
  const Docs = loadDocs(contentDir)
  const Candidates = new Set<string>()
  const add = (i: number, j: number) => {
    const [a, b] = i < j ? [i, j] : [j, i]
    if (a !== b && Docs[a].source !== Docs[b].source) Candidates.add(`${a},${b}`)
  }
  // 같은 제목 후보
  const ByTitle = new Map<string, number[]>()
  Docs.forEach((D, i) => D.titleKey && ByTitle.set(D.titleKey, [...(ByTitle.get(D.titleKey) ?? []), i]))
  for (const Ids of ByTitle.values()) for (const i of Ids) for (const j of Ids) add(i, j)
  // 본문 후보 : 가장 작은 3-gram 해시 묶음이 많이 겹치는 짝만
  const BySketch = new Map<number, number[]>()
  Docs.forEach((D, i) => D.sketch.forEach((h) => BySketch.set(h, [...(BySketch.get(h) ?? []), i])))
  const Shared = new Map<string, number>()
  for (const Ids of BySketch.values()) {
    if (Ids.length > 50) continue
    for (const i of Ids) for (const j of Ids) if (i < j) Shared.set(`${i},${j}`, (Shared.get(`${i},${j}`) ?? 0) + 1)
  }
  for (const [K, N] of Shared) if (N >= SketchSize / 4) add(...(K.split(',').map(Number) as [number, number]))

  const Out: Dupe[] = []
  for (const K of Candidates) {
    const [A, B] = K.split(',').map((i) => Docs[Number(i)])
    if (Opts.only && A.source !== Opts.only && B.source !== Opts.only) continue
    const Score = jaccard(A.grams, B.grams)
    // M4 결정 : 강의 정리 글과 같은 제목 wiki 는 본문이 다르면 둘 다 남긴다
    const Reason = Score >= BodyMin ? 'body' : A.post && B.post && A.titleKey === B.titleKey ? 'title' : undefined
    if (Reason) Out.push({ pair: [A.path, B.path].sort() as [string, string], reason: Reason, score: Math.round(Score * 100) / 100 })
  }
  return Out.sort((a, b) => b.score - a.score || a.pair[0].localeCompare(b.pair[0]))
}

export const renderDupes = (D: Dupe[]): string =>
  ['# 출처 사이 중복', '', `- 짝 ${D.length}개 (본문 ${D.filter((d) => d.reason === 'body').length} · 제목만 ${D.filter((d) => d.reason === 'title').length})`, '', ...D.map((d) => `- ${d.reason === 'body' ? '본문' : '제목'} ${d.score} : ${d.pair[0]} ↔ ${d.pair[1]}`), ''].join('\n')

// pnpm migrate:dupes [--only <출처>]
if (process.argv[1]?.endsWith('dupes.ts')) {
  const Only = process.argv.indexOf('--only')
  const D = findDupes(join(import.meta.dirname, '../../src/content'), Only > 0 ? { only: process.argv[Only + 1] } : {})
  const Report = join(import.meta.dirname, '../../../../reports/dupes.md')
  writeFileSync(Report, renderDupes(D))
  console.log(`짝 ${D.length}개 · 리포트 reports/dupes.md`)
  process.exitCode = D.length ? 2 : 0
}
