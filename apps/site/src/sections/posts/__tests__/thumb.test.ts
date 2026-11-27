import { describe, expect, it } from 'vitest'
import { firstImage, resolveImage } from '../thumb'

describe('firstImage', () => {
  it('본문의 첫 이미지를 찾는다', () => {
    expect(firstImage('글\n![](../a/b.png)\n![](c.png)')).toEqual({ url: '../a/b.png', embed: false })
    expect(firstImage('![[그림.png|300]] 뒤 ![](x.png)')).toEqual({ url: '그림.png', embed: true })
    expect(firstImage('![설명](<a b.png> "제목")')).toEqual({ url: 'a b.png', embed: false })
  })
  it('코드 · 주석 · 노트 임베드 안의 것은 건너뛴다', () => {
    expect(firstImage('```\n![](no.png)\n```\n%% ![](no2.png) %%\n![[노트]]\n![](yes.png)')).toEqual({ url: 'yes.png', embed: false })
    expect(firstImage('이미지 없음')).toBeNull()
  })
})

describe('resolveImage', () => {
  it('글 파일 기준 상대 경로를 프로젝트 기준 경로로 바꾼다', () => {
    expect(resolveImage('src/content/posts/jekyll/a.md', '../../_assets/jekyll/a/img_1.png')).toBe('/src/content/_assets/jekyll/a/img_1.png')
    expect(resolveImage('src\\content\\posts\\a.md', './b.png')).toBe('/src/content/posts/b.png')
  })
})
