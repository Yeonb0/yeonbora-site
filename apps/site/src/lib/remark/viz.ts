// ```viz <id>``` 코드 블록을 시각화 자리표시 <figure> 로 바꾼다 (컴포넌트를 띄우는 런타임은 M2)
import type { Code, Root } from 'mdast'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import { parse } from 'yaml'

export interface VizOptions {
  onWarn?: (msg: string) => void
}

const IdRe = /^[a-z0-9-]+$/

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function remarkViz(opts: VizOptions = {}) {
  return (tree: Root, file: VFile) => {
    const Ids: string[] = []
    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== 'viz' || !parent || index === undefined) return
      const Id = (node.meta ?? '').trim()
      if (!IdRe.test(Id)) {
        opts.onWarn?.(`viz id 형식이 아님 : "${Id}"`)
        return
      }
      let Data: { caption?: unknown; height?: unknown } = {}
      try {
        Data = parse(node.value) ?? {}
      } catch {
        opts.onWarn?.(`viz ${Id} : 블록 안 yaml 을 읽지 못함`)
      }
      const Height = Number(Data.height)
      const Style = Number.isFinite(Height) && Height > 0 ? ` style="--viz-height:${Height}px"` : ''
      const Caption = typeof Data.caption === 'string' && Data.caption ? `<figcaption>${escape(Data.caption)}</figcaption>` : ''
      Ids.push(Id)
      parent.children[index] = { type: 'html', value: `<figure class="viz" data-viz="${Id}"${Style}><div class="viz-mount"></div>${Caption}</figure>` }
    })
    const Astro = ((file.data as { astro?: { frontmatter?: Record<string, unknown> } }).astro ??= {})
    Astro.frontmatter = { ...(Astro.frontmatter ?? {}), vizIds: Ids }
  }
}
