# 글 옮기기 M1 (콘텐츠 기반) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/site/src/content/` 의 `.md` 노트가 `[[링크]]` 로 서로 이어진 채 `/wiki` · `/posts` 에서 열리고, 같은 폴더를 Obsidian 볼트로 열 수 있다.

**Architecture:** 링크 해석 · 역링크는 순수 함수 (`src/lib/content/`) 하나로 만들고, 같은 함수를 두 곳에서 쓴다. (1) 빌드 시 remark 플러그인 : 파일 시스템에서 읽은 색인으로 `[[ ]]` 를 주소로 바꾼다. (2) 페이지 : `getCollection` 결과로 같은 그래프를 만들어 역링크를 붙인다. 주석 (`%% %%`) 제거와 viz 블록 변환도 remark 플러그인이다. viz 블록은 M1에서 자리표시 `<figure>` 까지만 만들고, 실제 컴포넌트를 띄우는 런타임은 첫 시각화와 함께 M2에서 만든다.

**Tech Stack:** Astro 7.4 content layer (`src/content.config.ts` + `glob` loader) · remark (unified 11, unist-util-visit 5) · github-slugger 2 · yaml 2 · vitest 5

**Spec:** `docs/content-rules.md` (형식 · frontmatter · 링크 · 시각화 · 주석) + `docs/migration/project-instructions.md` (Phase M1 완료 기준)

## Global Constraints

- 원본은 `apps/site/src/content/` 하나. 파일은 `.md` 만 (`.mdx` 금지).
- 폴더 : `wiki/<분야>/<제목>.md` · `posts/<출처>/<slug>.md` · `courses/<code>.md` · `_assets/<출처>/` · `.obsidian/`
- 분야 : `computer` · `philosophy` · `religion` · `etc` / 출처 : `jekyll` · `velog` · `tistory` · `notion` · `obsidian` · `paper`
- posts 의 `source` · `date` 는 필수 (비면 빌드 실패). `date` 는 원래 작성일.
- 링크 찾는 순서 : wiki 제목 → wiki aliases → posts 제목. 주소 : `/wiki/<slug>` · `/posts/<slug>`, slug 는 파일명 (한글 허용). 제목 중복은 빌드 오류.
- 찾지 못한 링크는 빌드를 멈추지 않고 경고 + `reports/broken-links.md` 기록.
- 역링크 : wiki 페이지 아래 "이 개념을 다룬 글" (그 노트를 링크한 posts), posts 페이지 아래 "관련 개념" (본문에서 링크한 wiki).
- viz 블록 : ` ```viz <id>``` ` + 선택 yaml (`caption` · `height`). 원문 문장은 건드리지 않는다.
- 주석 `%% ... %%` 는 사이트 빌드에서만 지운다 (원본 파일은 그대로).
- 허브 · 방 디자인은 건드리지 않는다. 새 읽기 화면은 다크 모드 (배경 `#1a1a1a`, 텍스트 `#e0e0e0`).
- 요청하지 않은 설명글 금지 (역링크 제목 두 개 말고는 화면 문구를 새로 만들지 않는다).
- 코드 규칙 : 들여쓰기 2칸, 배열 · 자료구조 변수명 첫 글자 대문자, 주석 끝 마침표 없음.
- 모든 화면은 375px 폭에서 확인한다.

## Review Focus

1. 코드 블록 · 인라인 코드 안의 `[[x]]` 와 `%% %%` → 그대로 남아야 한다 (Task 1 · Task 4 테스트).
2. Obsidian 임베드 `![[그림.png]]` · `![[노트]]` → 페이지 링크로 바뀌지 않고 원문 그대로 남는다. 이미지 임베드 처리는 M3 몫 (Task 1 테스트 `ignores embeds`).
3. 표 안의 `[[제목\|표시]]` (Obsidian 이 표에서 쓰는 이스케이프) → 표가 깨지지 않고 링크가 걸린다 (Task 3 테스트).
4. `pnpm dev` 중에 노트를 새로 추가 → 개발 서버를 다시 켜지 않아도 그 노트로 가는 링크가 해석된다 (Task 2 테스트 `cache invalidates`).
5. 닫히지 않은 `%%` → 문서 끝까지 삼키지 않고 원문 그대로 두며 경고한다 (Task 4 테스트).

