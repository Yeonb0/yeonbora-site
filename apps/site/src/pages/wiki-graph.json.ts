// 위키 그래프 데이터 : 모든 위키 페이지가 같은 값을 쓰므로 페이지마다 넣지 않고 한 번만 받아 간다
import { getWikiGraph } from '@/lib/content/site-graph'
import { layoutWikiGraph } from '@/lib/content/wiki-layout'

export async function GET() {
  const { data } = await getWikiGraph()
  return new Response(JSON.stringify(layoutWikiGraph(data)), { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
