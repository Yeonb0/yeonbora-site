# 글 옮기기 프로젝트 지침

## 프로젝트 개요
- yeonbora-site 안에서 콘텐츠 이전 · 시각화 · 시안 검토만 맡는 프로젝트. 저장소는 따로 만들지 않는다.
  - GitHub : Yeonb0/yeonbora-site
- 흩어진 글을 모두 yeonbora-site 로 옮긴다. 블로그 글은 posts, 위키 노트는 wiki 로 들어가고, 둘은 서로 링크로 이어진다.
  - 출처 : Obsidian 위키 (Yeonb0/Main, 노트 약 1,450개) · Jekyll 깃블로그 (Yeonb0/Yeonb0.github.io) · velog · Tistory · Notion · 종이 정리본
- 원문은 그대로 옮기고, 설명이 약한 곳에는 직접 그린 그림 · 애니메이션 · 인터랙티브 시각화를 덧붙인다.
- Claude가 만든 시안은 사용자가 사이트와 분리된 시안 작업대 (Claude 아티팩트 URL) 에서 값 조절 · 오타 수정 후 승인한다.

## 결정된 사항
- 원본은 하나 : 모든 출처를 `apps/site/src/content/` 로 한 번 옮기고, 그 뒤로는 이 폴더가 원본이다. Obsidian은 이 폴더를 볼트로 연다. Main 저장소는 이전 후 보관 (archive) 한다. 계속 동기화하지 않는다.
  - 이유 : 동기화하면 Claude가 덧붙인 시각화를 둘 곳이 애매해지고, MDX로만 옮기면 Obsidian 환경 (LaTeX Suite · 자동 링크 · Dataview) 을 잃는다.
