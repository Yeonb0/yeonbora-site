import { describe, expect, it } from 'vitest'
import { plainText, searchItems, type SearchItem } from '../search'

const Item = (title: string, text = '', extra: Partial<SearchItem> = {}): SearchItem => ({ kind: 'wiki', title, href: `/wiki/${title}`, text, aliases: [], tags: [], label: '', ...extra })

describe('plainText', () => {
  it('마크다운 기호 · 코드 · 그림을 걷어내고 위키 링크는 보이는 글자만', () => {
    const Md = '### 제목\n- [[ACK]] 와 [[Error|오류]] ![[a.png]]\n```c\nint x;\n```\n**굵게** `코드` [링크](http://x) ==ex)== $x^2$'
    expect(plainText(Md, 200)).toBe('제목 ACK 와 오류 굵게 코드 링크 ex) x^2')
  })

  it('표 · 수식 명령은 글자만 남긴다', () => {
    const Md = '| 특징 | 설명 |\n| --- | :---: |\n| 완전성 | 잃지 않음 |\n$\\text{DBMS, DataBase}$ 와 $\\frac{a}{b}$'
    expect(plainText(Md, 200)).toBe('특징 설명 완전성 잃지 않음 DBMS, DataBase 와 a b')
  })

  it('길이 제한', () => {
    expect(plainText('가나다라마바사', 3)).toBe('가나다…')
  })
})

describe('searchItems', () => {
  const Items = [Item('데이터베이스'), Item('관계형 데이터베이스'), Item('SQL', '관계형 데이터베이스 질의'), Item('ACK', '', { aliases: ['긍정 응답'] }), Item('Timeout')]

  it('제목이 같은 것 > 제목으로 시작 > 제목에 포함 > 본문에 포함', () => {
    expect(searchItems(Items, '데이터베이스').map((i) => i.title)).toEqual(['데이터베이스', '관계형 데이터베이스', 'SQL'])
  })

  it('대소문자 무시, 별칭도 찾는다', () => {
    expect(searchItems(Items, 'ack').map((i) => i.title)).toEqual(['ACK'])
    expect(searchItems(Items, '긍정').map((i) => i.title)).toEqual(['ACK'])
  })

  it('여러 낱말은 모두 들어 있어야 한다, 빈 검색은 결과 없음', () => {
    expect(searchItems(Items, '관계형 질의').map((i) => i.title)).toEqual(['SQL'])
    expect(searchItems(Items, '   ')).toEqual([])
  })
})
