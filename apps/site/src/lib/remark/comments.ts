// Obsidian 주석 %% … %% 를 사이트 빌드에서만 지운다 (원본 파일은 그대로)
import type { Parent, Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

export interface CommentOptions {
  onWarn?: (msg: string) => void
}

const Mark = '%%'

const count = (s: string) => s.split(Mark).length - 1

// 블록 안 text 노드들 (code · inlineCode 는 text 가 아니라 빠진다)
const textsOf = (node: Parent): Text[] => {
  const Out: Text[] = []
  visit(node, 'text', (t: Text) => {
    Out.push(t)
  })
  return Out
}

const marksIn = (node: Parent) => textsOf(node).reduce((n, t) => n + count(t.value), 0)

// 짝이 맞지 않은 %% 하나가 든 text 노드를 찾아 앞 · 뒤 어느 쪽을 지울지 정한다
const cut = (block: Parent, side: 'after' | 'before') => {
  const Texts = textsOf(block)
  const T = side === 'after' ? Texts.find((t) => t.value.includes(Mark)) : [...Texts].reverse().find((t) => t.value.includes(Mark))
  if (!T) return
  const At = side === 'after' ? T.value.indexOf(Mark) : T.value.lastIndexOf(Mark)
  T.value = side === 'after' ? T.value.slice(0, At) : T.value.slice(At + Mark.length)
  // 같은 블록 안에서 그 노드 뒤 (또는 앞) 형제는 주석 안에 있다
  visit(block, (n, i, p) => {
    if (n !== T || !p || i === undefined) return
    if (side === 'after') p.children.splice(i + 1)
    else p.children.splice(0, i)
  })
}

// 바로 아래 text 자식들의 %% 위치를 차례로 짝지어 그 사이를 지운다 (짝이 안 맞는 마지막 하나는 2단계 몫)
const stripInline = (P: Parent) => {
  const Kids = P.children as { type: string; value?: string }[]
  const Marks: [number, number][] = []
  Kids.forEach((k, i) => {
    if (k.type !== 'text') return
    let At = k.value!.indexOf(Mark)
    while (At >= 0) {
      Marks.push([i, At])
      At = k.value!.indexOf(Mark, At + Mark.length)
    }
  })
  const Pairs = Math.floor(Marks.length / 2)
  // 뒤쪽 짝부터 지워야 앞쪽 위치가 그대로다
  for (let p = Pairs - 1; p >= 0; p--) {
    const [I, A] = Marks[2 * p]
    const [J, B] = Marks[2 * p + 1]
    if (I === J) {
      Kids[I].value = Kids[I].value!.slice(0, A) + Kids[I].value!.slice(B + Mark.length)
    } else {
      Kids[I].value = Kids[I].value!.slice(0, A)
      Kids[J].value = Kids[J].value!.slice(B + Mark.length)
      Kids.splice(I + 1, J - I - 1)
    }
  }
  if (Pairs > 0) P.children = (Kids as typeof P.children).filter((k) => k.type !== 'text' || (k as Text).value !== '')
}

const isEmpty = (block: Parent) => textsOf(block).every((t) => t.value.trim() === '') && textsOf(block).length === block.children.length

export function remarkStripComments(opts: CommentOptions = {}) {
  return (tree: Root) => {
    // 1. 한 블록 안에서 짝이 맞는 주석 : 강조 · 코드 · 링크가 섞여 있어도 형제 노드를 건너 지운다
    visit(tree, (node) => {
      if ('children' in node) stripInline(node as Parent)
    })

    // 2. 여러 블록에 걸친 주석 : 짝이 안 맞는 블록부터 다음 짝이 안 맞는 블록까지
    visit(tree, (node) => {
      if (!('children' in node)) return
      const P = node as Parent
      const Kids = P.children as Parent[]
      for (let i = 0; i < Kids.length; i++) {
        if (!('children' in Kids[i]) || marksIn(Kids[i]) % 2 === 0) continue
        let j = i + 1
        while (j < Kids.length && !('children' in Kids[j] && marksIn(Kids[j]) % 2 === 1)) j++
        if (j >= Kids.length) {
          opts.onWarn?.('닫히지 않은 %% 주석 : 원문 그대로 둠')
          continue
        }
        cut(Kids[i], 'after')
        cut(Kids[j], 'before')
        const Drop = new Set<number>()
        for (let k = i + 1; k < j; k++) Drop.add(k)
        if (isEmpty(Kids[i])) Drop.add(i)
        if (isEmpty(Kids[j])) Drop.add(j)
        P.children = P.children.filter((_, k) => !Drop.has(k)) as typeof P.children
        return
      }
    })
  }
}
