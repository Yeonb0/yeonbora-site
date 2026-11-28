import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRaw, needsCheck, runBatch, sameBody, verifyAll } from '../run'

const make = (Files: Record<string, string>): string => {
  const Root = mkdtempSync(join(tmpdir(), 'tistory-'))
  for (const [p, t] of Object.entries(Files)) {
    mkdirSync(dirname(join(Root, p)), { recursive: true })
    writeFileSync(join(Root, p), t)
  }
  return Root
}

const meta = (id: string, title: string, published: string, category = 'C/C') => ({ id, title, category, visibility: 'PUBLIC', published, created: published, modified: published, permalink: `https://yeonbo-ra.tistory.com/entry/${id}`, html: '<p>rendered page</p>' })

const rawDir = () =>
  make({
    'raw.json': JSON.stringify({
      posts: [meta('1', '[C] 01_C언어 개론', '2024-06-01 10:00'), meta('2', '[C] 02_프로그램의 기본 구성', '2024-06-02 10:00'), meta('8', '[HTML] Self Check', '2024-06-22 11:10', 'HTML + CSS + JS/HTML')],
      images: { 'https://blog.kakaocdn.net/dna/zG/btA/AAA/img.png?credential=x': { type: 'image/png', size: 3, data: Buffer.from([1, 2, 3]).toString('base64') } },
      failedImages: [],
    }),
    'source.json': JSON.stringify({
      content: {
        '1': '<p data-ke-size="size16">C언어는 절차 지향</p>\n<p>[##_Image|kage@zG/btA/AAA/img.png|CDM|1.3|{}_##]</p>',
        '2': '<p data-ke-size="size16">main 함수</p>',
      },
    }),
  })

describe('runBatch', () => {
  it('writes posts and images, then reports same on the second run', () => {
    const Raw = loadRaw(rawDir())
    const Content = make({ 'wiki/computer/x/절차 지향.md': '---\ntitle: 절차 지향\n---\n' })
    const R = runBatch(Raw, 'C/C', Content, { dryRun: false })
    expect(R.written).toEqual(['posts/tistory/2024-06-01-01-c언어-개론.md', 'posts/tistory/2024-06-02-02-프로그램의-기본-구성.md'])
    expect(R.images.copied).toBe(1)
    expect(readFileSync(join(Content, '_assets/tistory/2024-06-01-01-c언어-개론/btA.png'))).toEqual(Buffer.from([1, 2, 3]))
    expect(needsCheck(R)).toBe(0)

    const Again = runBatch(Raw, 'C/C', Content, { dryRun: true })
    expect(Again.skipped.map((s) => s.reason)).toEqual(['same', 'same'])
    expect(Again.images.same).toBe(1)
  })

  it('excluded posts are reported, not written', () => {
    const Raw = loadRaw(rawDir())
    const Content = make({})
    const R = runBatch(Raw, 'HTML + CSS + JS/HTML', Content, { dryRun: false })
    expect(R.total).toBe(0)
    expect(R.excluded.map((e) => e.id)).toEqual(['8'])
    expect(existsSync(join(Content, 'posts/tistory'))).toBe(false)
  })

  it('a site link that points nowhere is broken', () => {
    const Raw = loadRaw(rawDir())
    const Content = make({})
    runBatch(Raw, 'C/C', Content, { dryRun: false })
    const P = join(Content, 'posts/tistory/2024-06-02-02-프로그램의-기본-구성.md')
    writeFileSync(P, readFileSync(P, 'utf8').replace('main 함수', '[[main 함수|main]] 함수'))
    const R = runBatch(Raw, 'C/C', Content, { dryRun: true })
    expect(R.links.broken).toEqual([{ target: 'main 함수', files: ['posts/tistory/2024-06-02-02-프로그램의-기본-구성.md'] }])
  })
})

describe('sameBody · verifyAll', () => {
  it('ignores wiki links, marks and whitespace but catches changed letters', () => {
    const Html = '<p data-ke-size="size16">C언어는&nbsp;절차 지향</p>'
    expect(sameBody('---\ntitle: x\n---\n\n[[C언어]]는 절차 지향\n%% typo? : 확인 %%\n', Html)).toBe(true)
    expect(sameBody('---\ntitle: x\n---\n\nC언어는 절차 지양\n', Html)).toBe(false)
  })

  it('counts missing and changed posts', () => {
    const Dir = rawDir()
    const Raw = loadRaw(Dir)
    const Content = make({})
    expect(verifyAll(Raw, Content).missing).toHaveLength(2)
    runBatch(Raw, 'C/C', Content, { dryRun: false })
    expect(verifyAll(Raw, Content)).toEqual({ ok: 2, missing: [], changed: [] })
    const P = join(Content, 'posts/tistory/2024-06-02-02-프로그램의-기본-구성.md')
    writeFileSync(P, readFileSync(P, 'utf8').replace('main', 'maim'))
    expect(verifyAll(Raw, Content).changed).toEqual(['[C] 02_프로그램의 기본 구성'])
  })
})
