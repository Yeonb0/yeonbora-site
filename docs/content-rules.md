# 콘텐츠 규칙

글 옮기기 프로젝트 지침과 migrate-posts 스킬이 함께 따르는 규칙이다. 규칙을 바꿀 때는 이 문서만 고친다.

## 원칙
- 원본은 하나 : `apps/site/src/content/` 가 모든 글의 원본이다. Obsidian은 이 폴더를 볼트로 연다.
- 파일은 `.md` 로 유지한다. `.mdx` 는 쓰지 않는다 (Obsidian에서 열리지 않으므로).
- 원문은 그대로 옮긴다. 문장을 다듬거나 요약하지 않는다. Claude가 더하는 것은 시각화 블록과 주석 (아래) 뿐이다.

## 폴더
```
apps/site/src/content/
  wiki/<분야>/<출처 폴더 경로>/<제목>.md   위키 노트 (원자 단위 개념)
  posts/<출처>/<slug>.md       블로그 글
  courses/<code>.md            과목
  _assets/<출처>/...           이미지 · 스캔 원본 (Obsidian 첨부 폴더도 여기로 지정)
  .obsidian/                   Obsidian 설정 (Astro glob 에서 제외)
apps/site/src/viz/<id>/
  index.tsx                    시각화 컴포넌트
  config.json                  조절 가능한 값 (작업대가 읽고, 반영 때 Claude가 씀)
  review.json                  검토 상태 (저장소 쪽 기록)
```
- 분야 : computer · philosophy · religion · etc
- 출처 : jekyll · velog · tistory · notion · obsidian · paper · site (이 사이트에서 처음 쓴 글, devlog 등)
- wiki 는 원래 출처의 폴더 구조를 그대로 둔다 : `wiki/<분야>/<원래 출처의 폴더 경로>/<제목>.md` (obsidian 은 Main 상대 경로 그대로). 주소는 파일명 slug 이므로 폴더를 옮겨도 주소는 바뀌지 않는다 (2026-11-27 결정).
- 이름 충돌 : 같은 slug 가 둘 이상이면 파일명 뒤에 ` (<폴더>)` 를 붙이고, 원래 이름을 aliases 맨 앞에 넣는다. 폴더는 파일명과 이름이 다른 가장 가까운 상위 폴더이고 `_MOC` 는 `MOC` 로 쓴다. 새 이름도 slug 가 겹치면 멈추고 알린다.

## frontmatter

### wiki
```yaml
---
title: 가비지 컬렉션
aliases: [GC, Garbage Collection]
tags: [java, jvm]
field: computer
topic: 컴퓨터 방의 폴더 이름
course: [engineer-cert]     # 배운 곳 (코스), 코스 폴더의 노트만
source: obsidian            # 원래 있던 곳
sourcePath: 서버 구조와 기술/가비지 컬렉션.md   # Main 상대 경로 (이름이 바뀐 노트도 원래 경로)
created: 2026-07-29         # 원래 작성일
autolink: true              # Main 규칙 그대로 (autolink · autolink-in)
---
```

- `topic` 은 무엇을 배웠는지 (주제), `course` 는 어디서 배웠는지 (코스) 다. 멋쟁이사자처럼 · 정보처리기사 · 빅데이터분석기사처럼 여러 주제가 섞인 폴더는 노트마다 하위 경로로 topic 을 나누고 course 로 묶는다. 규칙은 `apps/site/scripts/migrate/obsidian/topics.ts` 의 `CourseFolders`, 코스 이름 · 배운 순서는 `apps/site/src/lib/content/wiki-courses.ts` 의 `Courses` 에 둔다 (2026-11-27 결정).
- Main 노트에 `source:` 키가 있으면 위 `source` 와 겹치므로 `sourceDoc` 으로 이름을 바꿔 옮긴다 (값은 그대로). Main 에만 있는 다른 키는 이름 그대로 뒤에 둔다.

