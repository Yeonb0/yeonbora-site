// pnpm drafts:bundle : pending 시각화와 그 글을 저장소 루트 .drafts-dist/ 로 묶는다
// index.html 말고는 모두 내용 해시 이름이라, 올릴 때 list_files 에 없는 경로만 새로 올리면 된다
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import type { DraftsManifest } from '../../src/drafts/manifest'
import { draftsConfig } from '../../vite.drafts.config'
import { collectPending, postFile } from './collect'
import { renderPost } from './render-post'

const SiteDir = fileURLToPath(new URL('../..', import.meta.url))
const ContentDir = join(SiteDir, 'src/content')
const OutDir = join(SiteDir, '../../.drafts-dist')

const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex').slice(0, 8)

const listAll = (dir: string): string[] =>
  (readdirSync(dir, { recursive: true, withFileTypes: true }) as import('node:fs').Dirent[])
    .filter((d) => d.isFile())
    .map((d) => relative(dir, join(d.parentPath, d.name)).split('\\').join('/'))
    .sort()

// JSON 을 <script> 안에 넣을 때 < 를 이스케이프
export const embedJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

async function main() {
  const { Viz, postPaths } = collectPending(SiteDir)
  await build(draftsConfig(Viz.map((v) => v.id), OutDir))

  const Posts: DraftsManifest['Posts'] = {}
  for (const P of postPaths) {
    const Post = renderPost(postFile(SiteDir, P), ContentDir)
    for (const Img of Post.Images) {
      mkdirSync(dirname(join(OutDir, Img.name)), { recursive: true })
      copyFileSync(Img.file, join(OutDir, Img.name))
    }
    const { Images: _, ...Data } = Post
    const Json = JSON.stringify(Data)
    const Name = `data/post-${hash(Json)}.json`
    mkdirSync(join(OutDir, 'data'), { recursive: true })
    writeFileSync(join(OutDir, Name), Json)
    Posts[P] = { title: Post.title, file: Name }
  }

  const Manifest: DraftsManifest = { builtAt: new Date().toISOString(), Viz, Posts }
  const IndexPath = join(OutDir, 'index.html')
  const Html = readFileSync(IndexPath, 'utf8').replace('<!--manifest-->', `<script type="application/json" id="manifest">${embedJson(Manifest)}</script>`)
  writeFileSync(IndexPath, Html)

  const Files = listAll(OutDir).filter((f) => f !== 'files.json')
  writeFileSync(join(OutDir, 'files.json'), JSON.stringify(Files, null, 2) + '\n')
  console.log(`[drafts] 시각화 ${Viz.length}개 · 글 ${postPaths.length}편 · 파일 ${Files.length}개 → ${OutDir}`)
}

main().catch((e) => {
  console.error(`[drafts] ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
