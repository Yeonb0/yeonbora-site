// Main 에서도 대상 노트가 없던 링크 목록 : docs/migration/wiki-backlog.json (소문자 문자열 배열)
import { readFileSync } from 'node:fs'

export const loadBacklog = (path: string): Set<string> => {
  try {
    const Data: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return new Set(Array.isArray(Data) ? Data.map((t) => String(t).trim().toLowerCase()) : [])
  } catch {
    return new Set()
  }
}
