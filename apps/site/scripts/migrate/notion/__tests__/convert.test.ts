import { describe, expect, it } from 'vitest'
import { convertPage, siteSlugOf, splitExport, type PageMeta } from '../convert'

const Page = (Body: string) => `# 스프링 부트 4 시작하기\n\nPart: 1\n과목: Spring (https://app.notion.com/p/Spring-3953a7483f97806a8660c6ce1ebbe33b?pvs=21)\n\n${Body}`
const Meta: PageMeta = { id: '3963a7483f9780cca319c4efbd9be305', date: '2026-07-07', group: 'spring' }
const conv = (Body: string, Over: Partial<PageMeta> = {}, Title?: string) =>
  convertPage(Title ? Page(Body).replace('스프링 부트 4 시작하기', Title) : Page(Body), { ...Meta, ...Over })

describe('splitExport', () => {
  it('takes the h1 as title and drops the property lines', () => {
    const S = splitExport(Page('본문'))
    expect(S.title).toBe('스프링 부트 4 시작하기')
    expect(S.body).toBe('본문')
  })
  it('keeps a title with a slash', () => {
    expect(splitExport('# 로그인/로그아웃\n\n본문').title).toBe('로그인/로그아웃')
  })
})

describe('siteSlugOf', () => {
  it('date plus lowercased title', () => {
    expect(siteSlugOf('2026-07-30', 'JWT 로 로그인/로그아웃 구현하기')).toBe('2026-07-30-jwt-로-로그인-로그아웃-구현하기')
    expect(siteSlugOf('2024-11-28', 'Lec 15 ~ 18 Design Patterns and Best Practices')).toBe('2024-11-28-lec-15-18-design-patterns-and-best-practices')
  })
})

describe('convertPage', () => {
  it('writes frontmatter from the group rule', () => {
    const C = conv('본문')
    expect(C.path).toBe('posts/notion/2026-07-07-스프링-부트-4-시작하기.md')
    expect(C.text).toMatch(/^---\ntitle: 스프링 부트 4 시작하기\nfield: computer\ncontext: study\ntopic: java\nsource: notion\noriginalUrl: https:\/\/www\.notion\.so\/3963a7483f9780cca319c4efbd9be305\ndate: 2026-07-07\ntags:\n  - Spring\n  - Java\nseries: Spring\n---\n\n본문\n$/)
  })
  it('step from the lecture number', () => {
    const C = conv('본문', { group: 'java', date: '2024-11-28' }, 'Lec 08 - Multithreading and Concurrency (1)')
    expect(C.text).toContain('\nstep: 8\n')
  })
  it('drops the template Index toggle line only', () => {
    const C = conv('![a.png](a.png)\n\n- Index\n- `Variable` 클래스\n\n## 본문\n\n- Index 는 목차')
    expect(C.body).toBe('![a.png](../../_assets/notion/2026-07-07-스프링-부트-4-시작하기/a.png)\n\n- `Variable` 클래스\n\n## 본문\n\n- Index 는 목차')
    expect(C.notes).toContainEqual({ kind: 'toc', detail: '' })
  })
  it('rewrites image paths once-decoded into _assets, spaces → -', () => {
    const C = conv('![image.png](%EC%83%81%EC%9E%90/image%201.png)\n\n![r.png](%EC%9E%90%EB%B0%94/%25ED%2595%2598.png)')
    expect(C.images).toEqual([
      { src: '상자/image 1.png', name: 'image-1.png' },
      { src: '자바/%ED%95%98.png', name: '하.png' },
    ])
    expect(C.body).toBe('![image.png](../../_assets/notion/2026-07-07-스프링-부트-4-시작하기/image-1.png)\n\n![r.png](../../_assets/notion/2026-07-07-스프링-부트-4-시작하기/하.png)')
  })
  it('two images with the same name from different folders get distinct names', () => {
    const C = conv('![a](x/image.png)\n\n![b](y/image.png)')
    expect(C.images.map((i) => i.name)).toEqual(['image.png', 'image-2.png'])
  })
  it('does not touch image syntax inside code blocks', () => {
    const C = conv('```md\n![a](x/image.png)\n```')
    expect(C.body).toBe('```md\n![a](x/image.png)\n```')
    expect(C.images).toEqual([])
  })
  it('aside becomes an Obsidian callout with the icon as title', () => {
    const C = conv('앞\n\n<aside>\n💡\n\n정리\n\n```python\nx = 1\n```\n</aside>\n\n뒤')
    expect(C.body).toBe('앞\n\n> [!note] 💡\n> \n> 정리\n> \n> ```python\n> x = 1\n> ```\n\n뒤')
    expect(C.notes).toContainEqual({ kind: 'callout', detail: '1곳' })
  })
  it('aside without an icon line', () => {
    const C = conv('<aside>\n정리\n</aside>')
    expect(C.body).toBe('> [!note]\n> 정리')
  })
  it('notion page links keep only the text', () => {
    const C = conv('[Spring](https://app.notion.com/p/Spring-3953?pvs=21) 과 [다른 글](%EB%8B%A4.md)')
    expect(C.body).toBe('Spring 과 다른 글')
    expect(C.notes.filter((n) => n.kind === 'page-link')).toHaveLength(2)
  })
})
