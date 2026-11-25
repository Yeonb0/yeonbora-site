# 철학 방 (Phase 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/philosophy` 를 실사풍 미술관 (갈림길 → 동 · 서양관 원형 홀 → 전시실 8개 → 글) 으로 만든다.

**Architecture:** 페이지 하나에 React 섬 `Museum.tsx` 하나. 장면은 섬 안의 상태이고 주소 (`?wing=&room=`) 와 history.pushState / popstate 로 동기화한다. 주소 해석 · 글 링크 · 액자 배치는 순수 함수로 떼어 vitest 로 검증하고, 화면 연출은 dev 서버에서 눈으로 확인한다.

**Tech Stack:** Astro 7 + React 19 섬 + TypeScript 6, CSS (transform · clip-path · mask-image), vitest (새로 추가, 순수 로직 전용)

**Spec:** `docs/superpowers/specs/2026-11-25-philosophy-room-design.md`

## Global Constraints

- 방 구조 : `registry.ts` 한 줄 + `src/sections/philosophy/` (Layout.astro + tokens.css + 섬과 모듈) + `src/pages/philosophy/index.astro`. 방은 콘텐츠를 직접 갖지 않는다 (Phase 2 전까지 `data.ts` 임시 데이터).
- 허브 → 방 전환은 기존 ClientRouter + `transition:name="section-philosophy"` 그대로.
- 이징 기준 `cubic-bezier(0.22, 1, 0.36, 1)`. 문 열림 0.6s 안팎, 장면 확대 0.9s 안팎.
- 모든 전환은 열 때와 닫을 때 모두 넣는다. 새 장면의 명판 · 액자 · 이름표는 전환이 끝난 뒤에 나타난다. `prefers-reduced-motion: reduce` 이면 0.2s 크로스페이드로 줄인다.
- 요청하지 않은 설명글 금지. 버튼은 글씨 없는 아이콘.
- 글꼴 : 명판 · 이름표만 Cinzel 600 (서양관 영문) · Noto Serif KR 700 (동양관 한자). 나머지는 사이트 글꼴.
- 코드 규칙 : 들여쓰기 2칸, 배열 · 자료구조 변수명은 첫 글자 대문자, 주석 끝에 마침표 없음.
- 장면 · 문 · 액자 좌표는 사진 기준 % (0 ~ 100) 로 둔다.
- 홀 문 순서 (왼 → 오) : 서양관 ancient · medieval · modern · contemporary / 동양관 confucian · daoist · buddhist · hundred.
- 명판 글자 : ANCIENT · MEDIEVAL · MODERN · CONTEMPORARY / 儒 · 道 · 佛 · 百. 서양관 명판 폭은 넷 다 같게.

## Review Focus

1. 전환 도중 다른 문 · 아치 · 초상화를 또 누르거나 빠르게 두 번 누름 → 진행 중인 전환이 끝날 때까지 입력을 무시해야 한다 (Task 4 테스트 : `transition lock`).
2. 전환 도중 브라우저 뒤로가기 (popstate) → 진행 중 전환을 끝낸 뒤 popstate 의 장면으로 간다. 화면이 두 장면 사이에 멈추면 안 된다 (Task 4 확인 단계).
3. 잘못된 주소 (`?wing=north`, `?wing=east&room=ancient`, `?room=ancient`) → 고칠 수 있는 만큼 고쳐 replaceState (Task 2 테스트).
4. 액자가 빛 웅덩이 수보다 많은 방 (고대 8명) → 겹치지 않고 벽 안에 두 줄로 걸린다 (Task 2 테스트).
5. 느린 네트워크에서 다음 장면 사진이 아직 안 불러졌을 때 → 사진 decode 가 끝나기 전에는 새 장면을 드러내지 않는다 (Task 4 확인 단계, DevTools Slow 4G).

---

### Task 1: 장면 사진 넣기 (관리자님 작업)

**Files:**
- Create: `apps/site/src/sections/philosophy/assets/*.png` (12개)

