import { posix } from 'node:path'
import { stringify } from 'yaml'
import { Groups, type Pages } from './pages'

export type NoteKind = 'toc' | 'callout' | 'page-link' | 'external-image'

export interface PageMeta {
  id: string
  date: string
  group: (typeof Pages)[string]['group']
}

export interface Converted {
  slug: string
  path: string
  text: string
  body: string
  // src : 내보내기 안에서 md 파일 폴더 기준 경로 (한 번 디코드), name : _assets 에 둘 이름
  images: { src: string; name: string }[]
  notes: { kind: NoteKind; detail: string }[]
}

// 제목 바로 아래 Notion 속성 줄 (DB 페이지)
const PropertyLine = /^(Part|과목|선택|생성 일시|자료|수업 노트): /

export const splitExport = (md: string): { title: string; body: string } => {
  const Lines = md.replace(/\r\n/g, '\n').split('\n')
  const M = Lines[0]?.match(/^# (.+)$/)
  if (!M) throw new Error('첫 줄이 # 제목이 아닙니다')
  let I = 1
  while (I < Lines.length && Lines[I].trim() === '') I++
  if (PropertyLine.test(Lines[I] ?? '')) {
    while (I < Lines.length && PropertyLine.test(Lines[I])) I++
    while (I < Lines.length && Lines[I].trim() === '') I++
  }
  return { title: M[1].trim(), body: Lines.slice(I).join('\n').replace(/\s+$/, '') }
}

export const siteSlugOf = (date: string, title: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`작성일이 없습니다 : ${title}`)
  const Rest = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  if (!Rest) throw new Error(`slug 를 만들 수 없습니다 : ${title}`)
  return `${date}-${Rest}`
}

const safeDecode = (s: string): string => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const isFence = (line: string) => /^\s*(```|~~~)/.test(line)
// 아이콘 한 글자 (이모지) 줄
const isIcon = (line: string) => line.trim() !== '' && line.trim().length <= 4 && !/[\p{L}\p{N}]/u.test(line)

const ImageRe = /!\[([^\]]*)\]\(([^)\s]+)\)/g
const PageLinkRe = /(?<!!)\[([^\]]*)\]\((https:\/\/(?:app|www)\.notion\.(?:com|so)[^)\s]*|[^)\s]*\.md)\)/g

export const convertPage = (md: string, Meta: PageMeta): Converted => {
  const Rule = Groups[Meta.group]
  if (!Rule) throw new Error(`pages.ts 에 없는 묶음입니다 : ${Meta.group}`)
  const { title, body } = splitExport(md)
  const Slug = siteSlugOf(Meta.date, title)
  const Notes: Converted['notes'] = []
  const Images: Converted['images'] = []
  const NameOf = new Map<string, string>()
  const Taken = new Set<string>()

  const imageName = (src: string): string => {
    const Known = NameOf.get(src)
    if (Known) return Known
    const Base = safeDecode(posix.basename(src)).replace(/\s+/g, '-')
    const Ext = posix.extname(Base)
    const Stem = Base.slice(0, Base.length - Ext.length)
    let Name = Base
    for (let N = 2; Taken.has(Name); N++) Name = `${Stem}-${N}${Ext}`
    Taken.add(Name)
    NameOf.set(src, Name)
    Images.push({ src, name: Name })
    return Name
  }

  const inline = (line: string): string =>
    line
      .replace(ImageRe, (all, alt: string, url: string) => {
        if (/^https?:/.test(url)) {
          Notes.push({ kind: 'external-image', detail: url })
          return all
        }
        return `![${alt}](../../_assets/notion/${Slug}/${imageName(safeDecode(url))})`
      })
      .replace(PageLinkRe, (_all, text: string, url: string) => {
        Notes.push({ kind: 'page-link', detail: `${text} → ${safeDecode(url)}` })
        return text
      })

  const In = body.split('\n')
  const Out: string[] = []
  let Fence = false
  let TocDone = false
  let Callouts = 0
  for (let I = 0; I < In.length; I++) {
    const Line = In[I]
    if (isFence(Line)) {
      Fence = !Fence
      Out.push(Line)
      continue
    }
    if (Fence) {
      Out.push(Line)
      continue
    }
    if (!TocDone && Line === '- Index') {
      // 템플릿의 목차 토글 : 안의 목차 블록은 내보내기에 남지 않는다
      TocDone = true
      Notes.push({ kind: 'toc', detail: '' })
      if (Out.at(-1) === '' && In[I + 1] === '') I++
      continue
    }
    if (Line === '<aside>') {
      const End = In.indexOf('</aside>', I + 1)
      if (End < 0) throw new Error(`</aside> 가 없습니다 : ${title}`)
      let Inner = In.slice(I + 1, End)
      let Head = '> [!note]'
      if (Inner.length && isIcon(Inner[0])) {
        Head += ` ${Inner[0].trim()}`
        Inner = Inner.slice(1)
      }
      Out.push(Head)
      let InnerFence = false
      for (const X of Inner) {
        if (isFence(X)) InnerFence = !InnerFence
        Out.push(`> ${InnerFence || isFence(X) ? X : inline(X)}`)
      }
      Callouts++
      I = End
      continue
    }
    Out.push(inline(Line))
  }
  if (Callouts) Notes.push({ kind: 'callout', detail: `${Callouts}곳` })

  const Lec = title.match(/^Lec (\d+)/)
  const Front: Record<string, unknown> = {
    title,
    field: 'computer',
    context: Rule.context,
    topic: Rule.topic,
    source: 'notion',
    originalUrl: `https://www.notion.so/${Meta.id}`,
    date: Meta.date,
    tags: Rule.tags,
    series: Rule.series,
    ...(Rule.stepFromLec && Lec ? { step: Number(Lec[1]) } : {}),
  }
  const Body = Out.join('\n')
  const Yaml = stringify(Front, { lineWidth: 0, indentSeq: true })
  return { slug: Slug, path: `posts/notion/${Slug}.md`, text: `---\n${Yaml}---\n\n${Body}\n`, body: Body, images: Images, notes: Notes }
}
