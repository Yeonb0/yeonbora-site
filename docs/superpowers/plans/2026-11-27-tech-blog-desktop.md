# 기술 블로그 바탕화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/posts/` 를 깃블로그 색감의 바탕화면 (왼쪽 카테고리 폴더 · 가운데 글 목록 창 · 오른쪽 책 아이콘) 으로 바꾼다.

**Architecture:** `pages/posts/index.astro` 가 `field: computer` posts 를 가벼운 `DeskPost[]` 로 바꿔 React 섬 `Desktop.tsx` 에 넘긴다. 폴더 · 책 · 목록 계산은 순수 함수 (`sections/posts/desk.ts`) 로 두고 vitest 로 검증한다. 열린 폴더 · 책은 주소 해시에 남긴다.

**Tech Stack:** Astro 7, React 19 (client:only), vitest, zod

**Spec:** `docs/superpowers/specs/2026-11-27-tech-blog-desktop-design.md`

## Global Constraints

- 색 : 바탕 #232236, 메뉴 막대 #1c1b2d, 창 #201f32, 창 제목 막대 #3d3c52, 강조 #aa93c2, 노랑 #F0C674 (시리즈 / 책 표시에만)
- 티어 색 : Bronze #996C53 · Silver #DCDCDC · Gold #FFEE8B · Platinum #A9FFB0
- 모든 글자 `word-break: keep-all`
- 창 열기 : transform .26s cubic-bezier(.22,1,.36,1) (반동 없음), 닫기 .15s, 폴더 바꿈 간격 150ms. reduced-motion 이면 0.05s
- 들여쓰기 2칸, 주석 끝 마침표 없음, 요청하지 않은 설명글 없음
- 기술 블로그에는 `field: computer` 글만

## Review Focus

- 빈 폴더 (글 0편) : 창에 빈 상태 한 줄, 오른쪽 책 칸은 비어 있다 → Task 2 `folderView` 테스트
- `step` 이 0부터 시작하는 시리즈 : 순서 표시는 1부터 → Task 2 `rankInSeries` 테스트
- 해시가 없는 폴더 · 책을 가리킬 때 : 기본 폴더 (network) 로 연다 → Task 2 `parseHash` 테스트
- 요약에 `%% 주석 %%` · 이미지 · 코드 블록 · HTML 태그가 섞인 본문 → Task 2 `summarize` 테스트
- topic 이 폴더 목록에 없는 글 : "기타" 폴더에 모인다 → Task 2 `folderOf` 테스트

---

### Task 1: 스키마에 step · tier · description

**Files:**
- Modify: `apps/site/src/lib/content/schemas.ts` (PostSchema)
- Modify: `docs/content-rules.md` (posts 예시)
- Test: `apps/site/src/lib/content/__tests__/schemas.test.ts`

**Interfaces:**
- Produces: `PostSchema` 에 `step?: number` (정수 ≥ 0), `tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'`, `description?: string`; `export const Tiers`

- [ ] 테스트 : `step: 5` 가 남는다, `step: -1` 실패, `tier: 'Gold'` 통과 · `tier: 'Ruby'` 실패
- [ ] 실패 확인 `pnpm vitest run src/lib/content/__tests__/schemas.test.ts`
- [ ] 스키마 · 문서 수정, 통과 확인, 커밋

### Task 2: 바탕화면 데이터 (`desk.ts` · `data.ts`)

**Files:**
- Create: `apps/site/src/sections/posts/data.ts` (Folders : id · name · topics · glyph, TierColors, DefaultFolder = 'network')
- Create: `apps/site/src/sections/posts/desk.ts`
- Test: `apps/site/src/sections/posts/__tests__/desk.test.ts`

**Interfaces:**
- Produces:
  - `type DeskPost = { id, title, date: string (YYYY-MM-DD), topic?: string, series?: string, step?: number, tier?: Tier, tags: string[], summary: string }`
  - `summarize(body: string, max = 140): string`
  - `folderOf(topic?: string): string` (폴더 id, 없으면 'etc')
  - `rankInSeries(posts: DeskPost[], p: DeskPost): number | null`
  - `folderView(posts: DeskPost[], folder: string, book: string | null): { books: BookIcon[]; rows: Row[]; count: number; book: string | null }` — 책 하나면 자동 선택, `'__loose'` 는 시리즈 밖, BOJ 는 티어가 책 역할이고 최신 순
  - `recent(posts: DeskPost[], n = 8): Row[]`
  - `parseHash(hash: string): { folder: string; book: string | null }`, `toHash(folder, book): string`

- [ ] 테스트 작성 (Review Focus 다섯 줄 포함 + 책 둘인 폴더는 '전체' 가 맨 앞 + BOJ 최신 순)
- [ ] 실패 확인 → 구현 → 통과 → 커밋

### Task 3: 섬 · 페이지 · 스타일

**Files:**
- Create: `apps/site/src/sections/posts/Desktop.tsx`, `apps/site/src/sections/posts/desktop.css`
- Modify: `apps/site/src/sections/posts/tokens.css`, `Layout.astro` (padding 제거), `apps/site/src/pages/posts/index.astro`
- Modify: `apps/site/src/sections/registry.ts` (posts label '기술 블로그', en 'Tech')

- [ ] 페이지가 collection → `DeskPost[]` (summary 는 `description ?? summarize(body)`) 로 바꿔 `<Desktop client:only="react" posts={...} />`
- [ ] 시안 마크업 · 값 그대로 옮기기 (폴더 글리프, 카드 / 한 줄 보기, 창 애니메이션, 해시 동기화)
- [ ] 900px 미만 : 폴더 · 책 가로 스크롤 줄, 창 전체 너비, 썸네일 88 × 66
- [ ] `pnpm test` · `pnpm build` 통과 확인, 커밋
