// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { openStore, writeErrorState } from '../store'

afterEach(() => delete (window as { claude?: unknown }).claude)

describe('openStore', () => {
  it('null when use(db) rejects', async () => {
    ;(window as { claude?: unknown }).claude = { use: () => Promise.reject({ code: 'not_granted' }) }
    await expect(openStore(300)).resolves.toBeNull()
  })
  it('null when runtime missing', async () => {
    await expect(openStore(300)).resolves.toBeNull()
  })
})

describe('writeErrorState', () => {
  it('locks on terminal codes', () => {
    for (const c of ['invalid_argument', 'revoked', 'not_granted', 'capability_disabled']) expect(writeErrorState(c).canWrite).toBe(false)
  })
  it('stays writable on transient codes', () => {
    expect(writeErrorState('unavailable').canWrite).toBe(true)
    expect(writeErrorState('resource_exhausted').canWrite).toBe(true)
  })
  it('quota message', () => {
    expect(writeErrorState('quota_exceeded').message).toBe('기록 공간이 가득 참')
  })
})
