import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { graphAware } from '../graph-loader'
import { invalidateContentIndex } from '../index-fs'

const vault = () => {
  const Dir = mkdtempSync(join(tmpdir(), 'gl-'))
  mkdirSync(join(Dir, 'wiki/computer'), { recursive: true })
  mkdirSync(join(Dir, 'posts'), { recursive: true })
  writeFileSync(join(Dir, 'wiki/computer/ARQ.md'), '[[Go-Back-N]]')
  return Dir
}

// 안쪽 loader 가 받은 generateDigest 를 붙잡아 본다
const capture = () => {
  const Seen: { digest?: (d: string) => string; watcher?: unknown } = {}
  const Inner = { name: 'inner', load: async (ctx: any) => { Seen.digest = ctx.generateDigest; Seen.watcher = ctx.watcher } }
  return { Inner, Seen }
}
const ctx = () => ({ generateDigest: (d: string) => `d:${d}`, logger: { info() {}, warn() {} } }) as any

describe('graphAware', () => {
  it('digest follows the graph', async () => {
    const Dir = vault()
    const { Inner, Seen } = capture()
    await graphAware(Inner, Dir).load(ctx())
    const Before = Seen.digest!('같은 본문')
    writeFileSync(join(Dir, 'wiki/computer/Go-Back-N.md'), 'gbn')
    invalidateContentIndex(Dir)
    await graphAware(Inner, Dir).load(ctx())
    expect(Seen.digest!('같은 본문')).not.toBe(Before)
  })

  it('throws on duplicates', async () => {
    const Dir = vault()
    writeFileSync(join(Dir, 'wiki/computer/C.md'), 'c')
    writeFileSync(join(Dir, 'wiki/computer/C++.md'), 'c++')
    invalidateContentIndex(Dir)
    const { Inner } = capture()
    await expect(graphAware(Inner, Dir).load(ctx())).rejects.toThrow(/c/)
  })
})
