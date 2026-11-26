// 게임 방 임시 데이터 : 게임 본편 소개 · 웹 빌드가 생기면 여기에 붙인다
// 순서 = TV 화면 속 CD 순서
import type { Game, GameId } from './types'

export const Games: Game[] = [
  { id: 'exorcism-school', en: 'Exorcism School', color: '#c8283a' },
  { id: 'factory', en: 'Factory', color: '#f39a33' },
  { id: 'fake-mmo', en: 'Fake MMO', color: '#4361ee' },
  { id: 'cheer-typing', en: 'Cheer Typing', color: '#ec4899' },
]

export const GameIds = Games.map((g) => g.id) as GameId[]
