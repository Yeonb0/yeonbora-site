// [[ ]] 위키 링크를 주소로, ![[그림]] 이미지 임베드를 이미지로 바꾼다
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Image, Link, PhrasingContent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import type { BrokenLink } from '../content/broken-report'
import type { Graph } from '../content/graph'
import { headingSlug, parseInner } from '../content/wikilink'

export interface WikilinkOptions {
  contentDir: string
  getGraph: () => Graph
  getAssets: () => Map<string, string>
  onBroken: (b: BrokenLink) => void
  // 아직 쓰지 않은 노트 (backlog) 로 가는 링크 : 경고 없이 흐린 글자로 보인다
  isBacklog?: (target: string) => boolean
}

// !? 를 함께 잡아 임베드와 링크를 한 번에 나눈다
const TokenRe = /(!?)\[\[([^\[\]\n]+?)\]\]/g
const ImageRe = /\.(png|jpe?g|gif|webp|svg|avif)$/i

const filePath = (file: VFile): string => {
  const P = file.path ?? ''
  return P.startsWith('file:') ? fileURLToPath(P) : P
}

export function remarkWikilink(opts: WikilinkOptions) {
  return (tree: Root, file: VFile) => {
    const Abs = filePath(file)
    const Rel = Abs ? relative(opts.contentDir, Abs).split('\\').join('/') : ''
    const Graph = opts.getGraph()

    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return
      const Out: PhrasingContent[] = []
      let Last = 0
      for (const M of node.value.matchAll(TokenRe)) {
        const [Raw, Bang, Inner] = M
        let Made: PhrasingContent | undefined
        const Link = parseInner(Raw, Inner)
        if (Bang) {
          // 이미지 임베드만 바꾼다 : 노트 임베드는 원문 그대로
          if (!ImageRe.test(Link.target)) continue
          const Asset = opts.getAssets().get(Link.target)
          if (!Asset) {
            opts.onBroken({ file: Rel, target: Link.target })
            continue
          }
          let Url = join(opts.contentDir, Asset)
          if (Abs) {
            Url = relative(dirname(Abs), Url).split('\\').join('/')
            if (!Url.startsWith('.')) Url = `./${Url}`
          }
          const Img: Image = { type: 'image', url: Url, alt: Link.target }
          // ![[그림.png|300]] : 표시 너비
          if (Link.label && /^\d+$/.test(Link.label)) Img.data = { hProperties: { width: Number(Link.label) } }
          Made = Img
        } else {
          // [[#소제목]] : 같은 노트 안의 소제목
          const Same = !Link.target && Link.heading ? `#${headingSlug(Link.heading)}` : undefined
          const Href = Same ?? Graph.href(Link)
          const Shown = Link.label ?? (Same ? Link.heading! : Link.target)
          if (Href) {
            const A: Link = { type: 'link', url: Href, children: [{ type: 'text', value: Shown }], data: { hProperties: { className: ['wikilink'] } } }
            Made = A
          } else if (opts.isBacklog?.(Link.target)) {
            Made = { type: 'emphasis', children: [{ type: 'text', value: Shown }], data: { hName: 'span', hProperties: { className: ['wikilink-pending'] } } }
          } else {
            opts.onBroken({ file: Rel, target: Link.target })
            Made = { type: 'emphasis', children: [{ type: 'text', value: Shown }], data: { hName: 'span', hProperties: { className: ['wikilink-broken'] } } }
          }
        }
        if (M.index > Last) Out.push({ type: 'text', value: node.value.slice(Last, M.index) })
        Out.push(Made)
        Last = M.index + Raw.length
      }
      if (Out.length === 0) return
      if (Last < node.value.length) Out.push({ type: 'text', value: node.value.slice(Last) })
      parent.children.splice(index, 1, ...(Out as typeof parent.children))
      return index + Out.length
    })
  }
}
