# Layered Wiki 첫 화면 · 공개 시연 연결 Implementation Plan (사이트)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/projects/layered-wiki/` 에 들어오면 시연 / 발표 / 설명을 고르는 첫 화면이 먼저 보이고, 시연 탭은 발표 PC 의 localhost 대신 공개 시연 서버 (`https://demo-api.yeonbora.dev`) 에 붙는다.

**Architecture:** 이미 있는 무대 (`src/sections/layered-wiki/`) 에 네 번째 패널 `home` 을 더하고, 탭 순서 · 숫자키 · 해시를 바꾼다. 시연 서버 주소는 `data.ts` 의 `ApiBase` 한 곳과 `demo:sync` 의 `VITE_API_BASE` 에서만 바뀐다. 서버 쪽은 별도 계획 (`2026-11-27-layered-wiki-public-demo-server.md`).

**Tech Stack:** Astro 7, TypeScript, vitest, pnpm (사이트 저장소 yeonbora-site)

**Spec:** `docs/superpowers/specs/2026-11-27-layered-wiki-project-page-design.md` (9.3 첫 화면, 9.4 주소, 5.2 ~ 5.4 는 9절이 덮어쓴 부분 빼고 유효)

## Global Constraints

- 들여쓰기 2칸, 배열 · 자료구조 변수는 대문자 시작, 주석 끝 마침표 없음
- 화면 다크 모드 : 배경 `#1a1a1a`, 글자 `#e0e0e0` 계열, 강조 `#a88bfa`
- 탭 순서 · 숫자키 : `1` 시연, `2` 발표, `3` 설명, `0` 첫 화면
- 해시 : `#home` (또는 없음) · `#demo` · `#slides-n` · `#wiki-NN`
- 첫 화면에서는 하단 막대를 띄우지 않는다
- 시연 카드에 서버 상태와 쓰는 모델을 적는다 : "미리 돌린 볼트 : 로컬 <health.base_model_id>, 라이브 : <health.model_id>"
- 입력창에 포커스가 있으면 모든 단축키를 무시한다 (기존 규칙 유지)
- 공개 시연 서버 주소 : `https://demo-api.yeonbora.dev` (매핑이 막히면 서버 계획 Task 9 가 알려 주는 `*.run.app` 주소로 이 값만 바꾼다)
- 프로젝터 화면에 늘 떠 있는 UI 금지 (반목표)

## Review Focus

1. 시연 서버가 콜드 스타트 중 (첫 요청 수십 초) : 첫 화면 · 시연 탭이 "서버를 깨우는 중" 으로 보이고, 오류처럼 보이지 않는다 → Task 2 의 `describeApi` 테스트
2. 페이지를 열어 둔 채 다른 탭으로 가 있을 때 : 5초 health 확인이 계속 돌아 Cloud Run 을 깨워 두지 않는다 (숨은 탭에서는 멈춤) → Task 2 의 `shouldPoll` 테스트
3. `#slides-99` · `#wiki-04` 처럼 없는 장 · 주차 해시로 들어올 때 : 첫 화면이 아니라 그 탭의 첫 장 · 첫 주차로 → Task 1 의 `resolveStart` 테스트
4. health 응답에 `model_id` 가 없을 때 (옛 서버) : 카드가 "모델 정보 없음" 으로 보이고 깨지지 않는다 → Task 2 의 `describeApi` 테스트
5. 숫자키 `0` 을 시연 iframe 안에서 눌렀을 때 : 첫 화면으로 돌아온다 (iframe 키 연결 목록에 `0` 포함) → Task 1 의 수동 확인 단계

---

### Task 1: 첫 화면 패널과 탭 · 숫자키 · 해시 재배치

**Files:**
- Modify: `apps/site/src/sections/layered-wiki/stage.ts` (`Tab` 타입, `TabKeys`, `parseHash`, `mountStage` 의 처음 자리 · 막대)
- Modify: `apps/site/src/pages/projects/layered-wiki/index.astro` (첫 화면 패널, 막대 버튼 순서 · 첫 화면 버튼)
- Modify: `apps/site/src/sections/layered-wiki/stage.css` (`.lw-panel[data-panel='home']`, 카드 3장, `.lw[data-tab='home'] .lw-bar` 숨김)
- Test: `apps/site/src/sections/layered-wiki/__tests__/stage.test.ts`

