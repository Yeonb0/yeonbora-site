import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readCreatedDates } from '../git-dates'

const Dirs: string[] = []

const git = (dir: string, date: string | null, ...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe', env: { ...process.env, ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}) } })

const newRepo = () => {
  const Dir = mkdtempSync(join(tmpdir(), 'git-dates-'))
  Dirs.push(Dir)
  git(Dir, null, 'init', '-q')
  git(Dir, null, 'config', 'user.name', 'tester')
  git(Dir, null, 'config', 'user.email', 'tester@example.com')
  git(Dir, null, 'config', 'commit.gpgsign', 'false')
  return Dir
}

const write = (dir: string, rel: string, text: string) => {
  mkdirSync(dirname(join(dir, rel)), { recursive: true })
  writeFileSync(join(dir, rel), text)
}

const commit = (dir: string, date: string) => {
  git(dir, null, 'add', '-A')
  git(dir, date, 'commit', '-q', '-m', 'c')
}

afterAll(() => {
  for (const D of Dirs) rmSync(D, { recursive: true, force: true })
})

describe('readCreatedDates', () => {
  it('uses the first add date', () => {
    const Dir = newRepo()
    write(Dir, 'a.md', '1\n')
    commit(Dir, '2026-07-01T12:00:00+09:00')
    write(Dir, 'a.md', '2\n')
    commit(Dir, '2026-07-05T12:00:00+09:00')
    expect(readCreatedDates(Dir).get('a.md')).toBe('2026-07-01')
  })

  it('follows moves', () => {
    const Dir = newRepo()
    write(Dir, '_pending/A.md', '# 같은 내용\n본문 본문 본문\n')
    commit(Dir, '2026-07-01T12:00:00+09:00')
    mkdirSync(join(Dir, '자료구조'))
    renameSync(join(Dir, '_pending/A.md'), join(Dir, '자료구조/A.md'))
    commit(Dir, '2026-07-10T12:00:00+09:00')
    const Dates = readCreatedDates(Dir)
    expect(Dates.get('자료구조/A.md')).toBe('2026-07-01')
    expect(Dates.has('_pending/A.md')).toBe(false)
  })

  it('handles non-ascii paths with spaces and ampersands', () => {
    const Dir = newRepo()
    write(Dir, '컴퓨터 네트워크/Data Link Layer/ARQ & 재전송.md', 'x\n')
    commit(Dir, '2026-07-02T12:00:00+09:00')
    expect(readCreatedDates(Dir).get('컴퓨터 네트워크/Data Link Layer/ARQ & 재전송.md')).toBe('2026-07-02')
  })

  it('handles names that git would quote', () => {
    const Dir = newRepo()
    write(Dir, 'q"t.md', 'x\n')
    write(Dir, 'back\\slash.md', 'x\n')
    commit(Dir, '2026-07-02T12:00:00+09:00')
    const Dates = readCreatedDates(Dir)
    expect(Dates.get('q"t.md')).toBe('2026-07-02')
    expect(Dates.get('back\\slash.md')).toBe('2026-07-02')
  })

  it('uses the re-add date for a deleted then re-added file', () => {
    const Dir = newRepo()
    write(Dir, 'b.md', 'x\n')
    commit(Dir, '2026-07-01T12:00:00+09:00')
    unlinkSync(join(Dir, 'b.md'))
    commit(Dir, '2026-07-03T12:00:00+09:00')
    write(Dir, 'b.md', 'y\n')
    commit(Dir, '2026-07-08T12:00:00+09:00')
    expect(readCreatedDates(Dir).get('b.md')).toBe('2026-07-08')
  })

  it('keeps only existing .md files', () => {
    const Dir = newRepo()
    write(Dir, 'a.md', '1\n')
    write(Dir, 'x.base', '1\n')
    write(Dir, 'gone.md', '1\n')
    commit(Dir, '2026-07-01T12:00:00+09:00')
    unlinkSync(join(Dir, 'gone.md'))
    commit(Dir, '2026-07-02T12:00:00+09:00')
    expect([...readCreatedDates(Dir).keys()]).toEqual(['a.md'])
  })

  it('throws a Korean error outside a git repo', () => {
    const Dir = mkdtempSync(join(tmpdir(), 'git-dates-none-'))
    Dirs.push(Dir)
    expect(() => readCreatedDates(Dir)).toThrow(/git 기록을 읽지 못했습니다/)
  })
})
