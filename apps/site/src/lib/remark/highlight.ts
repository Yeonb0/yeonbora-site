// Obsidian 형광펜 ==글== 을 mark 로 바꾼다
// 수식은 remark-math 가 이미 inlineMath 노드로 만들었고 코드는 text 가 아니라 빠진다
// 위키 링크는 아직 text 라, [[ ]] 안에서 시작하는 == 만 건너뛴다 (뒤의 remarkWikilink 가 mark 안 text 도 바꾼다)
import type { Parent, PhrasingContent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

// 안쪽 양 끝이 공백이나 = 이면 그대로 둔다 : "== a ==" · "===="
const HighlightRe = /==([^\s=](?:(?:(?!==)[^\n])*?[^\s=])?)==/g
const WikiRe = /!?\[\[[^\]\n]*\]\]/g

const mark = (children: PhrasingContent[]): PhrasingContent => ({ type: 'emphasis', children, data: { hName: 'mark' } })
const text = (value: string): Text => ({ type: 'text', value })

const inWiki = (value: string, at: number) => {
  for (const W of value.matchAll(WikiRe)) if (at >= W.index && at < W.index + W[0].length) return true
  return false
}

// 한 text 노드 안에서 짝이 맞는 것
const splitOne = (value: string): PhrasingContent[] | null => {
  const Out: PhrasingContent[] = []
  let Last = 0
  let Found = false
  for (const M of value.matchAll(HighlightRe)) {
    if (inWiki(value, M.index)) continue
    if (M.index > Last) Out.push(text(value.slice(Last, M.index)))
    Out.push(mark([text(M[1])]))
    Found = true
    Last = M.index + M[0].length
  }
  if (!Found) return null
  if (Last < value.length) Out.push(text(value.slice(Last)))
  return Out
}

// 여는 == : 뒤가 공백 · = 이 아니거나 (노드 끝이면 다음 형제가 이어진다) 앞이 = 이 아닐 때
const findOpen = (v: string, hasNext: boolean) => {
  for (let I = v.indexOf('=='); I !== -1; I = v.indexOf('==', I + 1)) {
    const Next = v[I + 2]
    if (v[I - 1] === '=' || inWiki(v, I)) continue
    if (Next === undefined ? hasNext : !/[\s=]/.test(Next)) return I
  }
  return -1
}

// 닫는 == : 앞이 공백 · = 이 아니고 (노드 맨 앞이면 앞 형제가 이어진다) 뒤가 = 이 아닐 때, 줄바꿈 앞에서만
const findClose = (v: string) => {
  const Limit = v.includes('\n') ? v.indexOf('\n') : v.length
  for (let I = v.indexOf('=='); I !== -1 && I + 2 <= Limit; I = v.indexOf('==', I + 1)) {
    if (v[I + 2] === '=') continue
    if (I === 0 || !/[\s=]/.test(v[I - 1])) return I
  }
  return -1
}

// 형제 text 노드에 나뉘어 걸친 것 : ==([[C]])== 가 아니라 ==**굵게**== · ==`코드` 설명== 같은 모양
const joinSiblings = (parent: Parent) => {
  const Kids = parent.children as PhrasingContent[]
  for (let I = 0; I < Kids.length; I++) {
    const A = Kids[I]
    if (A.type !== 'text') continue
    const O = findOpen(A.value, I + 1 < Kids.length)
    if (O === -1) continue
    const Tail = A.value.slice(O + 2)
    if (Tail.includes('\n')) continue
    let J = I + 1
    let Close = -1
    for (; J < Kids.length; J++) {
      const B = Kids[J]
      if (B.type === 'break') break
      if (B.type !== 'text') continue
      Close = findClose(B.value)
      if (Close !== -1 || B.value.includes('\n')) break
    }
    if (Close === -1) continue
    const B = Kids[J] as Text
    const Inner: PhrasingContent[] = []
    if (Tail) Inner.push(text(Tail))
    Inner.push(...Kids.slice(I + 1, J))
    if (Close > 0) Inner.push(text(B.value.slice(0, Close)))
    if (Inner.length === 0) continue
    const Out: PhrasingContent[] = []
    if (O > 0) Out.push(text(A.value.slice(0, O)))
    Out.push(mark(Inner))
    const After = B.value.slice(Close + 2)
    if (After) Out.push(text(After))
    Kids.splice(I, J - I + 1, ...Out)
    // 뒤에 남은 text 에서 다음 형광펜을 이어서 찾는다
    I += Out.length - (After ? 1 : 0) - 1
  }
}

export function remarkHighlight() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (!('children' in node)) return
      const P = node as Parent
      const Kids = P.children as PhrasingContent[]
      for (let I = 0; I < Kids.length; I++) {
        const K = Kids[I]
        if (K.type !== 'text' || !K.value.includes('==')) continue
        const Out = splitOne(K.value)
        if (!Out) continue
        Kids.splice(I, 1, ...Out)
        I += Out.length - 1
      }
      joinSiblings(P)
    })
  }
}
