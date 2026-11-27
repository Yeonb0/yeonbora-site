import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { buildGraph, type Node } from '../../content/graph'
import { writeBrokenReport, type BrokenLink } from '../../content/broken-report'
import { remarkWikilink } from '../wikilink'

const Gc: Node = { collection: 'wiki', slug: '가비지-컬렉션', title: '가비지 컬렉션', aliases: ['GC'], body: '' }
const Proxy: Node = { collection: 'posts', slug: 'proxy', title: '[시프] 프록시 서버 구현', aliases: [], body: '' }
const G = buildGraph([Gc, Proxy])
const ContentDir = '/vault'
const Assets = new Map([['그림 1.png', '_assets/obsidian/그림 1.png']])

const render = async (md: string) => {
  const Broken: BrokenLink[] = []
  const R = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [[remarkWikilink, { contentDir: ContentDir, getGraph: () => G, getAssets: () => Assets, onBroken: (b: BrokenLink) => Broken.push(b) }]],
  })
  const { code } = await R.render(md, { fileURL: pathToFileURL('/vault/wiki/computer/노트.md') })
  return { html: decodeURI(code), Broken }
}

describe('remarkWikilink', () => {
  it('links wiki', async () => {
    expect((await render('[[GC]]는')).html).toContain('<a href="/wiki/가비지-컬렉션" class="wikilink">GC</a>는')
  })

  it('links post by file name', async () => {
    expect((await render('[[proxy]]')).html).toContain('href="/posts/proxy"')
  })

  it('label and heading', async () => {
    expect((await render('[[GC#세대 구분|세대]]')).html).toContain('<a href="/wiki/가비지-컬렉션#세대-구분" class="wikilink">세대</a>')
  })

  it('table pipe', async () => {
    const { html } = await render('| a |\n|---|\n| [[GC\\|지씨]] |')
    expect(html.match(/<td>/g)).toHaveLength(1)
    expect(html).toContain('<a href="/wiki/가비지-컬렉션" class="wikilink">지씨</a>')
  })

  it('broken', async () => {
    const { html, Broken } = await render('[[없음]]')
    expect(html).toContain('<span class="wikilink-broken" data-target="없음">없음</span>')
    expect(Broken).toEqual([{ file: 'wiki/computer/노트.md', target: '없음' }])
  })

  it('same-note heading', async () => {
    const { html, Broken } = await render('[[#세대 구분]] [[#세대 구분|여기]]')
    expect(html).toContain('<a href="#세대-구분" class="wikilink">세대 구분</a>')
    expect(html).toContain('<a href="#세대-구분" class="wikilink">여기</a>')
    expect(Broken).toEqual([])
  })

  it('code untouched', async () => {
    const { html } = await render('`[[GC]]`\n\n```\n[[GC]]\n```')
    expect(html).not.toContain('<a')
    expect(html.match(/\[\[GC\]\]/g)).toHaveLength(2)
  })

  it('image embed', async () => {
    const { html } = await render('![[그림 1.png]]')
    expect(html).toContain('<img')
    expect(html).not.toContain('![[')
  })

  it('note embed stays', async () => {
    expect((await render('![[GC]]')).html).toContain('![[GC]]')
  })

  it('missing image embed is broken', async () => {
    const { html, Broken } = await render('![[없는 그림.png]]')
    expect(html).toContain('![[없는 그림.png]]')
    expect(Broken).toEqual([{ file: 'wiki/computer/노트.md', target: '없는 그림.png' }])
  })
})

describe('writeBrokenReport', () => {
  it('writes a table and removes the file when nothing is broken', () => {
    const Path = join(mkdtempSync(join(tmpdir(), 'rep-')), 'reports/broken-links.md')
    writeBrokenReport(Path, [{ file: 'a.md', target: 'x' }])
    expect(readFileSync(Path, 'utf8')).toContain('| a.md | x |')
    writeBrokenReport(Path, [])
    expect(existsSync(Path)).toBe(false)
  })
})
