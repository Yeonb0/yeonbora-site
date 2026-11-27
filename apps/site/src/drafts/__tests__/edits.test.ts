import { describe, expect, it } from 'vitest'
import { bodyEdit, configEdit, latestBody, latestReview, overlay, reviewEdit, type Edit } from '../edits'
import type { VizConfig } from '@/viz/types'

const Config: VizConfig = {
  speed: { type: 'range', min: 0, max: 3, step: 0.5, value: 1, label: '속도' },
  accent: { type: 'color', value: '#000000', label: '색' },
}

const at = (e: Edit, t: string): Edit => ({ ...e, at: t })

describe('overlay', () => {
  it('later edit of same key wins', () => {
    const Edits = [at(configEdit('v', 'speed', 2), '2026-11-27T01:00:00Z'), at(configEdit('v', 'speed', 0.5), '2026-11-27T02:00:00Z')]
    expect(overlay(Config, Edits, 'v').speed).toBe(0.5)
  })
  it('sorts by at, not by array order', () => {
    const Edits = [at(configEdit('v', 'speed', 0.5), '2026-11-27T02:00:00Z'), at(configEdit('v', 'speed', 2), '2026-11-27T01:00:00Z')]
    expect(overlay(Config, Edits, 'v').speed).toBe(0.5)
  })
  it('ignores applied edits, unknown keys, other viz', () => {
    const Done = { ...configEdit('v', 'speed', 2), applied: { commit: 'abc', at: 'x' } } as Edit
    const Edits = [Done, configEdit('v', 'nope', 1), configEdit('w', 'speed', 3)]
    expect(overlay(Config, Edits, 'v')).toEqual({ speed: 1, accent: '#000000' })
  })
})

describe('edit makers', () => {
  it('config edit shape', () => {
    const E = configEdit('v', 'speed', 2)
    expect(E).toMatchObject({ kind: 'config', vizId: 'v', key: 'speed', value: 2, applied: false })
    expect(Number.isNaN(Date.parse(E.at))).toBe(false)
  })
  it('body and review edits', () => {
    expect(bodyEdit('v', 'posts/a', '가', '나')).toMatchObject({ kind: 'body', post: 'posts/a', find: '가', replace: '나' })
    expect(reviewEdit('v', 'rejected', '색이 어두움')).toMatchObject({ kind: 'review', status: 'rejected', note: '색이 어두움' })
  })
})

describe('latest', () => {
  it('latest body replace for a block', () => {
    const Edits = [at(bodyEdit('v', 'p', '원문', '하나'), '1'), at(bodyEdit('v', 'p', '원문', '둘'), '2')]
    expect(latestBody(Edits, 'p', '원문')).toBe('둘')
    expect(latestBody(Edits, 'p', '다른')).toBeUndefined()
  })
  it('latest review', () => {
    const Edits = [at(reviewEdit('v', 'rejected', 'a'), '1'), at(reviewEdit('v', 'approved', ''), '2')]
    expect(latestReview(Edits, 'v')?.status).toBe('approved')
  })
})
