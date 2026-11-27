// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { StepControls } from '../StepControls'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mount = (k: number, playing: boolean) => {
  const dispatch = vi.fn()
  const Div = document.createElement('div')
  act(() => createRoot(Div).render(<StepControls k={k} last={4} playing={playing} dispatch={dispatch} />))
  const btn = (label: string) => Div.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
  return { Div, dispatch, btn }
}

describe('StepControls', () => {
  it('buttons dispatch their actions', () => {
    const { dispatch, btn } = mount(2, true)
    act(() => btn('다시보기').click())
    act(() => btn('이전').click())
    act(() => btn('일시정지').click())
    act(() => btn('다음').click())
    expect(dispatch.mock.calls.map((c) => c[0].type)).toEqual(['replay', 'prev', 'toggle', 'next'])
  })
  it('shows play label when paused', () => {
    expect(mount(2, false).btn('재생')).toBeTruthy()
  })
  it('disables prev at start and next at end', () => {
    expect(mount(0, false).btn('이전').disabled).toBe(true)
    expect(mount(4, false).btn('다음').disabled).toBe(true)
  })
  it('shows step position', () => {
    expect(mount(2, false).Div.textContent).toContain('3 / 5')
  })
})
