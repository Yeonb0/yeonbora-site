import { describe, expect, it } from 'vitest'
import { TabKeys, describeApi, parseHash, resolveStart, shouldPoll } from '../stage'
import { Weeks, pad } from '../data'

describe('parseHash', () => {
  it('탭 · 장 · 주차를 읽는다', () => {
    expect(parseHash('#slides-3')).toEqual({ tab: 'slides', n: '3' })
    expect(parseHash('#demo')).toEqual({ tab: 'demo', n: undefined })
    expect(parseHash('#wiki-07')).toEqual({ tab: 'wiki', n: '07' })
  })

  it('모르는 해시는 null', () => {
    expect(parseHash('')).toBeNull()
    expect(parseHash('#foo')).toBeNull()
    expect(parseHash('#slides-x')).toBeNull()
  })
})

describe('첫 화면 · 탭 순서', () => {
  it('숫자키 0 1 2 3', () => {
    expect(TabKeys).toEqual({ '0': 'home', '1': 'demo', '2': 'slides', '3': 'wiki' })
  })

  it('#home 과 빈 해시는 첫 화면', () => {
    expect(parseHash('#home')).toEqual({ tab: 'home', n: undefined })
    expect(resolveStart('', 2, ['01'])).toEqual({ tab: 'home', slide: 0, week: null })
  })

  it('없는 장 · 주차는 그 탭의 처음으로', () => {
    expect(resolveStart('#slides-99', 2, ['01'])).toEqual({ tab: 'slides', slide: 0, week: null })
    expect(resolveStart('#wiki-04', 2, ['01', '07'])).toEqual({ tab: 'wiki', slide: 0, week: '01' })
    expect(resolveStart('#slides-2', 2, ['01'])).toEqual({ tab: 'slides', slide: 1, week: null })
  })
})

describe('공개 시연 서버 상태', () => {
  it('연결되면 모델을 적는다', () => {
    expect(describeApi('up', { model_id: 'x/y', base_model_id: 'Qwen3-8B' })).toEqual({
      dot: 'ok',
      line: '미리 돌린 볼트 : 로컬 Qwen3-8B, 라이브 : x/y',
    })
  })

  it('모델 정보가 없어도 깨지지 않는다', () => {
    expect(describeApi('up', { status: 'ok' }).line).toBe('연결됨, 모델 정보 없음')
    expect(describeApi('up', null).line).toBe('연결됨, 모델 정보 없음')
  })

  it('깨우는 중은 오류처럼 보이지 않는다', () => {
    expect(describeApi('waking', null)).toEqual({ dot: 'wait', line: '서버를 깨우는 중입니다 (최대 1분)' })
  })

  it('끊김 · 확인 전', () => {
    expect(describeApi('down', null).dot).toBe('down')
    expect(describeApi('unknown', null).dot).toBe('wait')
  })

  it('숨은 탭에서는 확인하지 않는다', () => {
    expect(shouldPoll('hidden')).toBe(false)
    expect(shouldPoll('visible')).toBe(true)
  })
})

describe('Weeks', () => {
  it('주차는 오름차순이고 겹치지 않는다', () => {
    const N = Weeks.map((w) => w.week)
    expect([...N].sort((a, b) => a - b)).toEqual(N)
    expect(new Set(N).size).toBe(N.length)
  })

  it('해시용 두 자리', () => {
    expect(pad(1)).toBe('01')
    expect(pad(11)).toBe('11')
  })
})
