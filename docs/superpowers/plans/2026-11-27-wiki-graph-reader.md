# 위키 그래프 읽기 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/wiki/` 를 전체 그래프 + 카테고리 확대 첫 화면으로, `/wiki/<slug>` 를 트리 · 글 · 그래프 카드 + 목차 · 역링크 세 칸 화면으로 바꾼다.

**Architecture:** 빌드 때 `wiki-graph.ts` 순수 함수가 노드 · 선 · 카테고리 데이터를 만들고, 두 페이지가 같은 데이터를 `WikiGraph.tsx` 섬 (d3-force) 에 넘긴다. 섬은 `transition:persist="wiki-graph"` 로 페이지를 넘어 살아남고, 트리 · 목차 · 칸 조절 · 호버 연결은 `wiki.ts` 클라이언트 스크립트가 `wiki:topic` · `wiki:focus` 이벤트로 섬과 주고받는다.

**Tech Stack:** Astro 7 + React 19 섬, d3-force, vitest

**Spec:** `docs/superpowers/specs/2026-11-27-wiki-graph-reader-design.md`

## Global Constraints

- 색 : 바탕 #232236, 패널 #1c1b2d, 선 #3a3954 · #565569, 호버 #34334d, 보라 #aa93c2 (밝은 #e6dcf5), 글 노드 · 강조 #f0c674, 글씨 #eaeaea, 보조 #b4b3c8, 위키 노드 #8e8da6
- 칸 : 왼쪽 기본 260px (180 ~ 420), 오른쪽 기본 300px (220 ~ 520), 그래프 카드는 오른쪽 칸 너비 정사각형, 모바일 기준 860px, 모바일 그래프 띠 220px
- 글 노드 기본값 : 첫 화면 끔, 글 화면 켬 (localStorage `wiki-posts`), 칸 너비 localStorage `wiki-panes`
- 확대 · 이동 애니메이션 0.6 ~ 0.7s, `cubic-bezier(0.22, 1, 0.36, 1)` 계열, reduced motion 이면 즉시
- 디자인에 설명글 없음, 코드 들여쓰기 2칸, 주석 끝 마침표 없음, 배열 · 자료구조 변수명 대문자 시작

## Review Focus

- topic 이 없는 노트 : "기타" 카테고리로 묶여야 한다 → Task 1 테스트
- 같은 노트를 두 번 링크 · 서로 링크 : 선은 한 번만 → Task 1 테스트
- 자기 자신 링크 · `[[#소제목]]` · 이미지 임베드 : 노드 · 선이 생기면 안 된다 → Task 1 테스트
- 위키를 링크하지 않은 글 : 그래프에 나오면 안 된다 → Task 1 테스트
- 위키 노트끼리의 역링크 : 역링크 목록에 나와야 한다 → Task 2 테스트

---

### Task 1: 그래프 데이터

**Files:**
- Create: `apps/site/src/lib/content/wiki-graph.ts`, `apps/site/src/sections/wiki/topics.ts`
- Test: `apps/site/src/lib/content/__tests__/wiki-graph.test.ts`

**Interfaces:**
- Produces: `buildWikiGraphData(Nodes: (Node & { topic?: string })[], G: Graph): WikiGraphData`
  - `WikiGraphData = { nodes: GNode[]; links: [string, string][]; topics: { id: string; name: string }[] }`
  - `GNode = { id: string; title: string; kind: 'wiki' | 'post' | 'ghost'; topic: string }` — id 는 위키 `/wiki/<slug>`, 글 `/posts/<slug>`, 빈 점 `?<소문자 이름>`. 글 · 빈 점의 topic 은 이웃 위키 노트 중 첫 번째의 topic
  - `topicName(id: string): string`, `TopicOrder: string[]` (topics.ts). topic 없음 → `etc` / "기타"

