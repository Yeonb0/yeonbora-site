import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

// 사이트 (astro.config.mjs) 와 시안 작업대 (render-post.ts) 가 같은 remark 플러그인을 같은 순서로 쓰는지
describe('remark plugin order', () => {
  it('workbench and site use the same custom remark plugins in the same order', () => {
    const Site = read('../../../../astro.config.mjs')
    const Block = Site.slice(Site.indexOf('remarkPlugins:') + 14, Site.indexOf('rehypePlugins:'))
    const SiteOrder = [...Block.matchAll(/\b(remark[A-Z]\w*)\b/g)].map((m) => m[1])
    const Bench = read('../../../../scripts/drafts/render-post.ts')
    const Chain = Bench.slice(Bench.indexOf('unified()\n      .use(remarkParse)'), Bench.indexOf('.use(remarkRehype'))
    const BenchOrder = [...Chain.matchAll(/\.use\((remark[A-Z]\w*)/g)].map((m) => m[1]).filter((n) => !['remarkParse', 'remarkGfm'].includes(n))
    expect(SiteOrder).toEqual(['remarkStripComments', 'remarkViz', 'remarkCallout', 'remarkHighlight', 'remarkHtmlImage', 'remarkMath', 'remarkWikilink'])
    expect(BenchOrder).toEqual(SiteOrder)
  })
})
