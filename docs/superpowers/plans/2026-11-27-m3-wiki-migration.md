# M3 위키 이전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Yeonb0/Main 볼트의 노트 약 1,440개를 `apps/site/src/content/wiki/computer/` 로 옮겨 사이트에서 열리게 하고, Main 저장소를 보관할 수 있는 상태로 만든다.

**Architecture :** 손으로 옮기지 않고 결정적인 이전 도구 (`apps/site/scripts/migrate/obsidian/`) 를 먼저 만든다. 도구는 Main 전체를 색인한 뒤 폴더 하나씩 변환 · 복사하고 리포트를 낸다. 사이트 쪽은 Main 에 있던 문법 중 아직 못 그리는 것 (수식 · 콜아웃) 을 보강하고, 깨진 링크 리포트를 "진짜 깨짐" 과 "앞으로 쓸 노트 (backlog)" 로 나눈다. 그다음 폴더 15개를 작은 것부터 한 브랜치씩 옮긴다.

**Tech Stack :** Astro 7 · `@astrojs/markdown-remark` unified · remark-math · rehype-katex · vitest · tsx · yaml · git CLI

**Spec :** `docs/migration/project-instructions.md` (M3 행) · `docs/content-rules.md` · 2026-11-27 결정 (아래)

## 2026-11-27 결정 (이 계획의 근거)
1. 깨진 링크 리포트를 둘로 나눈다. Main 에서도 대상이 없던 링크 (Main 의 "없는 노트에도 링크를 건다" 규칙, 약 520개 대상) 는 backlog 로 따로 적고 사이트에서는 흐린 글자로 보인다. M3 완료 기준 "깨진 링크 0" 은 backlog 를 뺀 수를 뜻한다.
2. wiki 폴더는 Main 폴더 구조를 그대로 유지한다 : `wiki/computer/<Main 상대 경로>`. 주소는 지금처럼 파일명 slug 다.
3. 시각화는 M3 에서 만들지 않고 묶음 리포트에 후보만 적는다. 관리자님이 고른 것만 이후에 만든다.

## Global Constraints
- 원문 보존 : 본문은 바이트 단위로 같아야 한다. 바꾸는 것은 frontmatter 뿐이다. 오타는 `%% typo? %%` 로 표시만 한다.
- frontmatter 는 content-rules 의 wiki 형식 : title (= 파일명) · aliases · tags · field `computer` · topic · source `obsidian` · sourcePath · created · autolink. Main 에만 있는 키 (domain · formulation · techniques · cssclasses · updated · autolink-in) 는 지우지 않고 뒤에 그대로 둔다.
- created 는 원래 작성일 : Main frontmatter 의 created → 없으면 Main git 에서 그 노트가 처음 생긴 날. 오늘 날짜를 넣지 않는다.
- 제외 : README.md · scripts/ · templete/ · images/ (그림은 따로 복사) · `_inbox/` · `_pending/` · `.githooks/` · `*.base` · `publish: false` · `status: pending` 인 노트. 제외한 것은 리포트에 이름을 남긴다.
- 그림은 `_assets/obsidian/` 에 파일명 그대로 둔다 (Obsidian 첨부 폴더 설정과 remark 임베드 해석이 파일명 기준).
- 이름 충돌 : 같은 slug 가 둘 이상이면 파일명 뒤에 ` (<바로 위 폴더>)` 를 붙이고, 원래 이름을 aliases 맨 앞에 넣는다. 지금 확인된 3쌍 : `!important` (CSS · JS), `데이터 전환` · `인터페이스 구현` (`_MOC` 쪽과 본 노트 쪽).
- 브랜치 `migrate/obsidian-<묶음>`, 커밋 `migrate(obsidian) : <폴더> N편`, 묶음 하나 = Main 최상위 폴더 하나.
- 코드 : 2칸 들여쓰기, 배열 · 자료구조 변수는 대문자 시작 (저장소 기존 관례와 같음), 주석 끝 마침표 없음.
- 모든 화면은 모바일 폭 (390px) 에서 확인한다. 다크 모드 · 색은 `src/viz/palette.ts` 의 `Role` 에서만 가져온다.

