import { describe, expect, it, vi } from 'vitest'
import { formatDate } from '../format-date'

describe('formatDate', () => {
  it('formats in Korea time as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-06-24T15:30:00Z'))).toBe('2026-06-25')
    expect(formatDate(new Date('2026-01-18'))).toBe('2026-01-18')
  })

  // 글 화면마다 전체 글 목록 날짜를 찍는다 : 호출마다 Intl.DateTimeFormat 을 만들면 off-heap 메모리가 쌓여 빌드가 죽는다 (글 430편에서 6 GB)
  it('does not create a formatter per call', () => {
    const Spy = vi.spyOn(Intl, 'DateTimeFormat')
    for (let I = 0; I < 100; I++) formatDate(new Date())
    expect(Spy).not.toHaveBeenCalled()
    Spy.mockRestore()
  })
})
