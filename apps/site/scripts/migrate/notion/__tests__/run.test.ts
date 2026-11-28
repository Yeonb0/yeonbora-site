import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRaw, needsCheck, pageIdOf, runBatch, verifyAll } from '../run'

const make = (Files: Record<string, string | Buffer>): string => {
  const Root = mkdtempSync(join(tmpdir(), 'notion-'))
  for (const [p, t] of Object.entries(Files)) {
    mkdirSync(dirname(join(Root, p)), { recursive: true })
    writeFileSync(join(Root, p), t)
  }
  return Root
}

// pages.ts 의 실제 id (typescript 묶음)
const A = '3a33a7483f9780fa963ad27cbaa2853e'
const B = '3a33a7483f978076a763cfe364fab34c'
const page = (title: string, body: string) => `# ${title}\n\nPart: 1\n과목: 타입스크립트 (https://app.notion.com/p/x?pvs=21)\n\n${body}\n`

const rawDir = (Extra: Record<string, string | Buffer> = {}) =>
  make({
    [`N/자바스크립트에서 타입스크립트로 ${A}.md`]: page('자바스크립트에서 타입스크립트로', '![image.png](%EC%9E%90%EB%B0%94/image.png)\n\n- Index\n\n## 타입\n\n<aside>\n💡\n\n정리\n</aside>'),
    'N/자바/image.png': Buffer.from([1, 2, 3]),
    [`N/타입 시스템 ${B}.md`]: page('타입 시스템', '![a.png](%ED%83%80/a.png)'),
    ...Extra,
  })

describe('loadRaw', () => {
  it('pageIdOf reads the 32 hex suffix only', () => {
    expect(pageIdOf(`정렬 ${A}.md`)).toBe(A)
    expect(pageIdOf('정렬.md')).toBeUndefined()
  })
  it('maps ids to export files', () => {
    expect([...loadRaw(rawDir()).pages.keys()].sort()).toEqual([B, A].sort())
  })
})

describe('runBatch', () => {
  it('writes posts and images, reports a missing image, then same on the second run', () => {
    const Raw = loadRaw(rawDir())
    const Content = make({ 'posts/.keep': '' })
    const R = runBatch(Raw, 'typescript', Content, { dryRun: false })
    expect([...R.written].sort()).toEqual(['posts/notion/2026-07-20-자바스크립트에서-타입스크립트로.md', 'posts/notion/2026-07-20-타입-시스템.md'])
    expect(existsSync(join(Content, '_assets/notion/2026-07-20-자바스크립트에서-타입스크립트로/image.png'))).toBe(true)
    expect(R.images.missing).toEqual([{ post: 'posts/notion/2026-07-20-타입-시스템.md', src: '타/a.png' }])
    expect(R.missingSource).toHaveLength(2)
    expect(needsCheck(R)).toBe(3)
    const R2 = runBatch(Raw, 'typescript', Content, { dryRun: false })
    expect(R2.skipped.map((s) => s.reason)).toEqual(['same', 'same'])
    expect(R2.images.same).toBe(1)
  })
  it('dry-run writes nothing', () => {
    const Content = make({ 'posts/.keep': '' })
    runBatch(loadRaw(rawDir()), 'typescript', Content, { dryRun: true })
    expect(existsSync(join(Content, 'posts/notion'))).toBe(false)
  })
})

describe('verifyAll', () => {
  it('counts a changed body and ignores callout markers, wiki links and %% marks', () => {
    const Raw = loadRaw(rawDir())
    const Content = make({ 'posts/.keep': '' })
    runBatch(Raw, 'typescript', Content, { dryRun: false })
    const P = join(Content, 'posts/notion/2026-07-20-자바스크립트에서-타입스크립트로.md')
    writeFileSync(P, readFileSync(P, 'utf8').replace('## 타입', '## [[타입]]\n%% check %%'))
    expect(verifyAll(Raw, Content).changed).toEqual([])
    writeFileSync(P, readFileSync(P, 'utf8').replace('정리', '정리함'))
    expect(verifyAll(Raw, Content).changed).toEqual(['posts/notion/2026-07-20-자바스크립트에서-타입스크립트로.md'])
  })
})
