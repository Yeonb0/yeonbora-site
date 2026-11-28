// ```html demo``` 코드 블록 (티스토리 "HTML 삽입" 원문) 을 실제로 동작하는 iframe 으로 바꾼다
// 원문 HTML 은 srcdoc 안에서만 동작하므로 그 CSS · 스크립트가 사이트로 새어 나가지 않는다 (sandbox : 다른 출처로 취급)
// 높이는 iframe 안의 작은 스크립트가 알려 주고, VizMount.astro 의 리스너가 맞춘다
import type { Code, Root } from 'mdast'
import { visit } from 'unist-util-visit'

export const HtmlDemoMessage = 'html-demo-height'

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 문서 높이를 부모에게 알린다 (그림 · 글꼴이 늦게 와도 다시 알림)
const Reporter = `<script>(function(){var t='${HtmlDemoMessage}';function s(){parent.postMessage({type:t,height:document.documentElement.scrollHeight},'*')}addEventListener('load',s);if(window.ResizeObserver)new ResizeObserver(s).observe(document.documentElement);s()})()</script>`

export const isHtmlDemo = (node: Code): boolean => node.lang === 'html' && (node.meta ?? '').trim() === 'demo'

export const demoHtml = (source: string): string =>
  `<figure class="html-demo"><iframe title="HTML 실습 화면" sandbox="allow-scripts allow-forms" loading="lazy" srcdoc="${escapeAttr(source + Reporter)}"></iframe></figure>`

export function remarkHtmlDemo() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (!isHtmlDemo(node) || !parent || index === undefined) return
      parent.children[index] = { type: 'html', value: demoHtml(node.value) }
    })
  }
}
