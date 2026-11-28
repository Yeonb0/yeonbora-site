// CLI 본체 : 인자 검사 · 경로 해석 · 요약 · 종료 코드 (cli.ts 는 경로를 정해 이 함수를 부른다)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { BatchNames } from './pages'
import { loadRaw, needsCheck, renderReport, reportFileName, runBatch, verifyAll } from './run'

export interface CommandEnv {
  cwd: string
  contentDir: string
  reportsDir: string
  backlogPath: string
  log: (msg: string) => void
  err: (msg: string) => void
}

export const Usage = `사용법 :
  pnpm migrate:notion run <raw 폴더> <묶음> [--dry-run]   (묶음 : ${BatchNames.join(' · ')})
  pnpm migrate:notion verify <raw 폴더>
raw 폴더 : Notion 마크다운 내보내기 (zip) 를 푼 폴더`

// 종료 코드 : 0 정상 · 1 사용법 / 오류 · 2 실행은 했지만 확인할 것이 있음
export const main = (Argv: string[], Env: CommandEnv): number => {
  const Flags = Argv.filter((a) => a.startsWith('--'))
  const Bad = Flags.find((f) => f !== '--dry-run')
  if (Bad) {
    Env.err(`알 수 없는 옵션입니다 : ${Bad}\n${Usage}`)
    return 1
  }
  const DryRun = Flags.includes('--dry-run')
  const [Cmd, RawArg, Batch] = Argv.filter((a) => !a.startsWith('--'))
  if (!Cmd || !RawArg) {
    Env.err(Usage)
    return 1
  }
  try {
    const RawDir = resolve(Env.cwd, RawArg)
    if (!existsSync(RawDir)) {
      Env.err(`raw 폴더가 없습니다 : ${RawDir}`)
      return 1
    }
    const Raw = loadRaw(RawDir)
    if (Cmd === 'verify') {
      const V = verifyAll(Raw, Env.contentDir)
      Env.log(`같음 ${V.ok} · 없음 ${V.missing.length} · 본문 다름 ${V.changed.length}`)
      for (const P of V.missing) Env.log(`  없음 : ${P}`)
      for (const P of V.changed) Env.log(`  본문 다름 : ${P}`)
      return V.changed.length > 0 ? 1 : 0
    }
    if (Cmd !== 'run' || !Batch || !BatchNames.includes(Batch)) {
      Env.err(Usage)
      return 1
    }
    const R = runBatch(Raw, Batch, Env.contentDir, { dryRun: DryRun, backlogPath: Env.backlogPath })
    mkdirSync(Env.reportsDir, { recursive: true })
    const Report = join(Env.reportsDir, reportFileName(Batch, DryRun))
    const Text = renderReport(R, DryRun)
    writeFileSync(Report, Text)
    Env.log(Text.split('\n').slice(0, 6).join('\n'))
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
