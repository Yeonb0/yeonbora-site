# 글 옮기기 M2 (시안 작업대 + 첫 시각화) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 샘플 글 1편에 직접 그린 시각화가 사이트에서 뜨고, `pnpm drafts:bundle` 로 묶은 시안을 "시안 작업대" 아티팩트 (별도 URL, 휴대폰 포함) 에서 조절 · 본문 수정 · 승인 / 반려한 뒤, "시안 반영" 으로 그 기록이 저장소에 커밋된다.

**Architecture:** 시각화 하나는 `src/viz/<id>/` 의 React 컴포넌트 + config.json + review.json 이다. 컴포넌트는 `values` (config.json 의 value 만 뽑은 객체) 를 props 로 받는다. 이 계약을 쓰는 곳은 셋이다. (1) 사이트 : `figure[data-viz]` 를 보이는 순간 찾아 `import.meta.glob` 으로 컴포넌트를 불러 붙이는 마운트 스크립트 (`client:visible` 과 같은 동작). (2) 작업대 : 같은 마운트 함수를 쓰는 별도 Vite 앱을 `.drafts-dist/` 로 빌드 (pending 시각화만 포함). (3) 반영 : 아티팩트 db 의 미반영 기록을 저장소 파일에 적용하는 순수 함수 + CLI. 묶음 파일은 index.html 을 빼고 모두 내용 해시 이름이라, 어느 세션이든 `list_files` 와 비교만 하면 "바뀐 파일만" 올릴 수 있다.

**Tech Stack:** Astro 7.4 · React 19 · Vite (Astro 동봉) · unified / remark-parse / remark-gfm / remark-rehype / rehype-raw / rehype-stringify (작업대용 본문 렌더) · yaml 2 · vitest 5 · Node 22 (타입 제거 실행 `node --experimental-strip-types`) · claude-artifacts 도구 (publish_files · declare_capabilities · db_query · db_write)

**Spec:** `docs/content-rules.md` (시각화 · config.json · review.json · 주석) + `docs/migration/project-instructions.md` (시안 작업대 결정 · Phase M2 완료 기준)

## Global Constraints

- 본문은 ` ```viz <id>``` ` 블록 하나만 넣는다. 원문 문단 사이에만, 원문 문장은 쪼개거나 바꾸지 않는다.
- 컴포넌트는 값을 하드코딩하지 않고 config.json 에서 읽는다. config type : `range` · `color` · `toggle` · `select` · `text`.
- review.json : `{ status: 'pending' | 'approved' | 'rejected', post, note, updated }`. 저장소에서는 이 파일이 최종 기록.
- 시각화는 다크 모드 (배경 `#1a1a1a`, 텍스트 `#e0e0e0` 계열). 직접 그린 SVG / 애니메이션. 원문 그림은 지우지 않는다.
- 사이트에서는 화면에 보일 때만 불러온다. 모바일에서 조작 가능, `prefers-reduced-motion` 이면 정지 화면 또는 짧은 애니메이션.
- 설명글 금지 : 라벨 · 캡션만. 원문에 없는 내용을 새로 쓰지 않는다.
- `.drafts-dist/` 는 커밋하지 않는다 (이미 .gitignore 에 있음). 아티팩트는 하나 ("시안 작업대"), slug 는 `docs/migration/drafts-artifact.json`.
- db 기록은 수정 한 건당 문서 하나. "시안 반영" 은 미반영 기록만 읽고, 반영한 기록에 표시한다.
- 시각화 톤은 첫 시각화를 작업대에서 승인받은 뒤 고정한다. 승인 없이 톤을 바꾸지 않는다.
- 허브 · 방 디자인은 건드리지 않는다.
- 코드 규칙 : 들여쓰기 2칸, 배열 · 자료구조 변수명 첫 글자 대문자, 주석 끝 마침표 없음.
- 모든 화면은 375px 폭에서 확인한다.

## Review Focus

