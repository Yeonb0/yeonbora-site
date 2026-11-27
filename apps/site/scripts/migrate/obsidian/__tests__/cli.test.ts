import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runBatch, runCommand, verifyVault, writeBacklog } from '../run'
import { renderReport } from '../report'
import { makeVault } from './fixture'

const git = (dir: string, date: string | null, ...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe', env: { ...process.env, ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}) } })

const gitCommit = (dir: string, date: string) => {
  git(dir, null, 'init', '-q')
  git(dir, null, 'config', 'user.name', 't')
  git(dir, null, 'config', 'user.email', 't@example.com')
  git(dir, null, 'config', 'commit.gpgsign', 'false')
  git(dir, null, 'add', '-A')
  git(dir, date, 'commit', '-q', '-m', 'c')
}

const newContent = () => {
  const Dir = mkdtempSync(join(tmpdir(), 'content-'))
  mkdirSync(join(Dir, 'wiki'), { recursive: true })
  return Dir
}

const put = (root: string, rel: string, text: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}

const note = (extra = '', body = '본문\n') => `---\ncreated: 2026-01-02\n${extra}---\n${body}`

const Dest = (c: string, rel: string) => join(c, 'wiki/computer', rel)

describe('runBatch', () => {
  it('run writes converted notes and report', () => {
    const V = makeVault({ '컴퓨터 네트워크/A.md': note('', '본문 [[B]]\n'), '컴퓨터 네트워크/B.md': note(), 'README.md': 'x', 'images/p.png': 'x' })
    const C = newContent()
    const Reports = mkdtempSync(join(tmpdir(), 'reports-'))
    const R = runCommand(V, '컴퓨터 네트워크', { contentDir: C, reportsDir: Reports, dryRun: false })
    expect(R.written.sort()).toEqual(['wiki/computer/컴퓨터 네트워크/A.md', 'wiki/computer/컴퓨터 네트워크/B.md'])
    const Text = readFileSync(Dest(C, '컴퓨터 네트워크/A.md'), 'utf8')
    expect(Text).toContain('title: A')
    expect(Text).toContain('created: 2026-01-02')
    expect(Text.endsWith('---\n본문 [[B]]\n')).toBe(true)
    const Rep = readFileSync(join(Reports, 'migrate-obsidian-network.md'), 'utf8')
    expect(Rep).toContain('## 시각화 후보')
    expect(Rep).toContain('## 제외')
    expect(R.links).toEqual({ broken: 0, backlog: 0, notYetMigrated: 0 })
  })

  it('existing identical note is skipped and keeps viz block', () => {
    const V = makeVault({ '컴퓨터 네트워크/A.md': note('', '앞\n\n뒤\n') })
    const C = newContent()
    const Existing = '---\ntitle: A\naliases: []\ntags: [x]\nfield: computer\nsource: obsidian\n---\n앞\n%% typo? %%\n\n뒤\n\n```viz a-id\ncaption: c\n```\n'
    put(C, 'wiki/computer/컴퓨터 네트워크/A.md', Existing)
    const R = runBatch(V, '컴퓨터 네트워크', C, { dryRun: false })
    expect(R.skipped).toEqual([{ path: 'wiki/computer/컴퓨터 네트워크/A.md', reason: 'same' }])
    expect(R.written).toEqual([])
    expect(readFileSync(Dest(C, '컴퓨터 네트워크/A.md'), 'utf8')).toBe(Existing)
  })

  it('existing different note is a conflict, not overwritten', () => {
    const V = makeVault({ '컴퓨터 네트워크/A.md': note('', '새 본문\n') })
    const C = newContent()
    put(C, 'wiki/computer/컴퓨터 네트워크/A.md', '---\ntitle: A\n---\n고친 본문\n')
    const R = runBatch(V, '컴퓨터 네트워크', C, { dryRun: false })
    expect(R.skipped).toEqual([{ path: 'wiki/computer/컴퓨터 네트워크/A.md', reason: 'conflict' }])
    expect(readFileSync(Dest(C, '컴퓨터 네트워크/A.md'), 'utf8')).toBe('---\ntitle: A\n---\n고친 본문\n')
  })

  it('dry-run writes nothing', () => {
    const V = makeVault({ '컴퓨터 네트워크/A.md': note('', '![[p.png]]\n'), 'images/p.png': 'img' })
    const C = newContent()
    const Reports = mkdtempSync(join(tmpdir(), 'reports-'))
    const R = runCommand(V, '컴퓨터 네트워크', { contentDir: C, reportsDir: Reports, dryRun: true })
    expect(R.written).toEqual(['wiki/computer/컴퓨터 네트워크/A.md'])
    expect(R.images.Copied).toEqual(['p.png'])
    expect(existsSync(join(C, 'wiki/computer'))).toBe(false)
    expect(existsSync(join(C, '_assets/obsidian'))).toBe(false)
    expect(existsSync(join(Reports, 'migrate-obsidian-network.md'))).toBe(false)
    // dry-run 도 리포트는 쓴다 : 따로 .dry-run 이름으로
    const Rep = readFileSync(join(Reports, 'migrate-obsidian-network.dry-run.md'), 'utf8')
    expect(Rep).toContain('dry-run')
    expect(Rep).toContain('## 이름 바꿈')
    expect(Rep).toContain('## 작성일 못 찾음')
    expect(Rep).toContain('p.png')
    const Real = runCommand(V, '컴퓨터 네트워크', { contentDir: newContent(), reportsDir: Reports, dryRun: false })
    expect(Real.written).toHaveLength(1)
    expect(readFileSync(join(Reports, 'migrate-obsidian-network.md'), 'utf8')).not.toContain('dry-run')
  })

  it('links to notes in other Main folders count as notYetMigrated, not broken', () => {
    const Backlog = join(mkdtempSync(join(tmpdir(), 'bl-')), 'b.json')
    writeFileSync(Backlog, '["없는노트"]')
    const V = makeVault({
      '컴퓨터 네트워크/A.md': note('', '[[다른 폴더 노트]] [[없는노트]] [[진짜 없음]] [[A]] [[#섹션]]\n'),
      '자료구조/다른 폴더 노트.md': note(),
    })
    const C = newContent()
    const R = runBatch(V, '컴퓨터 네트워크', C, { dryRun: false, backlogPath: Backlog })
    expect(R.links).toEqual({ broken: 1, backlog: 1, notYetMigrated: 1 })
    expect(R.brokenList).toEqual([{ target: '진짜 없음', files: ['컴퓨터 네트워크/A.md'] }])
  })

  it('classifies straight and curly apostrophe links the same way', () => {
    const Backlog = join(mkdtempSync(join(tmpdir(), 'bl-')), 'b.json')
    writeFileSync(Backlog, JSON.stringify(["jensen's device"]))
    const V = makeVault({
      "컴퓨터 네트워크/A.md": note('', "[[Prim's Algorithm]] [[Prim\u2019s Algorithm]] [[Jensen's Device]] [[Jensen\u2019s Device]] [[Kruskal\u2019s]]\n"),
      "자료구조/Prim's Algorithm.md": note(),
    })
    const R = runBatch(V, '컴퓨터 네트워크', newContent(), { dryRun: false, backlogPath: Backlog })
    expect(R.links).toEqual({ broken: 1, backlog: 2, notYetMigrated: 2 })
    expect(R.brokenList).toEqual([{ target: 'Kruskal\u2019s', files: ['컴퓨터 네트워크/A.md'] }])
  })

  it('frontmatter that fails WikiSchema stops the batch with the file name', () => {
    const V = makeVault({ '컴퓨터 네트워크/A.md': note(), '컴퓨터 네트워크/Bad.md': note('title: x\n').replace('created: 2026-01-02', 'created: 가나다') })
    const C = newContent()
    expect(() => runBatch(V, '컴퓨터 네트워크', C, { dryRun: false })).toThrow(/Bad\.md/)
    expect(existsSync(join(C, 'wiki/computer'))).toBe(false)
  })

  it('root folder dot migrates only root-level notes with etc topic', () => {
    const V = makeVault({ 'LaTex.md': note(), '자료구조/X.md': note() })
    const C = newContent()
    const Reports = mkdtempSync(join(tmpdir(), 'reports-'))
    const R = runCommand(V, '.', { contentDir: C, reportsDir: Reports, dryRun: false })
    expect(R.written).toEqual(['wiki/computer/LaTex.md'])
    expect(readFileSync(Dest(C, 'LaTex.md'), 'utf8')).toContain('topic: etc')
    expect(existsSync(join(Reports, 'migrate-obsidian-etc-root.md'))).toBe(true)
  })

  it('renames clashes over the whole vault, even when the pair is in another batch', () => {
    const V = makeVault({ 'Python/!x.md': note(), '자료구조/!x.md': note() })
    const C = newContent()
    const R = runBatch(V, 'Python', C, { dryRun: false })
    expect(R.renamed).toEqual([['Python/!x.md', '!x (Python)']])
    expect(R.written).toEqual(['wiki/computer/Python/!x (Python).md'])
  })

  it('lists notes without a date, and uses git date otherwise', () => {
    const V = makeVault({ 'Python/G.md': '---\ntags: []\n---\n본문\n', 'Python/H.md': '본문\n' })
    gitCommit(V, '2026-03-04T12:00:00+09:00')
    const C = newContent()
    const R = runBatch(V, 'Python', C, { dryRun: false })
    expect(R.noDate).toEqual([])
    expect(readFileSync(Dest(C, 'Python/G.md'), 'utf8')).toContain('created: 2026-03-04')
    const V2 = makeVault({ 'Python/G.md': '본문\n' })
    gitCommit(V2, '2026-03-04T12:00:00+09:00')
    writeFileSync(join(V2, 'Python/New.md'), '새\n')
    const R2 = runBatch(V2, 'Python', newContent(), { dryRun: true })
    expect(R2.noDate).toEqual(['Python/New.md'])
  })

  it('flags suspects and ignored files', () => {
    const V = makeVault({
      'Python/S.md': note('', '$x$ 와 > [!note] a\n<br> [[A\\|b]] ![[doc.pdf]] ![[p.png]]\n```dataview\nTABLE\n```\n`$코드`\n'),
      'Python/P.md': note('', '평범\n'),
      'Python/memo.txt': 'x',
    })
    const R = runBatch(V, 'Python', newContent(), { dryRun: true })
    const S = R.suspects.find((s) => s.path === 'Python/S.md')
    expect(S?.kinds.sort()).toEqual(['callout', 'dataview', 'embed-note', 'html', 'math', 'table-link'])
    expect(R.suspects.find((s) => s.path === 'Python/P.md')).toBeUndefined()
    expect(R.ignored).toEqual(['Python/memo.txt'])
  })
})

describe('code fence handling', () => {
  const Body = '앞\n\n```mermaid\n%%{init: {}}%%\ngraph TD\n```\n'
  it('a %% line inside a code fence is same on re-run and passes verify', () => {
    const V = makeVault({ 'Python/M.md': note('', Body) })
    const C = newContent()
    runBatch(V, 'Python', C, { dryRun: false })
    const R = runBatch(V, 'Python', C, { dryRun: false })
    expect(R.skipped).toEqual([{ path: 'wiki/computer/Python/M.md', reason: 'same' }])
    expect(verifyVault(V, C)).toEqual({ ok: 1, missing: [], changed: [] })
  })

  it('a real edit inside a code fence is a conflict', () => {
    const V = makeVault({ 'Python/M.md': note('', Body) })
    const C = newContent()
    runBatch(V, 'Python', C, { dryRun: false })
    const P = join(C, 'wiki/computer/Python/M.md')
    writeFileSync(P, readFileSync(P, 'utf8').replace('graph TD', 'graph LR'))
    expect(runBatch(V, 'Python', C, { dryRun: false }).skipped[0].reason).toBe('conflict')
    expect(verifyVault(V, C).changed).toEqual(['Python/M.md'])
  })

  it('still ignores viz fences and %% lines outside fences', () => {
    const V = makeVault({ 'Python/M.md': note('', Body) })
    const C = newContent()
    put(C, 'wiki/computer/Python/M.md', '---\ntitle: M\n---\n앞\n%% typo? %%\n\n```mermaid\n%%{init: {}}%%\ngraph TD\n```\n\n```viz m\ncaption: c\n```\n')
    expect(runBatch(V, 'Python', C, { dryRun: false }).skipped[0].reason).toBe('same')
  })
})

describe('verifyVault', () => {
  it('verify fails on changed body', () => {
    const V = makeVault({ 'Python/A.md': note('', '원문\n'), 'Python/B.md': note('', '같음\n'), 'Python/C.md': note('', '없음\n') })
    const C = newContent()
    put(C, 'wiki/computer/Python/A.md', '---\ntitle: A\n---\n바뀜\n')
    put(C, 'wiki/computer/Python/B.md', '---\ntitle: B\n---\n같음\n\n```viz b\n```\n')
    const R = verifyVault(V, C)
    expect(R.changed).toEqual(['Python/A.md'])
    expect(R.missing).toEqual(['Python/C.md'])
    expect(R.ok).toBe(1)
  })
})

describe('writeBacklog', () => {
  it('writes a pretty JSON array with trailing newline', () => {
    const V = makeVault({ 'Python/A.md': note('', '[[Zed]] [[없음]]\n') })
    const Out = join(mkdtempSync(join(tmpdir(), 'bl-')), 'docs/migration/wiki-backlog.json')
    const N = writeBacklog(V, Out)
    expect(N).toBe(2)
    expect(readFileSync(Out, 'utf8')).toBe('[\n  "zed",\n  "없음"\n]\n')
  })
})

describe('ambiguous links', () => {
  it('lists links resolved by nearest folder or order, not exact-case ones', () => {
    const V = makeVault({
      '멋쟁이사자처럼/css/!x.md': note(),
      '멋쟁이사자처럼/js/!x.md': note(),
      '멋쟁이사자처럼/css/박스.md': note('', '[[!x]]\n'),
      '자료구조/pop.md': note(),
      '서버 구조와 기술/POP.md': note(),
      '서버 구조와 기술/링크.md': note('', '[[pop]]\n'),
    })
    const Css = runBatch(V, '멋쟁이사자처럼', newContent(), { dryRun: true })
    expect(Css.ambiguous).toEqual([{ file: '멋쟁이사자처럼/css/박스.md', target: '!x', chosen: '!x (css) (멋쟁이사자처럼/css/!x.md)', candidates: 2 }])
    const Server = runBatch(V, '서버 구조와 기술', newContent(), { dryRun: true }).ambiguous
    expect(Server).toEqual([])
    const Rep = runCommand(V, '멋쟁이사자처럼', { contentDir: newContent(), reportsDir: mkdtempSync(join(tmpdir(), 'reports-')), dryRun: true })
    expect(Rep.ambiguous).toHaveLength(1)
  })

  it('report has the 모호한 링크 section', () => {
    const V = makeVault({ 'Python/css/!x.md': note(), 'Python/js/!x.md': note(), 'Python/css/a.md': note('', '[[!x]]\n') })
    const Reports = mkdtempSync(join(tmpdir(), 'reports-'))
    runCommand(V, 'Python', { contentDir: newContent(), reportsDir: Reports, dryRun: false })
    const Rep = readFileSync(join(Reports, 'migrate-obsidian-python.md'), 'utf8')
    expect(Rep).toContain('## 모호한 링크')
    expect(Rep).toContain('Python/css/a.md → !x → !x (css) (Python/css/!x.md)')
  })
})

describe('date source and bad frontmatter in the report', () => {
  it('counts frontmatter dates and git dates separately', () => {
    const V = makeVault({ 'Python/G.md': '---\ncreated: 2026-01-02\n---\n본문\n', 'Python/H.md': '본문\n' })
    gitCommit(V, '2026-03-04T12:00:00+09:00')
    const R = runBatch(V, 'Python', newContent(), { dryRun: true })
    expect(R.dateSource).toEqual({ frontmatter: 1, git: 1 })
    const Rep = renderReport(R)
    expect(Rep).toContain('Main frontmatter 1편 · git 기록 1편')
  })

  it('lists notes with unreadable frontmatter', () => {
    const V = makeVault({ 'Python/B.md': '---\ntags: [x\n  : : bad\n---\n본문\n', 'Python/A.md': note() })
    gitCommit(V, '2026-03-04T12:00:00+09:00')
    const R = runBatch(V, 'Python', newContent(), { dryRun: true })
    expect(R.badFront.map((b) => b.relPath)).toEqual(['Python/B.md'])
    expect(renderReport(R)).toContain('Python/B.md')
  })
})
