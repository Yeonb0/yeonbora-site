// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'

// 도메인이 확정되면 site 값만 바꾼다
export default defineConfig({
  site: 'https://yeonbora.dev',
  // 허브 칸의 다음 방 페이지를 미리 받아 둔다 (data-astro-prefetch)
  prefetch: true,
  // 게임 방은 프로젝트 방이 되었다 : 옛 주소로 들어오면 넘긴다
  redirects: { '/games': '/projects' },
  integrations: [react(), mdx()],
})