---

### Task 1 : 링크 파서 · 콘텐츠 그래프 (순수 함수)

**Files:**
- Create : `apps/site/src/lib/content/wikilink.ts`
- Create : `apps/site/src/lib/content/graph.ts`
- Test : `apps/site/src/lib/content/__tests__/wikilink.test.ts` · `graph.test.ts`

**Interfaces:**
- Produces :
  - `interface Wikilink { raw: string; target: string; heading?: string; label?: string }`
  - `parseWikilinks(md: string): Wikilink[]` : 펜스 코드 · 인라인 코드 · `![[ ]]` 임베드는 건너뛴다. `\|` 도 구분자로 인정
  - `slugFromPath(path: string): string` : 파일명 stem 을 github-slugger `slug()` 로 (`wiki/computer/가비지 컬렉션.md` → `가비지-컬렉션`)
  - `type Collection = 'wiki' | 'posts'`
  - `interface Node { collection: Collection; slug: string; title: string; aliases: string[]; body: string }`
  - `interface Graph { resolve(target: string): Node | undefined; href(link: Wikilink): string | undefined; backlinks(slug: string): Node[]; related(slug: string): Node[]; duplicates: string[] }`
  - `buildGraph(Nodes: Node[]): Graph`

- [ ] **Step 1 : 실패하는 테스트 작성**

`wikilink.test.ts`
- `parses label` : `'[[가비지 컬렉션|GC]]는'` → `[{ target: '가비지 컬렉션', label: 'GC', raw: '[[가비지 컬렉션|GC]]' }]`
- `parses heading` : `'[[TLB#적중]]'` → `target: 'TLB', heading: '적중'`
- `parses escaped pipe` : `'[[TLB\\|티엘비]]'` → `label: '티엘비'`
- `skips code` : ``'`[[a]]`\n```\n[[b]]\n```\n[[c]]'`` → target 은 `c` 하나
- `ignores embeds` : `'![[그림.png]] ![[노트]] [[d]]'` → target 은 `d` 하나
- `slugFromPath` : `'wiki/computer/가비지 컬렉션.md'` → `'가비지-컬렉션'`, `'posts/jekyll/2025-05-02-proxy.md'` → `'2025-05-02-proxy'`

`graph.test.ts` (wiki `가비지 컬렉션` (aliases `[GC]`) · wiki `JVM` · post `proxy` (title `'[시프] 프록시 서버 구현'`, 본문에 `[[GC]]` `[[JVM]]` `[[GC]]`) · post `other` (title `'JVM'`))
- `resolve order` : `resolve('JVM')` 은 wiki 쪽, `resolve('GC')` 는 `가비지 컬렉션`, `resolve('[시프] 프록시 서버 구현')` 은 post, `resolve('없음')` 은 `undefined`
- `href` : `href({ target: 'GC', heading: '세대 구분', raw: '' })` → `'/wiki/가비지-컬렉션#세대-구분'`
- `backlinks` : `backlinks('가비지-컬렉션')` → `[proxy]` (한 번만)
- `related` : `related('proxy')` → `[가비지 컬렉션, JVM]` (중복 없이 본문 순서)
- `duplicates` : wiki 끼리 · posts 끼리 같은 title 이나 같은 slug 가 있으면 `duplicates` 에 그 이름이 들어간다. wiki `JVM` 과 post `JVM` 처럼 collection 이 다르면 중복 아님