## Review Focus
1. YAML 에 그대로 넣으면 깨지는 제목 (`!important`, `C++`, `:` · `#` · 따옴표가 든 이름) → frontmatter 가 파싱되고 title 이 파일명과 글자 하나까지 같아야 한다 (Task 2 테스트)
2. 다른 파일명이 같은 slug 가 되는 경우 (`C` · `C++` · `C#` 처럼 기호만 다른 이름) → 같은 주소로 덮이지 않고 충돌로 잡혀야 한다 (Task 1 테스트)
3. 표 셀 안 `[[대상\|표시]]` 와 `<br>` → 링크로 해석되고 줄바꿈이 보여야 한다 (Task 5 테스트)
4. `_pending/` 에서 폴더로 옮겨진 노트 → git 첫 추가일이 옮긴 날이 아니라 처음 생긴 날이어야 한다 (Task 3 테스트)
5. 이미 옮긴 샘플 5개 (Stop-and-Wait 에는 viz 블록이 있음) → 다시 돌려도 덮어쓰지 않고 viz 블록 · 주석이 남아야 한다 (Task 7 테스트)

---

## 파일 구조
```
apps/site/scripts/migrate/obsidian/
  vault.ts          Main 색인 : 노트 목록 · 제외 · slug 충돌 · backlog
  convert.ts        노트 하나 → { path, text } (frontmatter 만 바꿈)
  topics.ts         Main 최상위 폴더 → topic 표
  git-dates.ts      Main git 기록 → 노트별 처음 생긴 날
  assets.ts         묶음이 쓰는 그림만 _assets/obsidian/ 으로 복사
  report.ts         묶음 리포트 Markdown
  cli.ts            pnpm migrate:obsidian <run | backlog | verify>
  __tests__/        fixture 볼트 + 각 모듈 테스트
apps/site/src/lib/remark/callout.ts        Obsidian 콜아웃 → aside / details
apps/site/src/lib/content/backlog.ts       backlog 목록 읽기 · 판정
apps/site/src/styles/wiki-content.css      콜아웃 · pending 링크 · KaTeX 색 (파일이 이미 있으면 그쪽에)
docs/migration/wiki-backlog.json           Main 기준 미해결 대상 목록 (커밋)
```

## topic 표 (검토 필요)
샘플이 이미 `컴퓨터 네트워크 → network` 를 쓰고 있어 같은 방식으로 영문 소문자 하이픈으로 정했습니다. 컴퓨터 방 폴더 이름이 정해지면 이 표만 고칩니다.

| Main 폴더 | topic | 노트 수 |
|---|---|---|
| Python | python | 4 |
| 데이터베이스시스템 | database | 5 |
| 빅데이터분석기사 | bigdata-cert | 7 |
| 도커&쿠버네티스 | devops | 8 |
| 기타 정보들 (+ 루트 LaTex.md) | etc | 19 |
| 자료구조 | data-structure | 28 |
| 알고리즘 설계와 분석 | algorithm | 61 |
| 컴퓨터시스템개론 | system | 88 |
| 서버 구조와 기술 | server | 89 |
| AWS | aws | 115 |
| 프로그래밍 언어 | programming-language | 118 |
| 멋쟁이사자처럼 | likelion | 141 |
| 머신러닝 | ml | 147 |
| 컴퓨터 네트워크 | network | 213 |
| 정보처리기사 | engineer-cert | 401 |

---

### Task 0 : 시작 전 정리

**Files :**
- Modify : `.devlog/config.yml` (current_migration_phase)
- Modify : `docs/content-rules.md` (폴더 · 링크 · 처리기 절)
- Modify : `docs/migration/project-instructions.md` (M3 완료 기준 문구)
- Move : `apps/site/src/content/wiki/computer/{ARQ,ACK,Timeout,Sequence Number,Stop-and-Wait}.md` → 각 sourcePath 위치

