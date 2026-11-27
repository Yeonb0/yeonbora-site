// 단계형 시각화 공용 재생기 : 자동 재생 + 다시보기 · 이전 / 다음 · 재생 / 일시정지
import { useEffect, useReducer } from 'react'

export interface StepState {
  k: number
  playing: boolean
  last: number
}

export type StepAction =
  | { type: 'tick'; loop: boolean }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'replay' }
  | { type: 'toggle' }
  | { type: 'reset'; last: number; reduced: boolean }

// 기본은 처음부터 자동 재생, reduced-motion 이면 마지막 장면에서 멈춘 채 시작
export const initSteps = (last: number, reduced: boolean): StepState => (reduced ? { k: last, playing: false, last } : { k: 0, playing: true, last })

export function stepReducer(s: StepState, a: StepAction): StepState {
  switch (a.type) {
    case 'tick':
      if (!s.playing) return s
      if (s.k < s.last) return { ...s, k: s.k + 1 }
      return a.loop ? { ...s, k: 0 } : { ...s, playing: false }
    case 'next':
      return { ...s, k: Math.min(s.k + 1, s.last), playing: false }
    case 'prev':
      return { ...s, k: Math.max(s.k - 1, 0), playing: false }
    case 'replay':
      return { ...s, k: 0, playing: true }
    case 'toggle':
      if (s.playing) return { ...s, playing: false }
      return s.k >= s.last ? { ...s, k: 0, playing: true } : { ...s, playing: true }
    case 'reset':
      return initSteps(a.last, a.reduced)
  }
}

export interface StepOptions {
  // 한 칸 시간 (ms, 속도 1 기준) · 끝 장면을 보여 주는 시간 (ms)
  stepMs: number
  holdMs: number
  speed: number
  loop: boolean
  reduced: boolean
}

export function useSteps(count: number, o: StepOptions) {
  const Last = Math.max(count - 1, 0)
  const [s, dispatch] = useReducer(stepReducer, initSteps(Last, o.reduced))

  useEffect(() => dispatch({ type: 'reset', last: Last, reduced: o.reduced }), [Last, o.reduced])

  useEffect(() => {
    if (!s.playing || count === 0) return
    const Wait = s.k >= s.last ? o.holdMs : o.stepMs / o.speed
    const T = window.setTimeout(() => dispatch({ type: 'tick', loop: o.loop }), Wait)
    return () => window.clearTimeout(T)
  }, [s, count, o.holdMs, o.stepMs, o.speed, o.loop])

  return { ...s, dispatch }
}
