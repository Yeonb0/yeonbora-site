import { describe, expect, it } from 'vitest'
import { DesktopItems, Langs, PlCourse, blogHref } from '../desktop'
import { Folders } from '../../posts/data'
import { parseHash } from '../../posts/desk'

const Known = new Set(Folders.map((f) => f.id))
const Linked = [...DesktopItems, PlCourse, ...Langs].filter((it) => it.blog)

describe('컴퓨터 방 → 기술 블로그', () => {
  it('아이콘의 blog 는 기술 블로그에 있는 폴더 id', () => {
    for (const it of Linked) expect(Known.has(it.blog!), it.id).toBe(true)
  })

  it('블로그 주소의 해시가 그 폴더로 열린다', () => {
    for (const it of Linked) {
      const Href = blogHref(it.blog!)
      expect(Href.startsWith('/posts/#')).toBe(true)
      expect(parseHash(Href.slice('/posts/'.length)).folder).toBe(it.blog)
    }
  })
})
