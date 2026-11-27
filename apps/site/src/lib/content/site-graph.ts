// 사이트 페이지용 그래프 : 빌드 한 번에 한 번만 만든다
import { getCollection } from 'astro:content'
import { buildGraph, type Graph } from './graph'
import { toNodes } from './graph-from-collections'

let Cached: Promise<Graph> | undefined

export const getSiteGraph = (): Promise<Graph> =>
  (Cached ??= Promise.all([getCollection('wiki'), getCollection('posts')]).then(([W, P]) => {
    const G = buildGraph(toNodes(W, P))
    if (G.duplicates.length > 0) throw new Error(`제목 · 파일명 중복 : ${G.duplicates.join(', ')}`)
    return G
  }))

// 원래 작성일 : 한국 시간 기준 YYYY-MM-DD
export const formatDate = (d: Date): string => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d)