- [ ] **Step 2 : 실패 확인** — Run : `pnpm --filter site test src/lib/content` / Expected : FAIL (모듈 없음)
- [ ] **Step 3 : 구현** — 코드 구간 건너뛰기는 정규식으로 펜스 · 인라인 코드를 같은 길이 공백으로 가린 뒤 `(?<!!)\[\[([^\]]+?)\]\]` 를 찾는다. 그래프는 `Map<string, Node>` 세 개 (wiki title · wiki alias · posts title)
- [ ] **Step 4 : 통과 확인** — 같은 명령 / Expected : PASS
- [ ] **Step 5 : Commit** — `git commit -m "feat(content): 위키 링크 파서와 콘텐츠 그래프"`

### Task 2 : 파일 시스템 색인 (빌드 · 개발 서버용)

**Files:**
- Create : `apps/site/src/lib/content/index-fs.ts`
- Test : `apps/site/src/lib/content/__tests__/index-fs.test.ts`

**Interfaces:**
- Consumes : `Node` · `buildGraph` · `slugFromPath` (Task 1)
- Produces :
  - `loadNodes(contentDir: string): Node[]` : `wiki/**/*.md` · `posts/**/*.md` 를 읽고 frontmatter 를 `yaml` 로 파싱. `_assets` · `.obsidian` 은 제외. title 이 없으면 파일명 stem
  - `getGraph(contentDir: string): Graph` : 파일 수 + 가장 늦은 mtime 을 서명으로 캐시, 서명이 바뀌면 다시 만든다

- [ ] **Step 1 : 실패하는 테스트 작성** (`os.tmpdir()` 에 임시 볼트)
  - `loads wiki and posts` : 노드 2개, `.obsidian/x.md` · `_assets/a.md` 는 빠진다
  - `cache hit` : 바뀐 것 없이 두 번 부르면 같은 객체 (`toBe`)
  - `cache invalidates` : 새 노트를 쓰고 부르면 `resolve('새 노트')` 가 노드를 돌려준다
- [ ] **Step 2 : 실패 확인** — `pnpm --filter site test src/lib/content/__tests__/index-fs.test.ts` / FAIL
- [ ] **Step 3 : 구현** — `fs.readdirSync(dir, { recursive: true })` + `statSync`
- [ ] **Step 4 : 통과 확인** — PASS
- [ ] **Step 5 : Commit** — `feat(content): 콘텐츠 폴더 색인과 캐시`

### Task 3 : remark 링크 플러그인 + 깨진 링크 리포트

**Files:**
- Create : `apps/site/src/lib/remark/wikilink.ts`
- Create : `apps/site/src/lib/content/broken-report.ts`
- Test : `apps/site/src/lib/remark/__tests__/wikilink.test.ts`
- Modify : `apps/site/package.json` (devDependencies : `remark-parse` · `remark-gfm` · `remark-rehype` · `rehype-stringify`, 테스트에서 HTML 을 만들 때만 사용)

**Interfaces:**
- Consumes : `Graph` · `parseWikilinks` 규칙 (Task 1), `getGraph` (Task 2)
- Produces :
  - `interface BrokenLink { file: string; target: string }`
  - `remarkWikilink(opts: { getGraph: () => Graph; onBroken: (b: BrokenLink) => void })` : text 노드 안의 `[[ ]]` 를 `link` 노드 (`data.hProperties.className = ['wikilink']`) 로 바꾼다. 표시 글자는 label → target 순. 못 찾으면 원문 글자 그대로 두고 `className = ['wikilink-broken']` 인 span + `onBroken`
  - `createBrokenReporter(reportPath: string): (b: BrokenLink) => void` : `console.warn` + 중복 없이 `| 파일 | 대상 |` 표로 파일을 다시 쓴다. 깨진 링크가 0개면 파일을 만들지 않는다

