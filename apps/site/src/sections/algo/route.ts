// 목록 화면 ↔ 주소 (#cat=<카테고리 코드>, 전체는 #cat=all). 꽃밭은 /algo/ 그대로
// 검색어 (?cat=) 가 아니라 해시를 쓴다 : Astro 화면 전환 라우터는 해시만 바뀐 앞 · 뒤로 가기를 같은 페이지 안의 이동으로 처리해
// 페이지를 다시 불러오지 않는다 (검색어가 바뀌면 페이지 전체를 새로 받아 꽃밭이 다시 심어진다)
import { Categories } from './data'

// null : 꽃밭, 'all' : 전체 목록, 'A' ~ 'L' : 그 카테고리 목록
export type CatView = string | null

export const catHash = (cat: string): string => `#cat=${cat}`

// 잘못된 값은 꽃밭으로 고친다
export const parseCat = (hash: string): { cat: CatView; canonical: string } => {
  const Raw = new URLSearchParams(hash.replace(/^#/, '')).get('cat')
  const ok = Raw === 'all' || Categories.some((c) => c.letter === Raw)
  return { cat: ok ? Raw : null, canonical: ok ? catHash(Raw!) : '' }
}
