// CLI 본체 : 인자 검사 · 경로 해석 · 요약 · 종료 코드 (cli.ts 는 경로를 정해 이 함수를 부른다)
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { reportFileName, runCommand, verifyVault, writeBacklog, type BatchResult } from './run'
import { Topics } from './topics'

export interface CommandEnv {
  // 상대 경로를 푸는 기준 : pnpm 은 apps/site 로 옮겨 실행하므로 INIT_CWD (처음 부른 위치) 를 넘긴다
  cwd: string
  contentDir: string
  reportsDir: string
  backlogPath: string
  log: (msg: string) => void
  err: (msg: string) => void
}

export const Usage = `사용법 :
  pnpm migrate:obsidian backlog <vaultDir>
  pnpm migrate:obsidian run <vaultDir> <Main 최상위 폴더 | .> [--dry-run]
  pnpm migrate:obsidian verify <vaultDir>`

export const summary = (R: BatchResult, dryRun: boolean): string =>
  [
    `${dryRun ? '[dry-run] ' : ''}${R.folder} (${R.topic}) : 대상 ${R.total}편`,
    `  옮김 ${R.written.length} · 건너뜀 ${R.skipped.length} (같음 ${R.skipped.filter((s) => s.reason === 'same').length} · 충돌 ${R.skipped.filter((s) => s.reason === 'conflict').length}) · 제외 ${R.excluded.length}`,
    `  이름 바꿈 ${R.renamed.length} · 작성일 못 찾음 ${R.noDate.length} · 작성일 출처 frontmatter ${R.dateSource.frontmatter} / git ${R.dateSource.git}`,
    `  그림 : 복사 ${R.images.Copied.length} · 같음 ${R.images.Same.length} · 충돌 ${R.images.Clash.length} · 없음 ${R.images.Missing.length}`,
    `  링크 : 깨짐 ${R.links.broken} · backlog ${R.links.backlog} · 아직 안 옮김 ${R.links.notYetMigrated} · 모호 ${R.ambiguous.length}`,
    `  의심 ${R.suspects.length}편 · 무시된 파일 ${R.ignored.length}개 · frontmatter 읽기 실패 ${R.badFront.length}편`,
    ...R.skipped.filter((s) => s.reason === 'conflict').map((s) => `  충돌 : ${s.path}`),
    ...R.brokenList.map((b) => `  깨진 링크 : ${b.target} (${b.files.join(', ')})`),
    ...R.badFront.map((b) => `  frontmatter 읽기 실패 : ${b.relPath}`),
  ].join('\n')

// 볼트 폴더인지 : 폴더가 있고 Main 최상위 (Topics) 폴더가 하나라도 있다
const checkVault = (dir: string): string | undefined => {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return `볼트 폴더를 찾을 수 없습니다 : ${dir}`
  const Names = readdirSync(dir)
  if (!Names.some((n) => Object.hasOwn(Topics, n))) return `Main 볼트가 아닌 것 같습니다 (${Object.keys(Topics).slice(0, 3).join(' · ')} 같은 폴더가 없음) : ${dir}`
  return undefined
}

// 종료 코드 : 0 정상 · 1 사용법 / 오류 · 2 실행은 했지만 확인할 것이 있음 (충돌 · 깨진 링크 · frontmatter 읽기 실패)
export const main = (Argv: string[], Env: CommandEnv): number => {
  const Flags = Argv.filter((a) => a.startsWith('--'))
  const Bad = Flags.find((f) => f !== '--dry-run')
  if (Bad) {
    Env.err(`알 수 없는 옵션입니다 : ${Bad}\n${Usage}`)
    return 1
  }
  const DryRun = Flags.includes('--dry-run')
  const [Cmd, Vault, RawFolder] = Argv.filter((a) => !a.startsWith('--'))
  if (!Cmd || !Vault) {
    Env.err(Usage)
    return 1
  }
  try {
    const VaultDir = resolve(Env.cwd, Vault)
    const Problem = checkVault(VaultDir)
    if (Problem) {
      Env.err(Problem)
      return 1
    }

    if (Cmd === 'backlog') {
      Env.log(`backlog ${writeBacklog(VaultDir, Env.backlogPath)}개를 ${Env.backlogPath} 에 썼습니다`)
      return 0
    }
    if (Cmd === 'run') {
      if (!RawFolder) {
        Env.err(Usage)
        return 1
      }
      // Python/ 처럼 끝에 / 가 붙어도 받는다
      const Folder = RawFolder === '.' || RawFolder === './' ? '.' : RawFolder.replace(/\/+$/, '')
      const R = runCommand(VaultDir, Folder, { contentDir: Env.contentDir, reportsDir: Env.reportsDir, backlogPath: Env.backlogPath, dryRun: DryRun })
      Env.log(summary(R, DryRun))
      Env.log(`리포트 : ${resolve(Env.reportsDir, reportFileName(R.topic, DryRun))}`)
      const Conflicts = R.skipped.filter((s) => s.reason === 'conflict').length
      if (Conflicts + R.links.broken + R.badFront.length > 0) {
        Env.log(`확인 필요 : 충돌 ${Conflicts} · 깨진 링크 ${R.links.broken} · frontmatter 읽기 실패 ${R.badFront.length} (리포트를 보세요)`)
        return 2
      }
      return 0
    }
    if (Cmd === 'verify') {
      const V = verifyVault(VaultDir, Env.contentDir)
      Env.log(`같음 ${V.ok} · 없음 ${V.missing.length} · 본문 다름 ${V.changed.length}`)
      for (const P of V.missing) Env.log(`  없음 : ${P}`)
      for (const P of V.changed) Env.log(`  본문 다름 : ${P}`)
      return V.missing.length + V.changed.length > 0 ? 1 : 0
    }
    Env.err(Usage)
    return 1
  } catch (e) {
    Env.err(e instanceof Error ? e.message : String(e))
    return 1
  }
}