- [ ] **Step 1 : 실패하는 테스트 작성** (unified + remark-parse + remark-gfm + 플러그인 + remark-rehype + rehype-stringify, Task 1 의 그래프 고정값)
  - `links wiki` : `'[[GC]]는'` → `<a href="/wiki/가비지-컬렉션" class="wikilink">GC</a>는`
  - `links post` : 제목으로 post 주소
  - `label and heading` : `'[[GC#세대 구분|세대]]'` → `href="/wiki/가비지-컬렉션#세대-구분"`, 글자 `세대`
  - `table pipe` : `'| a |\n|---|\n| [[GC\\|지씨]] |'` → `<td>` 하나 안에 링크 하나
  - `broken` : `'[[없음]]'` → `wikilink-broken` span, `onBroken` 한 번 (`{ file, target: '없음' }`)
  - `code untouched` : 인라인 · 펜스 코드 안의 `[[GC]]` 는 그대로
  - `reporter` : 같은 깨진 링크를 두 번 넘겨도 표에 한 줄
- [ ] **Step 2 : 실패 확인** — `pnpm --filter site test src/lib/remark` / FAIL
- [ ] **Step 3 : 구현** — `visit(tree, 'text', ...)` 로 부모 children 을 나눠 끼운다. 표 셀 안 `\|` 는 GFM 이 이미 `|` 로 풀어 주므로 Task 1 파서를 그대로 쓴다
- [ ] **Step 4 : 통과 확인** — PASS
- [ ] **Step 5 : Commit** — `feat(remark): 위키 링크 플러그인과 깨진 링크 리포트`

### Task 4 : remark 주석 제거 · viz 블록 플러그인

**Files:**
- Create : `apps/site/src/lib/remark/comments.ts` · `apps/site/src/lib/remark/viz.ts`
- Test : `apps/site/src/lib/remark/__tests__/comments.test.ts` · `viz.test.ts`

**Interfaces:**
- Produces :
  - `remarkStripComments(opts?: { onWarn?: (msg: string) => void })` : 한 문단 안 `%% … %%` 와 여러 문단에 걸친 `%%` 블록을 지운다. code · inlineCode 는 건드리지 않는다
  - `remarkViz(opts?: { onWarn?: (msg: string) => void })` : `code` 노드 중 `lang === 'viz'` 를 `html` 노드 `<figure class="viz" data-viz="<id>" style="--viz-height:<height>px"><div class="viz-mount"></div><figcaption>…</figcaption></figure>` 로 바꾼다. id 는 `meta`, 블록 안 yaml 의 `caption` · `height` 는 선택. 캡션은 HTML 이스케이프
  - `vizIds` : 쓰인 id 목록을 `file.data.astro.frontmatter.vizIds` 에 남긴다 (M2 런타임이 쓴다)

- [ ] **Step 1 : 실패하는 테스트 작성**
  - comments `inline` : `'앞 %% typo? : 확인 %% 뒤'` → `<p>앞  뒤</p>` (공백 하나로 접는 것까지는 하지 않는다)
  - comments `block` : `'가\n\n%%\n여러 줄\n\n주석\n%%\n\n나'` → `<p>가</p>\n<p>나</p>`
  - comments `code untouched` : `` '`%% a %%`' `` 그대로
  - comments `unclosed` : `'가 %% 나\n\n다'` → 원문 그대로, `onWarn` 한 번
  - viz `basic` : ` '```viz tlb-lookup\ncaption: TLB 에서 주소를 찾는 과정\n```' ` → `data-viz="tlb-lookup"` + `<figcaption>TLB 에서 주소를 찾는 과정</figcaption>`
  - viz `no yaml` : figcaption 없음, style 없음
  - viz `escape` : `caption: <b>x</b>` → `&lt;b&gt;x&lt;/b&gt;`
  - viz `bad id` : `'```viz Bad Id\n```'` (`/^[a-z0-9-]+$/` 위반) → 코드 블록 그대로 + `onWarn`
  - viz `vizIds` : 두 블록이면 `['a', 'b']`
