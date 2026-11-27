import { describe, expect, it } from 'vitest'
import { applyEdits, type Repo } from '../apply'
import type { Edit } from '../../../src/drafts/edits'

const repo = (): Repo => ({
  Configs: { v: { speed: { type: 'range', min: 0, max: 3, step: 0.5, value: 1, label: '속도' } } },
  Reviews: { v: { status: 'pending', post: 'posts/a', note: '', updated: '2026-11-01' } },
  Posts: { 'posts/a': '---\ntitle: a\n---\n\n첫 문단\n\n둘째 문단\n\n둘째 문단\n' },
})

let n = 0
const E = (e: Partial<Edit> & { kind: Edit['kind'] }, at: string): Edit & { id: string } => ({ vizId: 'v', applied: false, at, id: `e${n++}`, ...e }) as Edit & { id: string }

describe('applyEdits', () => {
  it('last write wins', () => {
    const R = applyEdits(repo(), [E({ kind: 'config', key: 'speed', value: 0.5 }, '1'), E({ kind: 'config', key: 'speed', value: 2 }, '2'), E({ kind: 'config', key: 'speed', value: 1.5 }, '3')], '2026-11-27')
    expect(R.Repo.Configs.v.speed.value).toBe(1.5)
    expect(R.Applied).toHaveLength(3)
  })

  it('sorts by at before applying', () => {
    const R = applyEdits(repo(), [E({ kind: 'config', key: 'speed', value: 1.5 }, '3'), E({ kind: 'config', key: 'speed', value: 0.5 }, '1')], '2026-11-27')
    expect(R.Repo.Configs.v.speed.value).toBe(1.5)
  })

  it('skips out of range, unknown key, unknown viz', () => {
    const Bad = [E({ kind: 'config', key: 'speed', value: 9 }, '1'), E({ kind: 'config', key: 'nope', value: 1 }, '2'), E({ kind: 'config', key: 'speed', value: 1, vizId: 'gone' } as Partial<Edit> & { kind: 'config' }, '3')]
    const R = applyEdits(repo(), Bad, '2026-11-27')
    expect(R.Applied).toEqual([])
    expect(R.Skipped.map((s) => s.id)).toEqual(Bad.map((b) => b.id))
    expect(R.Repo.Configs.v.speed.value).toBe(1)
  })

  it('body replaces only when find occurs exactly once', () => {
    const Once = E({ kind: 'body', post: 'posts/a', find: '첫 문단', replace: '첫 문단 (고침)' }, '1')
    const Twice = E({ kind: 'body', post: 'posts/a', find: '둘째 문단', replace: 'x' }, '2')
    const None = E({ kind: 'body', post: 'posts/a', find: '없는 문단', replace: 'x' }, '3')
    const R = applyEdits(repo(), [Once, Twice, None], '2026-11-27')
    expect(R.Repo.Posts['posts/a']).toContain('첫 문단 (고침)\n')
    expect(R.Repo.Posts['posts/a']).toContain('둘째 문단\n\n둘째 문단')
    expect(R.Applied).toEqual([Once.id])
    expect(R.Skipped.map((s) => s.id)).toEqual([Twice.id, None.id])
  })

  it('same block edited twice keeps last and marks both applied', () => {
    const A = E({ kind: 'body', post: 'posts/a', find: '첫 문단', replace: '하나' }, '1')
    const B = E({ kind: 'body', post: 'posts/a', find: '첫 문단', replace: '둘' }, '2')
    const R = applyEdits(repo(), [A, B], '2026-11-27')
    expect(R.Repo.Posts['posts/a']).toContain('\n둘\n')
    expect(R.Applied.sort()).toEqual([A.id, B.id].sort())
  })

  it('review rejected with note updates review.json', () => {
    const R = applyEdits(repo(), [E({ kind: 'review', status: 'rejected', note: '색이 어두움' }, '1')], '2026-11-27')
    expect(R.Repo.Reviews.v).toEqual({ status: 'rejected', post: 'posts/a', note: '색이 어두움', updated: '2026-11-27' })
  })

  it('ignores already applied edits', () => {
    const Done = { ...E({ kind: 'config', key: 'speed', value: 2 }, '1'), applied: { commit: 'abc', at: 'x' } } as Edit & { id: string }
    const R = applyEdits(repo(), [Done], '2026-11-27')
    expect(R.Applied).toEqual([])
    expect(R.Skipped).toEqual([])
    expect(R.Repo.Configs.v.speed.value).toBe(1)
  })

  it('text object keeps original key order', () => {
    const R0 = repo()
    R0.Configs.v.labels = { type: 'text', value: { input: 'a', output: 'b', count: 'c' }, label: '라벨' }
    const R = applyEdits(R0, [E({ kind: 'config', key: 'labels', value: { count: 'C', input: 'a', output: 'b' } }, '1')], '2026-11-27')
    expect(Object.keys(R.Repo.Configs.v.labels.value as object)).toEqual(['input', 'output', 'count'])
    expect((R.Repo.Configs.v.labels.value as Record<string, string>).count).toBe('C')
  })

  it('does not mutate input repo', () => {
    const Before = repo()
    applyEdits(Before, [E({ kind: 'config', key: 'speed', value: 2 }, '1')], '2026-11-27')
    expect(Before.Configs.v.speed.value).toBe(1)
  })
})
