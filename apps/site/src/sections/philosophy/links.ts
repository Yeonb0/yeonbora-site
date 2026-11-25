// 초상화를 눌렀을 때 갈 곳 : 0편 없음, 1편 그 글, 여러 편 그 철학자로 걸러 둔 서재 목록
import type { Philosopher } from './types'

export const postTarget = (p: Philosopher): string | null => {
  if (p.posts.length === 0) return null
  if (p.posts.length === 1) return `/posts/${p.posts[0]}`
  return `/posts?topic=${encodeURIComponent(p.id)}`
}