- [ ] Step 1 : 테스트 — `[[B]] [[B]]` · B 가 A 를 링크하면 links 길이 1, `[[없음]]` 은 `?없음` ghost, `[[#제목]]` · `![[a.png]]` · 자기 링크는 무시, 위키를 링크 안 한 글은 nodes 에 없음, topic 없는 노트는 `etc`, topics 는 노트가 있는 것만 TopicOrder 순서
- [ ] Step 2 : 실행해 실패 확인 `pnpm vitest run src/lib/content/__tests__/wiki-graph.test.ts`
- [ ] Step 3 : 구현 (parseWikilinks + G.resolve)
- [ ] Step 4 : 통과 확인 후 커밋

### Task 2: 역링크 확장 + 깨진 링크 표시

**Files:**
- Modify: `apps/site/src/lib/content/graph.ts` (backlinks), `apps/site/src/lib/remark/wikilink.ts` (broken span 에 `data-target`)
- Test: `graph.test.ts`, `lib/remark/__tests__/wikilink.test.ts`

- [ ] Step 1 : 테스트 — 위키 노트가 다른 위키 노트를 링크하면 `backlinks` 에 들어감 (본문 순서 아닌 노드 순서), 깨진 링크 span 에 `data-target="없음"`
- [ ] Step 2 : 실패 확인 → 구현 → 통과 → 커밋

### Task 3: 그래프 섬

**Files:**
- Create: `apps/site/src/sections/wiki/WikiGraph.tsx`, `apps/site/src/sections/wiki/graph.css`, `apps/site/src/sections/wiki/labels.ts`
- Test: `apps/site/src/sections/wiki/__tests__/labels.test.ts`

**Interfaces:**
- Consumes: `WikiGraphData` (Task 1)
- Produces: `<WikiGraph data={WikiGraphData} current={string | null} />`, 이벤트 수신 `wiki:topic` (detail `string | null`), `wiki:focus` (detail `string | null`)
- `placeLabels(Items: LabelItem[], Obstacles: Box[], W: number, H: number): Map<string, Spot | null>` (labels.ts, 순수 함수) — 우선순위 순서대로 아래 → 위 → 오른쪽 → 왼쪽, 겹치거나 칸 밖이면 다음 자리, 다 막히면 null (단 `force` 항목은 아래 자리)

- [ ] Step 1 : labels 테스트 — 두 노드가 붙어 있으면 둘째 이름표가 위로 가고, 사방이 막히면 null, 칸 밖으로 나가는 자리는 고르지 않음
- [ ] Step 2 : 실패 확인 → labels.ts 구현 → 통과
- [ ] Step 3 : `pnpm add d3-force` + `@types/d3-force`, WikiGraph.tsx 구현 (목업 동작 그대로 : 카테고리 중심 forceX/Y, 확대 viewBox 애니메이션, 지금 글 정중앙, 2단계 로컬 (2단계 빈 점 제외), 글 노드 버튼, 끌기 · 클릭 이동, 호버 강조, 크기 고정 노드)
- [ ] Step 4 : 커밋

### Task 4: 페이지 · 레이아웃

**Files:**
- Modify: `apps/site/src/sections/wiki/Layout.astro`, `tokens.css`, `apps/site/src/pages/wiki/index.astro`, `[slug].astro`
- Create: `apps/site/src/sections/wiki/Tree.astro`, `wiki.ts` (클라이언트 스크립트), `home.css`

- [ ] Step 1 : Layout 세 칸 grid (`--lw` · `--rw`, 첫 화면은 오른쪽 0), 저장된 칸 너비를 그리기 전에 적용하는 inline 스크립트, 경계선 손잡이
- [ ] Step 2 : Tree (카테고리 버튼 + 노트 목록), 첫 화면은 버튼이 확대 이벤트, 글 화면은 `/wiki/?topic=` 로 이동
- [ ] Step 3 : `[slug]` : 가운데 Article, 오른쪽 그래프 카드 + 목차 (headings) + 역링크, 본문 링크 호버 → `wiki:focus`
- [ ] Step 4 : `pnpm build` 통과, 로컬 `pnpm preview` 화면 확인 (데스크톱 1440 · 모바일 390), 커밋

### Task 5: 마무리

- [ ] `pnpm test` · `pnpm build` 전체 통과
- [ ] 브랜치 전체 리뷰 후 PR
