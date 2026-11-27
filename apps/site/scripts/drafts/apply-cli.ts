// pnpm drafts:apply <edits.json> : db_query 로 받은 미반영 기록 (배열) 을 저장소 파일에 적용하고 결과를 JSON 으로 출력
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Review, VizConfig } from '../../src/viz/types'
import { applyEdits, type Repo, type StoredEdit } from './apply'
import { postFile } from './collect'

const SiteDir = fileURLToPath(new URL('../..', import.meta.url))
const vizFile = (id: string, name: string) => join(SiteDir, 'src/viz', id, name)
const readJson = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T
const writeJson = (p: string, v: unknown) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')

const Arg = process.argv[2]
if (!Arg) {
  console.error('사용법 : pnpm drafts:apply <edits.json>')
  process.exit(1)
}
const Edits = readJson<StoredEdit[]>(Arg)

const Repo: Repo = { Configs: {}, Reviews: {}, Posts: {} }
for (const id of new Set(Edits.map((e) => e.vizId))) {
  if (!existsSync(vizFile(id, 'config.json'))) continue
  Repo.Configs[id] = readJson<VizConfig>(vizFile(id, 'config.json'))
  Repo.Reviews[id] = readJson<Review>(vizFile(id, 'review.json'))
}
for (const e of Edits) {
  if (e.kind === 'body' && !(e.post in Repo.Posts) && existsSync(postFile(SiteDir, e.post))) Repo.Posts[e.post] = readFileSync(postFile(SiteDir, e.post), 'utf8')
}

const Today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
const R = applyEdits(Repo, Edits, Today)

for (const id of Object.keys(R.Repo.Configs)) {
  if (JSON.stringify(R.Repo.Configs[id]) !== JSON.stringify(Repo.Configs[id])) writeJson(vizFile(id, 'config.json'), R.Repo.Configs[id])
  if (JSON.stringify(R.Repo.Reviews[id]) !== JSON.stringify(Repo.Reviews[id])) writeJson(vizFile(id, 'review.json'), R.Repo.Reviews[id])
}
for (const [p, text] of Object.entries(R.Repo.Posts)) if (text !== Repo.Posts[p]) writeFileSync(postFile(SiteDir, p), text)

console.log(JSON.stringify({ Applied: R.Applied, Skipped: R.Skipped }, null, 2))