- 파일 형식 · frontmatter · 링크 · 시각화 · 주석 규칙은 저장소의 `docs/content-rules.md` 를 따른다. 이 지침에 같은 내용을 다시 적지 않는다. 작업 전에 항상 그 문서를 먼저 읽는다.
- 콘텐츠 모델 : 본 사이트 지침의 courses · posts 에 wiki collection을 추가한다.
- 시각화는 `.md` 안의 ` ```viz <id>``` ` 코드 블록 + `src/viz/<id>/` (index.tsx · config.json · review.json).
- 시안 작업대 : Claude 아티팩트 하나 ("시안 작업대") 를 계속 갱신해 쓴다. 사이트와 연결하지 않고, 사이트 배포에도 넣지 않는다 (2026-11-27 결정).
  - 이유 : 사이트 배포 없이 별도 URL (휴대폰 포함) 에서 보고 고칠 수 있고, 서버 · 토큰 · 비용이 없다. workers.dev + Cloudflare Access 안은 토큰 보관 · 인증 설정이 커서 보류.
  - 묶기 : `pnpm drafts:bundle` 이 review.json status 가 pending 인 시각화와 그 글을 `.drafts-dist/` (index.html + data/*.json + 번들 JS) 로 만든다. `.drafts-dist/` 는 커밋하지 않는다.
  - 올리기 : 아티팩트 파일 게시 도구로 `.drafts-dist/` 를 같은 아티팩트에 바뀐 파일만 다시 올린다 (파일 내용이 대화를 거치지 않으므로 토큰이 거의 들지 않는다). 새 아티팩트를 묶음마다 만들지 않는다.
  - 아티팩트 주소 (slug) 는 `docs/migration/drafts-artifact.json` 에 적어 두고 모든 세션이 같은 것을 쓴다.
  - 기록 : 아티팩트의 db 에 수정 한 건당 한 줄 (viz id · 바꾼 키 · 값 / 본문 수정 · 승인 / 반려 + 메모) 로 쌓는다.
  - 반영 : 사용자가 "시안 반영해 줘"라고 하면 db 에서 아직 반영하지 않은 기록만 읽어 config.json · 본문 · review.json 에 커밋하고, 반영한 기록에 표시한다.
  - 모습 : 시각화는 기본 다크 모드로 보인다. 방 테마가 정해진 글은 그 방의 tokens.css 를 함께 묶는다.
  - 나중 후보 : 사이트를 배포하는 본 사이트 Phase 11 무렵, 사이트 글에서 비밀번호로 바로 고치는 편집 (Worker 에서 비밀번호 확인 + GitHub API 커밋 + 시도 횟수 제한) 을 다시 검토한다. 그전까지는 아티팩트만 쓴다.
- 위키 이전 (M3) 결정 (2026-11-27)
  - 폴더 : wiki 는 Main 폴더 구조를 그대로 둔다 (`wiki/computer/<Main 상대 경로>`). 주소는 파일명 slug.
  - 링크 리포트 : Main 에서도 대상이 없던 링크는 backlog (`docs/migration/wiki-backlog.json`, 사이트에서 흐린 글자) 로, 나머지만 깨진 링크로 센다. "깨진 링크 0" 은 backlog 제외.
  - 이전 도구 : `pnpm migrate:obsidian run <볼트> "<최상위 폴더>" [--dry-run]` · `backlog <볼트>` · `verify <볼트>`. 볼트는 전체 기록 클론이어야 한다 (얕은 클론은 작성일이 틀려 도구가 거부). 종료 코드 2 = 확인 필요 (리포트 참조).
  - 렌더링 : Obsidian 콜아웃 · `==형광펜==` · KaTeX 수식 지원. smartypants 는 끈다 (원문의 ' · -- · ... 를 바꾸지 않음).
  - 같은 이름 노트 : 파일명 뒤에 ` (가장 가까운 다른 이름의 상위 폴더)` (`_MOC` 는 `MOC`) 를 붙이고 원래 이름은 aliases 맨 앞. 링크는 대소문자가 같은 쪽 → 링크 건 노트와 가까운 폴더 → 정렬 순서로 정한다.
- 반복 이전 작업은 migrate-posts 스킬로 한다. 이 프로젝트는 기반 (스키마 · 플러그인 · 작업대 묶음 스크립트) 을 만들고 결정을 쌓는 곳이다.

## 출처별 가져오기
| 출처 | 방법 | 주의 |
|---|---|---|
| Obsidian (Main) | 저장소 파일을 그대로 복사 → frontmatter 보강 | 첨부 이미지 경로 · 볼트 전용 플러그인 문법 (Dataview 쿼리) 처리 |
| Jekyll | `_posts` 파일 복사 → frontmatter 변환 | Liquid 태그 · `{% raw %}` · 이미지 경로 · MathJax 문법 |
| Notion | Notion 연결 (MCP) 또는 기존 `notion_to_md.py` | 이미지 URL 만료 → 즉시 내려받기, 토글 · 콜아웃 변환 |
| velog | GraphQL 로 마크다운 원문 받기 (공식 API 아님) | 시리즈 정보 유지, 이미지 내려받기 |
| Tistory | 공개 글 HTML → 마크다운 변환 (오픈 API 없음) | 표 · 코드 블록 · 수식 변환 결과를 반드시 리포트에 표시 |
| 종이 | 스캔 이미지 보관 + 전사 | 읽기 어려운 글씨는 추측하지 말고 `%% unclear %%` 로 남기고 사용자에게 묻는다 |

## 이 프로젝트의 경계
- 하는 것 : 콘텐츠 스키마, remark 플러그인 (링크 · viz · 주석 제거), /posts · /wiki 페이지, 역링크, 시안 작업대, 시각화 컴포넌트, 출처 이전
- 하지 않는 것 : 허브 · 방 디자인 (본 사이트 지침을 따르고 건드리지 않음), 배포 · 도메인 · 애드센스
- 본 사이트 지침의 Phase 2 (콘텐츠 모델 + 깃블로그 이전) 와 Phase 8 (흩어진 출처 수집) 은 이 프로젝트로 넘어온다. 본 지침의 Phase 표도 그에 맞춰 고친다.

## Phase
| Phase | 제목 | 목표 | 완료 기준 |
|---|---|---|---|
| M1 | 콘텐츠 기반 | 노트가 링크로 이어져 뜬다 | wiki · posts · courses 스키마 · remark 플러그인 (링크 · viz · 주석) · /wiki · /posts 페이지 · 역링크 · 샘플 노트 3개 이상 · content 폴더를 Obsidian 볼트로 열어 확인 |
| M2 | 시안 작업대 + 첫 시각화 | 별도 URL에서 그림을 보고 고치고 승인한다 | `pnpm drafts:bundle` · 시안 작업대 아티팩트 (목록 · config.json 조절판 · 본문 · 라벨 텍스트 수정 · 승인 / 반려 메모, db 기록) · "시안 반영"으로 저장소 커밋 · 샘플 글 1편에 직접 그린 SVG 또는 애니메이션 · 휴대폰에서 확인 |
| M3 | 위키 이전 | Main 노트가 사이트에서 열린다 | Main 노트 전부 이전 · 깨진 링크 0 (backlog 제외) · 이미지 정상 · Main 저장소 보관 |
| M4 | 깃블로그 이전 | Jekyll 글이 사이트에서 열린다 | _posts 전부 이전 · 원작성일 · 출처 유지 · 위키 링크 연결 · devlog 게시 경로를 Astro로 변경 |
| M5 | Tistory · Notion 이전 | 흩어진 블로그 글이 모인다 | 두 출처 글 전부 이전 · 출처별 변환 리포트 · 중복 글 정리 (velog 는 원문을 찾으면 나중에 추가) |
| M6 | 종이 정리본 | 손글씨가 글이 된다 | 1편 이상 스캔 + 전사 · 스캔 원본 보관 |

- 시각화는 이전 작업에서 바로 만들지 않는다. 묶음마다 설명이 약한 곳을 "시각화 후보" 로 PR 에 적고, 사용자가 고른 것만 만든다 (2026-11-27 결정).
- 깃블로그 이전 (M4) 결정 (2026-11-28)
  - 이전 도구 : `pnpm migrate:jekyll run <블로그 클론> <_posts 폴더> [--dry-run]` · `externals <블로그> <폴더>` (아직 받지 않은 외부 그림 목록) · `verify <블로그>`. 폴더별 topic · context · course 와 제외할 글은 `apps/site/scripts/migrate/jekyll/categories.ts`.
  - slug 는 날짜 + `[분류]` 접두어를 뺀 제목 (`2026-06-24-framing-error-control`), originalUrl 은 깃블로그 permalink `/:categories/:title/` 규칙으로 계산한다.
  - wiki 와 제목이 같은 강의 정리 글은 본문이 달라 둘 다 남기고 posts → wiki 링크로 잇는다. 같은 글이 두 번 올라간 경우는 하나만 남긴다 (PL Preliminaries · CA Computer Abstractions 는 06-24 판, BOJ 1068 은 그림이 있는 01-23 판).
  - BOJ 문제 그림 등 외부 그림은 `_assets/jekyll/<slug>/` 로 내려받는다. 받은 뒤 `run` 을 다시 돌리면 이미 옮긴 글의 그림 경로만 바뀐다.
  - 원문 HTML `<img src="../../_assets/...">` 는 remark 플러그인 (HTML 그림) 이 마크다운 그림으로 바꿔 사이트에서 보인다.
  - devlog 는 M4 이후 이 사이트 `posts/site/` 에 `draft: true` 로 올리고, 관리자가 허락한 글만 draft 를 지워 공개한다 (devlog 플러그인 0.2.0).
- 흩어진 블로그 이전 (M5) 결정 (2026-11-28)
  - velog : 계정이 404 (삭제 또는 휴면) 라 원문이 없다. M5 에서 빼고 원문을 찾으면 나중에 추가한다.
  - Tistory (`yeonbo-ra.tistory.com`) : 이 클라우드 세션에서 접속이 막혀 있어, 관리자가 로그인한 브라우저 (연결된 컴퓨터) 에서 원문을 모아 받는다. `raw/tistory/raw.json` (관리 페이지 글 목록 + 그림 원본) · `source.json` (편집기가 불러오는 저장 원본 HTML). 공개 페이지 HTML 은 HTML 삽입 블록 때문에 꼬인 글이 있어 쓰지 않는다. `raw/` 는 커밋하지 않는다.
  - 이전 도구 : `pnpm migrate:tistory run <raw 폴더> <묶음> [--dry-run]` · `verify <raw 폴더>` (공백을 뺀 글자 대조). 카테고리별 topic · series 와 제외 글은 `apps/site/scripts/migrate/tistory/categories.ts`.
  - 비공개 글 `[HTML] Self Check` 는 옮기지 않는다. HTML 삽입 (실습 화면) 은 `html demo` 블록 → 사이트에서 iframe (content-rules "HTML 실습").
  - 표는 머리 행이 없어 GFM 표 대신 모양 속성만 지운 HTML 표로 둔다. 글자 색은 의미 있는 것만 `<span style>` 로 남기고, 밝은 회색 바탕 (#dddddd) 은 다크 모드에서 안 보여 `<mark>` 로, 기본 글자색 · 흰 바탕 + 검은 글자 (붙여넣기 흔적) 는 지운다.
  - Notion : 𝑨𝒓𝒄𝒉𝒊𝒗𝒆 페이지 아래만, 첨부 파일 없이 글만 posts 로. 일차가 제목인 수업 노트 · 시험공부 페이지는 빼고 정리 글만.
- M3 진행 상황 (2026-11-28) : Main 노트 1,443편 이전 · 원문 대조 (같음 1443 · 없음 0 · 본문 다름 0) · 깨진 링크 0 · 빌드 확인 완료. Obsidian 으로 열어 보기와 Main 저장소 보관이 남았다.

## 작업 규칙
- 원문 보존 : 원문 문장은 고치지 않는다. 오타로 보이는 곳은 `%% typo? %%` 로 표시만 한다. 원래 작성일과 출처는 반드시 남긴다.
- PR 은 한 번에 하나 : Phase 하나 (출처가 여럿인 Phase 는 출처 하나) = 브랜치 하나 = PR 하나. 브랜치 이름 : `migrate/<출처>`. 묶음 (과목 하나 · 폴더 하나 · 출처의 한 카테고리) 은 그 브랜치 안의 커밋으로 나눈다 (커밋 이름 : `migrate(<출처>) : <묶음> N편`).
- 리뷰와 수정은 모두 머지 전에 같은 PR 에 커밋으로 더한다. 수정 PR 을 따로 만들지 않는다. 머지는 사용자가 하고, PR 이 다 준비되면 한 번 알린다.
- 묶음이 끝나면 리포트를 PR 본문에 쓴다 (`reports/` 는 커밋하지 않으므로 PR 본문이 기록이다) : 옮긴 글 수, 깨진 링크, 변환이 의심되는 곳 (표 · 수식 · 코드), 이름 바꿈, 붙인 표시 목록과 표시하지 않고 적기만 한 곳, 시각화 후보.
- 커밋 전에 `pnpm migrate:obsidian verify` (다른 출처는 그에 맞는 대조) 로 "본문 다름 0" 을 확인한다.
- 시각화 디자인은 첫 1 ~ 2개를 목업으로 먼저 보여 주고 승인받은 뒤 같은 톤으로 이어 간다. 승인 없이 톤을 바꾸지 않는다.
- 요청하지 않은 설명글을 글이나 시각화에 넣지 않는다.
- 저장소에 이미 구현된 결정 (색 · 선 · 애니메이션 값 · 글꼴 · 구조) 을 먼저 확인하고 따른다.
- 같은 글이 여러 출처에 있으면 (예 : Notion 원본과 Jekyll 게시본) 하나만 남기고, 무엇을 남겼는지 리포트에 적는다.
- 이미지 · 텍스트가 잘 안 보이면 추측하지 말고 사용자에게 먼저 묻는다.
- 모든 화면은 모바일에서 확인한다.

## devlog
- Phase는 `.devlog/config.yml` 에 기록한다 (본 사이트 Phase와 구분되도록 id 를 M1 ~ M6 으로).
- 현재 Phase의 완료 기준이 충족되면 "Phase N이 끝난 것 같습니다"라고 알리고 /devlog:publish phase-N 실행을 제안한다. 직접 실행하지 않는다.
- M4 완료 전까지 devlog 게시 대상은 기존 Jekyll 깃블로그, 완료 후에는 이 사이트의 posts collection이다 (`posts/site/`, draft 로 올린 뒤 허락받아 공개).
- 세션을 마칠 때 이번 세션의 결정과 이유를 /devlog:note 로 남길지 묻는다.
