# 콘텐츠 규칙

글 옮기기 프로젝트 지침과 migrate-posts 스킬이 함께 따르는 규칙이다. 규칙을 바꿀 때는 이 문서만 고친다.

## 원칙
- 원본은 하나 : `apps/site/src/content/` 가 모든 글의 원본이다. Obsidian은 이 폴더를 볼트로 연다.
- 파일은 `.md` 로 유지한다. `.mdx` 는 쓰지 않는다 (Obsidian에서 열리지 않으므로).
- 원문은 그대로 옮긴다. 문장을 다듬거나 요약하지 않는다. Claude가 더하는 것은 시각화 블록과 주석 (아래) 뿐이다.

## 폴더
```
apps/site/src/content/
  wiki/<분야>/<제목>.md        위키 노트 (원자 단위 개념)
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
- 출처 : jekyll · velog · tistory · notion · obsidian · paper

## frontmatter

### wiki
```yaml
---
title: 가비지 컬렉션
aliases: [GC, Garbage Collection]
tags: [java, jvm]
field: computer
topic: 컴퓨터 방의 폴더 이름
source: obsidian            # 원래 있던 곳
sourcePath: 서버 구조와 기술/가비지 컬렉션.md
created: 2026-07-29         # 원래 작성일
autolink: true              # Main 규칙 그대로 (autolink · autolink-in)
---
```

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
---
```
- `source` · `date` 가 비면 빌드가 실패하도록 스키마에서 필수로 둔다.
- 원래 플랫폼의 분류 · 시리즈 정보는 tags · series 로 옮기고 버리지 않는다.

## 링크
- `[[제목]]` · `[[제목|표시]]` 는 remark 플러그인이 주소로 바꾼다. 찾는 순서 : wiki 제목 → wiki aliases → posts 제목.
- 주소 : wiki 는 `/wiki/<slug>`, posts 는 `/posts/<slug>`. slug 는 파일명 (한글 허용). 제목 중복은 금지 (Main 규칙 그대로).
- 같은 대상은 글 하나에 한 번만 링크한다. 조사는 링크 밖에 둔다 (`[[가비지 컬렉션]]은`).
- 역링크 : wiki 페이지 아래에 "이 개념을 다룬 글" (그 노트를 링크한 posts) 을 자동으로 붙인다. posts 페이지에는 "관련 개념" (본문에서 링크한 wiki) 을 붙인다.
- 찾지 못한 링크는 빌드를 멈추지 않고 경고 + `reports/broken-links.md` 에 기록한다.

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
- 사이트에서는 `client:visible` 로 화면에 보일 때만 불러온다.
- 모바일에서 조작 가능해야 하고, prefers-reduced-motion 이면 애니메이션을 짧게 줄이거나 정지 화면을 보여 준다.
- 설명글은 원문에 없는 내용을 새로 쓰지 않는다. 라벨 · 캡션 정도만 둔다.

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

## 주석 (원문을 고치지 않고 표시만)
Obsidian 주석 문법을 쓴다. 사이트 빌드에서는 remark 플러그인이 지운다.
```md
%% typo? : "레지스터를" → "레지스터를" 의 조사 확인 %%
%% check : 원문 이미지가 깨져 있음 (tistory 원본 확인 필요) %%
%% unclear : 스캔 글씨를 읽지 못함 — 사용자에게 확인 %%
```
- 오타로 보이는 부분은 고치지 않고 `typo?` 로 표시한다. 고치는 것은 사용자가 작업대 (아티팩트) 나 Obsidian에서 한다.

## canonical
- 원래 플랫폼에 글을 남겨 두면, 새 사이트 글이 canonical 이 되도록 한다. 원래 플랫폼 쪽 처리 (삭제 · 비공개 · 링크 남기기) 는 사용자가 정한다.