- [ ] **Step 1: 관리자님이 Figma 파일 "yeonbora-site · 철학 방 장면" 에서 PNG 로 내보내 아래 이름으로 넣는다**

| 파일 | Figma 노드 |
|---|---|
| `01-crossroads.png` | 1:2 |
| `02-west-hall.png` | 3:2 |
| `03-east-hall.png` | 3:3 |
| `10-west-ancient.png` · `11-west-medieval.png` · `12-west-modern.png` · `13-west-contemporary.png` | 3:4 · 3:5 · 3:6 · 3:7 |
| `20-east-confucian.png` · `21-east-daoist.png` · `22-east-buddhist.png` · `23-east-hundred.png` | 3:8 · 3:9 · 3:10 · 3:11 |
| `plate-metal.png` | 6:2 |

- [ ] **Step 2: 확인**

Run: `ls apps/site/src/sections/philosophy/assets | wc -l`
Expected: `12`

- [ ] **Step 3: Commit** (`feat : 철학 방 장면 사진 추가`)

---

### Task 2: 순수 로직 (주소 · 글 링크 · 액자 배치) + 임시 데이터

**Files:**
- Create: `apps/site/src/sections/philosophy/types.ts`, `route.ts`, `links.ts`, `hang.ts`, `data.ts`
- Create: `apps/site/src/sections/philosophy/__tests__/route.test.ts`, `links.test.ts`, `hang.test.ts`
- Modify: `apps/site/package.json` (devDependency `vitest`, script `"test": "vitest run"`), 루트 `package.json` (script `"test": "pnpm --filter site test"`)

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  type Wing = 'west' | 'east'
  type RoomId = 'ancient' | 'medieval' | 'modern' | 'contemporary' | 'confucian' | 'daoist' | 'buddhist' | 'hundred'
  type Scene = { kind: 'crossroads' } | { kind: 'hall'; wing: Wing } | { kind: 'room'; wing: Wing; room: RoomId }
  interface Philosopher { id: string; name: string; label: string; wing: Wing; room: RoomId; weight: 1 | 2 | 3; portrait?: string; posts: string[] }
  interface Rect { x: number; y: number; w: number; h: number }   // 사진 기준 %
  interface Hung { id: string | null; weight: 1 | 2 | 3; rect: Rect }   // id null = 빈 액자
  ```
  `RoomsOf: Record<Wing, RoomId[]>` (홀 문 순서 그대로)
- Produces (`route.ts`): `parseScene(search: string): { scene: Scene; canonical: string }`, `sceneToSearch(scene: Scene): string`, `parentOf(scene: Scene): Scene | null`, `AllScenes: Scene[]` (11개)
- Produces (`links.ts`): `postTarget(p: Philosopher): string | null`
- Produces (`hang.ts`): `hangFrames(list: Philosopher[], wall: Rect): Hung[]`
- Produces (`data.ts`): `Philosophers: Philosopher[]` (설계 §8.4 표 그대로, `posts: []`, portrait 는 Task 6 에서 채움)

- [ ] **Step 1: vitest 추가**

Run: `pnpm --filter site add -D vitest` 후 위 script 두 줄 추가.

- [ ] **Step 2: 실패하는 테스트 작성**

```ts
// route.test.ts
expect(parseScene('').scene).toEqual({ kind: 'crossroads' })
expect(parseScene('?wing=west').scene).toEqual({ kind: 'hall', wing: 'west' })
expect(parseScene('?wing=east&room=daoist').scene).toEqual({ kind: 'room', wing: 'east', room: 'daoist' })
// 잘못된 값 : 고칠 수 있는 만큼 고친다
expect(parseScene('?wing=north')).toEqual({ scene: { kind: 'crossroads' }, canonical: '' })
expect(parseScene('?wing=east&room=ancient')).toEqual({ scene: { kind: 'hall', wing: 'east' }, canonical: '?wing=east' })
expect(parseScene('?room=ancient').scene).toEqual({ kind: 'crossroads' })
// 왕복
for (const S of AllScenes) expect(parseScene(sceneToSearch(S)).scene).toEqual(S)
expect(parentOf({ kind: 'room', wing: 'west', room: 'modern' })).toEqual({ kind: 'hall', wing: 'west' })
expect(parentOf({ kind: 'crossroads' })).toBeNull()