1. 같은 슬라이더를 끌 때 기록이 수십 건 쌓임 → 놓았을 때 (`change`) 한 건만 기록한다 (Task 4 테스트 `one edit per commit`).
2. 반영 시 원문에서 `find` 문자열이 0번 또는 2번 이상 나옴 → 고치지 않고 건너뛴 목록에 남긴다 (Task 5 테스트).
3. config 범위를 벗어난 값 · 없는 키 · 이미 삭제된 viz 에 대한 기록 → 건너뛰고 리포트 (Task 5 테스트).
4. 같은 키를 여러 번 바꾼 기록 → 시간순으로 적용해 마지막 값이 남는다 (Task 5 테스트 `last write wins`).
5. db 를 쓸 수 없는 화면 (로그아웃 · 10초 응답 없음) → 작업대는 보기 전용으로 뜨고 "기록할 수 없음" 표시만 한다 (Task 4 테스트).

---

### Task 1 : 시각화 계약 + 사이트 마운트

**Files:**
- Create : `apps/site/src/viz/types.ts` · `apps/site/src/viz/mount.ts` · `apps/site/src/viz/useReducedMotion.ts`
- Create : `apps/site/src/components/content/VizMount.astro`
- Modify : `apps/site/src/pages/posts/[slug].astro` · `apps/site/src/pages/wiki/[slug].astro` (VizMount 한 줄씩)
- Modify : `apps/site/src/lib/remark/viz.ts:1` (주석의 "M2" 문구만 갱신)
- Test : `apps/site/src/viz/__tests__/types.test.ts` · `mount.test.ts`

**Interfaces:**
- Produces :
  - `type ConfigField = { label: string } & ({ type: 'range'; min: number; max: number; step: number; value: number } | { type: 'color'; value: string } | { type: 'toggle'; value: boolean } | { type: 'select'; options: string[]; value: string } | { type: 'text'; value: string | Record<string, string> })`
  - `type VizConfig = Record<string, ConfigField>`
  - `type Values = Record<string, ConfigField['value']>`
  - `type VizProps = { values: Values }` (모든 `src/viz/<id>/index.tsx` 의 default export 가 받는 props)
  - `toValues(Config: VizConfig): Values`
  - `validateValue(Field: ConfigField, value: unknown): { ok: true; value: ConfigField['value'] } | { ok: false; reason: string }` : range 는 min ~ max 와 step 배수, color 는 `#rrggbb`, select 는 options 안, text 객체는 키 집합이 같아야 함
  - `type Loader = (id: string) => Promise<{ default: ComponentType<VizProps>; config: VizConfig }> | undefined`
  - `mountViz(el: HTMLElement, load: Loader, override?: Values): Promise<() => void>` : `.viz-mount` 에 createRoot, 반환값은 unmount
  - `observeViz(root: ParentNode, load: Loader): void` : IntersectionObserver (rootMargin `200px`) 로 보일 때 한 번만 `mountViz`
  - `useReducedMotion(): boolean`
  - `siteLoader` 는 `mount.ts` 안의 `import.meta.glob('./*/index.tsx')` + `import.meta.glob('./*/config.json', { eager: true })` 로 만든 `Loader`

- [ ] **Step 1 : 실패하는 테스트 작성**
  - `toValues` : `{ speed: { type: 'range', …, value: 1 }, labels: { type: 'text', value: { hit: 'a' } } }` → `{ speed: 1, labels: { hit: 'a' } }`
  - `validateValue` : range `3.5` (max 3) → `ok: false` / range `0.25` (step 0.1) → `ok: false` / color `'red'` → `ok: false` / text 객체에 키가 빠짐 → `ok: false` / 정상값 → `ok: true`
  - `mountViz` (jsdom) : 가짜 Loader 의 컴포넌트가 `values.speed` 를 렌더 → `.viz-mount` 안에 그 값이 보이고, `override` 를 주면 override 값이 보인다
  - `observeViz` : 같은 figure 에 교차가 두 번 와도 Loader 는 한 번만 불린다 / 없는 id 면 경고만 하고 figure 는 그대로
