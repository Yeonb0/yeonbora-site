import { describe, expect, it } from 'vitest'
import { topicColors } from '../wiki-topics'

describe('topicColors', () => {
  it('무지개 순서 : 첫 카테고리는 빨강, 마지막은 보라, 기타는 회색', () => {
    const C = topicColors(['network', 'database', 'ml', 'etc'])
    expect(C.get('network')).toBe('#e87373')
    expect(C.get('ml')).toBe('#c173e8')
    expect(C.get('etc')).toBe('#8e8da6')
  })

  it('카테고리 하나면 빨강', () => {
    expect(topicColors(['network']).get('network')).toBe('#e87373')
  })
})
