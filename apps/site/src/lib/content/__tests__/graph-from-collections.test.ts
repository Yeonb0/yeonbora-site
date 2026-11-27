import { describe, expect, it } from 'vitest'
import { toNodes } from '../graph-from-collections'

describe('toNodes', () => {
  it('copies id, title, aliases and body', () => {
    const Nodes = toNodes(
      [{ id: 'ack', data: { title: 'ACK', aliases: ['긍정 응답'] }, body: '[[Timeout]]' }],
      [{ id: 'framing', data: { title: '[Network] Framing' }, body: undefined }],
    )
    expect(Nodes).toEqual([
      { collection: 'wiki', slug: 'ack', title: 'ACK', aliases: ['긍정 응답'], body: '[[Timeout]]' },
      { collection: 'posts', slug: 'framing', title: '[Network] Framing', aliases: [], body: '' },
    ])
  })

  it('copies wiki sourcePath', () => {
    const [N] = toNodes([{ id: 'a', data: { title: 'A', sourcePath: 'x/a.md' }, body: '' }], [])
    expect(N.sourcePath).toBe('x/a.md')
  })
})