- [ ] **Step 1 : M2 완료 여부를 관리자님께 확인한다.** config 는 아직 `current_migration_phase: M2` 다. M2 가 끝났으면 `M3` 으로 바꾼다
- [ ] **Step 2 : content-rules 를 결정대로 고친다**
  - 폴더 : `wiki/<분야>/<제목>.md` → `wiki/<분야>/<원래 출처의 폴더 경로>/<제목>.md` (obsidian 은 Main 상대 경로 그대로)
  - 링크 : "찾지 못한 링크" 문단에 backlog 구분 · `reports/wiki-backlog.md` · 흐린 글자 표시 추가
  - 처리기 : 플러그인 순서를 `주석 제거 → viz → 콜아웃 → 수식 → 링크` 로
  - 이름 충돌 규칙 (Global Constraints 의 문장 그대로)
- [ ] **Step 3 : 지침의 M3 완료 기준을 "Main 노트 전부 이전 · 깨진 링크 0 (backlog 제외) · 이미지 정상 · Main 저장소 보관" 으로 고친다** (프로젝트 지침 원문도 같이 고치도록 관리자님께 알린다)
- [ ] **Step 4 : 샘플 5개를 `git mv` 로 sourcePath 위치로 옮긴다**
- [ ] **Step 5 : 확인** — Run : `pnpm test && pnpm build` · Expected : 통과, `/wiki/arq` 등 주소 그대로
- [ ] **Step 6 : 커밋** `docs : M3 결정 반영 (폴더 구조 유지 · backlog 분리)`

### Task 1 : Main 색인

**Files :**
- Create : `apps/site/scripts/migrate/obsidian/vault.ts`, `topics.ts`
- Test : `apps/site/scripts/migrate/obsidian/__tests__/vault.test.ts`, `__tests__/fixture.ts`

**Interfaces :**
- Consumes : `slugFromPath` · `parseWikilinks` (`src/lib/content/wikilink.ts`), `buildGraph` · `Node` (`src/lib/content/graph.ts`)
- Produces :
  - `interface VaultNote { relPath: string; stem: string; data: Record<string, unknown>; rawFront: string | null; body: string }`
  - `interface Excluded { relPath: string; reason: 'infra' | 'publish-false' | 'pending' }`
  - `listVault(vaultDir: string): { Notes: VaultNote[]; Excluded: Excluded[] }`
  - `findSlugClashes(Notes: VaultNote[]): Map<string, VaultNote[]>` (slug → 둘 이상인 노트들)
  - `renameMap(Clashes: Map<string, VaultNote[]>): Map<string, string>` (relPath → 새 stem)
  - `computeBacklog(Notes: VaultNote[]): string[]` (해석되지 않는 링크 대상, 소문자 정렬 · 중복 없음)
  - `Topics: Record<string, string>` · `topicOf(relPath: string): string` (루트 파일은 `etc`, 표에 없는 폴더는 throw)

- [ ] **Step 1 : fixture 볼트를 만드는 `makeVault(Files: Record<string, string>): string` (tmp 폴더) 를 쓰고 실패하는 테스트를 쓴다**
  - `listVault excludes infra and unpublished` : README.md · scripts/a.md · templete/b.md · _pending/c.md · x.base · `publish: false` · `status: pending` 노트가 Notes 에 없고 Excluded 에 이유와 함께 있다
  - `listVault keeps MOC notes` : `자료구조/_MOC/자료구조.md` 는 Notes 에 있다
  - `findSlugClashes catches same name and same slug` : `CSS/!important.md` + `JS/!important.md`, `C.md` + `C++.md` 가 각각 한 묶음
  - `renameMap appends parent folder` : `!important` → `!important (CSS)` · `!important (JS)`
  - `computeBacklog` : `[[있음]]` 은 빠지고 `[[없음]]` · alias 로 걸린 링크는 해석, 코드 블록 안 링크는 무시
  - `topicOf` : `컴퓨터 네트워크/Data Link Layer/ARQ.md` → `network`, `LaTex.md` → `etc`
- [ ] **Step 2 : Run** `pnpm --filter site vitest run scripts/migrate/obsidian/__tests__/vault.test.ts` · Expected : FAIL (모듈 없음)
- [ ] **Step 3 : 구현.** frontmatter 는 `yaml` 의 `parse`, 그래프는 Main 노트를 `Node` (collection `wiki`) 로 바꿔 `buildGraph` 에 넣어 `resolve` 로 판정한다 (사이트와 같은 해석 규칙을 쓰기 위해)
- [ ] **Step 4 : Run** 같은 명령 · Expected : PASS
- [ ] **Step 5 : 커밋** `feat(migrate) : Main 볼트 색인`

