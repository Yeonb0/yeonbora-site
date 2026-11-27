// 찾지 못한 링크 : 빌드는 멈추지 않고 경고 + reports/broken-links.md
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export interface BrokenLink {
  file: string
  target: string
}

export const createBrokenReporter = (reportPath: string) => {
  const Seen = new Map<string, BrokenLink>()
  return (b: BrokenLink) => {
    const Key = `${b.file}\u0000${b.target}`
    if (Seen.has(Key)) return
    Seen.set(Key, b)
    console.warn(`[wikilink] 찾지 못한 링크 : ${b.file} → ${b.target}`)
    const Rows = [...Seen.values()]
      .sort((x, y) => x.file.localeCompare(y.file) || x.target.localeCompare(y.target))
      .map((r) => `| ${r.file} | ${r.target.replace(/\|/g, '\\|')} |`)
    mkdirSync(dirname(reportPath), { recursive: true })
    writeFileSync(reportPath, ['# 깨진 링크', '', `${Rows.length}개`, '', '| 파일 | 대상 |', '|---|---|', ...Rows, ''].join('\n'))
  }
}
