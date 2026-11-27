// 찾지 못한 링크 리포트 : reports/broken-links.md (0개면 파일을 지운다)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export interface BrokenLink {
  file: string
  target: string
}

export const writeBrokenReport = (reportPath: string, Links: BrokenLink[]) => {
  if (Links.length === 0) {
    rmSync(reportPath, { force: true })
    return
  }
  const Rows = Links.map((r) => `| ${r.file} | ${r.target.replace(/\|/g, '\\|')} |`)
  mkdirSync(dirname(reportPath), { recursive: true })
  writeFileSync(reportPath, ['# 깨진 링크', '', `${Links.length}개`, '', '| 파일 | 대상 |', '|---|---|', ...Rows, ''].join('\n'))
}
