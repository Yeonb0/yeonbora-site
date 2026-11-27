// 시안 작업대 빌드 설정 : pending 시각화만 담은 가상 모듈로 묶는다
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import type { InlineConfig, Plugin } from 'vite'

const SiteDir = fileURLToPath(new URL('.', import.meta.url))
const VirtualId = 'virtual:drafts-viz'
const Resolved = `\0${VirtualId}`

const draftsViz = (VizIds: string[]): Plugin => ({
  name: 'drafts-viz',
  resolveId: (id) => (id === VirtualId ? Resolved : undefined),
  load(id) {
    if (id !== Resolved) return
    const Rows = VizIds.map((v) => `  ${JSON.stringify(v)}: () => import(${JSON.stringify(`${SiteDir}src/viz/${v}/index.tsx`)}),`)
    return `export default {\n${Rows.join('\n')}\n}\n`
  },
})

export function draftsConfig(VizIds: string[], outDir: string): InlineConfig {
  return {
    configFile: false,
    root: `${SiteDir}src/drafts`,
    base: './',
    logLevel: 'warn',
    plugins: [react(), draftsViz(VizIds)],
    resolve: { alias: { '@': `${SiteDir}src` } },
    build: { outDir, emptyOutDir: true, assetsDir: 'assets' },
  }
}