### posts
```yaml
---
title: '[시프] 프록시 서버 구현'
field: computer
context: course             # self / course / study
course: CSE4100             # context 가 course 일 때
year: 3                     # 과목 없는 글일 때
topic: ''
source: jekyll
originalUrl: https://yeonb0.github.io/...
date: 2025-05-02            # 원래 작성일 (절대 오늘 날짜로 바꾸지 않음)
tags: [c, network]
series: ''                  # 있으면 유지 (devlog 포함)
step: 5                     # 시리즈 안 순서 (있을 때만)
tier: Gold                  # BOJ 글의 티어 : Bronze · Silver · Gold · Platinum
description: ''             # 기술 블로그 목록 카드의 요약 (없으면 본문 앞부분)
book: cpr                   # 인문 블로그 도서관의 책 id (있을 때만)
draft: true                 # 숨김 (있을 때만) : 빌드에서 빠지고 pnpm dev 에서만 보인다
---
```
- `source` · `date` 가 비면 빌드가 실패하도록 스키마에서 필수로 둔다.
- `draft` : devlog 초안처럼 관리자 승인 전 글. posts 를 읽는 곳은 모두 `src/lib/content/posts.ts` 의 `getPosts` 를 써서 draft 를 뺀다. 공개는 draft 줄을 지우는 커밋으로 한다.
- devlog 글은 `devlog_project` · `devlog_phase` 를 둔다 (devlog 플러그인이 씀).
- 원래 플랫폼의 분류 · 시리즈 정보는 tags · series 로 옮기고 버리지 않는다.
- `book` : 인문 블로그 도서관 (`/humanities/`) 에서 그 책을 펼치면 글 목록에 나온다. id 는 `apps/site/src/sections/humanities/data.ts` 의 `Books` 에 있는 것만 쓴다 (없는 id 면 빌드가 멈춘다). 새 책은 `Books` 에 한 줄 + `tools/shelves.py` 로 책장 그림에 제목을 찍어 더한다.

## 링크
- `[[제목]]` · `[[제목|표시]]` · `[[제목#소제목]]` 는 remark 플러그인이 주소로 바꾼다. 찾는 순서 : wiki 제목 → wiki aliases → posts 제목 → posts 파일명 (Obsidian 은 파일명으로 링크하고, 대괄호가 든 제목은 `[[ ]]` 안에 쓸 수 없으므로). 대소문자는 가리지 않는다.
- 링크 키 : 앞뒤 공백을 지우고 소문자로 맞추며, 곡선 따옴표 (`‘ ’ ʼ`) 는 `'` 로 본다. 같은 키의 노트가 여럿이면 ① 대소문자까지 맞는 노트 ② 링크를 건 노트와 폴더가 가장 많이 겹치는 노트 ③ `sourcePath` 순서 중 첫 노트를 고른다 (②③ 으로 고른 링크는 이전 리포트의 `## 모호한 링크` 에 남는다).
- 경로형 링크 `[[폴더/노트]]` 는 제목이 아니라 `sourcePath` 로 찾는다 (전체 경로 또는 `/` 경계의 뒷부분이 하나만 맞을 때, `.md` 는 있어도 없어도 된다). 이름이 바뀐 노트 (`!important (CSS)`) 도 원래 경로로 찾는다.
- wiki 의 title 은 파일명과 같게 둔다 (Main 규칙 : 제목이 곧 링크 이름).
- 이미지 임베드 `![[그림.png]]` · `![[그림.png|300]]` 는 `_assets/` 아래에서 파일명으로 찾아 이미지로 바꾼다. 노트 임베드 `![[노트]]` 는 아직 원문 그대로 둔다.
- 주소 : wiki 는 `/wiki/<slug>`, posts 는 `/posts/<slug>`. slug 는 파일명 (한글 허용). 제목 중복은 금지 (Main 규칙 그대로).
- 같은 대상은 글 하나에 한 번만 링크한다. 조사는 링크 밖에 둔다 (`[[가비지 컬렉션]]은`).
- 역링크 : wiki 페이지 아래에 "이 개념을 다룬 글" (그 노트를 링크한 posts) 을 자동으로 붙인다. posts 페이지에는 "관련 개념" (본문에서 링크한 wiki) 을 붙인다.
- 찾지 못한 링크는 빌드를 멈추지 않고 경고한다. 대상 노트가 Main 에 처음부터 없던 링크는 backlog (나중에 쓸 노트) 로 따로 본다 : 목록은 `docs/migration/wiki-backlog.json`, 리포트는 `reports/wiki-backlog.md`, 사이트에서는 흐린 글자로 표시한다. 그 밖의 실제 깨진 링크는 `reports/broken-links.md` 에 기록한다. "깨진 링크 0" 은 backlog 를 뺀 수로 센다. 두 리포트는 `pnpm build` · `pnpm dev` 를 시작할 때 콘텐츠 폴더에서 다시 계산한다 (커밋하지 않음).

## 처리기
- Astro 7 기본 처리기 (Sätteri) 대신 `@astrojs/markdown-remark` 의 `unified()` 를 쓴다. 플러그인 순서 : 주석 제거 → viz → HTML 실습 → 콜아웃 → 형광펜 → HTML 그림 → 수식 → 링크. Obsidian `==형광펜==` 은 `<mark>` 로 바뀐다.
- HTML 그림 : 원문의 `<img src="../../_assets/...">` (상대 경로, `<img>` 만 있는 HTML) 는 마크다운 그림 노드로 바꿔 Astro 가 처리하게 한다 (alt · style · width · height 유지). 원문 파일은 그대로 둔다.
- smartypants 는 끈다 (원문 보존 : 따옴표 · 줄임표 · 대시를 곡선 · 특수 문자로 바꾸지 않는다). posts 에도 같이 적용된다.

