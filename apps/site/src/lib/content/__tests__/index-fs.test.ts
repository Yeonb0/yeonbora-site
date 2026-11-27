import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getAssets, getGraph, loadNodes } from '../index-fs'

const vault = () => {
  const Dir = mkdtempSync(join(tmpdir(), 'vault-'))
  for (const D of ['wiki/computer', 'posts/jekyll', '.obsidian', '_assets/obsidian']) mkdirSync(join(Dir, D), { recursive: true })
  writeFileSync(join(Dir, 'wiki/computer/Stop-and-Wait.md'), '---\naliases: [정지-대기]\n---\n[[ACK]] 대기')
  writeFileSync(join(Dir, 'posts/jekyll/framing.md'), "---\ntitle: '[Network] Framing'\n---\n[[정지-대기]]")
  writeFileSync(join(Dir, '.obsidian/x.md'), 'x')
  writeFileSync(join(Dir, '_assets/a.md'), 'a')
  writeFileSync(join(Dir, '_assets/obsidian/그림 1.png'), '')
  return Dir
}

describe('loadNodes', () => {
  it('loads wiki and posts', () => {
    const Nodes = loadNodes(vault())
    expect(Nodes.map((n) => [n.collection, n.slug, n.title])).toEqual(
      expect.arrayContaining([
        ['wiki', 'stop-and-wait', 'Stop-and-Wait'],
        ['posts', 'framing', '[Network] Framing'],
      ]),
    )
    expect(Nodes).toHaveLength(2)
    expect(Nodes.find((n) => n.collection === 'wiki')?.aliases).toEqual(['정지-대기'])
    expect(Nodes.find((n) => n.collection === 'wiki')?.body.trim()).toBe('[[ACK]] 대기')
  })
})

describe('getGraph', () => {
  it('cache hit', () => {
    const Dir = vault()
    expect(getGraph(Dir)).toBe(getGraph(Dir))
  })

  it('cache invalidates', () => {
    const Dir = vault()
    expect(getGraph(Dir).resolve('새 노트')).toBeUndefined()
    const F = join(Dir, 'wiki/computer/새 노트.md')
    writeFileSync(F, '새')
    utimesSync(F, new Date(), new Date(Date.now() + 5000))
    expect(getGraph(Dir).resolve('새 노트')?.slug).toBe('새-노트')
  })
})

describe('getAssets', () => {
  it('maps file names to paths', () => {
    expect(getAssets(vault()).get('그림 1.png')).toBe('_assets/obsidian/그림 1.png')
  })
})
