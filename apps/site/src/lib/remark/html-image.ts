// 원문의 <img src="../../_assets/..."> 를 마크다운 그림 노드로 바꾼다
// Astro 는 마크다운 그림만 _assets 에서 찾아 처리하므로, 원문 HTML 그대로 두면 사이트에서 그림이 깨진다
// <img> 만 있는 HTML 노드만 바꾸고 (div 등으로 감싼 것은 그대로), alt · style · width · height 는 넘긴다
import type { Html, Image, Paragraph, Parent } from 'mdast'
import { visit } from 'unist-util-visit'

const OnlyImgs = /^\s*(?:<img\b[^>]*>\s*)+$/i
const ImgRe = /<img\b([^>]*)>/gi
const AttrRe = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

const isLocal = (src: string) => !/^(?:[a-z]+:|\/\/|\/|#)/i.test(src)

const toImages = (value: string): Image[] | null => {
  if (!OnlyImgs.test(value)) return null
  const Out: Image[] = []
  for (const M of value.matchAll(ImgRe)) {
    const Attrs: Record<string, string> = {}
    for (const A of M[1].matchAll(AttrRe)) Attrs[A[1].toLowerCase()] = A[2] ?? A[3] ?? ''
    if (!Attrs.src || !isLocal(Attrs.src)) return null
    const Props: Record<string, string> = {}
    for (const K of ['style', 'width', 'height']) if (Attrs[K]) Props[K] = Attrs[K]
    Out.push({ type: 'image', url: Attrs.src, alt: Attrs.alt ?? '', ...(Object.keys(Props).length ? { data: { hProperties: Props } } : {}) })
  }
  return Out.length ? Out : null
}

export const remarkHtmlImage = () => (tree: Parent) => {
  visit(tree, 'html', (node: Html, index, parent: Parent | undefined) => {
    if (!parent || index === undefined) return
    const Imgs = toImages(node.value)
    if (!Imgs) return
    // 블록 자리 (root · 인용 · 목록 항목) 에서는 문단으로 감싼다
    const Inline = parent.type === 'paragraph' || parent.type === 'emphasis' || parent.type === 'strong' || parent.type === 'link'
    const Repl = Inline ? Imgs : [{ type: 'paragraph', children: Imgs, position: node.position } as Paragraph]
    parent.children.splice(index, 1, ...(Repl as Parent['children']))
    return index + Repl.length
  })
}