// links.test.ts
expect(postTarget({ ...Kant, posts: [] })).toBeNull()
expect(postTarget({ ...Kant, posts: ['kant-critique'] })).toBe('/posts/kant-critique')
expect(postTarget({ ...Kant, posts: ['a', 'b'] })).toBe('/posts?topic=kant')

// hang.test.ts
const Wall = { x: 10, y: 15, w: 80, h: 50 }
// 고대 8명 : 모두 걸리고, 겹치지 않고, 벽 안에 있다
// 비중 3 액자는 비중 1 액자보다 넓고, 비중 3 액자의 세로 중심은 벽 세로 중앙 ± 벽 높이의 15% 안
// 빈 방 (철학자 0명) : id null, weight 2 인 액자 정확히 3개
// 근대 (칸트 1명) : 1개, 벽 가로 중앙
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm test`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: 구현**

`hangFrames` 배치 규칙 : 비중 3 을 벽 세로 중앙 한 줄에 가로로 고르게 놓고, 비중 2 · 1 은 그 위아래 줄에 살롱식으로 채운다. 액자 크기 (벽 폭 대비) 는 비중 3 = 16%, 2 = 11%, 1 = 7%, 세로는 가로의 1.25배 (초상화 비율). 한 줄에 다 안 들어가면 줄을 늘리고, 그래도 넘치면 전체를 같은 비율로 줄인다. 간격은 액자 폭의 25% 이상.

- [ ] **Step 5: 통과 확인**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 6: Commit** (`feat : 철학 방 주소 · 글 링크 · 액자 배치 로직`)

---

### Task 3: 장면 좌표 측정 + 목업 승인

**Files:**
- Create: `apps/site/src/sections/philosophy/scenes.ts`
- Create: `docs/design/philosophy-room/README.md`, `docs/design/philosophy-room/mockup.html`

**Interfaces:**
- Consumes: Task 2 `Wing`, `RoomId`, `Rect`, `RoomsOf`, `hangFrames`, `Philosophers`
- Produces (`scenes.ts`):
  ```ts
  CrossroadsArches: Record<Wing, Rect>          // 갈림길의 왼쪽 (east) · 오른쪽 (west) 아치
  HallDoors: Record<Wing, Rect[]>               // RoomsOf 순서, 문틀 안쪽 영역
  HallPlaques: Record<Wing, Rect[]>             // 문 위 명판 자리
  RoomWalls: Record<RoomId, Rect>               // 액자를 걸 벽 영역 (빛 웅덩이 띠)
  SceneImage: (s: Scene) => ImageMetadata       // assets import
  ```

- [ ] **Step 1: 사진마다 좌표를 잰다** — 각 PNG 를 1536 × 864 기준으로 열어 픽셀을 재고 % 로 바꿔 `scenes.ts` 에 적는다. 서양관 문은 아치형이므로 Rect 는 아치 꼭대기까지 포함한다.

- [ ] **Step 2: 목업 HTML 작성** — `mockup.html` 한 장에 실제 사진을 배경으로 다섯 화면을 세로로 늘어놓는다 : 갈림길 / 서양관 홀 (명판, 문 하나 호버 상태로 열림) / 동양관 홀 (같음) / 고대 전시실 (불 꺼진 상태 + 플라톤 액자에 스포트라이트, 이름표 PLATO 보임) / 중세 전시실 (빈 액자 3개). 뒤로가기 · 홈 버튼 포함, 모바일 세로 화면 (390 × 844) 시안 1장 추가. 명판 스타일은 설계 §5.5 (plate-metal 배경, 테두리 없음, 흰 글자). 설명글 없음.

- [ ] **Step 3: 관리자님 승인** — 목업을 보여 주고 승인받는다. 고칠 점은 `README.md` 에 결정으로 적고 반영한다. **승인 전에는 Task 4 이후로 넘어가지 않는다.**

- [ ] **Step 4: Commit** (`docs : 철학 방 목업과 장면 좌표`)

---

### Task 4: Museum 섬 뼈대 — 장면 상태 · 주소 동기화 · 장면 전환

**Files:**
- Create: `apps/site/src/sections/philosophy/Museum.tsx`, `museum.css`, `useSceneHistory.ts`
- Create: `apps/site/src/sections/philosophy/__tests__/sceneMachine.test.ts`, `sceneMachine.ts`
- Modify: `apps/site/src/pages/philosophy/index.astro` (`<Museum client:load />`), `apps/site/src/sections/philosophy/tokens.css`, `Layout.astro` (padding 제거, 전체 화면)

**Interfaces:**
- Consumes: Task 2 `parseScene` · `sceneToSearch` · `parentOf`, Task 3 `CrossroadsArches` · `SceneImage`
- Produces (`sceneMachine.ts`, 순수 상태 기계):
  ```ts
  type Phase = 'idle' | 'leaving' | 'entering'
  interface MachineState { scene: Scene; phase: Phase; next: Scene | null; origin: Rect | null }
  type Event = { type: 'go'; to: Scene; origin: Rect | null } | { type: 'left' } | { type: 'entered' } | { type: 'pop'; to: Scene }
  reduce(s: MachineState, e: Event): MachineState
  ```
- Produces (`Museum.tsx`): `export default function Museum(props: { philosophers: Philosopher[] })`, 하위 장면 컴포넌트는 `onGo(to: Scene, origin: Rect | null)` 를 받는다.

- [ ] **Step 1: 실패하는 테스트 (`sceneMachine.test.ts`)**

```ts
// transition lock : 전환 중 go 는 무시
let S = reduce(Idle(crossroads), { type: 'go', to: westHall, origin: ArchW })
expect(S.phase).toBe('leaving')
expect(reduce(S, { type: 'go', to: eastHall, origin: ArchE })).toEqual(S)
S = reduce(reduce(S, { type: 'left' }), { type: 'entered' })
expect(S).toMatchObject({ scene: westHall, phase: 'idle', next: null })
// 전환 중 pop : 지금 전환을 끝낸 뒤 pop 장면으로 이어 간다
S = reduce(Idle(crossroads), { type: 'go', to: westHall, origin: ArchW })
S = reduce(S, { type: 'pop', to: { kind: 'crossroads' } })
S = reduce(reduce(S, { type: 'left' }), { type: 'entered' })
expect(S).toMatchObject({ phase: 'leaving', next: { kind: 'crossroads' } })
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test` / Expected: FAIL

- [ ] **Step 3: `reduce` 구현** — 대기 중인 pop 은 `pendingPop` 필드 하나로 들고 있다가 `entered` 때 꺼낸다.

- [ ] **Step 4: 통과 확인** — Run: `pnpm test` / Expected: PASS

- [ ] **Step 5: `useSceneHistory.ts` + `Museum.tsx` 구현**
  - 허브에서 들어올 때 : `tokens.css` 의 `--bg` 를 허브 철학 칸 색 (`#6d28d9`) 으로 두고, View Transition 이 끝나면 갈림길 사진이 그 색 위로 0.6s 동안 번져 나온다 (설계 §5.3).
  - 첫 렌더 : `parseScene(location.search)`, canonical 이 다르면 replaceState. 직접 진입은 연출 없이 바로 표시.
  - `go` 때 pushState, popstate 때 `pop` 이벤트.
  - 장면 사진은 `<img>` 에 object-fit cover. 떠나는 장면 : origin Rect 중심을 transform-origin 으로 scale(2.4) + 어두워짐 (0.9s). 들어오는 장면 : scale(1.08) → 1, 투명 → 불투명. 새 사진은 `img.decode()` 가 끝난 뒤 `entering` 을 시작한다.
  - 다음에 갈 수 있는 장면 사진은 현재 장면이 idle 이 되면 `new Image()` 로 미리 불러 둔다.
  - 뒤로가기 버튼 (왼쪽 위 홈 버튼 아래, 같은 모양, 글씨 없는 ← 아이콘) · Esc → `parentOf` 장면으로 `go`. 갈림길에서는 버튼을 숨긴다.
  - 갈림길 : `CrossroadsArches` 두 영역을 투명 버튼으로 둔다 (aria-label 은 "동양관" · "서양관").
  - 장면 안의 오버레이는 사진과 같은 상자 (사진 비율 16 : 9 를 cover 로 맞춘 상자) 안에 % 로 놓아, 창 크기가 바뀌어도 사진과 같이 움직이게 한다.
  - reduced motion : 확대 없이 0.2s 크로스페이드.

