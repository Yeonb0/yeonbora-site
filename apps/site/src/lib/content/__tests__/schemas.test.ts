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

  it('draft defaults to false and hides only when true', () => {
    expect(PostSchema.parse(Post).draft).toBe(false)
    expect(PostSchema.parse({ ...Post, draft: true }).draft).toBe(true)
  })

  it('posts written on this site use source site and keep devlog keys', () => {
    const P = PostSchema.parse({ ...Post, source: 'site', devlog_project: 'factory-game', devlog_phase: 2 })
    expect(P.source).toBe('site')
    expect(P.devlog_project).toBe('factory-game')
    expect(P.devlog_phase).toBe(2)
  })

  it('keeps the original date', () => {
    expect(PostSchema.parse(Post).date.toISOString().slice(0, 10)).toBe('2026-06-24')
  })

  it('keeps series step and rejects negative step', () => {
    expect(PostSchema.parse({ ...Post, series: '컴퓨터 네트워크', step: 5 }).step).toBe(5)
    expect(PostSchema.parse({ ...Post, step: 0 }).step).toBe(0)
    expect(PostSchema.safeParse({ ...Post, step: -1 }).success).toBe(false)
  })

  it('accepts BOJ tiers only', () => {
    expect(PostSchema.parse({ ...Post, tier: 'Gold' }).tier).toBe('Gold')
    expect(PostSchema.safeParse({ ...Post, tier: 'Ruby' }).success).toBe(false)
  })

  it('keeps description', () => {
    expect(PostSchema.parse({ ...Post, description: '한 줄 요약' }).description).toBe('한 줄 요약')
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
