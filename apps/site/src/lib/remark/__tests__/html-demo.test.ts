import { createMarkdownProcessor } from '@astrojs/markdown-remark'
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { remarkHtmlDemo } from '../html-demo'

const render = async (md: string) => {
  const R = await createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkHtmlDemo] })
  return (await R.render(md)).code
}

describe('remarkHtmlDemo', () => {
  it('html demo block becomes a sandboxed iframe with the source in srcdoc', async () => {
    const Html = await render('a\n\n```html demo\n<style>h3{color:red}</style>\n<h3>"x" & y</h3>\n```\n\nb')
    expect(Html).toContain('<figure class="html-demo"><iframe')
    expect(Html).toContain('sandbox="allow-scripts allow-forms"')
    // 원문은 srcdoc 속성 값 안에만 있다 (속성 값 안의 < 는 요소가 아니다)
    const Doc = new DOMParser().parseFromString(Html, 'text/html')
    expect(Doc.querySelectorAll('body > style, body > h3, p style').length).toBe(0)
    expect(Doc.querySelector('iframe')?.getAttribute('srcdoc')).toMatch(/^<style>h3\{color:red\}<\/style>\n<h3>"x" & y<\/h3><script>/)
  })

  it('plain html code blocks stay code', async () => {
    const Html = await render('```html\n<b>x</b>\n```')
    expect(Html).toContain('<code class="language-html">')
    expect(Html).not.toContain('iframe')
  })
})
