import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { backlogKey } from '../../content/backlog'
import { buildGraph, type Node } from '../../content/graph'
import { writeBrokenReport, type BrokenLink } from '../../content/broken-report'
import { remarkWikilink } from '../wikilink'

const Gc: Node = { collection: 'wiki', slug: '가비지-컬렉션', title: '가비지 컬렉션', aliases: ['GC'], body: '' }
const Proxy: Node = { collection: 'posts', slug: 'proxy', title: '[시프] 프록시 서버 구현', aliases: [], body: '' }
const G = buildGraph([Gc, Proxy])
const ContentDir = '/vault'
const Assets = new Map([['그림 1.png', '_assets/obsidian/그림 1.png']])

const render = async (md: string, Backlog: string[] = []) => {
  const Broken: BrokenLink[] = []
  const R = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [[remarkWikilink, { contentDir: ContentDir, getGraph: () => G, getAssets: () => Assets, isBacklog: (t: string) => Backlog.includes(t.trim().toLowerCase()), onBroken: (b: BrokenLink) => Broken.push(b) }]],
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
    expect(html).toContain('<span class="wikilink-broken">없음</span>')
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

describe('backlog rendering', () => {
  it('renders pending span without warning', async () => {
    const R = await render('[[아직 없음|표시]] 와 [[진짜 없음]]', ['아직 없음'])
    expect(R.html).toContain('<span class="wikilink-pending">표시</span>')
    expect(R.html).not.toContain('<em')
    expect(R.Broken).toEqual([{ file: 'wiki/computer/노트.md', target: '진짜 없음' }])
  })

  it('resolved backlog target is a normal link', async () => {
    const R = await render('[[GC]]', ['gc'])
    expect(R.html).toContain('class="wikilink"')
    expect(R.html).not.toContain('wikilink-pending')
  })
})

describe('writeBrokenReport split', () => {
  it('writes broken and backlog to separate files and removes each when empty', () => {
    const Dir = mkdtempSync(join(tmpdir(), 'rep-'))
    const Path = join(Dir, 'reports/broken-links.md')
    const Back = join(Dir, 'reports/wiki-backlog.md')
    writeBrokenReport(Path, [
      { file: 'a.md', target: 'x', kind: 'broken' },
      { file: 'b.md', target: 'y', kind: 'backlog' },
    ])
    expect(readFileSync(Path, 'utf8')).toContain('| a.md | x |')
    expect(readFileSync(Path, 'utf8')).not.toContain('| b.md | y |')
    expect(readFileSync(Back, 'utf8')).toContain('| b.md | y |')
    writeBrokenReport(Path, [{ file: 'b.md', target: 'y', kind: 'backlog' }])
    expect(existsSync(Path)).toBe(false)
    expect(existsSync(Back)).toBe(true)
    writeBrokenReport(Path, [])
    expect(existsSync(Back)).toBe(false)
  })
})

describe('remarkWikilink typographic apostrophes (normalised even though smartypants is off)', () => {
  const Prim: Node = { collection: 'wiki', slug: 'prims-algorithm', title: "Prim's Algorithm", aliases: [], body: '' }
  const Pg = buildGraph([Prim])

  const renderSmart = async (md: string) => {
    const Broken: BrokenLink[] = []
    const R = await createMarkdownProcessor({
      syntaxHighlight: false,
      remarkPlugins: [[remarkWikilink, { contentDir: ContentDir, getGraph: () => Pg, getAssets: () => Assets, isBacklog: (t: string) => backlogKey(t) === "jensen's device", onBroken: (b: BrokenLink) => Broken.push(b) }]],
    })
    const { code } = await R.render(md, { fileURL: pathToFileURL('/vault/wiki/computer/노트.md') })
    return { html: decodeURI(code), Broken }
  }

  it('straight apostrophe in source links to the note', async () => {
    const { html, Broken } = await renderSmart("[[Prim's Algorithm]]")
    expect(html).toContain('href="/wiki/prims-algorithm"')
    expect(Broken).toEqual([])
  })

  it('curly apostrophe links to the note', async () => {
    expect((await renderSmart('[[Prim\u2019s Algorithm]]')).html).toContain('href="/wiki/prims-algorithm"')
  })

  it('backlog target renders pending without a warning in both forms', async () => {
    for (const Src of ["[[Jensen's Device]]", '[[Jensen\u2019s Device]]']) {
      const { html, Broken } = await renderSmart(Src)
      expect(html).toContain('wikilink-pending')
      expect(Broken).toEqual([])
    }
  })
})

describe('remarkWikilink clash names', () => {
  const W = (slug: string, sourcePath: string): Node => ({ collection: 'wiki', slug, title: `!important (${slug})`, aliases: ['!important'], body: '', sourcePath })
  const Css = W('css', '멋쟁이사자처럼/css/!important.md')
  const Js = W('js', '멋쟁이사자처럼/js/!important.md')
  const Cg = buildGraph([Js, Css])

  const renderAt = async (rel: string) => {
    const R = await createMarkdownProcessor({
      syntaxHighlight: false,
      remarkPlugins: [[remarkWikilink, { contentDir: ContentDir, getGraph: () => Cg, getAssets: () => Assets, onBroken: () => {} }]],
    })
    const { code } = await R.render('[[!important]]', { fileURL: pathToFileURL(`/vault/${rel}`) })
    return decodeURI(code)
  }

  it('resolves to the note nearest to the linking note', async () => {
    expect(await renderAt('wiki/computer/멋쟁이사자처럼/css/박스.md')).toContain('href="/wiki/css"')
    expect(await renderAt('wiki/computer/멋쟁이사자처럼/js/함수.md')).toContain('href="/wiki/js"')
  })
})
