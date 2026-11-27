import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'
import { draftsConfig } from '../../../vite.drafts.config'

describe('drafts bundle', () => {
  it('ships katex css and fonts with hashed names, linked from index.html', async () => {
    const Out = mkdtempSync(join(tmpdir(), 'drafts-'))
    await build(draftsConfig([], Out))
    const Assets = readdirSync(join(Out, 'assets'))
    const Css = Assets.filter((f) => f.endsWith('.css') && readFileSync(join(Out, 'assets', f), 'utf8').includes('.katex'))
    expect(Css).toHaveLength(1)
    expect(Css[0]).toMatch(/-[\w-]{8}\.css$/)
    expect(Assets.some((f) => /^KaTeX_Main-Regular-[\w-]+\.woff2$/.test(f))).toBe(true)
    expect(readFileSync(join(Out, 'index.html'), 'utf8')).toContain(`assets/${Css[0]}`)
  }, 60000)
})
