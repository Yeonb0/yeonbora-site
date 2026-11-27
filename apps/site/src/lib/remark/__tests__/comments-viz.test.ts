import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { remarkStripComments } from '../comments'
import { remarkViz } from '../viz'

const render = async (md: string) => {
  const Warn: string[] = []
  const onWarn = (m: string) => Warn.push(m)
  const R = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [
      [remarkStripComments, { onWarn }],
      [remarkViz, { onWarn }],
    ],
  })
  const Out = await R.render(md)
  return { html: Out.code.trim(), Warn, frontmatter: Out.metadata.frontmatter as Record<string, unknown> }
}

describe('remarkStripComments', () => {
  it('inline', async () => {
    expect((await render('앞 %% typo? : 확인 %% 뒤')).html).toBe('<p>앞  뒤</p>')
  })

  it('block', async () => {
    expect((await render('가\n\n%%\n여러 줄\n\n주석\n%%\n\n나')).html).toBe('<p>가</p>\n<p>나</p>')
  })

  it('inline with formatting', async () => {
    expect((await render('앞 %% 비밀 *강조* 메모 %% 뒤')).html).toBe('<p>앞  뒤</p>')
    expect((await render('가 %% TODO `x` %% 나')).html).toBe('<p>가  나</p>')
    expect((await render('가 %% check https://example.com 원본 %% 나')).html).toBe('<p>가  나</p>')
  })

  it('code untouched', async () => {
    expect((await render('`%% a %%`')).html).toBe('<p><code>%% a %%</code></p>')
  })

  it('unclosed', async () => {
    const { html, Warn } = await render('가 %% 나\n\n다')
    expect(html).toBe('<p>가 %% 나</p>\n<p>다</p>')
    expect(Warn).toHaveLength(1)
  })
})

describe('remarkViz', () => {
  it('basic', async () => {
    const { html } = await render('```viz tlb-lookup\ncaption: TLB 에서 주소를 찾는 과정\n```')
    expect(html).toContain('<figure class="viz" data-viz="tlb-lookup">')
    expect(html).toContain('<div class="viz-mount"></div>')
    expect(html).toContain('<figcaption>TLB 에서 주소를 찾는 과정</figcaption>')
  })

  it('height', async () => {
    expect((await render('```viz a\nheight: 320\n```')).html).toContain('style="--viz-height:320px"')
  })

  it('no yaml', async () => {
    const { html } = await render('```viz a\n```')
    expect(html).not.toContain('figcaption')
    expect(html).not.toContain('style=')
  })

  it('escape', async () => {
    // rehype-raw 가 다시 직렬화해 &#x3C; 꼴로 나온다 : 태그로 해석되지 않았는지만 본다
    const { html } = await render('```viz a\ncaption: <b>x</b>\n```')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&#x3C;b>x&#x3C;/b>')
  })

  it('bad id', async () => {
    const { html, Warn } = await render('```viz Bad Id\n```')
    expect(html).toContain('<code')
    expect(html).not.toContain('figure')
    expect(Warn).toHaveLength(1)
  })

  it('vizIds', async () => {
    expect((await render('```viz a\n```\n\n```viz b\n```')).frontmatter.vizIds).toEqual(['a', 'b'])
  })
})
