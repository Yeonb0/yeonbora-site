import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderPost } from '../render-post'
import { Base, makeSite } from './fixture'

const render = () => {
  const Site = makeSite(Base)
  const Content = join(Site, 'src/content')
  return { Content, Post: renderPost(join(Content, 'posts/jekyll/sample.md'), Content) }
}

describe('renderPost', () => {
  it('strips comments, mounts viz, links wiki, renders table', () => {
    const { Post } = render()
    expect(Post.path).toBe('posts/jekyll/sample')
    expect(Post.title).toBe('샘플 글')
    expect(Post.html).not.toContain('%%')
    expect(Post.html).toContain('data-viz="demo"')
    expect(Post.html).toContain('href="/wiki/arq"')
    expect(Post.html).toMatch(/<table[ >]/)
  })

  it('keeps markdown verbatim without frontmatter', () => {
    const { Post } = render()
    expect(Post.markdown.startsWith('\n첫 문단 %% typo? : 확인 %% 입니다.')).toBe(true)
  })

  it('blocks are verbatim slices in order', () => {
    const { Post } = render()
    expect(Post.Blocks.length).toBe(5)
    let Last = -1
    for (const B of Post.Blocks) {
      expect(B.text).toBe(Post.markdown.slice(B.start, B.end))
      expect(B.start).toBeGreaterThan(Last)
      Last = B.start
    }
  })

  it('tags rendered blocks with their index except viz', () => {
    const { Post } = render()
    expect(Post.html).toContain('<p data-block="0">')
    expect(Post.html).toContain('<table data-block="3">')
    expect(Post.html).not.toMatch(/<figure[^>]*data-block/)
  })

  it('collects local images with hashed names', () => {
    const { Post, Content } = render()
    expect(Post.Images).toHaveLength(1)
    expect(Post.Images[0].file).toBe(join(Content, '_assets/jekyll/p.png'))
    expect(Post.Images[0].name).toMatch(/^img\/p-[0-9a-f]{8}\.png$/)
    expect(Post.html).toContain(`src="${Post.Images[0].name}"`)
  })
})

describe('duplicate blocks', () => {
  it('blocks appearing twice are not editable', () => {
    const Site = makeSite({ ...Base, 'src/content/posts/jekyll/sample.md': '---\ntitle: d\n---\n\n### 같은 제목\n\n가\n\n### 같은 제목\n\n나\n' })
    const Content = join(Site, 'src/content')
    const P = renderPost(join(Content, 'posts/jekyll/sample.md'), Content)
    expect(P.Blocks.map((b) => b.unique)).toEqual([false, true, false, true])
    expect(P.html).not.toMatch(/<h3 data-block/)
    expect(P.html).toContain('<p data-block="1">')
  })
})
