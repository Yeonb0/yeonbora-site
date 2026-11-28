// pnpm migrate:tistory run <raw 폴더> <묶음> [--dry-run] | verify <raw 폴더>
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { main } from './command'

const SiteDir = fileURLToPath(new URL('../../..', import.meta.url))
const RepoDir = resolve(SiteDir, '../..')

process.exitCode = main(process.argv.slice(2), {
  cwd: process.env.INIT_CWD ?? process.cwd(),
  contentDir: resolve(SiteDir, 'src/content'),
  reportsDir: resolve(RepoDir, 'reports'),
  backlogPath: resolve(RepoDir, 'docs/migration/wiki-backlog.json'),
  log: (m) => console.log(m),
  err: (m) => console.error(m),
})
