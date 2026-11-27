// Main 노트 한 편을 wiki 노트로 바꾼다 : frontmatter 만 새로 쓰고 본문은 그대로 붙인다
import { stringify } from 'yaml'
import { courseOf, topicOf } from './topics'
import type { VaultNote } from './vault'

export interface ConvertOpts {
  created?: string
  newStem?: string
}

// 새 frontmatter 가 직접 쓰는 키 : 나머지 Main 키는 원래 순서대로 뒤에 붙는다
const Handled = new Set(['title', 'aliases', 'tags', 'field', 'topic', 'course', 'source', 'sourcePath', 'created', 'autolink'])

const toList = (v: unknown): unknown[] => {
  if (v === null || v === undefined) return []
  if (Array.isArray(v)) return [...v]
  return [v]
}

const toDay = (v: unknown): string | undefined => {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString().slice(0, 10)
  if (typeof v === 'string' && v.trim()) {
    const M = v.trim().match(/^\d{4}-\d{2}-\d{2}/)
    if (M) return M[0]
    const D = new Date(v)
    return Number.isNaN(D.getTime()) ? v.trim() : D.toISOString().slice(0, 10)
  }
  return undefined
}

export const convertNote = (Note: VaultNote, Opts: ConvertOpts): { path: string; text: string } => {
  const Stem = Opts.newStem ?? Note.stem
  const Aliases = toList(Note.data.aliases)
  if (Opts.newStem) {
    const I = Aliases.indexOf(Note.stem)
    if (I >= 0) Aliases.splice(I, 1)
    Aliases.unshift(Note.stem)
  }

  const Front: Record<string, unknown> = {
    title: Stem,
    aliases: Aliases,
    tags: toList(Note.data.tags),
    field: 'computer',
    topic: topicOf(Note.relPath),
    ...(courseOf(Note.relPath) ? { course: [courseOf(Note.relPath)] } : {}),
    source: 'obsidian',
    sourcePath: Note.relPath,
  }
  const Created = toDay(Note.data.created) ?? Opts.created
  if (Created) Front.created = Created
  if (Note.data.autolink === false) Front.autolink = false

  for (const [K, V] of Object.entries(Note.data)) {
    if (K === 'source') Front.sourceDoc = V
    else if (!Handled.has(K)) Front[K] = V
  }

  const Yaml = stringify(Front, { lineWidth: 0, indentSeq: true }).replace(/\r\n/g, '\n')
  const Dir = Note.relPath.includes('/') ? Note.relPath.slice(0, Note.relPath.lastIndexOf('/') + 1) : ''
  return { path: `wiki/computer/${Dir}${Stem}.md`, text: `---\n${Yaml}---\n${Note.body}` }
}