- [ ] **Step 2 : 실행해서 실패 확인** — Run : `pnpm test -- src/viz` / Expected : FAIL (모듈 없음)
- [ ] **Step 3 : 구현** — vitest 환경에 jsdom 이 없으면 `jsdom` devDependency 추가하고 두 테스트 파일 맨 위에 `// @vitest-environment jsdom`. VizMount.astro 는 `<script>import { observeViz, siteLoader } from '@/viz/mount'; observeViz(document, siteLoader)</script>` 만 담는다 (Astro 가 번들 · 지연 로드)
- [ ] **Step 4 : 통과 확인** — Run : `pnpm test` / Expected : 전부 PASS
- [ ] **Step 5 : 커밋** — `git commit -m "feat(viz): 시각화 계약 · 화면에 보일 때 붙이는 마운트"`

### Task 2 : 첫 시각화 (샘플 글)

**Files:**
- Create : `apps/site/src/viz/bit-stuffing/index.tsx` · `config.json` · `review.json`
- Modify : `apps/site/src/content/posts/jekyll/2026-06-24-framing-error-control.md` (`### ◆ Stuffing` 절 끝 "→ 수신 측에서 원래대로 복원" 다음, `### ◆ Ethernet Framing` 앞에 viz 블록 하나. 목록 중간에는 넣지 않음)
- Test : `apps/site/src/viz/bit-stuffing/__tests__/stuff.test.ts`

**Interfaces:**
- Consumes : `VizProps` · `useReducedMotion` (Task 1)
- Produces : `stuff(Bits: string): { out: string; Inserted: number[] }` (같은 파일 `stuff.ts`, 컴포넌트가 단계별 애니메이션에 씀)

원문의 예 `1111110 → 11111010` 을 입력으로, 비트가 한 칸씩 지나가며 1 연속 개수 카운터가 5에 닿으면 `0` 이 끼워지는 SVG 애니메이션. 원문에 없는 문장은 넣지 않는다.

config.json (값은 첫 시안, 작업대에서 조절) :
```json
{
  "input": { "type": "text", "value": "1111110", "label": "입력 비트" },
  "speed": { "type": "range", "min": 0.2, "max": 3, "step": 0.1, "value": 1, "label": "속도" },
  "accent": { "type": "color", "value": "#7209B7", "label": "끼운 비트 색" },
  "size": { "type": "range", "min": 280, "max": 640, "step": 10, "value": 420, "label": "크기 (px)" },
  "loop": { "type": "toggle", "value": true, "label": "반복" },
  "labels": { "type": "text", "value": { "input": "보낼 데이터", "output": "stuffing 후", "count": "연속 1" }, "label": "라벨 문구" }
}
```
review.json : `{ "status": "pending", "post": "posts/jekyll/2026-06-24-framing-error-control", "note": "", "updated": "<작업일>" }`

- [ ] **Step 1 : 실패하는 테스트** — `stuff('1111110')` → `{ out: '11111010', Inserted: [5] }` / `stuff('0111111111')` → 1이 5개 뒤 `0`, 다시 카운트 (`out: '01111101111'`) / `stuff('')` → `{ out: '', Inserted: [] }` / `0` · `1` 이외 문자는 무시하지 않고 예외
- [ ] **Step 2 : 실패 확인** — `pnpm test -- bit-stuffing` / FAIL
- [ ] **Step 3 : `stuff` 와 컴포넌트 구현** — 애니메이션은 `requestAnimationFrame` 한 개, reduced-motion 이면 최종 상태 정지 화면. 폭은 `min(values.size, 100%)`, 터치로 재생 / 정지. 잘못된 `input` 이면 그림 대신 빈 상태
- [ ] **Step 4 : 통과 확인 + 화면 확인** — `pnpm test` PASS, `pnpm build` 성공, `pnpm preview` 로 `/posts/2026-06-24-framing-error-control` 을 375px · 1280px 스크린샷 (Playwright). 스크롤 전에는 bit-stuffing 청크가 요청되지 않음을 네트워크 로그로 확인
- [ ] **Step 5 : 커밋** — `feat(viz): bit-stuffing 첫 시각화 (pending)`

