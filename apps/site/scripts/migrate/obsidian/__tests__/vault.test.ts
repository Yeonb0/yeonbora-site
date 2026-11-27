import { describe, expect, it } from 'vitest'
import { computeBacklog, findSlugClashes, listVault, renameMap } from '../vault'
import { topicOf } from '../topics'
import { makeVault } from './fixture'

describe('listVault', () => {
  it('excludes infra and unpublished', () => {
    const Dir = makeVault({
      'README.md': '# readme',
      'scripts/a.md': 'a',
      'templete/b.md': 'b',
      '자료구조/_pending/c.md': 'c',
      '자료구조/_inbox/i.md': 'i',
      '공부 기록.base': 'x',
      'x.base': 'x',
      '자료구조/숨김.md': '---\npublish: false\n---\n본문',
      '자료구조/대기.md': '---\nstatus: pending\n---\n본문',
      '자료구조/배열.md': '---\ntitle: 배열\n---\n본문\n',
    })
    const { Notes, Excluded } = listVault(Dir)
    expect(Notes.map((n) => n.relPath)).toEqual(['자료구조/배열.md'])
    const Reason = Object.fromEntries(Excluded.map((e) => [e.relPath, e.reason]))
    expect(Reason['README.md']).toBe('infra')
    expect(Reason['scripts/a.md']).toBe('infra')
    expect(Reason['templete/b.md']).toBe('infra')
    expect(Reason['x.base']).toBe('infra')
    expect(Reason['자료구조/_pending/c.md']).toBe('infra')
    expect(Reason['자료구조/_inbox/i.md']).toBe('infra')
    expect(Reason['자료구조/숨김.md']).toBe('publish-false')
    expect(Reason['자료구조/대기.md']).toBe('pending')
  })

  it('keeps MOC notes', () => {
    const Dir = makeVault({ '자료구조/_MOC/자료구조.md': '# moc' })
    expect(listVault(Dir).Notes.map((n) => n.relPath)).toEqual(['자료구조/_MOC/자료구조.md'])
  })

  it('keeps body byte-exact and survives bad yaml', () => {
    const Dir = makeVault({
      'a/좋음.md': '---\ntags: [x]\n---\n\n본문  \r\n끝',
      'a/나쁨.md': '---\nfoo: [\n---\n본문',
      'a/없음.md': '프론트 없음',
    })
    const N = Object.fromEntries(listVault(Dir).Notes.map((n) => [n.stem, n]))
    expect(N['좋음'].rawFront).toBe('tags: [x]')
    expect(N['좋음'].body).toBe('\n본문  \r\n끝')
    expect(N['나쁨'].data).toEqual({})
    expect(N['나쁨'].body).toBe('본문')
    expect(N['없음'].rawFront).toBeNull()
    expect(N['없음'].body).toBe('프론트 없음')
  })
})

describe('findSlugClashes / renameMap', () => {
  const Dir = makeVault({
    'CSS/!important.md': 'a',
    'JS/!important.md': 'b',
    'p/C.md': 'c',
    'q/C++.md': 'd',
    'x/유일.md': 'e',
  })
  const { Notes } = listVault(Dir)

  it('catches same name and same slug', () => {
    const C = findSlugClashes(Notes)
    const Groups = [...C.values()].map((g) => g.map((n) => n.relPath).sort())
    expect(Groups).toHaveLength(2)
    expect(Groups).toContainEqual(['CSS/!important.md', 'JS/!important.md'])
    expect(Groups).toContainEqual(['p/C.md', 'q/C++.md'])
  })

  it('renameMap appends parent folder', () => {
    const R = renameMap(findSlugClashes(Notes), Notes)
    expect(R.get('CSS/!important.md')).toBe('!important (CSS)')
    expect(R.get('JS/!important.md')).toBe('!important (JS)')
  })

  it('writes _MOC as MOC and skips a parent named like the stem', () => {
    const Dir2 = makeVault({
      '정보처리기사/_MOC/데이터 전환.md': '1',
      '정보처리기사/데이터베이스 구축/데이터 전환/데이터 전환.md': '2',
    })
    const R = renameMap(findSlugClashes(listVault(Dir2).Notes), listVault(Dir2).Notes)
    expect(R.get('정보처리기사/_MOC/데이터 전환.md')).toBe('데이터 전환 (MOC)')
    expect(R.get('정보처리기사/데이터베이스 구축/데이터 전환/데이터 전환.md')).toBe('데이터 전환 (데이터베이스 구축)')
  })

  it('throws when new stem collides with another vault note', () => {
    const Dir2 = makeVault({ 'a/N.md': '1', 'b/N.md': '2', 'c/N (a).md': '3' })
    const { Notes: Ns } = listVault(Dir2)
    expect(() => renameMap(findSlugClashes(Ns), Ns)).toThrow(/c\/N \(a\)\.md/)
  })

  it('throws when new stems still collide', () => {
    const Dir2 = makeVault({ 'a/x/N.md': '1', 'b/x/N.md': '2' })
    const C = findSlugClashes(listVault(Dir2).Notes)
    expect(() => renameMap(C, listVault(Dir2).Notes)).toThrow(/a\/x\/N\.md.*b\/x\/N\.md/)
  })
})

