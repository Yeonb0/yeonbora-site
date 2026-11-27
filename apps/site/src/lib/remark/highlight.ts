// Obsidian 하이라이트 ==글자== 를 <mark> 로 바꾼다. 한 글자 덩어리 (text 노드) 안에서만 찾는다
import type { PhrasingContent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

// == 바로 안쪽은 공백이 아니어야 한다 : a == b 같은 비교식은 건드리지 않는다
const MarkRe = /==(?=\S)([^=\n]*?\S)==/g

export function remarkHighlight() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('==')) return
      const Out: PhrasingContent[] = []
      let Last = 0
      for (const M of node.value.matchAll(MarkRe)) {
        if (M.index > Last) Out.push({ type: 'text', value: node.value.slice(Last, M.index) })
        Out.push({ type: 'emphasis', children: [{ type: 'text', value: M[1] }], data: { hName: 'mark' } })
        Last = M.index + M[0].length
      }
      if (Out.length === 0) return
      if (Last < node.value.length) Out.push({ type: 'text', value: node.value.slice(Last) })
      parent.children.splice(index, 1, ...(Out as typeof parent.children))
      return index + Out.length
    })
  }
}