## HTML 실습 (html demo)
티스토리 "HTML 삽입" 처럼 글 안에서 실제로 동작하던 HTML 은 원문 그대로 코드 블록 하나에 둔다 (2026-11-28 결정).
````md
```html demo
<style>.bar{ width:100px; }</style>
<div class="bar">ease</div>
```
````
- Obsidian 에서는 코드 블록으로 보이고, 사이트에서는 remark 플러그인 (`src/lib/remark/html-demo.ts`) 이 `<iframe sandbox srcdoc>` 로 바꾼다. 원문의 CSS · 스크립트는 iframe 안에서만 동작하고 사이트로 새어 나가지 않는다.
- 블록 안 HTML 은 고치지 않는다. iframe 바탕은 원문 기준인 흰색, 높이는 iframe 이 알려 주는 문서 높이로 맞춘다.
- 시각화 (viz) 가 아니므로 review.json · config.json 을 두지 않는다.

## 시각화 · 그림
본문에는 코드 블록 하나만 넣는다. Obsidian에서는 코드 블록으로 보이고, 사이트에서는 컴포넌트로 바뀐다.
````md
```viz tlb-lookup
caption: TLB 에서 주소를 찾는 과정
```
````
- 블록 안 yaml 은 선택 (caption · 높이 정도). 값 조절은 config.json 에서 한다.
- 위치 : 원문 문단 사이에만 넣는다. 원문 문장을 쪼개거나 바꾸지 않는다.
- 직접 그리기 우선 : 외부 이미지 대신 SVG를 직접 그리거나 애니메이션으로 표현한다. 원문의 기존 그림은 지우지 않고, 시각화는 그 옆에 덧붙인다.
- 다크 모드 (배경 #1a1a1a, 텍스트 #e0e0e0 계열). 단, 글이 놓인 방의 토큰이 있으면 그 토큰을 쓴다.
- 색은 프로젝트 팔레트 `apps/site/src/viz/palette.ts` 에서만 가져온다 (아래 "색"). 컴포넌트에 색 코드를 새로 적지 않는다.
- 사이트에서는 `client:visible` 로 화면에 보일 때만 불러온다.
- 모바일에서 조작 가능해야 하고, prefers-reduced-motion 이면 애니메이션을 짧게 줄이거나 정지 화면을 보여 준다.
- 설명글은 원문에 없는 내용을 새로 쓰지 않는다. 라벨 · 캡션 정도만 둔다.

### 색 (2026-11-27 결정)
글 옮기기 프로젝트 전체 (시각화 · 재생 버튼 · 시안 작업대) 가 쓰는 팔레트. 원본은 `apps/site/src/viz/palette.ts` 하나다.
- 주 색 : 무광 보라 21색 (`Purple`) + 연보라 25색 (`PurpleTint`)
- 포인트 : 노랑 5색 (`Yellow`, #FFFFCC ~ #FFCA1A) · 남색 5색 (`Navy`, #06162B ~ #F3FBFE)
- 쓰임새 (`Role`)
  - 바탕 #1A1A1A · 글자 #E0E0E0 · 흐린 글자 #8A8A8A · 선 #3A3A3A
  - primary #A688B7 : 선 · 채움 · 버튼 강조
  - point #FFD94D : 한 장면에서 가장 중요한 한 곳. 그 위 글자는 #1A1A1A
  - navyPoint #2F6E9B · navyText #A8D4EA : 두 번째 강조 (지금 읽는 자리 등)
- config.json 의 color 기본값도 팔레트에서 고른다. 작업대 색 고르기는 팔레트를 먼저 보여 준다.
- 바탕 위 글자는 대비 4.5 이상, 선 · 채움은 3 이상 (palette 테스트가 검사).

### config.json
작업대 조절판이 이 파일로 그려진다. 컴포넌트는 값을 하드코딩하지 않고 여기서 읽는다.
```json
{
  "speed": { "type": "range", "min": 0.2, "max": 3, "step": 0.1, "value": 1, "label": "속도" },
  "accent": { "type": "color", "value": "#7209B7", "label": "강조 색" },
  "size": { "type": "range", "min": 200, "max": 640, "step": 10, "value": 420, "label": "크기 (px)" },
  "labels": { "type": "text", "value": { "hit": "TLB 적중", "miss": "TLB 실패" }, "label": "라벨 문구" }
}
```
- type : range · color · toggle · select · text

### review.json
```json
{ "status": "pending", "post": "posts/jekyll/2025-05-02-proxy", "note": "", "updated": "2026-11-27" }
```
- status : pending (검토 대기) · approved · rejected
- 반려 메모 (note) 는 다음 작업에서 가장 먼저 읽고 반영한다.
- 작업대 (아티팩트) 에서 누른 승인 / 반려는 "시안 반영" 때 이 파일로 옮겨진다. 저장소에서는 이 파일이 최종 기록이다.

## 시안 작업대
Claude 아티팩트 하나 ("시안 작업대") 를 계속 갱신해 쓴다. 주소는 `docs/migration/drafts-artifact.json`.

### 묶기 · 올리기
- `pnpm drafts:bundle` : review.json status 가 pending 인 시각화와 그 글을 저장소 루트 `.drafts-dist/` 로 묶는다 (커밋하지 않음).
- index.html 말고는 모두 내용 해시 이름이다 (`assets/*-<hash>.js` · `data/post-<hash>.json` · `img/<이름>-<hash>.<ext>`). 글의 로컬 그림도 함께 묶는다.
- 올리기 : `list_files` 결과와 `.drafts-dist/files.json` 을 비교해 index.html + 목록에 없는 경로만 `publish_files` (patch) 로 올리고, 아티팩트에만 있는 경로는 `remove` 로 지운다.
- 아티팩트 db 선언 : `{ db: { rules: [{ path: "edits", read: "admin", write: "admin" }] }, user: {} }`

### 기록 (db)
컬렉션 `edits`, 수정 한 건 = 문서 하나 (id 는 시각 + 난수). 모든 기록에 `at` (ISO 시각) · `vizId` · `applied` (`false` 또는 `{ commit, at }`) 가 있다.
```json
{ "kind": "config", "key": "speed", "value": 1.4 }
{ "kind": "body", "post": "posts/jekyll/2026-06-24-framing-error-control", "find": "블록 원문", "replace": "고친 원문" }
{ "kind": "review", "status": "rejected", "note": "메모" }
```
- config : 슬라이더는 놓았을 때 한 건. body : 블록 (문단 · 목록 · 표 하나) 단위로 원문 전체를 find 로 둔다.

### 반영 ("시안 반영해 줘")
1. `db_query` (collection `edits`, where `applied == false`, orderBy `at`) 결과를 `{ id, ...data }` 배열로 임시 파일에 쓴다.
2. 브랜치 `drafts/apply-<날짜>` 에서 `pnpm drafts:apply <파일>` → `pnpm test` → 커밋 (반영 · 건너뛴 건수).
3. Applied 의 각 문서에 `db_write` update `{ applied: { commit, at } }` (ifVersion 포함).
4. Skipped 는 이유와 함께 사용자에게 보고하고 표시하지 않는다 (작업대에 계속 남음).
- 같은 키를 여러 번 바꿨으면 시간순으로 마지막 값이 남는다. 범위 밖 값 · 없는 키 · 없는 시각화는 건너뛴다.
- body 는 find 가 글에 정확히 한 번 나올 때만 바꾼다. 같은 블록을 여러 번 고쳤으면 마지막 것만 적용한다.
- 반영이 끝나면 다시 묶어 올린다 (approved · rejected 는 목록에서 빠진다).

## 주석 (원문을 고치지 않고 표시만)
Obsidian 주석 문법을 쓴다. 사이트 빌드에서는 remark 플러그인이 지운다.
```md
%% typo? : "레지스터를" → "레지스터를" 의 조사 확인 %%
%% check : 원문 이미지가 깨져 있음 (tistory 원본 확인 필요) %%
%% unclear : 스캔 글씨를 읽지 못함 — 사용자에게 확인 %%
```
- 오타로 보이는 부분은 고치지 않고 `typo?` 로 표시한다. 고치는 것은 사용자가 작업대 (아티팩트) 나 Obsidian에서 한다.
- 표시는 바로 앞 줄과 같은 들여쓰기 · `> ` 를 붙여 독립된 한 줄로 단다. 문장 중간에 넣지 않고, 표시 안에 `]]` 를 쓰지 않는다.
- 표시 한 줄을 더하는 것 말고는 아무것도 바꾸지 않는다 (빈 줄을 더하거나 빼지 않는다). 빈 줄이 필요해지는 곳과 표 바로 다음 줄 (화면에 빈 표 행이 생김) 에는 달지 않고 PR 에 적는다.
- 코드 블록 안의 오타는 표시하지 않고 PR 에 적는다.
- `check` 는 문법이 깨졌거나 사실 · 수식이 분명히 틀린 곳에만 쓴다. 문체 · 의견 · 한자 약어 (多 · 大 / 小) 에는 달지 않는다. 확실하지 않으면 PR 에만 적는다.

## canonical
- 원래 플랫폼에 글을 남겨 두면, 새 사이트 글이 canonical 이 되도록 한다. 원래 플랫폼 쪽 처리 (삭제 · 비공개 · 링크 남기기) 는 사용자가 정한다.
