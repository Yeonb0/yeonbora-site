import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { remarkHighlight } from '../highlight'

const render = async (md: string) => {
  const R = await createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkHighlight] })
  return (await R.render(md)).code
}

describe('remarkHighlight', () => {
  it('==글자== 를 mark 로', async () => {
    expect(await render('- ==ex)== 택배가 사라짐')).toContain('<mark>ex)</mark> 택배가 사라짐')
  })

  it('한 줄에 여러 개', async () => {
    expect(await render('==가== 와 ==나==')).toContain('<mark>가</mark> 와 <mark>나</mark>')
  })

  it('코드 안 · 짝이 없는 == 는 그대로', async () => {
    const Html = await render('`==a==` 와 a == b')
    expect(Html).toContain('<code>==a==</code>')
    expect(Html).toContain('a == b')
    expect(Html).not.toContain('<mark>')
  })
})
