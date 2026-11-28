import { describe, expect, it, vi } from 'vitest'

vi.mock('astro:content', () => ({ getCollection: vi.fn() }))
const { isVisible } = await import('../posts')

const post = (draft: boolean) => ({ data: { draft } }) as unknown as Parameters<typeof isVisible>[0]

describe('isVisible', () => {
  it('hides drafts in the build and shows them on the dev server', () => {
    expect(isVisible(post(false), false)).toBe(true)
    expect(isVisible(post(true), false)).toBe(false)
    expect(isVisible(post(true), true)).toBe(true)
  })
})