### Task 2 : 노트 변환

**Files :**
- Create : `apps/site/scripts/migrate/obsidian/convert.ts`
- Test : `__tests__/convert.test.ts`

**Interfaces :**
- Consumes : `VaultNote`, `topicOf`
- Produces : `convertNote(Note: VaultNote, Opts: { created?: string; newStem?: string }): { path: string; text: string }`
  - path : `wiki/computer/<relPath 의 폴더>/<newStem ?? stem>.md`
  - frontmatter 키 순서 : title · aliases · tags · field · topic · source · sourcePath · created · autolink · (Main 의 나머지 키, 원래 순서)
  - autolink : Main 에 `autolink: false` 면 false, 없으면 키를 쓰지 않음 (스키마 기본값 true)

- [ ] **Step 1 : 실패하는 테스트**
  - `body is byte-identical` : CRLF · 끝 줄바꿈 없음 · `%%` · 표 · `$$` 가 든 본문이 그대로
  - `frontmatter round-trips through WikiSchema` : 결과 frontmatter 를 `yaml.parse` → `WikiSchema.parse` 가 통과하고 title 이 `!important`, `C++`, `A: B`, `"따옴표"` 와 정확히 같다
  - `note without frontmatter gets one` : Main 254개처럼 frontmatter 가 없는 노트
  - `rename keeps old name as first alias` : newStem `!important (CSS)` → title 은 새 이름, aliases[0] 은 `!important`
  - `extra keys kept` : `domain` · `formulation` · `autolink-in` 이 값 그대로 남는다
- [ ] **Step 2 : Run** `pnpm --filter site vitest run scripts/migrate/obsidian/__tests__/convert.test.ts` · Expected : FAIL
- [ ] **Step 3 : 구현.** frontmatter 는 `yaml` 의 `Document` 로 써서 따옴표 처리를 라이브러리에 맡긴다. 본문은 원래 문자열에서 frontmatter 블록 뒤를 그대로 잘라 붙인다
- [ ] **Step 4 : Run** · Expected : PASS
- [ ] **Step 5 : 커밋** `feat(migrate) : 노트 frontmatter 변환`

### Task 3 : 원래 작성일

**Files :**
- Create : `apps/site/scripts/migrate/obsidian/git-dates.ts`
- Test : `__tests__/git-dates.test.ts`

**Interfaces :**
- Produces : `readCreatedDates(vaultDir: string): Map<string, string>` (현재 relPath → `YYYY-MM-DD`)

- [ ] **Step 1 : 실패하는 테스트** — tmp git 저장소에서 `GIT_AUTHOR_DATE` · `GIT_COMMITTER_DATE` 를 지정해 커밋한다
  - `first add date` : 2026-07-01 에 추가, 2026-07-05 에 수정 → `2026-07-01`
  - `follows moves` : `_pending/A.md` 를 2026-07-01 에 추가, 2026-07-10 에 `자료구조/A.md` 로 이동 → `자료구조/A.md` 는 `2026-07-01`
  - `non-ascii paths` : 한글 · 공백 · `&` 경로가 깨지지 않는다
- [ ] **Step 2 : Run** · Expected : FAIL
- [ ] **Step 3 : 구현.** git 을 한 번만 부른다 : `git -c core.quotepath=false log --reverse -M --name-status --format=%x00%as`. 오래된 커밋부터 읽으며 `A` 는 날짜 기록, `R` 은 옛 경로의 날짜를 새 경로로 넘긴다. 노트마다 `git log --follow` 를 부르지 않는다 (1,440번 호출)
- [ ] **Step 4 : Run** · Expected : PASS
- [ ] **Step 5 : 커밋** `feat(migrate) : Main git 기록에서 작성일 읽기`

Main 은 지금 `--depth 1` 로 받았으므로 실제 실행 전에 전체 기록을 받는다 (공개 저장소, `git clone https://github.com/Yeonb0/main` 깊이 제한 없이).

