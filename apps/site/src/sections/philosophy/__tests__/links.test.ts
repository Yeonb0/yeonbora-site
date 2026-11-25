import { describe, expect, it } from 'vitest'
import { postTarget } from '../links'
import type { Philosopher } from '../types'

const Kant: Philosopher = { id: 'kant', name: '칸트', label: 'KANT', wing: 'west', room: 'modern', weight: 3, posts: [] }

describe('postTarget', () => {
  it('글이 없으면 갈 곳이 없다', () => {
    expect(postTarget({ ...Kant, posts: [] })).toBeNull()
  })

  it('글이 한 편이면 그 글로', () => {
    expect(postTarget({ ...Kant, posts: ['kant-critique'] })).toBe('/posts/kant-critique')
  })

  it('글이 여러 편이면 그 철학자로 걸러 둔 서재 목록으로', () => {
    expect(postTarget({ ...Kant, posts: ['a', 'b'] })).toBe('/posts?topic=kant')
  })
})
