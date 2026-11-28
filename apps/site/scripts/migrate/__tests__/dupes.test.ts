import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findDupes } from '../dupes'

// 씨앗마다 겹치지 않는 한글 400자
const Long = (Seed: string) => Array.from({ length: 400 }, (_, k) => String.fromCharCode(0xac00 + ((Seed.charCodeAt(0) * 131 + k * 17) % 11000))).join('')
const content = (Files: Record<string, string>) => {
  const Dir = mkdtempSync(join(tmpdir(), 'dupes-'))
  for (const [Path, Text] of Object.entries(Files)) {
    mkdirSync(dirname(join(Dir, Path)), { recursive: true })
    writeFileSync(join(Dir, Path), Text)
  }
  return Dir
}
const post = (Source: string, Title: string, Body: string) => `---\ntitle: ${Title}\nsource: ${Source}\n---\n\n${Body}\n`

describe('findDupes', () => {
  it('finds same-body pair across sources', () => {
    const Dir = content({
      'posts/notion/a.md': post('notion', '힙 정렬', Long('힙')),
      'posts/jekyll/b.md': post('jekyll', '[자구] 힙 정렬 정리', Long('힙') + '\n덧붙인 한 줄'),
      'posts/jekyll/c.md': post('jekyll', '다른 글', Long('트리')),
    })
    const D = findDupes(Dir)
    expect(D).toHaveLength(1)
    expect(D[0].pair).toEqual(['posts/jekyll/b.md', 'posts/notion/a.md'])
    expect(D[0].reason).toBe('body')
  })
  it('finds same-title posts from different sources even with different bodies', () => {
    const Dir = content({
      'posts/notion/a.md': post('notion', '객체', Long('가')),
      'posts/tistory/b.md': post('tistory', '객체', Long('나')),
    })
    expect(findDupes(Dir).map((d) => d.reason)).toEqual(['title'])
  })
  it('ignores wiki-post pairs with the same title but different bodies', () => {
    const Dir = content({
      'posts/notion/a.md': post('notion', '객체', Long('가')),
      'wiki/computer/x/객체.md': post('obsidian', '객체', Long('나')),
    })
    expect(findDupes(Dir)).toEqual([])
  })
  it('ignores pairs from the same source', () => {
    const Dir = content({
      'posts/notion/a.md': post('notion', 'A', Long('가')),
      'posts/notion/b.md': post('notion', 'B', Long('가')),
    })
    expect(findDupes(Dir)).toEqual([])
  })
})
