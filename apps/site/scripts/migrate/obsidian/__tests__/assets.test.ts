import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyImages } from '../assets'
import type { VaultNote } from '../vault'
import { makeVault } from './fixture'

const note = (relPath: string, body: string): VaultNote => ({
  relPath,
  stem: relPath.replace(/\.md$/, ''),
  data: {},
  rawFront: null,
  body,
})

const setup = (Images: Record<string, string>) => {
  const Vault = makeVault(Object.fromEntries(Object.entries(Images).map(([n, t]) => [`images/${n}`, t])))
  const Assets = mkdtempSync(join(tmpdir(), 'assets-'))
  return { ImagesDir: join(Vault, 'images'), Assets }
}

describe('copyImages', () => {
  it('copies only referenced images', () => {
    const { ImagesDir, Assets } = setup({ 'a.png': 'A', 'b.png': 'B', 'c.png': 'C' })
    const R = copyImages([note('n.md', '![[a.png]] text ![[b.png\\|300]]')], ImagesDir, Assets)
    expect(R.Copied).toEqual(['a.png', 'b.png'])
    expect(readFileSync(join(Assets, 'obsidian', 'a.png'), 'utf8')).toBe('A')
    expect(existsSync(join(Assets, 'obsidian', 'c.png'))).toBe(false)
  })

  it('same content is skipped, different content is a clash', () => {
    const { ImagesDir, Assets } = setup({ 'a.png': 'A', 'b.png': 'B' })
    mkdirSync(join(Assets, 'obsidian'))
    writeFileSync(join(Assets, 'obsidian', 'a.png'), 'A')
    writeFileSync(join(Assets, 'obsidian', 'b.png'), 'OTHER')
    const R = copyImages([note('n.md', '![[a.png]] ![[b.png]]')], ImagesDir, Assets)
    expect(R.Same).toEqual(['a.png'])
    expect(R.Clash).toEqual(['b.png'])
    expect(R.Copied).toEqual([])
    expect(readFileSync(join(Assets, 'obsidian', 'b.png'), 'utf8')).toBe('OTHER')
  })

  it('missing image reported', () => {
    const { ImagesDir, Assets } = setup({})
    const R = copyImages([note('x/n.md', '![[gone.png]]')], ImagesDir, Assets)
    expect(R.Missing).toEqual([{ note: 'x/n.md', name: 'gone.png' }])
    expect(R.Copied).toEqual([])
  })

  it('same name in a sibling folder is a clash or same', () => {
    const { ImagesDir, Assets } = setup({ 'a.png': 'A', 'b.png': 'B' })
    mkdirSync(join(Assets, 'jekyll'))
    writeFileSync(join(Assets, 'jekyll', 'a.png'), 'A')
    writeFileSync(join(Assets, 'jekyll', 'b.png'), 'OTHER')
    const R = copyImages([note('n.md', '![[a.png]] ![[b.png]]')], ImagesDir, Assets)
    expect(R.Same).toEqual(['a.png'])
    expect(R.Clash).toEqual(['b.png'])
    expect(existsSync(join(Assets, 'obsidian', 'b.png'))).toBe(false)
  })

  it('uses basename, ignores code and note embeds, accepts uppercase ext', () => {
    const { ImagesDir, Assets } = setup({ 'a.png': 'A', 'p.JPG': 'P', 'code.png': 'X' })
    const Body = ['![[images/a.png]]', '![[p.JPG]]', '![[some note]]', '`![[code.png]]`', '```', '![[code.png]]', '```'].join('\n')
    const R = copyImages([note('n.md', Body)], ImagesDir, Assets)
    expect(R.Copied).toEqual(['a.png', 'p.JPG'])
    expect(R.Missing).toEqual([])
  })

  it('processes each name once and lists each missing pair', () => {
    const { ImagesDir, Assets } = setup({ 'a.png': 'A' })
    const R = copyImages(
      [note('2.md', '![[a.png]] ![[z.png]]'), note('1.md', '![[a.png]] ![[z.png]]')],
      ImagesDir,
      Assets,
    )
    expect(R.Copied).toEqual(['a.png'])
    expect(R.Missing).toEqual([
      { note: '1.md', name: 'z.png' },
      { note: '2.md', name: 'z.png' },
    ])
  })

  it('same only if every same-named file is identical', () => {
    const { ImagesDir, Assets } = setup({ 'a.png': 'A' })
    mkdirSync(join(Assets, 'obsidian'))
    mkdirSync(join(Assets, 'jekyll'))
    writeFileSync(join(Assets, 'obsidian', 'a.png'), 'A')
    writeFileSync(join(Assets, 'jekyll', 'a.png'), 'OTHER')
    const R = copyImages([note('n.md', '![[a.png]]')], ImagesDir, Assets)
    expect(R.Clash).toEqual(['a.png'])
    expect(R.Same).toEqual([])
    expect(R.Copied).toEqual([])
    expect(readFileSync(join(Assets, 'obsidian', 'a.png'), 'utf8')).toBe('A')
  })
})