### Task 3 : `pnpm drafts:bundle`

**Files:**
- Create : `apps/site/scripts/drafts/collect.ts` (무엇을 묶을지) · `apps/site/scripts/drafts/render-post.ts` (본문 → HTML) · `apps/site/scripts/drafts/bundle.ts` (CLI)
- Create : `apps/site/src/drafts/index.html` · `main.tsx` (Task 4 의 앱 진입점, 이 Task 에서는 목록만 찍는 최소 화면)
- Create : `apps/site/vite.drafts.config.ts`
- Modify : `apps/site/package.json` (`"drafts:bundle": "node --experimental-strip-types scripts/drafts/bundle.ts"`, devDependencies : remark-parse · remark-gfm · remark-rehype · rehype-raw · rehype-stringify) · 루트 `package.json` (`"drafts:bundle": "pnpm --filter site drafts:bundle"`)
- Test : `apps/site/scripts/drafts/__tests__/collect.test.ts` · `render-post.test.ts`

**Interfaces:**
- Consumes : `VizConfig` (Task 1), remark 플러그인 `remarkStripComments` · `remarkViz` · `remarkWikilink` (M1)
- Produces :
  - `interface DraftPost { path: string; title: string; markdown: string; html: string; Blocks: { start: number; end: number; text: string }[] }` : `markdown` 은 원본 파일 그대로 (frontmatter 제외), `Blocks` 는 mdast 최상위 노드의 원문 위치 (본문 수정 단위), `html` 은 주석 제거 · viz figure · 위키 링크가 적용된 결과
  - `interface DraftViz { id: string; config: VizConfig; review: Review; post: string }`
  - `interface DraftsManifest { builtAt: string; Viz: DraftViz[]; Posts: Record<string, string> }` (Posts 값은 해시 이름 `data/post-<hash>.json`)
  - `collectPending(siteDir: string): { Viz: DraftViz[]; postPaths: string[] }` : review.json status 가 `pending` 인 것만, `post` 경로의 글이 없거나 글에 그 viz 블록이 없으면 예외
  - `renderPost(file: string, contentDir: string): DraftPost`
  - 산출물 `.drafts-dist/` (저장소 루트) : `index.html` (manifest 를 `<script type="application/json" id="manifest">` 로 품음, 이 파일만 고정 이름) · `assets/*-<hash>.js|css` · `data/post-<hash>.json` · `files.json` (전체 경로 목록)
- Vite 설정 : root `src/drafts`, 가상 모듈 `virtual:drafts-viz` 가 pending id 들의 `() => import('/src/viz/<id>/index.tsx')` 표를 내보낸다. pending 이 아닌 시각화는 번들에 들어가지 않는다

- [ ] **Step 1 : 실패하는 테스트** — `collectPending` : 임시 폴더에 pending · approved 시각화 하나씩 → pending 하나만 / post 경로가 틀리면 예외 메시지에 viz id 포함. `renderPost` : 샘플 md (`%% x %%` · viz 블록 · `[[ARQ]]` · 표) → html 에 `%%` 없음, `data-viz="bit-stuffing"` 있음, `href="/wiki/ARQ"` 있음, 표가 `<table>`; `Blocks` 를 이어 붙인 위치가 원문 순서와 같고 각 `text` 가 `markdown.slice(start, end)` 와 같다
- [ ] **Step 2 : 실패 확인**
- [ ] **Step 3 : 구현** — bundle.ts 는 `collectPending` → `renderPost` → JSON 을 내용 해시 이름으로 쓰기 → Vite `build()` 를 프로그램으로 호출 → index.html 에 manifest 주입 → `files.json`. 실행 전 `.drafts-dist/` 를 비운다
- [ ] **Step 4 : 통과 확인** — `pnpm test` PASS. `pnpm drafts:bundle` 후 `.drafts-dist/files.json` 에 index.html · data · assets 가 있고, 두 번 연속 실행해도 index.html 외의 파일 이름이 같다 (내용이 같으면 해시가 같음). `npx serve .drafts-dist` 로 열어 목록에 bit-stuffing 이 뜬다
- [ ] **Step 5 : 커밋** — `feat(drafts): 시안 묶음 스크립트`

