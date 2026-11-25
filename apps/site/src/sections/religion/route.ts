// 문서 화면 ↔ 주소 (?religion=<id>). 상자와 뱃지를 든 화면은 주소가 같다 (/religion/)
import { ReligionIds } from './data'
import type { ReligionId } from './types'

export const docsSearch = (id: ReligionId): string => `?religion=${id}`

// 잘못된 값은 상자 화면으로 고친다
export const parseDocs = (search: string): { id: ReligionId | null; canonical: string } => {
  const Raw = new URLSearchParams(search).get('religion')
  const id = Raw && (ReligionIds as string[]).includes(Raw) ? (Raw as ReligionId) : null
  return { id, canonical: id ? docsSearch(id) : '' }
}
