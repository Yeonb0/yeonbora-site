// collection frontmatter 스키마 : 규칙은 docs/content-rules.md
import { z } from 'astro/zod'

export const Fields = ['computer', 'philosophy', 'religion', 'etc'] as const
// site : 이 사이트에서 처음 쓴 글 (devlog 등)
export const Sources = ['jekyll', 'velog', 'tistory', 'notion', 'obsidian', 'paper', 'site'] as const
// BOJ 글의 티어 : 기술 블로그 BOJ 폴더에서 책 대신 놓인다
export const Tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const

const Field = z.enum(Fields)
const Source = z.enum(Sources)
const Strings = z.array(z.coerce.string()).default([])

export const WikiSchema = z.object({
  title: z.string(),
  aliases: Strings,
  tags: Strings,
  field: Field,
  topic: z.string().optional(),
  // 배운 곳 (코스) id : sections/wiki 의 코스 칸에서 묶어 보인다 (lib/content/wiki-courses.ts)
  course: Strings,
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
    // 시리즈 안 순서 (깃블로그 step 그대로, 0 부터일 수 있다)
    step: z.number().int().min(0).optional(),
    tier: z.enum(Tiers).optional(),
    // 목록 카드의 한 줄 요약 : 없으면 본문 앞부분을 쓴다
    description: z.string().optional(),
    // 인문 블로그 도서관의 책 id (sections/humanities/data.ts 의 Books) : 그 책을 펼치면 글 목록에 나온다
    book: z.string().optional(),
    // 숨김 : true 면 빌드에서 빠진다 (pnpm dev 에서는 보인다). devlog 초안은 관리자 승인 전까지 true
    draft: z.boolean().default(false),
    // 개발일지 (devlog 플러그인) 가 쓰는 키
    devlog_project: z.string().optional(),
    devlog_phase: z.union([z.number(), z.string()]).optional(),
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

// Layered Wiki 설명 탭 : 주차 하나의 한 판 (제출본 / 최신판)
export const WeekSchema = z.object({
  week: z.number().int().positive(),
  edition: z.enum(['submitted', 'latest']),
  date: z.coerce.date(),
  // 수업 위키 원문으로 아직 바꾸지 않은 임시 본문
  provisional: z.boolean().default(false),
})