**Interfaces:**
- Produces: `type Tab = 'home' | 'demo' | 'slides' | 'wiki'`, `TabKeys: Record<string, Tab>` (export), `parseHash(Hash: string): { tab: Tab; n?: string } | null`, `resolveStart(Hash: string, SlideCount: number, WeekIds: string[]): { tab: Tab; slide: number; week: string | null }`
- 첫 화면 카드 마크업 : `<button class="lw-card" data-tab="demo|slides|wiki">` 안에 제목 · 한 줄 설명 · 상태 줄 (`[data-card-status]`). Task 2 가 시연 카드의 `[data-card-status]` 를 채운다

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
it('숫자키 0 1 2 3', () => {
  expect(TabKeys).toEqual({ '0': 'home', '1': 'demo', '2': 'slides', '3': 'wiki' })
})
it('#home 과 빈 해시는 첫 화면', () => {
  expect(parseHash('#home')).toEqual({ tab: 'home', n: undefined })
  expect(resolveStart('', 2, ['01'])).toEqual({ tab: 'home', slide: 0, week: null })
})
it('없는 장 · 주차는 그 탭의 처음으로', () => {
  expect(resolveStart('#slides-99', 2, ['01'])).toEqual({ tab: 'slides', slide: 0, week: null })
  expect(resolveStart('#wiki-04', 2, ['01', '07'])).toEqual({ tab: 'wiki', slide: 0, week: '01' })
  expect(resolveStart('#slides-2', 2, ['01'])).toEqual({ tab: 'slides', slide: 1, week: null })
})
```

- [ ] **Step 2: 실패 확인** — Run: `cd apps/site && npx vitest run src/sections/layered-wiki` → Expected: FAIL (`resolveStart` 없음, `TabKeys` 값 다름)

- [ ] **Step 3: 구현** — `stage.ts` 에서 `TabKeys` 를 export 하고 위 값으로, `resolveStart` 를 순수 함수로 추가하고 `mountStage` 의 처음 자리를 이것으로 바꾼다. `showTab('home')` 일 때 `Root.dataset.bar = 'closed'` 로 두고 `.lw-edge` 호버를 무시한다. iframe 키 연결 (`hookFrame`) 이 `TabKeys` 의 모든 키 (`0` 포함) 를 넘기게 한다. `index.astro` 에 `<section class="lw-panel" data-panel="home">` 을 맨 앞에, 막대 버튼 순서를 시연 · 발표 · 설명 + `첫 화면` 으로. 패널 기본값 `data-tab="home"`. 카드 문구 : 시연 "에이전트를 직접 돌려 봅니다", 발표 "데모데이 슬라이드", 설명 "주차별 산출물". 발표 카드 상태 줄 `n장`, 설명 카드 `n주차` (본문이 있는 주차 수)

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/sections/layered-wiki` → PASS, 그리고 `pnpm build` → `0 errors`

- [ ] **Step 5: 화면 확인 (Review Focus 5 포함)** — `npx astro preview` 후 Playwright 로 : 해시 없이 열면 카드 3장 · 막대 숨김, 카드 클릭 → 해당 탭, `0` → 첫 화면, 시연 iframe 클릭 뒤 `0` → 첫 화면. 스크린샷 1440 × 810 을 관리자님께 보낸다

- [ ] **Step 6: Commit**

```bash
git add apps/site/src/sections/layered-wiki apps/site/src/pages/projects/layered-wiki
git commit -m "feat(layered-wiki): 첫 화면 (시연 · 발표 · 설명) 과 숫자키 0 1 2 3"
```

### Task 2: 공개 시연 서버에 붙이기 (주소 · 상태 문구 · 모델 고지 · 숨은 탭)

**Files:**
- Modify: `apps/site/src/sections/layered-wiki/data.ts` (`ApiBase`)
- Modify: `apps/site/src/sections/layered-wiki/stage.ts` (health 결과 해석, 숨은 탭 멈춤)
- Modify: `apps/site/src/pages/projects/layered-wiki/index.astro` (시연 탭 안내 문구)
- Modify: `scripts/demo-sync.mjs` (`ApiBase` 상수 → `https://demo-api.yeonbora.dev`, 실행 인자 `--api-base <url>` 로 덮어쓰기 가능)
- Test: `apps/site/src/sections/layered-wiki/__tests__/stage.test.ts`

