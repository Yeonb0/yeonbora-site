// 티스토리 글 한 편 (편집기 원본 HTML) 을 posts 글로 바꾼다
// 원문 HTML → hast → mdast → 마크다운. 티스토리 전용 블록 (그림 표시 · HTML 삽입 · 더보기 · 링크 카드 · 글자 색) 은 아래 처리기가 맡는다
import type { Element, ElementContent, Root as HastRoot } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { toText } from 'hast-util-to-text'
import type { Nodes as MdastNodes, PhrasingContent, Root as MdastRoot, RootContent } from 'mdast'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { stringify } from 'yaml'
import { Categories } from './categories'

export const BlogUrl = 'https://yeonbo-ra.tistory.com'

// 관리 페이지 글 목록 (manage/posts.json) 에서 받은 정보
export interface TistoryMeta {
  id: string
  title: string
  category: string
  visibility: string
  published: string
  created: string
  modified: string
  permalink: string
}

// 받은 그림 : 티스토리 그림 id (kage@<a>/<id>/...) → 파일 내용
export interface ImageFile {
  type: string
  data: Buffer
}

export interface PostImage {
  id: string
  name: string
  found: boolean
}

export type NoteKind = 'html-demo' | 'link-card' | 'more-less' | 'color' | 'mark' | 'table' | 'caption' | 'dropped-color'

export interface Converted {
  slug: string
  path: string
  text: string
  body: string
  images: PostImage[]
  notes: { kind: NoteKind; detail: string }[]
}

const Ext: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' }
export const extOf = (type: string): string => Ext[type] ?? '.png'

// 사이트 slug : 날짜 + [분류] 접두어를 뺀 제목 (jekyll 도구와 같은 규칙)
export const siteSlugOf = (Meta: Pick<TistoryMeta, 'published' | 'title'>): string => {
  const Day = Meta.published.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(Day)) throw new Error(`작성일이 없습니다 : ${Meta.title}`)
  const Rest = Meta.title
    .replace(/^\[[^\]]*\]\s*/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  if (!Rest) throw new Error(`slug 를 만들 수 없습니다 : ${Meta.title}`)
  return `${Day}-${Rest}`
}

// 제목의 번호 : "[DS] 07_트리" → 7
export const stepOf = (title: string): number | undefined => {
  const M = title.match(/^\[[^\]]*\]\s*(\d+)_/)
  return M ? Number(M[1]) : undefined
}

