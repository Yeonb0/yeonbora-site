import { describe, expect, it } from 'vitest'
import { CourseSchema, PostSchema, WikiSchema } from '../schemas'

const Post = { title: '[Network] Framing / Error Control', field: 'computer', context: 'self', source: 'jekyll', date: '2026-06-24' }

describe('PostSchema', () => {
  it('post requires date', () => {
    const { date: _, ...NoDate } = Post
    expect(PostSchema.safeParse(NoDate).success).toBe(false)
  })

  it('post requires source', () => {
    const { source: _, ...NoSource } = Post
    expect(PostSchema.safeParse(NoSource).success).toBe(false)
  })

  it('course context requires course', () => {
    expect(PostSchema.safeParse({ ...Post, context: 'course' }).success).toBe(false)
    expect(PostSchema.safeParse({ ...Post, context: 'course', course: '컴퓨터네트워크' }).success).toBe(true)
  })

  it('keeps the original date', () => {
    expect(PostSchema.parse(Post).date.toISOString().slice(0, 10)).toBe('2026-06-24')
  })
})

describe('WikiSchema', () => {
  it('wiki defaults', () => {
    const W = WikiSchema.parse({ title: 'ARQ', field: 'computer', source: 'obsidian' })
    expect(W.aliases).toEqual([])
    expect(W.tags).toEqual([])
    expect(W.autolink).toBe(true)
  })

  it('bad field rejected', () => {
    expect(WikiSchema.safeParse({ title: 'ARQ', field: 'network', source: 'obsidian' }).success).toBe(false)
  })
})

describe('CourseSchema', () => {
  it('year and category', () => {
    expect(CourseSchema.safeParse({ title: '컴퓨터네트워크', year: 4, category: 'cse' }).success).toBe(true)
    expect(CourseSchema.safeParse({ title: '컴퓨터네트워크', year: 6, category: 'cse' }).success).toBe(false)
  })
})