### Task 4 : 작업대 앱 (아티팩트 화면)

**Files:**
- Create : `apps/site/src/drafts/App.tsx` · `Controls.tsx` · `PostView.tsx` · `ReviewBar.tsx` · `edits.ts` · `drafts.css`
- Modify : `apps/site/src/drafts/main.tsx`
- Test : `apps/site/src/drafts/__tests__/edits.test.ts` · `Controls.test.tsx`

**Interfaces:**
- Consumes : `DraftsManifest` · `DraftPost` (Task 3), `mountViz` · `validateValue` · `toValues` (Task 1)
- Produces (db 문서 모양, Task 5 가 그대로 읽음) :
  - 컬렉션 `edits`, 문서 id `<ISO 시각>-<4자 난수>`
  - `type Edit = { at: string; vizId: string; applied: false | { commit: string; at: string } } & ({ kind: 'config'; key: string; value: unknown } | { kind: 'body'; post: string; find: string; replace: string } | { kind: 'review'; status: 'approved' | 'rejected'; note: string })`
  - `overlay(Config: VizConfig, Edits: Edit[]): Values` : 미반영 config 기록을 시간순으로 덮은 현재 값 (다시 열어도 조절한 값이 남음)
  - `makeEdit(…): Edit` 류 생성 함수 3개 (`configEdit` · `bodyEdit` · `reviewEdit`)
  - `openStore(): Promise<{ add(e: Edit): Promise<void>; subscribe(cb: (Edits: Edit[]) => void): () => void } | null>` : `claude.use('db')` 이 null 이거나 10초 안에 응답이 없으면 null

화면 (다크, 375px 우선) : 위 목록 (pending 시각화 · 글 제목 · 상태) → 고르면 [시각화 미리보기 + 조절판] 과 [본문] 두 탭 (데스크톱은 나란히). 조절판은 config.json 으로 그려지며 type 별 입력 (range 슬라이더 + 숫자, color, toggle, select, text 는 키마다 한 줄). 본문 탭은 글 HTML 을 보여 주고 viz 자리에 같은 미리보기를 붙이며, 블록을 누르면 그 블록 원문 textarea 가 열려 저장 시 `bodyEdit(find = 블록 원문, replace = 고친 원문)`. 아래 고정 막대 : 승인 / 반려 + 메모. 기록 목록 (미반영만) 을 접이식으로 보여 준다.

- [ ] **Step 1 : 실패하는 테스트** — `overlay` : 같은 키 기록 두 개 → 늦은 값 / 반영된 기록은 무시 / 없는 키 기록은 무시. `Controls` (jsdom) : 슬라이더를 `input` 으로 10번 움직이고 `change` 한 번 → `onCommit` 한 번 (`one edit per commit`). 값이 그대로면 기록 안 함. `openStore` 가 null 이면 승인 버튼 비활성 + "기록할 수 없음" 문구
- [ ] **Step 2 : 실패 확인**
- [ ] **Step 3 : 구현** — db 값은 모두 textContent 로만 화면에 넣는다. 구독은 한 번 (`onSnapshot`), 쓰기는 문서 하나씩
- [ ] **Step 4 : 통과 확인** — `pnpm test` PASS, `pnpm drafts:bundle` 후 로컬에서 375px 스크린샷 (db 없이 보기 전용으로 뜨는지)
- [ ] **Step 5 : 커밋** — `feat(drafts): 시안 작업대 화면`

### Task 5 : "시안 반영" (db → 저장소)

**Files:**
- Create : `apps/site/scripts/drafts/apply.ts` (순수 함수) · `apps/site/scripts/drafts/apply-cli.ts`
- Modify : `apps/site/package.json` (`"drafts:apply": "node --experimental-strip-types scripts/drafts/apply-cli.ts"`) · 루트 `package.json`
- Test : `apps/site/scripts/drafts/__tests__/apply.test.ts`

