import { describe, expect, it } from 'vitest'
import { convertPost, htmlToMarkdown, replaceImageMarks, siteSlugOf, spanStyle, stepOf } from '../convert'

const Meta = {
  id: '50',
  title: '[DS] 07_트리',
  category: 'C/Data Structure',
  visibility: 'PUBLIC',
  published: '2024-07-31 12:48',
  created: '2024-07-31 12:48',
  modified: '2024-07-31 12:48',
  permalink: 'https://yeonbo-ra.tistory.com/entry/DS-07%ED%8A%B8%EB%A6%AC',
}
const Png = { type: 'image/png', data: Buffer.from([1]) }
const md = (html: string) => htmlToMarkdown(html, 's', { image: (id) => (id === 'btA' ? Png : undefined) })

describe('slug · step', () => {
  it('drops the [prefix] and keeps the number', () => {
    expect(siteSlugOf(Meta)).toBe('2024-07-31-07-트리')
    expect(siteSlugOf({ ...Meta, title: '[Git&GitHub] 03_Git 기본 명령어' })).toBe('2024-07-31-03-git-기본-명령어')
    expect(stepOf('[DS] 07_트리')).toBe(7)
    expect(stepOf('[HTML] Self Check')).toBeUndefined()
  })
})

describe('htmlToMarkdown', () => {
  it('image marks become local images named by the tistory image id', () => {
    expect(replaceImageMarks('<p>[##_Image|kage@zG/btA/AAA/img.png?x=1&y=2|CDM|1.3|{"originWidth":"225","caption":"HTML5"}_##]</p>')).toBe('<p><img data-tistory-image="btA" alt="HTML5" data-caption="HTML5"></p>')
    const R = md('<p>[##_Image|kage@zG/btA/AAA/img.png|CDM|1.3|{"originWidth":"225"}_##]</p><p>[##_Image|kage@zG/btB/AAA/img.png|CDM|1.3|{}_##]</p>')
    expect(R.markdown).toBe('![](../../_assets/tistory/s/btA.png)\n\n![](../../_assets/tistory/s/btB.png)\n')
    expect(R.images).toEqual([
      { id: 'btA', name: 'btA.png', found: true },
      { id: 'btB', name: 'btB.png', found: false },
    ])
  })

  it('code blocks keep their language and text', () => {
    const R = md('<pre id="code_1" class="cpp" data-ke-language="cpp" data-ke-type="codeblock"><code>for(i = 0; i &lt; n; i++)\n  x++;</code></pre>')
    expect(R.markdown).toBe('```cpp\nfor(i = 0; i < n; i++)\n  x++;\n```\n')
  })

  it('html insert becomes an html demo block with the source untouched', () => {
    const R = md('<figure id="code_2" data-source="&lt;style&gt;.bar{width:1px}&lt;/style&gt;\n&lt;div class=&quot;bar&quot;&gt;a&lt;/div&gt;" data-ke-type="html"><div data-ke-class="header"><i>&lt;&gt;</i>HTML 삽입</div><div data-ke-class="article">미리보기할 수 없는 소스</div></figure>')
    expect(R.markdown).toBe('```html demo\n<style>.bar{width:1px}</style>\n<div class="bar">a</div>\n```\n')
    expect(R.notes.map((n) => n.kind)).toEqual(['html-demo'])
  })

  it('link card, more-less, nbsp paragraphs', () => {
    const R = md(
      '<figure data-ke-type="opengraph" data-og-title="cubic-bezier.com" data-og-url="https://cubic-bezier.com/"><a href="https://cubic-bezier.com/"><div class="og-text"><p>cubic-bezier.com</p></div></a></figure>' +
        '<p data-ke-size="size16">&nbsp; - 사용자 등록</p>' +
        '<div data-ke-type="moreLess" data-text-more="더보기" data-text-less="닫기"><a class="btn-toggle-moreless">더보기</a><div class="moreless-content"><p>git config</p></div></div>',
    )
    expect(R.markdown).toBe('[cubic-bezier.com](https://cubic-bezier.com/)\n\n  - 사용자 등록\n\n<details>\n<summary>더보기</summary>\n\ngit config\n\n</details>\n')
  })

  it('tables stay html without layout attributes', () => {
    const R = md('<table style="width: 50%;" border="1" data-ke-align="alignLeft">\n<tbody>\n<tr>\n<td style="width: 24%;">비교&nbsp;</td>\n<td colspan="2">O(n²)</td>\n</tr>\n</tbody>\n</table>')
    expect(R.markdown).toBe('<table>\n<tbody>\n<tr>\n<td>비교 </td>\n<td colspan="2">O(n²)</td>\n</tr>\n</tbody>\n</table>\n')
  })

  it('span colors : keep meaningful ones, mark light grey, drop paste leftovers', () => {
    expect(spanStyle('background-color: #666666; color: #ffffff;')).toEqual({ kind: 'keep', style: 'background-color: #666666; color: #ffffff;' })
    expect(spanStyle('color: #99cefa; text-align: start;')).toEqual({ kind: 'keep', style: 'color: #99cefa;' })
    expect(spanStyle('background-color: #dddddd;')).toEqual({ kind: 'mark' })
    expect(spanStyle('color: #333333; text-align: start;')).toEqual({ kind: 'drop' })
    expect(spanStyle('background-color: #ffffff; color: #000000;')).toEqual({ kind: 'drop' })
    const R = md('<p>a <span style="color: #99cefa;">파랑</span> <span style="background-color: #dddddd;">회색</span> <span style="color: #333333;">기본</span></p>')
    expect(R.markdown).toBe('a <span style="color: #99cefa;">파랑</span> <mark>회색</mark> 기본\n')
  })
})

describe('convertPost', () => {
  it('writes tistory frontmatter with the original date and url', () => {
    const C = convertPost(Meta, '<h3 data-ke-size="size23">1. 트리</h3>', { image: () => undefined })
    expect(C.path).toBe('posts/tistory/2024-07-31-07-트리.md')
    expect(C.text).toBe(
      '---\ntitle: "[DS] 07_트리"\nfield: computer\ncontext: self\ntopic: data-structure\nsource: tistory\noriginalUrl: https://yeonbo-ra.tistory.com/entry/DS-07%ED%8A%B8%EB%A6%AC\ndate: 2024-07-31\ntags:\n  - Data Structure\nseries: Data Structure\nstep: 7\n---\n\n### 1. 트리\n',
    )
  })

  it('unknown category fails loudly', () => {
    expect(() => convertPost({ ...Meta, category: 'Python' }, '', { image: () => undefined })).toThrow('categories.ts')
  })
})