- [ ] **Step 2 : 실패 확인** — `pnpm --filter site test src/lib/remark` / FAIL
- [ ] **Step 3 : 구현** — 블록 주석은 형제 노드를 앞에서부터 훑어 `%%` 만 있는 문단 사이를 잘라낸다
- [ ] **Step 4 : 통과 확인** — PASS
- [ ] **Step 5 : Commit** — `feat(remark): 주석 제거와 viz 블록 자리표시`

### Task 5 : collection 스키마 + 설정 연결 + Obsidian 볼트 뼈대

**Files:**
- Create : `apps/site/src/lib/content/schemas.ts` (zod 스키마만, 테스트용으로 분리)
- Create : `apps/site/src/content.config.ts`
- Create : `apps/site/src/content/.obsidian/app.json` · `apps/site/src/content/_assets/.gitkeep`
- Modify : `apps/site/astro.config.mjs` (`markdown.remarkPlugins`)
- Modify : `.gitignore` (`reports/` · `apps/site/src/content/.obsidian/workspace*.json`)
- Test : `apps/site/src/lib/content/__tests__/schemas.test.ts`

**Interfaces:**
- Consumes : Task 2 · 3 · 4 의 함수
- Produces :
  - `WikiSchema` : `title` · `aliases: string[] = []` · `tags: string[] = []` · `field: 'computer' | 'philosophy' | 'religion' | 'etc'` · `topic?` · `source` (출처 enum) · `sourcePath?` · `created?: date` · `autolink: boolean = true`
  - `PostSchema` : `title` · `field` · `context: 'self' | 'course' | 'study'` · `course?` · `year?: 1 ~ 5` · `topic?` · `source` (필수) · `originalUrl?: url` · `date: date` (필수) · `tags = []` · `series?` · `context === 'course'` 이면 `course` 필수 (`superRefine`)
  - `CourseSchema` : `title` · `code?` · `year: 1 ~ 5` · `category: 'gen' | 'phil' | 'rel' | 'cse'` (학교 방 `data.ts` 의 분류 그대로)
  - collection : `wiki` · `posts` · `courses`, 각각 `glob({ pattern: '**/*.md', base: './src/content/<이름>', generateId: ({ entry }) => slugFromPath(entry) })`

- [ ] **Step 1 : 실패하는 테스트 작성** — `post requires date` · `post requires source` · `course context requires course` · `wiki defaults` (aliases `[]`, autolink `true`) · `bad field rejected`
- [ ] **Step 2 : 실패 확인** — FAIL
- [ ] **Step 3 : 구현** — `z` 는 `astro/zod` 에서. `astro.config.mjs` 에 `remarkPlugins: [remarkStripComments, remarkViz, [remarkWikilink, { getGraph: () => getGraph(contentDir), onBroken: createBrokenReporter('../../reports/broken-links.md') }]]`. `.obsidian/app.json` : `{ "attachmentFolderPath": "_assets", "useMarkdownLinks": false, "newLinkFormat": "shortest" }`
- [ ] **Step 4 : 통과 확인** — `pnpm test` PASS, 그리고 date 없는 임시 post 를 넣었을 때 `pnpm build` 가 실패하는지 본 뒤 지운다
- [ ] **Step 5 : Commit** — `feat(content): wiki · posts · courses collection`

### Task 6 : 샘플 콘텐츠 (실제 원문)

**Files:**
- Create : `apps/site/src/content/wiki/computer/*.md` 3개 이상 · `posts/jekyll/*.md` 1개 · `courses/*.md` 1개

