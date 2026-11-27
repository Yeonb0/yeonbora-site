// 찾지 못한 링크 리포트 : reports/broken-links.md (깨진 링크) 와 reports/wiki-backlog.md (아직 쓰지 않은 노트, 0개면 파일을 지운다)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface BrokenLink {
  file: string
  target: string
  // 생략하면 broken : backlog 는 Main 에서도 대상 노트가 없던 링크
  kind?: 'broken' | 'backlog'
}

const writeTable = (path: string, title: string, Links: BrokenLink[]) => {
  if (Links.length === 0) {
    rmSync(path, { force: true })
    return
  }
  const Rows = Links.map((r) => `| ${r.file} | ${r.target.replace(/\|/g, '\\|')} |`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, [`# ${title}`, '', `${Links.length}개`, '', '| 파일 | 대상 |', '|---|---|', ...Rows, ''].join('\n'))
}

export const writeBrokenReport = (reportPath: string, Links: BrokenLink[]) => {
  writeTable(reportPath, '깨진 링크', Links.filter((l) => l.kind !== 'backlog'))
  writeTable(join(dirname(reportPath), 'wiki-backlog.md'), '미작성 노트 (backlog)', Links.filter((l) => l.kind === 'backlog'))
}
