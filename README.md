# yeonbora-site

개인 사이트. 첫 화면은 아이콘 허브, 섹션마다 다른 세계.

## 구조

```
apps/site/            허브 · 글 · 컴퓨터 · 게임 섹션 (Astro + React + MDX)
  src/sections/<id>/  섹션 하나 = 레이아웃 + 토큰 (폴더 하나로 끝)
  src/sections/registry.ts  허브에 놓일 섹션 목록
  src/shared/Base.astro     공유 골격 (ClientRouter, 홈 버튼)
packages/             Algoristro 자리 (Phase 6)
```

## 명령

```
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # astro check + build → apps/site/dist
```

## Cloudflare Pages 설정

| 항목 | 값 |
|---|---|
| Framework preset | Astro |
| Build command | `pnpm build` |
| Build output directory | `apps/site/dist` |
| Root directory | (비워 둠) |
| 환경 변수 | `NODE_VERSION=22` |

## 새 섹션 추가

1. `src/sections/registry.ts` 에 한 줄
2. `src/sections/<id>/` 에 `Layout.astro` + `tokens.css`
3. `src/pages/<id>/index.astro`
