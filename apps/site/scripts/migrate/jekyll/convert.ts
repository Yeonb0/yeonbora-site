// 깃블로그 글 한 편을 posts 글로 바꾼다 : frontmatter 를 새로 쓰고, 본문은 raw 태그 · 그림 경로만 바꾼다
import { createHash } from 'node:crypto'
import { parse, stringify } from 'yaml'
import { maskCode } from '../../../src/lib/content/wikilink'
import { Categories, Tiers } from './categories'

export const BlogUrl = 'https://yeonb0.github.io'

const FrontRe = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/
const DateRe = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/

export const splitPost = (text: string): { data: Record<string, unknown>; body: string } => {
  const M = text.match(FrontRe)
  if (!M) return { data: {}, body: text }
  const Data = (M[1] ? parse(M[1]) : {}) as Record<string, unknown> | null
  return { data: Data ?? {}, body: text.slice(M[0].length) }
}

const stemParts = (fileName: string): { day: string; stem: string } => {
  const M = fileName.match(DateRe)
  if (!M) throw new Error(`파일명에 날짜가 없습니다 : ${fileName}`)
  return { day: M[1], stem: M[2] }
}

// Jekyll Utils.slugify (mode pretty, cased) : 허용 문자 밖의 연속은 하이픈 하나로, 앞뒤 하이픈 제거
export const jekyllTitleSlug = (stem: string): string => stem.replace(/[^\p{L}\p{N}._~!$&'()+,;=@]+/gu, '-').replace(/^-|-$/g, '')

// permalink : /:categories/:title/ (카테고리는 소문자)
export const originalUrlOf = (categories: string[], fileName: string): string => {
  const Segs = [...new Set(categories.map((c) => String(c).toLowerCase()))]
  const Title = jekyllTitleSlug(stemParts(fileName).stem)
  return `${BlogUrl}/${[...Segs, Title].map((s) => encodeURI(s)).join('/')}/`
}

// 사이트 slug : 날짜 + [분류] 접두어를 뺀 제목, 소문자, 글자 · 숫자 밖의 연속은 하이픈 하나
export const siteSlugOf = (fileName: string): string => {
  const { day, stem } = stemParts(fileName)
  const Rest = stem
    .replace(/^\[[^\]]*\]-?/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return `${day}-${Rest}`
}

// {% raw %} · {% endraw %} : 그 태그만 있는 줄은 줄째로, 줄 안에 있으면 태그만 지운다
const RawTag = /\{%-?\s*(?:end)?raw\s*-?%\}/g
export const removeRaw = (body: string): string =>
  body
    .replace(/^[ \t]*\{%-?\s*(?:end)?raw\s*-?%\}[ \t]*(?:\r?\n|$)/gm, '')
    .replace(RawTag, '')

export interface LocalImage {
  src: string
  name: string
}
export interface ExternalImage {
  url: string
  name: string
  fetched: boolean
}

// 경로 안의 괄호 한 겹까지 받는다 : notion/[network]-internet-protocol-(ip)/img_1.png
const MdImage = /!\[[^\]\n]*\]\(\s*(<[^>\n]+>|(?:[^()\s]|\([^()\s]*\))+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)/g
const HtmlImage = /<img\b[^>]*?\ssrc\s*=\s*(["'])([^"'\n]+)\1/gi

const decode = (s: string): string => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const cleanName = (name: string): string => {
  const Dot = name.lastIndexOf('.')
  const Base = Dot > 0 ? name.slice(0, Dot) : name
  const Ext = Dot > 0 ? name.slice(Dot).toLowerCase() : ''
  const Clean = Base.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'image'
  return Clean + Ext
}

const withHash = (name: string, key: string): string => {
  const H = createHash('sha1').update(key).digest('hex').slice(0, 8)
  const Dot = name.lastIndexOf('.')
  return Dot > 0 ? `${name.slice(0, Dot)}-${H}${name.slice(Dot)}` : `${name}-${H}`
}

interface Ref {
  start: number
  end: number
  raw: string
  external: boolean
  key: string
  name: string
}

// 그림 경로를 _assets/jekyll/<slug>/ 로 바꾼다. 외부 그림은 이미 내려받은 것 (hasFile) 만 바꾼다
export const rewriteImages = (
  body: string,
  slug: string,
  hasFile: (name: string) => boolean,
  // 사이트 루트 기준 경로 (/upload/...) 를 원래 사이트 주소로 : BOJ 문제 본문에서 복사한 그림
  rootUrl?: (path: string) => string | undefined,
): { body: string; local: LocalImage[]; external: ExternalImage[] } => {
  const Masked = maskCode(body)
  const Refs: Ref[] = []
  const add = (start: number, raw: string) => {
    const Path = raw.startsWith('<') ? raw.slice(1, -1) : raw
    if (/^data:/i.test(Path)) return
    const Url = (Path.startsWith('/') && rootUrl?.(Path)) || Path
    const External = /^https?:\/\//i.test(Url)
    const Key = External ? Url : decode(Path.replace(/^\/+/, '').replace(/^(?:\.\.?\/)+/, '').split(/[?#]/)[0])
    const Last = (External ? Url.split(/[?#]/)[0] : Key).split('/').pop() ?? 'image'
    Refs.push({ start, end: start + raw.length, raw, external: External, key: Key, name: cleanName(External ? decode(Last) : Last) })
  }
  for (const M of Masked.matchAll(MdImage)) {
    const Off = M[0].indexOf(M[1], M[0].indexOf(']('))
    add(M.index + Off, body.slice(M.index + Off, M.index + Off + M[1].length))
  }
  for (const M of Masked.matchAll(HtmlImage)) {
    const Off = M[0].lastIndexOf(M[2])
    add(M.index + Off, body.slice(M.index + Off, M.index + Off + M[2].length))
  }
  // 같은 이름을 다른 그림이 쓰면 그 이름을 쓰는 그림 모두 URL · 경로 해시를 붙인다
  const Keys = new Map<string, Set<string>>()
  for (const R of Refs) Keys.set(R.name, (Keys.get(R.name) ?? new Set()).add(R.key))
  for (const R of Refs) if ((Keys.get(R.name)?.size ?? 0) > 1) R.name = withHash(R.name, R.key)

  const Local: LocalImage[] = []
  const External: ExternalImage[] = []
  const Seen = new Set<string>()
  let Out = ''
  let At = 0
  for (const R of [...Refs].sort((a, b) => a.start - b.start)) {
    const Fetched = R.external ? hasFile(R.name) : true
    if (!Seen.has(R.key)) {
      Seen.add(R.key)
      if (R.external) External.push({ url: R.key, name: R.name, fetched: Fetched })
      else Local.push({ src: R.key, name: R.name })
    }
    Out += body.slice(At, R.start) + (Fetched ? `../../_assets/jekyll/${slug}/${R.name}` : R.raw)
    At = R.end
  }
  return { body: Out + body.slice(At), local: Local, external: External }
}

const toList = (v: unknown): string[] => {
  if (v === null || v === undefined || v === '') return []
  return (Array.isArray(v) ? v : [v]).map((x) => String(x).trim()).filter(Boolean)
}

// 새 frontmatter 가 직접 다루는 키 : 나머지는 원래 순서대로 뒤에 붙는다
const Handled = new Set(['title', 'categories', 'date', 'tags', 'tag', 'series', 'step', 'layout', 'toc_sticky'])

export interface JekyllPost {
  // _posts 아래 폴더 이름
  category: string
  fileName: string
  text: string
}

export interface Converted {
  slug: string
  path: string
  text: string
  title: string
  local: LocalImage[]
  external: ExternalImage[]
}

export const convertPost = (Post: JekyllPost, Opts: { hasFile: (slug: string, name: string) => boolean }): Converted => {
  const Rule = Categories[Post.category]
  if (!Rule) throw new Error(`categories.ts 에 없는 폴더입니다 : ${Post.category}`)
  const { data, body } = splitPost(Post.text)
  const Slug = siteSlugOf(Post.fileName)
  const Cats = toList(data.categories)
  const Series = data.series === undefined || data.series === null ? undefined : String(data.series).trim()
  const Ctx = (Series && Rule.seriesContext?.[Series]) || { context: Rule.context, course: Rule.course }

  const Tags: string[] = []
  const pushTag = (t: string) => {
    if (!Tags.some((x) => x.toLowerCase() === t.toLowerCase())) Tags.push(t)
  }
  for (const T of [...toList(data.tags), ...toList(data.tag)]) pushTag(T)
  const Tier = Cats.find((c): c is (typeof Tiers)[number] => (Tiers as readonly string[]).includes(c))
  for (const C of Cats) if (C !== Tier) pushTag(C)

  const DateVal = data.date instanceof Date ? data.date.toISOString() : data.date ? String(data.date) : stemParts(Post.fileName).day
  const Title = String(data.title ?? '').trim()
  const Front: Record<string, unknown> = {
    title: Title,
    field: 'computer',
    context: Ctx.context,
    ...(Ctx.course ? { course: Ctx.course } : {}),
    topic: Rule.topic,
    source: 'jekyll',
    originalUrl: originalUrlOf(Cats.length ? Cats : [Post.category], Post.fileName),
    date: DateVal,
    tags: Tags,
    ...(Series ? { series: Series } : {}),
    ...(typeof data.step === 'number' ? { step: data.step } : {}),
    ...(Tier ? { tier: Tier } : {}),
  }
  for (const [K, V] of Object.entries(data)) if (!Handled.has(K)) Front[K] = V

  const Root = Post.category === 'BOJ' ? (p: string) => (p.startsWith('/upload/') ? `https://www.acmicpc.net${p}` : undefined) : undefined
  const Img = rewriteImages(removeRaw(body), Slug, (name) => Opts.hasFile(Slug, name), Root)
  const Yaml = stringify(Front, { lineWidth: 0, indentSeq: true }).replace(/\r\n/g, '\n')
  return { slug: Slug, path: `posts/jekyll/${Slug}.md`, text: `---\n${Yaml}---\n${Img.body}`, title: Title, local: Img.local, external: Img.external }
}
