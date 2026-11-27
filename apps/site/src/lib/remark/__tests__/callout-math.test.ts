import { pathToFileURL } from 'node:url'
import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { describe, expect, it } from 'vitest'
import { buildGraph, type Node } from '../../content/graph'
import { remarkCallout } from '../callout'
import { remarkHighlight } from '../highlight'
import { remarkWikilink } from '../wikilink'

const Arq: Node = { collection: 'wiki', slug: 'arq', title: 'ARQ', aliases: [], body: '' }
const G = buildGraph([Arq])

const render = async (md: string) => {
  const R = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [
      remarkCallout,
      remarkHighlight,
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

describe('remarkHighlight', () => {
  it('basic', async () => {
    expect(await render('앞 ==강조== 뒤')).toContain('<p>앞 <mark>강조</mark> 뒤</p>')
  })

  it('two in one line', async () => {
    expect(await render('==a== 와 ==b==')).toContain('<mark>a</mark> 와 <mark>b</mark>')
  })

  it('inside inline code untouched', async () => {
    const Html = await render('`==a==` 와 ==b==')
    expect(Html).toContain('<code>==a==</code>')
    expect(Html).toContain('<mark>b</mark>')
  })

  it('spaces inside, empty, and line break stay literal', async () => {
    expect(await render('== a ==')).not.toContain('<mark>')
    expect(await render('====')).not.toContain('<mark>')
    expect(await render('==가\n나==')).not.toContain('<mark>')
  })

  it('not inside math', async () => {
    const Html = await render('$a==b==c$')
    expect(Html).not.toContain('<mark>')
    expect(Html).toContain('katex')
  })

  it('dollar amounts do not block highlight', async () => {
    expect(await render('\\$5 ==할인== \\$6')).toContain('<mark>할인</mark>')
  })

  it('spans a wikilink', async () => {
    expect(await render('==([[ARQ]])==')).toMatch(/<mark>\(<a href="\/wiki\/arq" class="wikilink">ARQ<\/a>\)<\/mark>/)
  })

  it('spans strong', async () => {
    expect(await render('==**굵게**==')).toContain('<mark><strong>굵게</strong></mark>')
    expect(await render('앞 ==가 **굵게** 나== 뒤')).toContain('<mark>가 <strong>굵게</strong> 나</mark>')
  })

  it('spans inline code', async () => {
    expect(await render('==(`next` 의 offset)==')).toContain('<mark>(<code>next</code> 의 offset)</mark>')
  })

  it('unclosed across siblings stays literal', async () => {
    const Html = await render('==가 **굵게** 나')
    expect(Html).not.toContain('<mark>')
    expect(Html).toContain('==가')
  })

  it('inside a wikilink label does not break', async () => {
    const Html = await render('[[ARQ|==b==]]')
    expect(Html).toContain('class="wikilink"')
  })

  it('table cell', async () => {
    const Html = await render('| a |\n|---|\n| ==x== |')
    expect(Html).toContain('<td><mark>x</mark></td>')
  })
})
