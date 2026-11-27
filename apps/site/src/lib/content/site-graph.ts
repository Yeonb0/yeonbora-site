// 사이트 페이지용 그래프 : 빌드 한 번에 한 번만 만든다
import { getCollection } from 'astro:content'
import { buildGraph, type Graph } from './graph'
import { toNodes } from './graph-from-collections'
import { buildWikiGraphData, type WikiGraphData } from './wiki-graph'

let Cached: Promise<Graph> | undefined

export const getSiteGraph = (): Promise<Graph> =>
  (Cached ??= Promise.all([getCollection('wiki'), getCollection('posts')]).then(([W, P]) => {
    const G = buildGraph(toNodes(W, P))
    if (G.duplicates.length > 0) throw new Error(`제목 · 파일명 중복 : ${G.duplicates.join(', ')}`)
    return G
  }))

// 원래 작성일 : 한국 시간 기준 YYYY-MM-DD
export const formatDate = (d: Date): string => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d)

// 위키 그래프 화면 데이터 + 왼쪽 트리 : 두 위키 페이지가 같은 값을 쓴다
let WikiCached: Promise<{ data: WikiGraphData; tree: { id: string; name: string; notes: { href: string; title: string }[] }[] }> | undefined

export const getWikiGraph = () =>
  (WikiCached ??= Promise.all([getCollection('wiki'), getCollection('posts'), getSiteGraph()]).then(([W, P, G]) => {
    const Nodes = toNodes(W, P).map((n) => (n.collection === 'wiki' ? { ...n, topic: W.find((w) => w.id === n.slug)?.data.topic } : n))
    const data = buildWikiGraphData(Nodes, G)
    const tree = data.topics.map((t) => ({
      ...t,
      notes: data.nodes
        .filter((n) => n.kind === 'wiki' && n.topic === t.id)
        .map((n) => ({ href: n.id, title: n.title }))
        .sort((a, b) => a.title.localeCompare(b.title, 'ko')),
    }))
    return { data, tree }
  }))