- [ ] **Step 6: 확인** — Run: `pnpm dev` 후 브라우저에서
  - 허브 → 철학 → 갈림길 → 오른쪽 아치 → 서양관 홀 (주소 `?wing=west`) → 뒤로가기 버튼 → 갈림길. 깜빡임 없음.
  - 서양관으로 가는 중에 브라우저 뒤로가기 → 전환이 끝난 뒤 갈림길로 돌아옴 (Review Focus 2).
  - `?wing=east&room=ancient` 직접 진입 → `?wing=east` 로 바뀌고 동양관 홀 (Review Focus 3).
  - DevTools Slow 4G 에서 아치 클릭 → 사진이 다 불러진 뒤 들어옴 (Review Focus 5).
  - `pnpm check` 통과.

- [ ] **Step 7: Commit** (`feat : 철학 방 장면 전환과 주소 동기화`)

---

### Task 5: 원형 홀 — 문 열림 · 명판 · 전시실로 들어가기

**Files:**
- Create: `apps/site/src/sections/philosophy/Hall.tsx`, `Door.tsx`, `Plaque.tsx`, `hall.css`
- Modify: `Museum.tsx` (홀 장면 연결)

**Interfaces:**
- Consumes: Task 3 `HallDoors` · `HallPlaques` · `SceneImage`, Task 4 `onGo`
- Produces: `Door` props `{ wing: Wing; room: RoomId; rect: Rect; hallImage: string; roomImage: string; open: boolean }`, `Plaque` props `{ wing: Wing; text: string; rect: Rect; lit: boolean }`