**Interfaces:**
- Consumes: 서버 계획 Task 3 의 `/health` 응답 `{ status, modes, base_notes, base_run, model_id, base_model_id, front }`
- Produces: `type ApiState = 'unknown' | 'waking' | 'up' | 'down'`, `describeApi(State: ApiState, Health: Record<string, unknown> | null): { dot: 'ok' | 'wait' | 'down'; line: string }`, `shouldPoll(Visibility: DocumentVisibilityState): boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
it('연결되면 모델을 적는다', () => {
  expect(describeApi('up', { model_id: 'x/y', base_model_id: 'Qwen3-8B' }).line).toBe('미리 돌린 볼트 : 로컬 Qwen3-8B, 라이브 : x/y')
})
it('모델 정보가 없어도 깨지지 않는다', () => {
  expect(describeApi('up', { status: 'ok' }).line).toBe('연결됨, 모델 정보 없음')
})
it('깨우는 중은 오류처럼 보이지 않는다', () => {
  expect(describeApi('waking', null)).toEqual({ dot: 'wait', line: '서버를 깨우는 중입니다 (최대 1분)' })
})
it('숨은 탭에서는 확인하지 않는다', () => {
  expect(shouldPoll('hidden')).toBe(false)
  expect(shouldPoll('visible')).toBe(true)
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/sections/layered-wiki` → FAIL

- [ ] **Step 3: 구현** — `ApiBase = 'https://demo-api.yeonbora.dev'`. health 확인 타임아웃 2초 → 처음 한 번은 60초 (콜드 스타트), 그동안 상태 `waking`. 응답 JSON 을 보관해 시연 카드 `[data-card-status]` 와 막대 점에 `describeApi` 결과를 쓴다. `visibilitychange` 에서 숨으면 interval 을 멈추고 보이면 즉시 1회 확인 후 재개. 시연 탭 안내 (`.lw-offline`) 문구를 "시연 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도합니다" + 상태 줄로 바꾸고 localhost 서버 목록은 지운다. CSS `.lw[data-api='waking'] .lw-dot` 은 `#e0c060`

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src/sections/layered-wiki && pnpm build` → PASS, `0 errors`

- [ ] **Step 5: demo_ui 다시 올리기** — 서버 계획 Task 6 (demo_ui 문구) 이 하니스 main 에 들어간 뒤 : `pnpm demo:sync <하니스 경로>` → `apps/site/public/projects/layered-wiki/demo/assets/*.js` 에 `https://demo-api.yeonbora.dev` 가 있고 `localhost:8090` 이 없는지 `grep` 으로 확인

- [ ] **Step 6: Commit**

```bash
git add apps/site scripts/demo-sync.mjs
git commit -m "feat(layered-wiki): 시연 탭을 공개 시연 서버에 연결, 모델 고지 · 숨은 탭에서 확인 멈춤"
```

### Task 3: 배포

**Files:** 없음 (브랜치 `docs/layered-wiki-page-spec`)

- [ ] **Step 1:** `pnpm test && pnpm build` → 모두 통과
- [ ] **Step 2:** 이 클라우드 세션은 yeonbora-site 에 푸시할 수 없다 (프록시 허용 목록). 새 세션이 저장소를 소스로 갖고 시작했으면 직접 푸시, 아니면 `git bundle create layered-wiki-page.bundle origin/main..docs/layered-wiki-page-spec` 를 관리자님께 드리고 관리자님 PC 에서 `git fetch <bundle> docs/layered-wiki-page-spec:docs/layered-wiki-page-spec && git push -u origin docs/layered-wiki-page-spec`
- [ ] **Step 3:** GitHub 커넥터로 PR 생성 (base `main`) → 관리자님 확인 뒤 머지 → Cloudflare 자동 배포
- [ ] **Step 4:** 휴대폰에서 `https://yeonbora.dev/projects/layered-wiki/` → 첫 화면, 시연 카드 상태가 "깨우는 중" → 연결됨 + 모델 표시
