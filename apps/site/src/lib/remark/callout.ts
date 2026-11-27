// Obsidian 콜아웃 : > [!type]± 제목 을 aside (접기는 details) 로 바꾼다
import type { Blockquote, Paragraph, PhrasingContent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

const HeadRe = /^\[!([A-Za-z][\w-]*)\]([+-]?)[ \t]*/

export function remarkCallout() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const First = node.children[0]
      if (First?.type !== 'paragraph') return
      const Lead = First.children[0]
      if (Lead?.type !== 'text') return
      const M = Lead.value.match(HeadRe)
      if (!M) return

      const Type = M[1].toLowerCase()
      const Fold = M[2]
      const Rest = Lead.value.slice(M[0].length)

      // 첫 줄 (줄바꿈 전까지) 이 제목, 나머지는 본문
      const Title: PhrasingContent[] = []
      const Body: PhrasingContent[] = []
      let InTitle = true
      const Parts: PhrasingContent[] = [{ type: 'text', value: Rest } as Text, ...First.children.slice(1)]
      for (const P of Parts) {
        if (InTitle && P.type === 'text') {
          const I = P.value.indexOf('\n')
          if (I === -1) {
            Title.push(P)
          } else {
            if (I > 0) Title.push({ type: 'text', value: P.value.slice(0, I) })
            const After = P.value.slice(I + 1)
            if (After) Body.push({ type: 'text', value: After })
            InTitle = false
          }
        } else if (InTitle && P.type === 'break') {
          InTitle = false
        } else if (InTitle) {
          Title.push(P)
        } else {
          Body.push(P)
        }
      }

      const HasTitle = Title.some((t) => t.type !== 'text' || t.value.trim() !== '')
      const TitleNodes: PhrasingContent[] = HasTitle ? Title : [{ type: 'text', value: Type[0].toUpperCase() + Type.slice(1) }]
      const Tag = Fold ? 'details' : 'aside'
      const TitleTag = Fold ? 'summary' : 'p'

      const TitleP: Paragraph = {
        type: 'paragraph',
        children: TitleNodes,
        data: { hName: TitleTag, hProperties: { className: ['callout-title'] } },
      }
      const Children: Blockquote['children'] = [TitleP]
      if (Body.length > 0) Children.push({ type: 'paragraph', children: Body })
      Children.push(...node.children.slice(1))

      const Props: Record<string, string | boolean | string[]> = { className: ['callout', `callout-${Type}`] }
      if (Fold === '+') Props.open = true
      node.children = Children
      node.data = { hName: Tag, hProperties: Props }
    })
  }
}
