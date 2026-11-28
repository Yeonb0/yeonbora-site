// 사이트 페이지용 그래프 : 빌드 한 번에 한 번만 만든다
import { getCollection } from 'astro:content'
import { buildGraph, type Graph } from './graph'
import { toNodes } from './graph-from-collections'
import { buildWikiGraphData, type WikiGraphData } from './wiki-graph'
import { buildCourseOutlines, type CourseOutline } from './wiki-courses'
import { normalizeTopic } from './wiki-topics'

let Cached: Promise<Graph> | undefined

export const getSiteGraph = (): Promise<Graph> =>
  (Cached ??= Promise.all([getCollection('wiki'), getCollection('posts')]).then(([W, P]) => {
    const G = buildGraph(toNodes(W, P))
    if (G.duplicates.length > 0) throw new Error(`제목 · 파일명 중복 : ${G.duplicates.join(', ')}`)
    return G
  }))

export { formatDate } from './format-date'

// 위키 그래프 화면 데이터 + 왼쪽 트리 : 두 위키 페이지가 같은 값을 쓴다
export interface WikiTreeData {
  data: WikiGraphData
  tree: { id: string; name: string; color: string; notes: { href: string; title: string }[] }[]
  courses: CourseOutline[]
}
let WikiCached: Promise<WikiTreeData> | undefined

export const getWikiGraph = () =>
  (WikiCached ??= Promise.all([getCollection('wiki'), getCollection('posts'), getSiteGraph()]).then(([W, P, G]) => {
    const WikiBy = new Map(W.map((w) => [w.id, w]))
    const PostBy = new Map(P.map((p) => [p.id, p]))
    const Nodes = toNodes(W, P).map((n) =>
      n.collection === 'wiki'
        ? { ...n, topic: WikiBy.get(n.slug)?.data.topic, created: WikiBy.get(n.slug)?.data.created, course: WikiBy.get(n.slug)?.data.course }
        : { ...n, created: PostBy.get(n.slug)?.data.date },
    )
    const courses = buildCourseOutlines(W.map((w) => ({ id: `/wiki/${w.id}`, sourcePath: w.data.sourcePath, topic: normalizeTopic(w.data.topic), courses: w.data.course })))
    const data = buildWikiGraphData(Nodes, G, courses)
    const tree = data.topics.map((t) => ({
      ...t,
      notes: data.nodes
        .filter((n) => n.kind === 'wiki' && n.topic === t.id)
        .map((n) => ({ href: n.id, title: n.title }))
        .sort((a, b) => a.title.localeCompare(b.title, 'ko')),
    }))
    return { data, tree, courses }
  }))
