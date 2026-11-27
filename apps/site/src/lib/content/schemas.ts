// collection frontmatter 스키마 : 규칙은 docs/content-rules.md
import { z } from 'astro/zod'

export const Fields = ['computer', 'philosophy', 'religion', 'etc'] as const
export const Sources = ['jekyll', 'velog', 'tistory', 'notion', 'obsidian', 'paper'] as const

const Field = z.enum(Fields)
const Source = z.enum(Sources)
const Strings = z.array(z.coerce.string()).default([])

export const WikiSchema = z.object({
  title: z.string(),
  aliases: Strings,
  tags: Strings,
  field: Field,
  topic: z.string().optional(),
  source: Source,
  sourcePath: z.string().optional(),
  created: z.coerce.date().optional(),
  autolink: z.boolean().default(true),
})

export const PostSchema = z
  .object({
    title: z.string(),
    field: Field,
    context: z.enum(['self', 'course', 'study']),
    course: z.string().optional(),
    year: z.number().int().min(1).max(5).optional(),
    topic: z.string().optional(),
    // 원래 플랫폼과 원래 작성일 : 비면 빌드가 멈춘다
    source: Source,
    originalUrl: z.url().optional(),
    date: z.coerce.date(),
    tags: Strings,
    series: z.string().optional(),
  })
  .superRefine((p, ctx) => {
    if (p.context === 'course' && !p.course) ctx.addIssue({ code: 'custom', path: ['course'], message: 'context 가 course 면 course 가 필요하다' })
  })

// 학교 방 data.ts 의 분류 그대로
export const CourseSchema = z.object({
  title: z.string(),
  code: z.string().optional(),
  year: z.number().int().min(1).max(5),
  category: z.enum(['gen', 'phil', 'rel', 'cse']),
})
