import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { remarkHtmlImage } from '../html-image'

const render = async (md: string) => {
  const R = await createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkHtmlImage] })
  const Out = await R.render(md, { fileURL: new URL('file:///site/content/posts/jekyll/p.md') })
  return { html: Out.code, images: [...(Out.metadata.localImagePaths ?? [])] }
}

describe('remarkHtmlImage', () => {
  it('relative html img becomes a markdown image (Astro processes it)', async () => {
    const R = await render('a\n\n<img src="../../_assets/jekyll/s/image-1.png" alt="image (1)" style="zoom:50%;" />\n\nb')
    expect(R.images).toEqual(['../../_assets/jekyll/s/image-1.png'])
    expect(R.html).toContain('image (1)')
    expect(R.html).toContain('zoom:50%')
  })

  it('inline img inside a paragraph', async () => {
    const R = await render('글 <img src="../../_assets/jekyll/s/a.png" alt="a"> 끝')
    expect(R.images).toEqual(['../../_assets/jekyll/s/a.png'])
  })

  it('external and other html stay as they are', async () => {
    const R = await render('<img src="https://www.acmicpc.net/a.png" alt="">\n\n<div><img src="../../x.png"></div>')
    expect(R.images).toEqual([])
    expect(R.html).toContain('https://www.acmicpc.net/a.png')
  })
})
