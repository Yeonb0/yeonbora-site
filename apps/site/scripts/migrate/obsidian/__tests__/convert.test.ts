import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { WikiSchema } from '../../../../src/lib/content/schemas'
import { convertNote } from '../convert'
import type { VaultNote } from '../vault'

const note = (relPath: string, data: Record<string, unknown> = {}, body = '본문\n'): VaultNote => ({
  relPath,
  stem: (relPath.split('/').pop() ?? relPath).replace(/\.md$/, ''),
  data,
  rawFront: null,
  body,
})

const split = (text: string) => {
  const M = text.match(/^---\n([\s\S]*?)---\n/)
  if (!M) throw new Error('frontmatter 없음')
  return { front: M[1], data: parse(M[1]) as Record<string, unknown>, body: text.slice(M[0].length) }
}

describe('convertNote', () => {
  it('body is byte-identical', () => {
    const Body = '줄1\r\n%% 주석 %%\r\n| a | b |\r\n$$ x $$\r\n끝 줄바꿈 없음'
    const R = convertNote(note('자료구조/배열.md', {}, Body), {})
    expect(R.text.endsWith('---\n' + Body)).toBe(true)
    expect(split(R.text).body).toBe(Body)
  })

  it('frontmatter round-trips through WikiSchema', () => {
    for (const T of ['!important', 'C++', 'A: B', '"따옴표"', '#태그', '- 시작']) {
      const R2 = convertNote({ ...note('프로그래밍 언어/x.md'), stem: T }, {})
      const { data } = split(R2.text)
      expect(WikiSchema.parse(data).title).toBe(T)
    }
  })

  it('note without frontmatter gets one', () => {
    const R = convertNote(note('자료구조/배열.md'), {})
    const { data, front } = split(R.text)
    expect(R.path).toBe('wiki/computer/자료구조/배열.md')
    expect(data).toEqual({
      title: '배열',
      aliases: [],
      tags: [],
      field: 'computer',
      topic: 'data-structure',
      source: 'obsidian',
      sourcePath: '자료구조/배열.md',
    })
    expect(Object.keys(data)).toEqual(['title', 'aliases', 'tags', 'field', 'topic', 'source', 'sourcePath'])
    expect(front).toContain('aliases: []')
  })

  it('root note goes straight under wiki/computer with topic etc', () => {
    const R = convertNote(note('잡담.md'), {})
    expect(R.path).toBe('wiki/computer/잡담.md')
    expect(split(R.text).data.topic).toBe('etc')
  })

  it('rename keeps old name as first alias', () => {
    const N = note('프로그래밍 언어/CSS/!important.md', { aliases: ['임포턴트', '!important'] })
    const R = convertNote(N, { newStem: '!important (CSS)' })
    const { data } = split(R.text)
    expect(R.path).toBe('wiki/computer/프로그래밍 언어/CSS/!important (CSS).md')
    expect(data.title).toBe('!important (CSS)')
    expect(data.aliases).toEqual(['!important', '임포턴트'])
    expect(data.sourcePath).toBe('프로그래밍 언어/CSS/!important.md')
  })

  it('rename inserts old name when aliases missing', () => {
    const R = convertNote(note('자료구조/_MOC/데이터 전환.md'), { newStem: '데이터 전환 (MOC)' })
    expect(split(R.text).data.aliases).toEqual(['데이터 전환'])
  })

  it('extra keys kept in original order after autolink', () => {
    const N = note('머신러닝/a.md', {
      domain: 'ml',
      autolink: false,
      formulation: 'x',
      'autolink-in': false,
      cssclasses: ['wide'],
    })
    const { data } = split(convertNote(N, {}).text)
    expect(Object.keys(data)).toEqual([
      'title', 'aliases', 'tags', 'field', 'topic', 'source', 'sourcePath',
      'autolink', 'domain', 'formulation', 'autolink-in', 'cssclasses',
    ])
    expect(data.autolink).toBe(false)
    expect(data['autolink-in']).toBe(false)
    expect(data.cssclasses).toEqual(['wide'])
  })

  it('autolink true or missing writes no key', () => {
    expect(split(convertNote(note('a.md', { autolink: true }), {}).text).data).not.toHaveProperty('autolink')
  })

  it('Main source key moves to sourceDoc', () => {
    const { data } = split(convertNote(note('a.md', { source: '원본 문서.md' }), {}).text)
    expect(data.source).toBe('obsidian')
    expect(data.sourceDoc).toBe('원본 문서.md')
    expect(WikiSchema.parse(data).source).toBe('obsidian')
  })

  it('aliases and tags normalize to lists', () => {
    const A = split(convertNote(note('a.md', { aliases: null, tags: 'x' }), {}).text).data
    expect(A.aliases).toEqual([])
    expect(A.tags).toEqual(['x'])
    const B = split(convertNote(note('a.md', { aliases: '하나', tags: ['T', 'T'] }), {}).text).data
    expect(B.aliases).toEqual(['하나'])
    expect(B.tags).toEqual(['T', 'T'])
  })

  it('created : Main wins, then Opts, else omitted', () => {
    const C = (data: Record<string, unknown>, created?: string) =>
      split(convertNote(note('a.md', data), { created }).text).data.created
    expect(C({ created: '2026-01-02' }, '2020-01-01')).toBe('2026-01-02')
    expect(C({ created: new Date('2026-03-04T00:00:00Z') })).toBe('2026-03-04')
    expect(C({}, '2020-01-01')).toBe('2020-01-01')
    expect(C({})).toBeUndefined()
  })
})
