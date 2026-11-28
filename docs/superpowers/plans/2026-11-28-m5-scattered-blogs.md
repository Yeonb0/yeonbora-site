# M5 흩어진 블로그 이전 계획 (2026-11-28)

## 결정
- velog : 계정이 404 (삭제 또는 휴면) 라 원문이 없다. M5 에서 빼고, 원문을 찾으면 나중에 추가한다.
- Tistory (`yeonbo-ra.tistory.com`) : 공개 글 63편 (sitemap 기준) + 비공개 글 (예 : `[이산구조] 05. Algorithms`, 2024-10-19). 비공개 글은 로그인한 브라우저에서 받는다.
  - 이 클라우드 세션은 tistory.com 접속이 막혀 있으므로, 연결된 컴퓨터의 브라우저에서 원문 HTML 을 JSON 하나로 모아 받고 그 파일을 이 세션으로 가져온다.
- Notion (𝑨𝒓𝒄𝒉𝒊𝒗𝒆 페이지 아래만) : 첨부 파일 (강의 PDF · 교재 · 족보 · 논문 · 과제 파일) 은 옮기지 않고 글만 posts 로 옮긴다. 일차가 제목인 수업 노트와 시험공부 페이지는 빼고 정리 글만 옮긴다.
- 출처 하나 = 브랜치 하나 = PR 하나 : `migrate/tistory` → `migrate/notion`.

## 단계
| 단계 | 브랜치 | 목표 | 완료 기준 |
|---|---|---|---|
| M5-a | migrate/tistory | Tistory 글이 모인다 | `pnpm migrate:tistory run · verify` + 테스트 · 공개 + 비공개 글 전부 · 그림 `_assets/tistory/` · 원작성일 · originalUrl · 카테고리 → tags · series · 본문 다름 0 · 깨진 링크 0 · PR 리포트 (표 · 코드 블록 · 수식 의심 목록) |
| M5-b | migrate/notion | Notion 정리 글이 모인다 | Archive 아래 정리 글 목록을 PR 에 올려 확인 · 고른 글만 이전 (토글 → details, 콜아웃 → Obsidian 콜아웃, 열 펼치기) · 그림 즉시 내려받기 · 중복 정리 |
| 마무리 | 각 PR | 중복 · 링크 | `dupes` 리포트 (wiki · jekyll · tistory · notion) · wiki 용어 연결 · `pnpm build` 깨진 링크 0 · 모바일 확인 · 시각화 후보 |

## 도구 구조
`apps/site/scripts/migrate/<출처>/` 에 jekyll 도구와 같은 구조 (cli · command · convert · run + `__tests__`).
- 원문은 `raw/<출처>/` (커밋하지 않음) 에 두고 `run` 은 오프라인으로 변환한다.
- `verify` 는 원문의 텍스트와 옮긴 글의 텍스트를 대조한다.
