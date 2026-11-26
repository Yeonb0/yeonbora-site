// 게임 페이지 ↔ 주소 (?game=<id>). 방과 TV 확대 화면은 주소가 같다 (/games/)
import { GameIds } from './data'
import type { GameId } from './types'

export const gameSearch = (id: GameId): string => `?game=${id}`

// 잘못된 값은 방 화면으로 고친다
export const parseGame = (search: string): { id: GameId | null; canonical: string } => {
  const Raw = new URLSearchParams(search).get('game')
  const id = Raw && (GameIds as string[]).includes(Raw) ? (Raw as GameId) : null
  return { id, canonical: id ? gameSearch(id) : '' }
}
