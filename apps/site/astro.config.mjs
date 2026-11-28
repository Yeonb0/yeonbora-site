// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import { unified } from '@astrojs/markdown-remark'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { fileURLToPath } from 'node:url'
import { remarkStripComments } from './src/lib/remark/comments'
import { remarkViz } from './src/lib/remark/viz'
import { remarkHtmlDemo } from './src/lib/remark/html-demo'
import { remarkCallout } from './src/lib/remark/callout'
import { remarkHighlight } from './src/lib/remark/highlight'
import { remarkWikilink } from './src/lib/remark/wikilink'
import { remarkHtmlImage } from './src/lib/remark/html-image'
import { findBrokenLinks, getAssets, getGraph, isBacklog, setBacklogPath } from './src/lib/content/index-fs'
import { writeBrokenReport } from './src/lib/content/broken-report'

// 콘텐츠 원본 (Obsidian 볼트) 과 깨진 링크 리포트
const ContentDir = fileURLToPath(new URL('./src/content', import.meta.url))
const ReportPath = fileURLToPath(new URL('../../reports/broken-links.md', import.meta.url))
const BacklogPath = fileURLToPath(new URL('../../docs/migration/wiki-backlog.json', import.meta.url))
setBacklogPath(ContentDir, BacklogPath)
/** @param {string} msg */
const warn = (msg) => console.warn(`[content] ${msg}`)

// 렌더 결과는 content layer 가 캐시하므로 리포트는 렌더가 아니라 파일에서 계산한다
/** @type {import('astro').AstroIntegration} */
const brokenLinks = {
  name: 'broken-links',
  hooks: {
    'astro:build:start': () => writeBrokenReport(ReportPath, findBrokenLinks(ContentDir)),
    'astro:server:start': () => writeBrokenReport(ReportPath, findBrokenLinks(ContentDir)),
  },
}

// 도메인이 확정되면 site 값만 바꾼다
export default defineConfig({
  site: 'https://yeonbora.dev',
  // 허브 칸의 다음 방 페이지를 미리 받아 둔다 (data-astro-prefetch)
  prefetch: true,
  // 게임 방은 프로젝트 방이 되었다 : 옛 주소로 들어오면 넘긴다
  redirects: { '/games': '/projects' },
  integrations: [react(), mdx(), brokenLinks],
  // Astro 7 기본 처리기 (Sätteri) 대신 remark 파이프라인 : 주석 → viz → HTML 실습 → 콜아웃 → 형광펜 → HTML 그림 → 수식 → 링크 순서 (content-rules)
  markdown: {
    // smartypants 는 ' " -- ... 를 바꿔 원문을 해치고 링크 대상도 어긋나게 한다 : 끈다
    processor: unified({
      smartypants: false,
      remarkPlugins: [
        [remarkStripComments, { onWarn: warn }],
        [remarkViz, { onWarn: warn }],
        remarkHtmlDemo,
        remarkCallout,
        remarkHighlight,
        remarkHtmlImage,
        remarkMath,
        [remarkWikilink, { contentDir: ContentDir, getGraph: () => getGraph(ContentDir), getAssets: () => getAssets(ContentDir), isBacklog: (/** @type {string} */ t) => isBacklog(ContentDir, t), onBroken: (/** @type {{ file: string, target: string }} */ b) => warn(`찾지 못한 링크 : ${b.file} → ${b.target}`) }],
      ],
      rehypePlugins: [rehypeKatex],
    }),
  },
})
