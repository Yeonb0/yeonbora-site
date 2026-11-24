// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'

// 도메인이 확정되면 site 값만 바꾼다
export default defineConfig({
  site: 'https://yeonbora.dev',
  integrations: [react(), mdx()],
})