### Task 4 : 그림 복사

**Files :**
- Create : `apps/site/scripts/migrate/obsidian/assets.ts`
- Test : `__tests__/assets.test.ts`

**Interfaces :**
- Produces : `copyImages(Notes: VaultNote[], vaultImagesDir: string, destDir: string): { Copied: string[]; Same: string[]; Missing: { note: string; name: string }[]; Clash: string[] }`

- [ ] **Step 1 : 실패하는 테스트**
  - `copies only referenced images` : `![[a.png]]` · `![[b.png|300]]` 만 복사, 쓰지 않는 c.png 는 복사하지 않음
  - `same content is skipped, different content is a clash` : 대상에 같은 바이트 → Same, 다른 바이트 → Clash 이고 덮어쓰지 않음
  - `missing image reported` : 볼트에 없는 그림 → Missing
- [ ] **Step 2 ~ 4 : Run → 구현 (sha256 비교) → PASS**
- [ ] **Step 5 : 커밋** `feat(migrate) : 묶음 그림 복사`

### Task 5 : 사이트 렌더링 보강 (수식 · 콜아웃 · HTML)

Main 에 `$$` 59개 파일, 인라인 수식 약 190개 파일, 콜아웃 41개 파일 (`note` · `note-` 접기 · `example` · `warning`), `<br>` 100곳 · `<div>` 26곳이 있습니다. 지금 파이프라인에는 수식 · 콜아웃 처리가 없습니다.

**Files :**
- Create : `apps/site/src/lib/remark/callout.ts`
- Modify : `apps/site/astro.config.mjs` (remark-math · callout · rehype-katex)
- Modify : `apps/site/src/pages/wiki/[slug].astro`, `apps/site/src/pages/posts/[slug].astro` (KaTeX CSS · 콘텐츠 CSS)
- Create : `apps/site/src/styles/wiki-content.css`
- Modify : `apps/site/scripts/drafts/render-post.ts` (작업대 미리보기도 같은 플러그인을 쓰는지 확인하고 맞춘다)
- Test : `apps/site/src/lib/remark/__tests__/callout-math.test.ts`

**Interfaces :**
- Produces : `remarkCallout(): Transformer` — `> [!type] 제목` 을 `<aside class="callout callout-<type 소문자>">`, `> [!type]-` · `+` 를 `<details class="callout ...">` (`+` 는 open) + `<summary>` 로. 제목이 없으면 type 이름을 첫 글자 대문자로

- [ ] **Step 1 : 패키지 추가** `pnpm --filter site add remark-math rehype-katex katex`
- [ ] **Step 2 : 실패하는 테스트** (기존 `comments-viz.test.ts` 처럼 unified 파이프라인으로 HTML 을 만든다)
  - `note callout` · `foldable callout is details` · `Example 대소문자` · `callout body keeps wikilinks`
  - `inline and block math render katex` : `$O(n \log n)$` · `$$\sum$$` 가 `class="katex"` 를 포함
  - `math inside code is untouched`
  - `table cell wikilink with escaped pipe and br` : `| [[ARQ\|자동 재전송]]<br>둘째 줄 |` → `<a ...>자동 재전송</a><br>`
- [ ] **Step 3 : Run** `pnpm --filter site vitest run src/lib/remark/__tests__/callout-math.test.ts` · Expected : FAIL
- [ ] **Step 4 : 구현하고 astro.config 순서를 `주석 → viz → 콜아웃 → 수식 → 링크` 로**, rehype 에 `rehype-katex`
- [ ] **Step 5 : 스타일** — 콜아웃 바탕 `Role` 의 선 색 테두리 + primary 왼쪽 막대, warning 만 point. KaTeX 글자색은 글자 색 상속. 새 색 코드를 쓰지 않는다
- [ ] **Step 6 : Run** 테스트 PASS → `pnpm dev` 로 수식 · 콜아웃이 든 Main 노트 2개를 임시로 넣어 390px 폭 스크린샷 확인 (확인 후 임시 파일 삭제). 콜아웃 모습은 스크린샷으로 관리자님 승인을 받는다
- [ ] **Step 7 : 커밋** `feat(content) : 수식 · Obsidian 콜아웃 렌더링`

