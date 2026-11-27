// pnpm migrate:obsidian backlog <vaultDir> | run <vaultDir> <폴더 | .> [--dry-run] | verify <vaultDir>
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCommand, verifyVault, writeBacklog, type BatchResult } from './run'

const SiteDir = fileURLToPath(new URL('../../..', import.meta.url))
const RepoDir = resolve(SiteDir, '../..')
const ContentDir = resolve(SiteDir, 'src/content')
const BacklogPath = resolve(RepoDir, 'docs/migration/wiki-backlog.json')
const ReportsDir = resolve(RepoDir, 'reports')

const Usage = `사용법 :
  pnpm migrate:obsidian backlog <vaultDir>
  pnpm migrate:obsidian run <vaultDir> <Main 최상위 폴더 | .> [--dry-run]
  pnpm migrate:obsidian verify <vaultDir>`

const fail = (msg: string): never => {
  console.error(msg)
  process.exit(1)
}

const summary = (R: BatchResult, dryRun: boolean): string =>
  [
    `${dryRun ? '[dry-run] ' : ''}${R.folder} (${R.topic}) : 대상 ${R.total}편`,
    `  옮김 ${R.written.length} · 건너뜀 ${R.skipped.length} (같음 ${R.skipped.filter((s) => s.reason === 'same').length} · 충돌 ${R.skipped.filter((s) => s.reason === 'conflict').length}) · 제외 ${R.excluded.length}`,
    `  이름 바꿈 ${R.renamed.length} · 작성일 못 찾음 ${R.noDate.length}`,
    `  그림 : 복사 ${R.images.Copied.length} · 같음 ${R.images.Same.length} · 충돌 ${R.images.Clash.length} · 없음 ${R.images.Missing.length}`,
    `  링크 : 깨짐 ${R.links.broken} · backlog ${R.links.backlog} · 아직 안 옮김 ${R.links.notYetMigrated}`,
    `  의심 ${R.suspects.length}편 · 무시된 파일 ${R.ignored.length}개`,
    ...R.skipped.filter((s) => s.reason === 'conflict').map((s) => `  충돌 : ${s.path}`),
    ...R.brokenList.map((b) => `  깨진 링크 : ${b.target} (${b.files.join(', ')})`),
  ].join('\n')

try {
  const [Cmd, Vault, Folder] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const DryRun = process.argv.includes('--dry-run')
  if (!Cmd || !Vault) fail(Usage)
  const VaultDir = resolve(Vault)

  if (Cmd === 'backlog') {
    console.log(`backlog ${writeBacklog(VaultDir, BacklogPath)}개를 ${BacklogPath} 에 썼습니다`)
  } else if (Cmd === 'run') {
    if (!Folder) fail(Usage)
    const R = runCommand(VaultDir, Folder, { contentDir: ContentDir, reportsDir: ReportsDir, backlogPath: BacklogPath, dryRun: DryRun })
    console.log(summary(R, DryRun))
    if (!DryRun) console.log(`리포트 : ${resolve(ReportsDir, `migrate-obsidian-${R.topic}.md`)}`)
  } else if (Cmd === 'verify') {
    const V = verifyVault(VaultDir, ContentDir)
    console.log(`같음 ${V.ok} · 없음 ${V.missing.length} · 본문 다름 ${V.changed.length}`)
    for (const P of V.missing) console.log(`  없음 : ${P}`)
    for (const P of V.changed) console.log(`  본문 다름 : ${P}`)
    if (V.missing.length + V.changed.length > 0) process.exit(1)
  } else fail(Usage)
} catch (e) {
  fail(e instanceof Error ? e.message : String(e))
}
