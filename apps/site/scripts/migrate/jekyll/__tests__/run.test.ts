import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { needsCheck, runBatch, unwrapLinks, verifyBlog } from '../run'

const make = (Files: Record<string, string | Buffer>): string => {
  const Root = mkdtempSync(join(tmpdir(), 'jekyll-'))
  for (const [p, t] of Object.entries(Files)) {
    mkdirSync(dirname(join(Root, p)), { recursive: true })
    writeFileSync(join(Root, p), t)
  }
  return Root
}

const Post = (title: string, body: string, extra = '') => `---\ntitle: '${title}'\ncategories:\n- Algorithm\n${extra}---\n${body}`

const blog = () =>
  make({
    '_posts/algorithm/2026-03-01-[algo]-greedy.md': Post('[Algo] Greedy', '\n![](/assets/images/posts/g/a.png)\n{% raw %}\n```\n{{x}}\n```\n{% endraw %}\n'),
    '_posts/algorithm/2026-03-02-[algo]-dp.md': Post('[Algo] DP', '\n동적 계획법\n![](https://upload.acmicpc.net/q.png)\n'),
    'assets/images/posts/g/a.png': Buffer.from([1, 2, 3]),
  })

describe('unwrapLinks', () => {
  it('turns wikilinks back into their label', () => {
    expect(unwrapLinks('a [[ARQ]] b [[Timeout|timeout]] c [[X#h]] `[[code]]`')).toBe('a ARQ b timeout c X `[[code]]`')
  })
})

describe('runBatch', () => {
  it('writes posts, copies images, reports unfetched external images', () => {
    const Blog = blog()
    const Content = make({ 'wiki/computer/x/동적 계획법.md': '---\ntitle: 동적 계획법\n---\n' })
    const R = runBatch(Blog, 'algorithm', Content, { dryRun: false })
    expect(R.written).toEqual(['posts/jekyll/2026-03-01-greedy.md', 'posts/jekyll/2026-03-02-dp.md'])
    expect(existsSync(join(Content, '_assets/jekyll/2026-03-01-greedy/a.png'))).toBe(true)
    expect(readFileSync(join(Content, 'posts/jekyll/2026-03-01-greedy.md'), 'utf8')).toContain('![](../../_assets/jekyll/2026-03-01-greedy/a.png)')
    expect(R.external).toEqual([{ post: 'posts/jekyll/2026-03-02-dp.md', url: 'https://upload.acmicpc.net/q.png', dest: '_assets/jekyll/2026-03-02-dp/q.png', fetched: false }])
    expect(needsCheck(R)).toBe(1)

    // 외부 그림을 받아 두고 다시 돌리면 이미 쓴 글의 그림 경로만 바뀐다
    mkdirSync(join(Content, '_assets/jekyll/2026-03-02-dp'), { recursive: true })
    writeFileSync(join(Content, '_assets/jekyll/2026-03-02-dp/q.png'), 'x')
    const Again = runBatch(Blog, 'algorithm', Content, { dryRun: true })
    expect(Again.skipped.map((s) => s.reason)).toEqual(['same', 'same'])
    expect(Again.relinked).toEqual(['posts/jekyll/2026-03-02-dp.md'])
    runBatch(Blog, 'algorithm', Content, { dryRun: false })
    expect(readFileSync(join(Content, 'posts/jekyll/2026-03-02-dp.md'), 'utf8')).toContain('![](../../_assets/jekyll/2026-03-02-dp/q.png)')
  })

  it('verify ignores added links, notes and viz blocks but catches edits', () => {
    const Blog = blog()
    const Content = make({})
    runBatch(Blog, 'algorithm', Content, { dryRun: false })
    const P = join(Content, 'posts/jekyll/2026-03-02-dp.md')
    writeFileSync(P, readFileSync(P, 'utf8').replace('동적 계획법', '[[동적 계획법]]\n%% check : x %%\n```viz dp\ncaption: c\n```\n'))
    let V = verifyBlog(Blog, Content)
    expect(V.changed).toEqual([])
    expect(V.ok).toBe(2)
    writeFileSync(P, readFileSync(P, 'utf8').replace('계획법', '계획'))
    V = verifyBlog(Blog, Content)
    expect(V.changed).toEqual(['algorithm/2026-03-02-[algo]-dp.md'])
  })

  it('dry run writes nothing', () => {
    const Content = make({})
    const R = runBatch(blog(), 'algorithm', Content, { dryRun: true })
    expect(R.written.length).toBe(2)
    expect(existsSync(join(Content, 'posts'))).toBe(false)
  })

  it('reports broken links and missing images', () => {
    const Blog = make({ '_posts/algorithm/2026-03-01-x.md': Post('X', '![](/assets/none.png)\n없는 노트\n') })
    const Content = make({ 'posts/jekyll/2026-03-01-x.md': `---\ntitle: X\n---\n![](../../_assets/jekyll/2026-03-01-x/none.png)\n[[없는 노트]]\n` })
    const R = runBatch(Blog, 'algorithm', Content, { dryRun: true })
    expect(R.skipped).toEqual([{ path: 'posts/jekyll/2026-03-01-x.md', reason: 'same' }])
    expect(R.images.missing).toEqual([{ post: 'posts/jekyll/2026-03-01-x.md', src: 'assets/none.png' }])
    expect(R.links.broken).toEqual([{ target: '없는 노트', files: ['posts/jekyll/2026-03-01-x.md'] }])
  })
})