### Task 6 : 깨진 링크 리포트 분리 (backlog)

**Files :**
- Create : `apps/site/src/lib/content/backlog.ts`
- Modify : `apps/site/src/lib/content/broken-report.ts`, `index-fs.ts` (`findBrokenLinks`), `src/lib/remark/wikilink.ts` (미해결 링크 표시), `astro.config.mjs`
- Create : `docs/migration/wiki-backlog.json` (Task 8 의 `backlog` 명령으로 생성)
- Test : 기존 `src/lib/content/__tests__/index-fs.test.ts` · `src/lib/remark/__tests__/wikilink.test.ts` 에 추가

**Interfaces :**
- Consumes : `computeBacklog` 결과 형식 (`string[]`, 소문자)
- Produces :
  - `loadBacklog(path: string): Set<string>` (파일이 없으면 빈 Set)
  - `BrokenLink` 에 `kind: 'broken' | 'backlog'` 추가
  - `writeBrokenReport(reportPath, Links)` : `broken` 만 `reports/broken-links.md`, `backlog` 은 `reports/wiki-backlog.md` (각각 0개면 지움)
  - `WikilinkOptions` 에 `isBacklog: (target: string) => boolean` 추가 → backlog 링크는 `span.wikilink-pending` 으로, onBroken 을 부르지 않고 경고도 내지 않는다

- [ ] **Step 1 : 실패하는 테스트**
  - `backlog target is classified as backlog` · `other unresolved stays broken` · `report files split` · `remark renders pending span without warning`
  - `resolved backlog target is a normal link` : backlog 에 있어도 그 노트가 생기면 그냥 링크
- [ ] **Step 2 ~ 4 : Run → 구현 → PASS** (`.wikilink-pending` 은 흐린 글자 색, 밑줄 없음)
- [ ] **Step 5 : 커밋** `feat(content) : 미작성 노트 링크를 backlog 로 분리`

### Task 7 : 이전 CLI · 리포트

**Files :**
- Create : `apps/site/scripts/migrate/obsidian/report.ts`, `cli.ts`
- Modify : `apps/site/package.json`, 루트 `package.json` (`migrate:obsidian` 스크립트)
- Test : `__tests__/cli.test.ts`

**Interfaces :**
- Consumes : Task 1 ~ 4 의 함수 전부, `WikiSchema`
- Produces :
  - `pnpm migrate:obsidian backlog <vaultDir>` → `docs/migration/wiki-backlog.json`
  - `pnpm migrate:obsidian run <vaultDir> <Main 최상위 폴더> [--dry-run]` → 노트 쓰기 + 그림 복사 + `reports/migrate-obsidian-<topic>.md`
  - `pnpm migrate:obsidian verify <vaultDir>` → Main 의 이전 대상 노트마다 사이트 파일이 있고 본문이 같은지 (viz 블록 · `%%` 주석 줄은 빼고 비교). 다르면 exit 1
  - `runBatch(vaultDir: string, folder: string, contentDir: string, Opts: { dryRun: boolean }): BatchResult`
  - `interface BatchResult { written: string[]; skipped: { path: string; reason: 'same' | 'conflict' }[]; excluded: Excluded[]; renamed: [string, string][]; images: ReturnType<typeof copyImages>; noDate: string[]; links: { broken: number; backlog: number; notYetMigrated: number }; suspects: { path: string; kinds: ('math' | 'callout' | 'html' | 'table-link' | 'dataview' | 'embed-note')[] }[] }`

- [ ] **Step 1 : 실패하는 테스트**
  - `run writes converted notes and report`
  - `existing identical note is skipped and keeps viz block` : 대상에 viz 블록 · `%% typo? %%` 가 더해진 파일 → `same` 으로 건너뜀, 파일 그대로
  - `existing different note is a conflict, not overwritten`
  - `dry-run writes nothing`
  - `links to notes in other Main folders count as notYetMigrated, not broken`
  - `frontmatter that fails WikiSchema stops the batch with the file name`
  - `verify fails on changed body`
