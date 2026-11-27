// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import { unified } from '@astrojs/markdown-remark'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { remarkStripComments } from './src/lib/remark/comments'
import { remarkViz } from './src/lib/remark/viz'
import { remarkWikilink } from './src/lib/remark/wikilink'
import { getAssets, getGraph } from './src/lib/content/index-fs'
import { createBrokenReporter } from './src/lib/content/broken-report'

// 콘텐츠 원본 (Obsidian 볼트) 과 깨진 링크 리포트 : 빌드 · 개발 서버를 켤 때마다 리포트를 새로 쓴다
const ContentDir = fileURLToPath(new URL('./src/content', import.meta.url))
const ReportPath = fileURLToPath(new URL('../../reports/broken-links.md', import.meta.url))
rmSync(ReportPath, { force: true })
/** @param {string} msg */
const warn = (msg) => console.warn(`[content] ${msg}`)

// 도메인이 확정되면 site 값만 바꾼다
export default defineConfig({
  site: 'https://yeonbora.dev',
  // 허브 칸의 다음 방 페이지를 미리 받아 둔다 (data-astro-prefetch)
  prefetch: true,
  // 게임 방은 프로젝트 방이 되었다 : 옛 주소로 들어오면 넘긴다
  redirects: { '/games': '/projects' },
  integrations: [react(), mdx()],
  // Astro 7 기본 처리기 (Sätteri) 대신 remark 파이프라인 : 위키 링크 · 주석 · viz 플러그인
  markdown: {
    processor: unified({
      remarkPlugins: [
        [remarkStripComments, { onWarn: warn }],
        [remarkViz, { onWarn: warn }],
        [remarkWikilink, { contentDir: ContentDir, getGraph: () => getGraph(ContentDir), getAssets: () => getAssets(ContentDir), onBroken: createBrokenReporter(ReportPath) }],
      ],
    }),
  },
})
