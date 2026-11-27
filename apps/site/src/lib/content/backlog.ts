// Main 에서도 대상 노트가 없던 링크 목록 : docs/migration/wiki-backlog.json (소문자 문자열 배열)
import { readFileSync } from 'node:fs'
import { linkKey } from './wikilink'

// backlog 비교 키 : 그래프의 링크 키와 같다 (소문자 · 앞뒤 공백 제거 · 곡선 따옴표 → ')
export const backlogKey = linkKey

export const loadBacklog = (path: string): Set<string> => {
  try {
    const Data: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return new Set(Array.isArray(Data) ? Data.map((t) => backlogKey(String(t))) : [])
  } catch {
    return new Set()
  }
}