- [ ] **Step 2 ~ 4 : Run → 구현 → PASS.** 리포트 항목 : 옮긴 수 · 건너뜀 · 제외 · 이름 바꿈 · 작성일 못 찾음 · 그림 (복사 · 같음 · 충돌 · 없음) · 링크 3분류 · 의심 목록 · `## 시각화 후보` (빈 표, 묶음 작업 때 Claude 가 채움)
- [ ] **Step 5 : backlog 생성** Run : `pnpm migrate:obsidian backlog <Main 전체 기록 클론>` → `docs/migration/wiki-backlog.json` 커밋
- [ ] **Step 6 : 커밋** `feat(migrate) : obsidian 이전 CLI · 리포트`

### Task 8 : 전체 리허설 (커밋하지 않음)

- [ ] **Step 1 : 임시 브랜치에서 15개 폴더를 모두 `run`** 한다
- [ ] **Step 2 : Run** `time pnpm build` · Expected : 성공. 시간 · 최대 메모리를 적는다. 10분을 넘거나 실패하면 원인 (그래프 색인 · 역링크 계산 · 스키마) 을 고치는 작업을 이 계획에 Task 로 추가하고 관리자님께 알린다
- [ ] **Step 3 : `reports/broken-links.md` 를 본다.** 이 시점의 broken 은 모두 변환 문제다. 원인별로 묶어 Task 1 ~ 7 로 돌아가 고친다
- [ ] **Step 4 : 임시 브랜치를 지운다**

### Task 9 ~ 23 : 폴더 묶음 이전 (15개, 위 topic 표 순서)

작은 폴더부터 해서 초반 묶음에서 문제를 빨리 찾습니다. 묶음마다 같은 절차입니다 (migrate-posts 스킬의 0 · 5 단계와 같음).

- [ ] **Step 1 :** 작업대 db 에 반영 안 된 기록이 있는지 보고, 있으면 "시안 반영" 부터 할지 묻는다
- [ ] **Step 2 :** 브랜치 `migrate/obsidian-<topic>` (main 최신에서)
- [ ] **Step 3 :** `pnpm migrate:obsidian run <Main> <폴더> --dry-run` → 리포트에서 충돌 · 이름 바꿈 · 작성일 없음 확인, 문제 있으면 멈추고 묻는다
- [ ] **Step 4 :** `run` → `pnpm test && pnpm build`
- [ ] **Step 5 :** 의심 목록의 노트를 `pnpm dev` 390px 폭에서 열어 본다 (수식 · 콜아웃 · 표 · HTML). 원문이 이상하면 고치지 않고 `%% check %%` · `%% typo? %%`
- [ ] **Step 6 :** 리포트의 `## 시각화 후보` 를 채운다 : 과정 · 구조 · 상태 변화가 글로만 설명된 노트, 노트당 한 줄 이유. 만들지 않는다
- [ ] **Step 7 :** 커밋 `migrate(obsidian) : <폴더> N편` → PR (리포트 요약을 본문에). `reports/` 는 커밋되지 않으므로 PR 본문이 기록이다. 머지는 관리자님이 한다

정보처리기사 (401편) 는 한 PR 로는 검토가 어려우니, 그 묶음 Step 3 에서 하위 폴더 단위로 나눌지 묻습니다.

### Task 24 : M3 마무리

- [ ] **Step 1 : Run** `pnpm migrate:obsidian verify <Main>` · Expected : exit 0
- [ ] **Step 2 : Run** `pnpm build` · Expected : `reports/broken-links.md` 없음 (broken 0), 그림 임베드 경고 0
- [ ] **Step 3 :** Obsidian 으로 `apps/site/src/content/` 를 열어 그래프 뷰 · LaTeX · 그림이 Main 과 같게 보이는지 관리자님이 확인
- [ ] **Step 4 :** Main 저장소 보관은 관리자님이 GitHub Settings 에서 한다 (이 세션은 Main 에 읽기 권한만 있음). Main 의 Quartz 배포가 멈추는 것도 함께 확인
- [ ] **Step 5 :** "Phase M3 이 끝난 것 같습니다" 알림 + `/devlog:publish phase-M3` 제안