- [ ] **Step 1: `Door.tsx`** — 홀 사진을 문 Rect 크기로 잘라 (background-image + background-position) 왼 · 오 문짝 두 장으로 쓴다. 문짝 뒤에는 `roomImage` 를 blur(6px) + 밝기 낮춰 깔고, 바닥 쪽으로 번지는 따뜻한 빛 (radial-gradient, #ffcf8a 계열) 을 얹는다.
  - west : 문짝이 바깥 경첩 축으로 rotateY(±72deg), perspective 1200px. 문틀 · 문짝 · 문틈을 아치 모양 clip-path 로 자른다.
  - east : 문짝이 translateX 로 각자 바깥쪽으로 자기 폭만큼 밀려 문틀 밖은 잘린다 (overflow hidden).
  - 0.6s, 기준 이징. 닫힐 때도 같은 시간.

- [ ] **Step 2: `Plaque.tsx`** — 배경 `plate-metal.png` (cover), 테두리 없음, 흰 글자 + `text-shadow: 0 1px 2px rgba(0,0,0,.75)`. 평소 `filter: brightness(.78)`, `lit` 이면 1 + 빛줄기가 0.9s 동안 한 번 지나감. 서양관은 Cinzel 600 가로형 (넷 다 같은 폭, 글자 간격 .1em), 동양관은 Noto Serif KR 700 세로형. 글꼴은 Google Fonts 에서 이 두 굵기만 불러 온다 (Layout.astro head).

- [ ] **Step 3: `Hall.tsx`** — 문 4개를 `RoomsOf[wing]` 순서로 놓는다. 호버 · 포커스한 문만 `open`, 그 문의 명판만 `lit`. 클릭하면 문이 아직 안 열렸으면 열고 (0.6s) 이어서 `onGo(room, doorRect)`. 이때 Museum 의 확대 원점은 문틈 중심, 들어오는 전시실은 문틈 안의 흐린 사진에서 선명해지며 커진다. 홀로 돌아오면 그 문이 열린 상태에서 시작해 닫힌다.

- [ ] **Step 4: 확인** — `pnpm dev`
  - 서양관 문 넷 각각 호버 → 아치 모양 그대로 안쪽으로 열림, 명판 반짝임. 벗어나면 닫힘.
  - 동양관 문 넷 각각 → 옆으로 밀려 열림. 맨 왼쪽 · 오른쪽 문도 같게.
  - 문틈 너머 사진이 각 방 사진과 맞음 (고대 문 너머 = 고대 사진).
  - 문 클릭 → 문틈으로 들어가 전시실 (주소 `?wing=west&room=ancient`), 뒤로가기 → 문이 열린 채로 홀이 나타나 닫힘.
  - 문 열리는 도중 빠르게 다른 문 클릭 → 첫 클릭만 처리 (Review Focus 1).

- [ ] **Step 5: Commit** (`feat : 철학 방 원형 홀 문 열림과 명판`)

---

### Task 6: 전시실 — 불 꺼진 방 · 스포트라이트 · 액자 · 이름표 · 글로 가기

**Files:**
- Create: `apps/site/src/sections/philosophy/Room.tsx`, `Frame.tsx`, `room.css`
- Create: `apps/site/src/sections/philosophy/portraits/*.jpg` + `portraits/CREDITS.md`
- Modify: `data.ts` (portrait 경로), `Museum.tsx` (전시실 연결, 돌아올 때 역연출)

**Interfaces:**
- Consumes: Task 2 `hangFrames` · `postTarget` · `Philosophers`, Task 3 `RoomWalls`, Task 4 `onGo`
- Produces: `Frame` props `{ hung: Hung; philosopher: Philosopher | null; lit: boolean; showLabel: boolean }`, sessionStorage 키 `philosophy:lastPortrait` (값 : 철학자 id)

- [ ] **Step 1: 초상화 모으기** — 설계 §8.4 의 초상화가 있는 철학자 (모두) 마다 위키미디어 커먼즈의 퍼블릭 도메인 회화 · 판화를 하나씩 받아 세로 4 : 5 로 잘라 저장한다. `CREDITS.md` 에 철학자 · 작품명 · 작가 · 커먼즈 주소 · 라이선스를 적는다. 퍼블릭 도메인이 아닌 것은 쓰지 않는다 (없으면 빈 액자).

- [ ] **Step 2: `Room.tsx`** — 같은 전시실 사진 두 겹 : 아래 `brightness(.22)`, 위는 원래 밝기 + `mask-image: radial-gradient(circle at <액자 중심> , #000 <r>, transparent <r+18%>)`. r 은 0 → 액자 대각선의 0.9배로 0.7s 동안 커지고, 벗어나면 1.2s 동안 줄어든다 (CSS 변수 `--spot-r` · `--spot-x` · `--spot-y` 를 transition 으로 움직임, `@property` 로 등록). 들어왔을 때 액자 윤곽은 `opacity .18` 로 희미하게 보인다.

- [ ] **Step 3: `Frame.tsx`** — 얇은 금박 · 짙은 나무 액자 (서양관은 금박, 동양관은 짙은 나무) 안에 초상화. 초상화에 `sepia(.15) saturate(.85)` 와 위쪽이 밝은 그라데이션 한 겹. 빈 액자는 틀 + 옅은 캔버스색. 이름표는 액자 아래 명판과 같은 판 (작게), 서양관 영문 대문자 · 동양관 한자, 평소 숨김, `lit` 일 때 0.4s 페이드 인. `postTarget` 이 null 이면 클릭 불가 (cursor default, button disabled 대신 aria-disabled).

- [ ] **Step 4: 글로 가기와 돌아오기** — 클릭하면 sessionStorage 에 id 를 남기고, 액자가 화면 가운데로 커지며 어두워진 뒤 (0.9s) `navigate(postTarget(p))` (astro:transitions/client). 전시실 장면이 처음 렌더될 때 sessionStorage 에 그 방 철학자 id 가 있으면, 그 액자에서 화면이 줄어드는 역연출 후 키를 지운다.

- [ ] **Step 5: 확인** — `pnpm dev`
  - 고대 : 8명이 겹치지 않고 걸림, 소크라테스 · 플라톤 · 아리스토텔레스가 가운데 크게 (Review Focus 4).
  - 유가 : 공자 · 맹자 · 순자 크게, 주희 · 이황 · 이이 보통.
  - 중세 · 현대 · 불가 · 제자백가 : 빈 액자 3개.
  - 방은 어둡고, 액자 호버 → 그 자리만 빛이 켜지고 이름표가 나타남. 벗어나면 천천히 꺼짐.
  - `data.ts` 에서 칸트에 `posts: ['test']` 를 임시로 넣고 클릭 → `/posts/test` 로 이동 (404 정상), 브라우저 뒤로 → 칸트 액자에서 줄어들며 근대 방. 확인 뒤 되돌린다.

- [ ] **Step 6: Commit** (`feat : 철학 방 전시실 스포트라이트와 초상화`)

---

### Task 7: 모바일 · 마무리 확인

**Files:**
- Modify: `museum.css`, `hall.css`, `room.css`, `Museum.tsx`, `Hall.tsx`, `Room.tsx`
- Modify: `docs/superpowers/specs/2026-11-25-philosophy-room-design.md` (구현 중 바뀐 결정이 있으면)

**Interfaces:**
- Consumes: 앞 Task 전부. 새 interface 없음.

- [ ] **Step 1: 호버 없는 기기** (`(hover: hover) and (pointer: fine)` 가 아닐 때)
  - 장면 상자는 화면 높이에 맞추고 가로로 넘치는 부분은 끌어서 둘러본다 (pointer 이벤트로 translateX, 관성 없이). 처음 위치는 가운데, 홀은 문 4개가 최대한 보이는 위치.
  - 명판 · 이름표 항상 표시, 명판은 lit 상태 밝기.
  - 문 · 아치 · 액자는 한 번 탭으로 바로 들어감 (문은 탭과 동시에 열리며 확대). 끌기와 탭은 이동 거리 8px 로 구분.
  - 전시실 스포트라이트는 누르는 동안 켜진다.

- [ ] **Step 2: 확인** — DevTools 기기 모드 390 × 844 와 844 × 390 에서 Task 4 ~ 6 의 확인 항목을 다시 돈다. 창 크기를 바꾸거나 기기를 돌려도 문 · 명판 · 액자가 사진에서 어긋나지 않는다. `prefers-reduced-motion` 에뮬레이션에서 모든 전환이 짧은 크로스페이드. `pnpm test` · `pnpm build` 통과.

- [ ] **Step 3: Commit** (`feat : 철학 방 모바일 대응`)

- [ ] **Step 4: Phase 확인** — Phase 6 완료 기준 중 "초상화 갤러리 레이아웃 · 사상가 3명 이상 · 모바일 대응" 충족을 관리자님께 알리고, "사상가 클릭 시 정리 글"은 Phase 2 이후로 남았음을 적는다. `/devlog:publish phase-6` 는 직접 실행하지 않고 제안만 한다.
