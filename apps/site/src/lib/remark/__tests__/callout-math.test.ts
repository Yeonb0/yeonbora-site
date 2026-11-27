import { pathToFileURL } from 'node:url'
import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { describe, expect, it } from 'vitest'
import { buildGraph, type Node } from '../../content/graph'
import { remarkCallout } from '../callout'
import { remarkWikilink } from '../wikilink'

const Arq: Node = { collection: 'wiki', slug: 'arq', title: 'ARQ', aliases: [], body: '' }
const G = buildGraph([Arq])

const render = async (md: string) => {
  const R = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [
      remarkCallout,
      remarkMath,
      [remarkWikilink, { contentDir: '/vault', getGraph: () => G, getAssets: () => new Map(), onBroken: () => {} }],
    ],
    rehypePlugins: [rehypeKatex],
  })
  const { code } = await R.render(md, { fileURL: pathToFileURL('/vault/wiki/computer/노트.md') })
  return decodeURI(code).trim()
}

describe('remarkCallout', () => {
  it('note callout', async () => {
    const Html = await render('> [!note] 제목\n> 본문 *강조*')
    expect(Html).toContain('<aside class="callout callout-note">')
    expect(Html).toContain('<p class="callout-title">제목</p>')
    expect(Html).toContain('<em>강조</em>')
    expect(Html).not.toContain('<blockquote')
  })

  it('foldable callout is details', async () => {
    const Closed = await render('> [!note]- 접힘\n> 안')
    expect(Closed).toContain('<details class="callout callout-note">')
    expect(Closed).toContain('<summary class="callout-title">접힘</summary>')
    expect(await render('> [!warning]+ 열림\n> 안')).toContain('<details class="callout callout-warning" open>')
  })

  it('Example 대소문자', async () => {
    const Html = await render('> [!Example]\n> 내용')
    expect(Html).toContain('callout callout-example')
    expect(Html).toContain('<p class="callout-title">Example</p>')
    expect(await render('> [!note]\n> x')).toContain('<p class="callout-title">Note</p>')
  })

  it('callout body keeps wikilinks', async () => {
    expect(await render('> [!note] t\n> 보기 [[ARQ]]')).toContain('<a href="/wiki/arq" class="wikilink">ARQ</a>')
  })

  it('plain blockquote stays', async () => {
    expect(await render('> 그냥 인용')).toContain('<blockquote>')
  })
})

describe('math', () => {
  it('inline and block math render katex', async () => {
    const Html = await render('인라인 $O(n \\log n)$\n\n$$\n\\sum_{i=1}^n i\n$$')
    expect(Html.match(/class="katex"/g)!.length).toBeGreaterThanOrEqual(2)
    expect(Html).toContain('katex-display')
  })

  it('math inside code is untouched', async () => {
    const Html = await render('`$x$`\n\n```\n$$a$$\n```')
    expect(Html).not.toContain('katex')
    expect(Html).toContain('$x$')
  })

  it('table cell wikilink with escaped pipe and br', async () => {
    const Html = await render('| a |\n|---|\n| [[ARQ\\|자동 재전송]]<br>둘째 줄 |')
    expect(Html).toMatch(/<a [^>]*>자동 재전송<\/a><br ?\/?>/)
  })
})
