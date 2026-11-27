import { describe, expect, it } from 'vitest'
import { collectPending } from '../collect'
import { Base, makeSite } from './fixture'

describe('collectPending', () => {
  it('keeps only pending viz', () => {
    const R = collectPending(makeSite(Base))
    expect(R.Viz.map((v) => v.id)).toEqual(['demo'])
    expect(R.Viz[0].config.speed.value).toBe(1)
    expect(R.postPaths).toEqual(['posts/jekyll/sample'])
  })

  it('throws with viz id when post missing', () => {
    const Site = makeSite({ ...Base, 'src/viz/demo/review.json': JSON.stringify({ status: 'pending', post: 'posts/jekyll/none', note: '', updated: '' }) })
    expect(() => collectPending(Site)).toThrow(/demo/)
  })

  it('throws when post has no block for viz', () => {
    const Site = makeSite({ ...Base, 'src/content/posts/jekyll/sample.md': '---\ntitle: x\n---\n\n본문\n' })
    expect(() => collectPending(Site)).toThrow(/demo/)
  })
})
