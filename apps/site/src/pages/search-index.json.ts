// 허브 검색 색인 : 블로그 글 (인문 · 기술) + 위키 노트. 허브에서 검색창을 처음 열 때 받아 간다
import { getCollection } from 'astro:content'
import { plainText, type SearchItem } from '@/lib/search/search'
import { normalizeTopic, topicName } from '@/lib/content/wiki-topics'
import { formatDate } from '@/lib/content/site-graph'
import { getPosts } from '@/lib/content/posts'

const TextMax = 400

export async function GET() {
  const [Posts, Wiki] = await Promise.all([getPosts(), getCollection('wiki')])
  const Blog: SearchItem[] = Posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()).map((p) => {
    const Tech = p.data.field === 'computer'
    return {
      kind: 'blog',
      title: p.data.title,
      href: `/posts/${p.id}`,
      text: p.data.description ?? plainText(p.body ?? '', TextMax),
      aliases: [],
      tags: p.data.tags,
      label: Tech ? '기술' : '인문',
      section: Tech ? 'tech' : 'hum',
      date: formatDate(p.data.date),
    }
  })
  const Notes: SearchItem[] = Wiki.sort((a, b) => a.data.title.localeCompare(b.data.title, 'ko')).map((w) => ({
    kind: 'wiki',
    title: w.data.title,
    href: `/wiki/${w.id}`,
    text: plainText(w.body ?? '', TextMax),
    aliases: w.data.aliases,
    tags: w.data.tags,
    label: topicName(normalizeTopic(w.data.topic)),
  }))
  return new Response(JSON.stringify([...Blog, ...Notes]), { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
