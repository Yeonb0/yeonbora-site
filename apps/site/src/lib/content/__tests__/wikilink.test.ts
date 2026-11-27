import { describe, expect, it } from 'vitest'
import { parseWikilinks, slugFromPath } from '../wikilink'

const targets = (md: string) => parseWikilinks(md).map((l) => l.target)

describe('parseWikilinks', () => {
  it('parses label', () => {
    expect(parseWikilinks('[[가비지 컬렉션|GC]]는')).toEqual([{ target: '가비지 컬렉션', label: 'GC', raw: '[[가비지 컬렉션|GC]]' }])
  })

  it('parses heading', () => {
    const [Link] = parseWikilinks('[[TLB#적중]]')
    expect(Link.target).toBe('TLB')
    expect(Link.heading).toBe('적중')
  })

  it('parses escaped pipe', () => {
    expect(parseWikilinks('[[TLB\\|티엘비]]')[0].label).toBe('티엘비')
  })

  it('skips code', () => {
    expect(targets('`[[a]]`\n```\n[[b]]\n```\n[[c]]')).toEqual(['c'])
  })

  it('ignores embeds', () => {
    expect(targets('![[그림.png]] ![[노트]] [[d]]')).toEqual(['d'])
  })
})

describe('slugFromPath', () => {
  it('slugifies the file name only', () => {
    expect(slugFromPath('wiki/computer/가비지 컬렉션.md')).toBe('가비지-컬렉션')
    expect(slugFromPath('posts/jekyll/2025-05-02-proxy.md')).toBe('2025-05-02-proxy')
  })
})