describe('computeBacklog', () => {
  it('lists only unresolved targets', () => {
    const Dir = makeVault({
      'a/있음.md': '---\naliases: [별칭]\n---\n[[없음]] [[있음]] [[별칭]] [[#소제목]] ![[임베드]]\n```\n[[코드]]\n```\n`[[인라인]]` [[Zeta|표시]] [[없음#h]] [[ 없음 ]]',
    })
    expect(computeBacklog(listVault(Dir).Notes)).toEqual(['zeta', '없음'])
  })
})

describe('computeBacklog typographic apostrophes', () => {
  it('curly and straight forms agree', () => {
    const Dir = makeVault({
      "a/Prim's Algorithm.md": 'x',
      'a/A.md': '[[Prim\u2019s Algorithm]] [[Prim\u02BCs Algorithm]] [[Jensen\u2019s Device]] [[Jensen\u2018s Device]]',
      'a/B.md': "[[Prim's Algorithm]] [[Jensen's Device]]",
    })
    expect(computeBacklog(listVault(Dir).Notes)).toEqual(["jensen's device"])
  })
})

describe('computeBacklog path and table links', () => {
  it('treats path targets by Main path match', () => {
    const Dir = makeVault({
      'folder/note.md': 'x',
      'a/sub/note2.md': 'y',
      'z/본문.md': '[[folder/note]] [[Folder/NOTE]] [[sub/note2]] [[a/sub/note2.md]] [[nope/none]]',
    })
    expect(computeBacklog(listVault(Dir).Notes)).toEqual(['nope/none'])
  })

  it('resolves table link with escaped pipe', () => {
    const Dir = makeVault({ 'a/a.md': 'x', 'a/b.md': '| [[a\\|b]] |' })
    expect(computeBacklog(listVault(Dir).Notes)).toEqual([])
  })
})

describe('frontmatter edge cases', () => {
  it('handles CRLF and closing --- at EOF', () => {
    const Dir = makeVault({ 'a/crlf.md': '---\r\na: 1\r\n---\r\nbody', 'a/eof.md': '---\na: 1\n---' })
    const N = Object.fromEntries(listVault(Dir).Notes.map((n) => [n.stem, n]))
    expect(N['crlf'].data).toEqual({ a: 1 })
    expect(N['crlf'].body).toBe('body')
    expect(N['eof'].data).toEqual({ a: 1 })
    expect(N['eof'].body).toBe('')
  })
})

describe('topicOf', () => {
  it('maps folders', () => {
    expect(topicOf('컴퓨터 네트워크/Data Link Layer/ARQ.md')).toBe('network')
    expect(topicOf('LaTex.md')).toBe('etc')
    expect(topicOf('기타 정보들/a.md')).toBe('etc')
    expect(() => topicOf('모르는폴더/a.md')).toThrow()
  })
})

describe('BadFront', () => {
  it('reports notes whose frontmatter cannot be read, instead of treating them as empty', () => {
    const Dir = makeVault({
      'a/ok.md': '---\ntags: [x]\n---\n본문',
      'a/broken.md': '---\ntags: [x\n  : : bad\n---\n본문',
      'a/list.md': '---\n- a\n- b\n---\n본문',
      'a/empty.md': '---\n---\n본문',
      'a/none.md': '본문',
    })
    const { Notes, BadFront } = listVault(Dir)
    expect(BadFront.map((b) => b.relPath)).toEqual(['a/broken.md', 'a/list.md'])
    expect(BadFront[0].message).toContain('frontmatter')
    expect(Notes).toHaveLength(5)
  })
})

describe('computeBacklog path links use the graph rule', () => {
  it('an ambiguous tail (two notes end the same way) is not resolved, like the site', () => {
    const Dir = makeVault({ 'a/x/note.md': 'x', 'b/x/note.md': 'y', 'z/본문.md': '[[x/note]] [[a/x/note]]' })
    expect(computeBacklog(listVault(Dir).Notes)).toEqual(['x/note'])
  })
})