- [ ] **Step 1** : Yeonb0/Main 에서 서로 링크하는 노트 3개 이상, Yeonb0/Yeonb0.github.io 에서 그 노트를 링크할 수 있는 글 1편, 그 글의 과목 1개를 고른다 (관리자님 확인)
- [ ] **Step 2** : 원문 그대로 복사하고 content-rules 의 frontmatter 로 보강한다. 원작성일 · 출처 · `originalUrl` 유지
- [ ] **Step 3** : `[[ ]]` · `%% check %%` · viz 블록 (id 하나, 컴포넌트는 M2) 이 적어도 한 번씩 들어 있는지 확인
- [ ] **Step 4** : `pnpm build` 성공, `reports/broken-links.md` 가 없다 (깨진 링크 0)
- [ ] **Step 5 : Commit** — `content: M1 샘플 노트`

### Task 7 : /wiki · /posts 페이지 + 역링크

**Files:**
- Create : `apps/site/src/lib/content/graph-from-collections.ts`
- Create : `apps/site/src/sections/wiki/Layout.astro` · `tokens.css`
- Create : `apps/site/src/components/content/Article.astro` · `LinkList.astro` · `article.css`
- Create : `apps/site/src/pages/wiki/index.astro` · `apps/site/src/pages/wiki/[slug].astro` · `apps/site/src/pages/posts/[slug].astro`
- Modify : `apps/site/src/pages/posts/index.astro` (준비 중 → 글 목록)
- Modify : `apps/site/src/sections/registry.ts` (`wiki` 한 줄, `hub: false`)
- Test : `apps/site/src/lib/content/__tests__/graph-from-collections.test.ts`

**Interfaces:**
- Consumes : `buildGraph` · `Node` (Task 1), collection (Task 5)
- Produces : `toNodes(Wiki: CollectionEntry<'wiki'>[], Posts: CollectionEntry<'posts'>[]): Node[]` (entry.id → slug, `entry.body` → body)

- [ ] **Step 1 : 실패하는 테스트 작성** — `toNodes` 가 id · title · aliases · body 를 옮기는지 (가짜 entry 객체)
- [ ] **Step 2 : 실패 확인** — FAIL
- [ ] **Step 3 : 구현**
  - `/wiki` : 분야별 묶음 → 제목 목록. `/wiki/[slug]` : 제목 + 본문 + "이 개념을 다룬 글" (`backlinks`, 없으면 칸 자체를 숨김)
  - `/posts` : 날짜 내림차순 목록 (제목 · 날짜). `/posts/[slug]` : 제목 · 원작성일 · 출처 + 본문 + "관련 개념" (`related`)
  - 두 읽기 화면 모두 `Article.astro` 하나를 쓴다. 다크 (`#1a1a1a` · `#e0e0e0`), 본문 폭 `min(72ch, 100%)`, 링크 `.wikilink` 와 `.wikilink-broken` (점선 밑줄) 구분, `figure.viz` 는 `--viz-height` (기본 240px) 높이의 빈 틀
  - posts 섹션의 임시 밝은 토큰은 바꾸지 않는다 (서재 방 디자인은 본 사이트 몫). 글 읽기 화면만 다크 틀을 씌운다
- [ ] **Step 4 : 확인** — `pnpm test` PASS, `pnpm build` 성공, `pnpm dev --host` 에서 데스크톱과 375px (휴대폰) 로 : 링크 이동 · 역링크 · 제목 앵커 · 주석이 안 보이는지 · viz 틀
- [ ] **Step 5 : Commit** — `feat(pages): /wiki · /posts 와 역링크`

### Task 8 : Obsidian 확인 + 마무리

**Files:**
- Modify : `.devlog/config.yml` (필요하면 M1 완료 기준 문구만)

- [ ] **Step 1 (관리자님)** : Obsidian 에서 `apps/site/src/content` 를 볼트로 연다 → 링크 클릭 이동 · 그래프 뷰 연결 · 새 첨부가 `_assets` 로 가는지 · viz 블록이 코드 블록으로 보이는지 · 주석이 Obsidian 에서 숨는지
- [ ] **Step 2** : `pnpm test && pnpm build` 를 다시 돌려 출력 확인
- [ ] **Step 3** : PR 생성 (`feat/m1-content-base` → `main`)
