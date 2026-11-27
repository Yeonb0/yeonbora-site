// Obsidian 형광펜 ==글== 을 mark 로 바꾼다 (코드는 text 가 아니라 빠지고, 수식 · 위키 링크 구간은 건너뛴다)
import type { PhrasingContent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

// 안쪽 양 끝이 공백이나 = 이면 그대로 둔다 : "== a ==" · "===="
const HighlightRe = /==([^\s=](?:(?:(?!==)[^\n])*?[^\s=])?)==/g
// 아직 remark-math 전이라 수식 · 위키 링크가 text 로 남아 있다
const SkipRe = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$|!?\[\[[^\]\n]*\]\]/g

const split = (value: string): PhrasingContent[] => {
  const Out: PhrasingContent[] = []
  let Last = 0
  const pushPlain = (from: number, to: number) => {
    const Seg = value.slice(from, to)
    let L = 0
    for (const M of Seg.matchAll(HighlightRe)) {
      if (M.index > L) Out.push({ type: 'text', value: Seg.slice(L, M.index) })
      Out.push({ type: 'emphasis', children: [{ type: 'text', value: M[1] }], data: { hName: 'mark' } })
      L = M.index + M[0].length
    }
    if (L < Seg.length) Out.push({ type: 'text', value: Seg.slice(L) })
  }
  for (const S of value.matchAll(SkipRe)) {
    pushPlain(Last, S.index)
    Out.push({ type: 'text', value: S[0] })
    Last = S.index + S[0].length
  }
  pushPlain(Last, value.length)
  return Out
}

export function remarkHighlight() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('==')) return
      const Out = split(node.value)
      if (!Out.some((n) => n.type === 'emphasis')) return
      parent.children.splice(index, 1, ...(Out as typeof parent.children))
      return index + Out.length
    })
  }
}
