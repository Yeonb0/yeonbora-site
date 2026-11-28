// CLI 본체 : 인자 검사 · 경로 해석 · 요약 · 종료 코드 (cli.ts 는 경로를 정해 이 함수를 부른다)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Categories } from './categories'
import { needsCheck, renderReport, reportFileName, runBatch, verifyBlog } from './run'

export interface CommandEnv {
  cwd: string
  contentDir: string
  reportsDir: string
  backlogPath: string
  log: (msg: string) => void
  err: (msg: string) => void
}

export const Usage = `사용법 :
  pnpm migrate:jekyll run <블로그 클론> <_posts 폴더> [--dry-run]
  pnpm migrate:jekyll externals <블로그 클론> <_posts 폴더>   (아직 받지 않은 외부 그림 : URL \\t 저장 경로)
  pnpm migrate:jekyll verify <블로그 클론>`

// 종료 코드 : 0 정상 · 1 사용법 / 오류 · 2 실행은 했지만 확인할 것이 있음
export const main = (Argv: string[], Env: CommandEnv): number => {
  const Flags = Argv.filter((a) => a.startsWith('--'))
  const Bad = Flags.find((f) => f !== '--dry-run')
  if (Bad) {
    Env.err(`알 수 없는 옵션입니다 : ${Bad}\n${Usage}`)
    return 1
  }
  const DryRun = Flags.includes('--dry-run')
  const [Cmd, Blog, RawCat] = Argv.filter((a) => !a.startsWith('--'))
  if (!Cmd || !Blog) {
    Env.err(Usage)
    return 1
  }
  try {
    const BlogDir = resolve(Env.cwd, Blog)
    if (!existsSync(join(BlogDir, '_posts'))) {
      Env.err(`깃블로그 클론이 아닌 것 같습니다 (_posts 없음) : ${BlogDir}`)
      return 1
    }
    if (Cmd === 'verify') {
      const V = verifyBlog(BlogDir, Env.contentDir)
      Env.log(`같음 ${V.ok} · 없음 ${V.missing.length} · 본문 다름 ${V.changed.length}`)
      for (const P of V.missing) Env.log(`  없음 : ${P}`)
      for (const P of V.changed) Env.log(`  본문 다름 : ${P}`)
      return V.changed.length > 0 ? 1 : 0
    }
    const Cat = RawCat?.replace(/\/+$/, '')
    if ((Cmd !== 'run' && Cmd !== 'externals') || !Cat) {
      Env.err(Usage)
      return 1
    }
    if (!Object.hasOwn(Categories, Cat)) {
      Env.err(`categories.ts 에 없는 폴더입니다 : ${Cat}`)
      return 1
    }
    const R = runBatch(BlogDir, Cat, Env.contentDir, { dryRun: Cmd === 'externals' || DryRun, backlogPath: Env.backlogPath })
    if (Cmd === 'externals') {
      for (const E of R.external.filter((e) => !e.fetched)) Env.log(`${E.url}\t${E.dest}`)
      return 0
    }
    mkdirSync(Env.reportsDir, { recursive: true })
    const Report = join(Env.reportsDir, reportFileName(Cat, DryRun))
    writeFileSync(Report, renderReport(R, DryRun))
    Env.log(renderReport(R, DryRun).split('\n').slice(0, 5).join('\n'))
    Env.log(`리포트 : ${Report}`)
    const N = needsCheck(R)
    if (N > 0) {
      Env.log(`확인 필요 ${N}건 (리포트를 보세요)`)
      return 2
    }
    return 0
  } catch (e) {
    Env.err(e instanceof Error ? e.message : String(e))
    return 1
  }
}