// 그림 표시 [##_Image|kage@<a>/<id>/...|CDM|1.3|{json}_##] → <img data-tistory-image>
const ImageMark = /\[##_Image\|kage@([^|]+)\|[^|]*\|[^|]*\|(\{[^]*?\})_##\]/g
export const imageIdOf = (kage: string): string => kage.split('/')[1] ?? kage

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export const replaceImageMarks = (html: string): string =>
  html.replace(ImageMark, (_all, kage: string, json: string) => {
    let Info: Record<string, string> = {}
    try {
      Info = JSON.parse(json)
    } catch {
      Info = {}
    }
    const Alt = Info.caption ?? Info.alt ?? ''
    return `<img data-tistory-image="${escapeAttr(imageIdOf(kage))}" alt="${escapeAttr(Alt)}"${Info.caption ? ` data-caption="${escapeAttr(Info.caption)}"` : ''}>`
  })

// 다크 모드 사이트에서 의미가 없거나 글자가 안 보이는 색 : 기본 글자색 · 흰 바탕 + 검은 글자 (붙여넣기 흔적)
const Neutral = new Set(['#000000', '#222222', '#333333', '#ffffff'])
const styleMap = (style: string): Map<string, string> => {
  const M = new Map<string, string>()
  for (const Part of style.split(';')) {
    const I = Part.indexOf(':')
    if (I < 0) continue
    M.set(Part.slice(0, I).trim().toLowerCase(), Part.slice(I + 1).trim().toLowerCase())
  }
  return M
}

// span 의 style 을 어떻게 옮길지 : 그대로 · 형광펜 (==) · 버림
export const spanStyle = (style: string): { kind: 'keep'; style: string } | { kind: 'mark' } | { kind: 'drop' } => {
  const M = styleMap(style)
  M.delete('text-align')
  M.delete('letter-spacing')
  const Bg = M.get('background-color')
  const Color = M.get('color')
  if (Bg === '#ffffff' && (!Color || Neutral.has(Color))) return { kind: 'drop' }
  if (!Bg && (!Color || Neutral.has(Color))) return { kind: 'drop' }
  // 밝은 회색 바탕 + 기본 글자 : 다크 모드에서 글자가 안 보이므로 사이트 형광펜 (<mark>) 으로
  if (Bg === '#dddddd' && !Color) return { kind: 'mark' }
  return { kind: 'keep', style: [...M].map(([k, v]) => `${k}: ${v};`).join(' ') }
}

const attr = (node: Element, name: string): string | undefined => {
  const V = node.properties?.[name]
  if (V === undefined || V === null || V === false) return undefined
  return Array.isArray(V) ? V.join(' ') : String(V)
}

// 표의 모양 속성 (style · border · width · data-ke-*) 과 요소 사이 빈 줄을 지운다. 칸 합치기 (colspan · rowspan) 는 남긴다
const KeepAttr = new Set(['colSpan', 'rowSpan'])
export const cleanTable = (node: Element): Element => {
  const Rows = ['table', 'tbody', 'thead', 'tfoot', 'tr']
  const walk = (n: Element): Element => {
    const Kids = n.children
      .filter((c) => !(c.type === 'text' && !c.value.trim() && Rows.includes(n.tagName)))
      .filter((c) => !(c.type === 'element' && (c.tagName === 'colgroup' || c.tagName === 'col')))
      .map((c) => (c.type === 'element' ? walk(c) : c))
    // 행 · 칸 사이에 줄바꿈 : Obsidian 에서 읽기 쉽게 (빈 줄은 넣지 않는다, HTML 블록이 끊기므로)
    const Spaced = Rows.includes(n.tagName) ? [...Kids.flatMap((c) => [{ type: 'text' as const, value: '\n' }, c]), { type: 'text' as const, value: '\n' }] : Kids
    return { type: 'element', tagName: n.tagName, properties: Object.fromEntries(Object.entries(n.properties ?? {}).filter(([k]) => KeepAttr.has(k))), children: Spaced }
  }
  return walk(node)
}

export interface ConvertOptions {
  // 그림 id → 파일 (없으면 found false)
  image: (id: string) => ImageFile | undefined
}

export const htmlToMarkdown = (html: string, slug: string, Opts: ConvertOptions) => {
  const Images: PostImage[] = []
  const Notes: Converted['notes'] = []
  const imageName = (id: string) => {
    const F = Opts.image(id)
    const Name = `${id}${F ? extOf(F.type) : '.png'}`
    if (!Images.some((i) => i.id === id)) Images.push({ id, name: Name, found: !!F })
    return Name
  }

  const Hast = unified().use(rehypeParse, { fragment: true }).parse(replaceImageMarks(html)) as HastRoot
  const Mdast = unified()
    .use(rehypeRemark, {
      handlers: {
        // 코드 블록 : 언어는 data-ke-language
        pre(state, node: Element) {
          const Lang = attr(node, 'dataKeLanguage')
          const Value = toText(node, { whitespace: 'pre' }).replace(/\n$/, '')
          const Result = { type: 'code' as const, lang: Lang || null, meta: null, value: Value }
          state.patch(node, Result)
          return Result
        },
        figure(state, node: Element) {
          const Type = attr(node, 'dataKeType')
          // HTML 삽입 : 원문 HTML 을 그대로 html demo 코드 블록으로 (사이트에서 iframe 으로 동작)
          if (Type === 'html') {
            const Source = attr(node, 'dataSource') ?? attr(node, 'dataHtml') ?? ''
            Notes.push({ kind: 'html-demo', detail: Source.split('\n').find((l) => l.trim())?.trim().slice(0, 60) ?? '' })
            return { type: 'code', lang: 'html', meta: 'demo', value: Source.replace(/\n$/, '') }
          }
          // 링크 카드 : 제목 링크 한 줄
          if (Type === 'opengraph') {
            const Url = attr(node, 'dataOgUrl') ?? attr(node, 'dataOgSourceUrl') ?? ''
            const Title = attr(node, 'dataOgTitle') || Url
            Notes.push({ kind: 'link-card', detail: Url })
            return { type: 'paragraph', children: [{ type: 'link', url: Url, children: [{ type: 'text', value: Title }] }] }
          }
          return state.toFlow(state.all(node))
        },
        img(state, node: Element) {
          const Id = attr(node, 'dataTistoryImage')
          if (!Id) {
            const Src = attr(node, 'src') ?? ''
            return { type: 'image', url: Src, alt: attr(node, 'alt') ?? '', title: null }
          }
          const Caption = attr(node, 'dataCaption')
          if (Caption) Notes.push({ kind: 'caption', detail: Caption })
          const Result = { type: 'image' as const, url: `../../_assets/tistory/${slug}/${imageName(Id)}`, alt: attr(node, 'alt') ?? '', title: null }
          state.patch(node, Result)
          return Result
        },
        div(state, node: Element) {
          // 더보기 : <details> 로 감싸고 안쪽은 마크다운
          if (attr(node, 'dataKeType') === 'moreLess') {
            const Content = (node.children as ElementContent[]).find((c): c is Element => c.type === 'element' && String(c.properties?.className ?? '').includes('moreless-content'))
            const Label = attr(node, 'dataTextMore') ?? '더보기'
            Notes.push({ kind: 'more-less', detail: Content ? toText(Content).trim().slice(0, 40) : '' })
            return [{ type: 'html', value: `<details>\n<summary>${Label}</summary>` }, ...(Content ? state.toFlow(state.all(Content)) : []), { type: 'html', value: '</details>' }] as RootContent[]
          }
          return state.toFlow(state.all(node))
        },
        span(state, node: Element) {
          const Children = state.all(node) as PhrasingContent[]
          const Style = attr(node, 'style')
          if (!Style) return Children
          const S = spanStyle(Style)
          if (S.kind === 'drop') {
            Notes.push({ kind: 'dropped-color', detail: Style })
            return Children
          }
          const Text = toText(node).trim()
          if (!Text) return Children
          if (S.kind === 'mark') {
            Notes.push({ kind: 'mark', detail: Text.slice(0, 30) })
            return [{ type: 'html', value: '<mark>' }, ...Children, { type: 'html', value: '</mark>' }]
          }
          Notes.push({ kind: 'color', detail: `${S.style} ${Text.slice(0, 20)}` })
          return [{ type: 'html', value: `<span style="${S.style}">` }, ...Children, { type: 'html', value: '</span>' }]
        },
        // 표 : 티스토리 표에는 머리 행이 없어 GFM 표로 바꾸면 빈 머리 행이 생긴다. 모양 속성만 지운 HTML 표로 둔다
        table(_state, node: Element) {
          return { type: 'html', value: toHtml(cleanTable(node)) }
        },
        u(state, node: Element) {
          return [{ type: 'html', value: '<u>' }, ...(state.all(node) as PhrasingContent[]), { type: 'html', value: '</u>' }]
        },
      },
    })
    .runSync(Hast) as MdastRoot

  if (/<table\b/i.test(html)) Notes.push({ kind: 'table', detail: `${(html.match(/<table\b/gi) ?? []).length}개` })
  const Md = unified()
    .use(remarkGfm)
    .use(remarkStringify, { bullet: '-', fences: true, rule: '-', emphasis: '*', strong: '*', listItemIndent: 'one' })
    .stringify(Mdast as MdastNodes as MdastRoot)
  return { markdown: Md, images: Images, notes: Notes }
}

export const convertPost = (Meta: TistoryMeta, html: string, Opts: ConvertOptions): Converted => {
  const Rule = Categories[Meta.category]
  if (!Rule) throw new Error(`categories.ts 에 없는 카테고리입니다 : ${Meta.category}`)
  const Slug = siteSlugOf(Meta)
  const Step = stepOf(Meta.title)
  const Front: Record<string, unknown> = {
    title: Meta.title,
    field: 'computer',
    context: Rule.context,
    topic: Rule.topic,
    source: 'tistory',
    originalUrl: Meta.permalink,
    date: Meta.published.slice(0, 10),
    tags: Rule.tags,
    series: Rule.series,
    ...(Step !== undefined ? { step: Step } : {}),
  }
  const R = htmlToMarkdown(html, Slug, Opts)
  const Yaml = stringify(Front, { lineWidth: 0, indentSeq: true })
  return { slug: Slug, path: `posts/tistory/${Slug}.md`, text: `---\n${Yaml}---\n\n${R.markdown}`, body: R.markdown, images: R.images, notes: R.notes }
}
