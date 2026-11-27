import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import Config from '../../../../astro.config.mjs'

// 사이트가 실제로 쓰는 markdown.processor 로 그린다
const render = async (md: string) => {
  const R = await Config.markdown!.processor!.createRenderer({ syntaxHighlight: false })
  const { code } = await R.render(md, { fileURL: pathToFileURL('/tmp/x/wiki/a.md') })
  return code
}

describe('site markdown processor', () => {
  it('keeps quotes, dashes and ellipsis verbatim', async () => {
    const Html = await render('Prim\'s "따옴표" A -- B ... C --- D\n')
    expect(Html).toContain('Prim\'s')
    expect(Html).toContain('"따옴표"')
    expect(Html).toContain('A -- B')
    expect(Html).toContain('...')
    expect(Html).toContain('C --- D')
    expect(Html).not.toMatch(/[‘’“”–—…]/)
  })
})
