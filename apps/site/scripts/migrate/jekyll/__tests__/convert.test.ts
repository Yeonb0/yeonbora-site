import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { PostSchema } from '../../../../src/lib/content/schemas'
import { convertPost, jekyllTitleSlug, originalUrlOf, removeRaw, rewriteImages, siteSlugOf, splitPost } from '../convert'

const split = (text: string) => {
  const M = text.match(/^---\n([\s\S]*?)---\n/)
  if (!M) throw new Error('frontmatter 없음')
  return { data: parse(M[1]) as Record<string, unknown>, body: text.slice(M[0].length) }
}

describe('slug', () => {
  it('jekyll pretty slug keeps case and allowed punctuation', () => {
    expect(jekyllTitleSlug('[network]-framing---error-control')).toBe('network-framing-error-control')
    expect(jekyllTitleSlug('[pl]-names,-bindings,-type-checking,-and-scopes')).toBe('pl-names,-bindings,-type-checking,-and-scopes')
    expect(jekyllTitleSlug('A Mazing Problem')).toBe('A-Mazing-Problem')
    expect(jekyllTitleSlug('[network]-물리-계층-&-데이터-링크-계층')).toBe('network-물리-계층-&-데이터-링크-계층')
  })

  it('original url lowercases categories', () => {
    expect(originalUrlOf(['Network'], '2026-06-24-[network]-framing---error-control.md')).toBe(
      'https://yeonb0.github.io/network/network-framing-error-control/',
    )
    expect(originalUrlOf(['BOJ', 'Bronze'], '2026-01-18-boj-1000.md')).toBe('https://yeonb0.github.io/boj/bronze/boj-1000/')
    expect(originalUrlOf(['Network'], '2026-02-05-[network]-컴퓨터-네트워크.md')).toBe(
      `https://yeonb0.github.io/network/${encodeURIComponent('network-컴퓨터-네트워크')}/`,
    )
  })

  it('site slug drops the [category] prefix and keeps the date', () => {
    expect(siteSlugOf('2026-06-24-[network]-framing---error-control.md')).toBe('2026-06-24-framing-error-control')
    expect(siteSlugOf('2026-06-24-[pl]-names,-bindings,-type-checking,-and-scopes.md')).toBe('2026-06-24-names-bindings-type-checking-and-scopes')
    expect(siteSlugOf('2026-01-19-Stack & Queue.md')).toBe('2026-01-19-stack-queue')
    expect(siteSlugOf('2026-01-18-boj-1000.md')).toBe('2026-01-18-boj-1000')
    expect(siteSlugOf('2026-02-05-[network]-물리-계층-&-데이터-링크-계층.md')).toBe('2026-02-05-물리-계층-데이터-링크-계층')
  })
})

describe('removeRaw', () => {
  it('drops whole raw lines and inline tags only', () => {
    expect(removeRaw('a\n{% raw %}\n```c\n{{x}}\n```\n{% endraw %}\nb\n')).toBe('a\n```c\n{{x}}\n```\nb\n')
    expect(removeRaw('`{% raw %}{{x}}{% endraw %}`\n')).toBe('`{{x}}`\n')
    expect(removeRaw('a\r\n  {%raw%}  \r\nb')).toBe('a\r\nb')
  })
})

describe('rewriteImages', () => {
  it('rewrites local markdown and html images into the slug folder', () => {
    const Body = [
      '![](/assets/images/notion/[network]-framing---error-control/img_1.png)',
      '<img src="../../assets/images/posts/2026-01-19-Stack & Queue/image (1).png" alt="image (1)" style="zoom:50%;" />',
      '```',
      '![](/assets/in-code.png)',
      '```',
    ].join('\n')
    const R = rewriteImages(Body, 's', () => false)
    expect(R.body.split('\n')[0]).toBe('![](../../_assets/jekyll/s/img_1.png)')
    expect(R.body.split('\n')[1]).toBe('<img src="../../_assets/jekyll/s/image-1.png" alt="image (1)" style="zoom:50%;" />')
    expect(R.body).toContain('![](/assets/in-code.png)')
    expect(R.local).toEqual([
      { src: 'assets/images/notion/[network]-framing---error-control/img_1.png', name: 'img_1.png' },
      { src: 'assets/images/posts/2026-01-19-Stack & Queue/image (1).png', name: 'image-1.png' },
    ])
  })

  it('accepts one level of parentheses inside the path', () => {
    const R = rewriteImages('![](/assets/images/notion/[network]-internet-protocol-(ip)/img_1.png)', 's', () => false)
    expect(R.local).toEqual([{ src: 'assets/images/notion/[network]-internet-protocol-(ip)/img_1.png', name: 'img_1.png' }])
    expect(R.body).toBe('![](../../_assets/jekyll/s/img_1.png)')
  })

  it('extensionless external urls get .png', () => {
    const R = rewriteImages('<img src="https://upload.acmicpc.net/560de878/-/preview/">', 's', () => false)
    expect(R.external[0].name).toBe('preview.png')
  })

  it('root paths can map to the original site', () => {
    const R = rewriteImages('<img src="/upload/201004/pn.PNG">', 's', () => false, (p) => `https://www.acmicpc.net${p}`)
    expect(R.external).toEqual([{ url: 'https://www.acmicpc.net/upload/201004/pn.PNG', name: 'pn.png', fetched: false }])
  })

  it('decodes percent-encoded local paths', () => {
    const R = rewriteImages('![a](/assets/images/posts/%EA%B7%B8%EB%A6%BC.png "t")', 's', () => false)
    expect(R.local[0].src).toBe('assets/images/posts/그림.png')
    expect(R.body).toBe('![a](../../_assets/jekyll/s/그림.png "t")')
  })

  it('external images are rewritten only when already downloaded', () => {
    const Url = 'https://upload.acmicpc.net/abc/q.png'
    const Body = `![](${Url})`
    expect(rewriteImages(Body, 's', () => false).body).toBe(Body)
    const R = rewriteImages(Body, 's', (n) => n === 'q.png')
    expect(R.body).toBe('![](../../_assets/jekyll/s/q.png)')
    expect(R.external).toEqual([{ url: Url, name: 'q.png', fetched: true }])
  })

  it('velog style names get a url hash so they do not collide', () => {
    const R = rewriteImages('![](https://velog.velcdn.com/images/u/post/aaaa-1/image.png)\n![](https://velog.velcdn.com/images/u/post/bbbb-2/image.png)', 's', () => false)
    expect(R.external[0].name).not.toBe(R.external[1].name)
    expect(R.external[0].name).toMatch(/^image-[0-9a-f]{8}\.png$/)
  })
})