**Interfaces:**
- Consumes : `Edit` (Task 4), `validateValue` (Task 1)
- Produces :
  - `applyEdits(Repo: { Configs: Record<string, VizConfig>; Reviews: Record<string, Review>; Posts: Record<string, string> }, Edits: (Edit & { id: string })[], today: string): { Repo: typeof Repo; Applied: string[]; Skipped: { id: string; reason: string }[] }`
  - CLI : `pnpm drafts:apply <edits.json>` → 파일을 고쳐 쓰고 `{ Applied, Skipped }` 를 stdout JSON 으로. review 기록은 `status` · `note` · `updated` 를 바꾼다

반영 절차 (Claude 가 "시안 반영해 줘" 를 받았을 때, 문서로는 Task 6 에서 남김) :
1. `db_query(collection: 'edits', where: [{ field: 'applied', op: '==', value: false }], orderBy: 'at')` → `/tmp/edits.json`
2. 브랜치 `drafts/apply-<날짜>` 에서 `pnpm drafts:apply /tmp/edits.json` → `pnpm test` → 커밋 (메시지에 반영 건수 · 건너뛴 건수)
3. Applied 의 각 문서에 `db_write` update `{ applied: { commit, at } }` (ifVersion 포함, 50건씩)
4. Skipped 는 이유와 함께 사용자에게 보고하고 표시하지 않는다 (다음에 다시 보이도록)

- [ ] **Step 1 : 실패하는 테스트** — `last write wins` (같은 키 0.5 → 2 → 1.5 면 1.5) / 범위 밖 값 · 없는 키 · 없는 viz → Skipped / body `find` 가 0번 · 2번 → Skipped, 1번 → 바뀜 / review rejected + note → review.json 갱신, `updated` 는 today / 이미 반영된 기록은 입력에 와도 무시
- [ ] **Step 2 : 실패 확인**
- [ ] **Step 3 : 구현** — JSON 은 2칸 들여쓰기 + 끝 줄바꿈으로 써서 diff 를 작게
- [ ] **Step 4 : 통과 확인** — `pnpm test` PASS
- [ ] **Step 5 : 커밋** — `feat(drafts): 시안 반영 스크립트`

### Task 6 : 아티팩트 연결 · 끝까지 한 바퀴 (수동 검증)

**Files:**
- Modify : `docs/migration/drafts-artifact.json` (slug 채우기)
- Modify : `docs/content-rules.md` (시안 작업대 절 : 묶기 · 올리기 · 반영 절차와 db 문서 모양, 규칙 문서 하나에만 적음)
- Modify : `.devlog/config.yml` (`current_migration_phase: M2`)

- [ ] **Step 1 : 처음 올리기** — `pnpm drafts:bundle` → `publish_files` (새 아티팩트, title "시안 작업대", `.drafts-dist/` 전체) → `declare_capabilities({ db: {}, user: {} })` → slug 를 drafts-artifact.json 에 기록
- [ ] **Step 2 : 다시 올리기 절차 확인** — 값을 하나 바꿔 다시 묶고, `list_files` 결과와 `files.json` 을 비교해 새 경로 + index.html 만 올리고 사라진 경로는 `remove` 로 지운다. 올린 파일 수가 전체보다 적음을 확인
- [ ] **Step 3 : 사용자 확인 (휴대폰)** — 사용자가 휴대폰에서 작업대를 열어 슬라이더 조절 1건 · 라벨 수정 1건 · 본문 오타 표시 수정 1건 · 승인 또는 반려 메모 1건을 남긴다
- [ ] **Step 4 : 반영** — Task 5 절차로 커밋, db 기록에 applied 표시, 작업대를 다시 묶어 올렸을 때 (승인이면) 목록에서 빠지는지 확인
- [ ] **Step 5 : 사이트 확인** — `pnpm build` 성공, 샘플 글에서 반영된 값으로 시각화가 뜨는지 375px 스크린샷
- [ ] **Step 6 : 커밋 + PR** — `docs(migration): 시안 작업대 연결 · M2 완료 기준 확인`
