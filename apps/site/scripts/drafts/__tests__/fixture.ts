// 테스트용 임시 사이트 폴더 : src/content + src/viz
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export const Post = `---
title: 샘플 글
field: computer
context: self
source: jekyll
date: 2026-06-24
---

첫 문단 %% typo? : 확인 %% 입니다.

\`\`\`viz demo
caption: 그림
\`\`\`

[[ARQ]] 를 본다.

| a | b |
|---|---|
| 1 | 2 |

![](../../_assets/jekyll/p.png)
`

export function makeSite(Files: Record<string, string>): string {
  const Root = mkdtempSync(join(tmpdir(), 'drafts-'))
  for (const [p, text] of Object.entries(Files)) {
    const Abs = join(Root, p)
    mkdirSync(dirname(Abs), { recursive: true })
    writeFileSync(Abs, text)
  }
  return Root
}

export const Base = {
  'src/content/posts/jekyll/sample.md': Post,
  'src/content/wiki/computer/ARQ.md': '---\ntitle: ARQ\nfield: computer\nsource: obsidian\n---\n\n본문\n',
  'src/content/_assets/jekyll/p.png': 'png',
  'src/viz/demo/config.json': JSON.stringify({ speed: { type: 'range', min: 0, max: 2, step: 1, value: 1, label: '속도' } }),
  'src/viz/demo/review.json': JSON.stringify({ status: 'pending', post: 'posts/jekyll/sample', note: '', updated: '2026-11-27' }),
  'src/viz/done/config.json': '{}',
  'src/viz/done/review.json': JSON.stringify({ status: 'approved', post: 'posts/jekyll/sample', note: '', updated: '2026-11-27' }),
}
