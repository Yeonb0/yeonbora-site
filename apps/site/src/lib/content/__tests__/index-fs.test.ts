import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findBrokenLinks, getAssets, getGraph, getGraphSignature, invalidateContentIndex, loadNodes } from '../index-fs'

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

  it('no rescan until invalidated', () => {
    const Dir = vault()
    expect(getGraph(Dir).resolve('새 노트')).toBeUndefined()
    writeFileSync(join(Dir, 'wiki/computer/새 노트.md'), '새')
    expect(getGraph(Dir).resolve('새 노트')).toBeUndefined()
  })

  it('cache invalidates', () => {
    const Dir = vault()
    expect(getGraph(Dir).resolve('새 노트')).toBeUndefined()
    writeFileSync(join(Dir, 'wiki/computer/새 노트.md'), '새')
    invalidateContentIndex(Dir)
    expect(getGraph(Dir).resolve('새 노트')?.slug).toBe('새-노트')
  })

  it('slug collision is a duplicate', () => {
    const Dir = vault()
    writeFileSync(join(Dir, 'wiki/computer/C.md'), 'c')
    writeFileSync(join(Dir, 'wiki/computer/C++.md'), 'c++')
    expect(getGraph(Dir).duplicates).toContain('c')
  })
})

describe('getGraphSignature', () => {
  it('changes with titles and aliases, not with bodies', () => {
    const Dir = vault()
    const A = getGraphSignature(Dir)
    writeFileSync(join(Dir, 'wiki/computer/Stop-and-Wait.md'), '---\naliases: [정지-대기]\n---\n본문만 바뀜')
    invalidateContentIndex(Dir)
    expect(getGraphSignature(Dir)).toBe(A)
    writeFileSync(join(Dir, 'wiki/computer/Stop-and-Wait.md'), '---\naliases: [정지-대기, SW]\n---\n본문만 바뀜')
    invalidateContentIndex(Dir)
    expect(getGraphSignature(Dir)).not.toBe(A)
  })
})

describe('getAssets', () => {
  it('maps file names to paths', () => {
    expect(getAssets(vault()).get('그림 1.png')).toBe('_assets/obsidian/그림 1.png')
  })
})

describe('findBrokenLinks', () => {
  it('lists unresolved links and image embeds, skipping comments and code', () => {
    const Dir = vault()
    writeFileSync(join(Dir, 'wiki/computer/ACK.md'), '[[Stop-and-Wait]] [[없음]] ![[그림 1.png]] ![[없는.png]] ![[노트]] %% [[주석 안]] %% `[[코드]]`')
    writeFileSync(join(Dir, 'wiki/computer/TCP.md'), '[[#혼잡 제어]] [[#흐름|여기]]')
    invalidateContentIndex(Dir)
    expect(findBrokenLinks(Dir)).toEqual([
      { file: 'wiki/computer/ACK.md', target: '없는.png' },
      { file: 'wiki/computer/ACK.md', target: '없음' },
    ])
  })
})