describe('convertPost', () => {
  const Text = [
    '---',
    'categories:',
    '- Network',
    "date: '2026-06-24T10:20:00.000+09:00'",
    'layout: single',
    'series: 컴퓨터 네트워크',
    'step: 5',
    'tags:',
    '- 데이터 링크 계층',
    "title: '[Network] Framing / Error Control'",
    'toc: true',
    'toc_sticky: true',
    '---',
    '',
    '## ✦ Framing',
    '{% raw %}',
    'x',
    '{% endraw %}',
    '',
  ].join('\n')

  it('matches the M2 sample frontmatter shape and keeps the body', () => {
    const R = convertPost({ category: 'network', fileName: '2026-06-24-[network]-framing---error-control.md', text: Text }, { hasFile: () => false })
    expect(R.path).toBe('posts/jekyll/2026-06-24-framing-error-control.md')
    const { data, body } = split(R.text)
    expect(data).toEqual({
      title: '[Network] Framing / Error Control',
      field: 'computer',
      context: 'course',
      course: '컴퓨터네트워크',
      topic: 'network',
      source: 'jekyll',
      originalUrl: 'https://yeonb0.github.io/network/network-framing-error-control/',
      date: '2026-06-24T10:20:00.000+09:00',
      tags: ['데이터 링크 계층', 'Network'],
      series: '컴퓨터 네트워크',
      step: 5,
      toc: true,
    })
    expect(body).toBe('\n## ✦ Framing\nx\n')
    expect(PostSchema.safeParse(data).success).toBe(true)
  })

  it('BOJ: tier from categories, date from file name, tag key merged', () => {
    const T = ['---', 'title: "[Gold / 1991] 트리 순회"', 'categories:', '  - BOJ', '  - Gold', 'tag: [트리]', 'tags:', '  - C++', '---', 'b', ''].join('\n')
    const R = convertPost({ category: 'BOJ', fileName: '2026-01-18-boj-1991.md', text: T }, { hasFile: () => false })
    const { data } = split(R.text)
    expect(data.tier).toBe('Gold')
    expect(data.date).toBe('2026-01-18')
    expect(data.topic).toBe('boj')
    expect(data.context).toBe('self')
    expect(data.tags).toEqual(['C++', '트리', 'BOJ'])
    expect(PostSchema.safeParse(data).success).toBe(true)
  })

  it('series override switches context', () => {
    const T = ['---', 'title: x', 'categories: [Network]', 'series: 혼자 공부하는 네트워크', '---', ''].join('\n')
    const { data } = split(convertPost({ category: 'network', fileName: '2026-02-05-x.md', text: T }, { hasFile: () => false }).text)
    expect(data.context).toBe('self')
    expect(data.course).toBeUndefined()
  })

  it('keeps devlog keys', () => {
    const T = ['---', 'title: x', 'categories: [Devlog]', 'devlog_project: factory-game', 'devlog_phase: 0', '---', ''].join('\n')
    const { data } = split(convertPost({ category: 'devlog', fileName: '2026-11-06-x.md', text: T }, { hasFile: () => false }).text)
    expect(data.devlog_project).toBe('factory-game')
    expect(data.devlog_phase).toBe(0)
  })

  it('splitPost tolerates no frontmatter', () => {
    expect(splitPost('본문').body).toBe('본문')
  })
})
