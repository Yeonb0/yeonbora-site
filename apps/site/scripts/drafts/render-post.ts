// 작업대용 글 : 원문 (본문 수정 기준) + 사이트와 같은 플러그인으로 만든 HTML
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, extname, basename, relative, resolve } from 'node:path'
import type { Element, Root as HastRoot } from 'hast'
import type { Root as MdastRoot } from 'mdast'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'
import { parse } from 'yaml'
import { fileURLToPath } from 'node:url'
import { getAssets, getGraph, isBacklog, setBacklogPath } from '../../src/lib/content/index-fs'
import { remarkStripComments } from '../../src/lib/remark/comments'
import { remarkCallout } from '../../src/lib/remark/callout'
import { remarkHighlight } from '../../src/lib/remark/highlight'
import { remarkViz } from '../../src/lib/remark/viz'
import { remarkWikilink } from '../../src/lib/remark/wikilink'

const BacklogPath = fileURLToPath(new URL('../../../../docs/migration/wiki-backlog.json', import.meta.url))

export interface Block {
  start: number
  end: number
  text: string
  // 원문에 한 번만 나오는 블록만 고칠 수 있다 ("시안 반영" 이 find 로 찾으므로)
  unique: boolean
}

export interface DraftImage {
  // 원본 파일 (절대 경로)
  file: string
  // 묶음 안 경로 (내용 해시 이름)
  name: string
}

export interface DraftPost {
  path: string
  title: string
  markdown: string
  html: string
  Blocks: Block[]
  Images: DraftImage[]
}

const FrontRe = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

const hashName = (file: string) => {
  const H = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)
  const Ext = extname(file)
  return `img/${basename(file, Ext)}-${H}${Ext}`
}

export function renderPost(file: string, contentDir: string): DraftPost {
  setBacklogPath(contentDir, BacklogPath)
  const Text = readFileSync(file, 'utf8')
  const M = Text.match(FrontRe)
  const Front = (M ? parse(M[1]) : {}) ?? {}
  const markdown = M ? Text.slice(M[0].length) : Text
  const path = relative(contentDir, file).split('\\').join('/').replace(/\.md$/, '')

  const Mdast = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastRoot
  const Blocks: Block[] = Mdast.children.map((n) => {
    const start = n.position!.start.offset!
    const end = n.position!.end.offset!
    const text = markdown.slice(start, end)
    return { start, end, text, unique: markdown.split(text).length === 2 }
  })
  const StartIdx = new Map(Blocks.map((b, i) => [b.start, i]))

  const Images: DraftImage[] = []
  const Dir = dirname(file)
  // 최상위 요소에 원문 블록 번호를 단다 (viz figure 는 raw html 이라 위치가 없어 빠진다)
  const tagBlocks = () => (tree: HastRoot) => {
    for (const C of tree.children) {
      if (C.type !== 'element') continue
      const I = StartIdx.get(C.position?.start.offset ?? -1)
      if (I !== undefined && Blocks[I].unique && C.tagName !== 'figure') C.properties = { ...C.properties, dataBlock: I }
    }
    visit(tree, 'element', (el: Element) => {
      if (el.tagName !== 'img') return
      const Src = String(el.properties?.src ?? '')
      if (!Src || /^[a-z]+:|^\/\//i.test(Src) || Src.startsWith('/')) return
      const Abs = resolve(Dir, decodeURI(Src))
      if (!Abs.startsWith(contentDir)) return
      let Img = Images.find((i) => i.file === Abs)
      if (!Img) Images.push((Img = { file: Abs, name: hashName(Abs) }))
      el.properties.src = Img.name
    })
  }

  const warn = () => {}
  const html = String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkStripComments, { onWarn: warn })
      .use(remarkViz, { onWarn: warn })
      .use(remarkCallout)
      .use(remarkHighlight)
      .use(remarkMath)
      .use(remarkWikilink, { contentDir, getGraph: () => getGraph(contentDir), getAssets: () => getAssets(contentDir), isBacklog: (t: string) => isBacklog(contentDir, t), onBroken: warn })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(tagBlocks)
      .use(rehypeRaw)
      .use(rehypeKatex)
      .use(rehypeStringify)
      .processSync(new VFile({ path: file, value: markdown })),
  )

  return { path, title: String(Front.title ?? path), markdown, html, Blocks, Images }
}
