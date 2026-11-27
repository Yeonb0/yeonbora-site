// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Controls } from '../Controls'
import { ReviewBar } from '../ReviewBar'
import type { VizConfig } from '@/viz/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const Config: VizConfig = {
  speed: { type: 'range', min: 0, max: 3, step: 0.5, value: 1, label: '속도' },
  loop: { type: 'toggle', value: true, label: '반복' },
  labels: { type: 'text', value: { a: '가', b: '나' }, label: '라벨' },
}

const mount = (el: React.ReactElement) => {
  const Div = document.createElement('div')
  document.body.append(Div)
  act(() => createRoot(Div).render(el))
  return Div
}

const setValue = (input: HTMLInputElement, v: string) => {
  const Set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  Set.call(input, v)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Controls', () => {
  beforeEach(() => (document.body.innerHTML = ''))

  it('one edit per commit', () => {
    const onCommit = vi.fn()
    const Div = mount(<Controls config={Config} values={{ speed: 1, loop: true, labels: { a: '가', b: '나' } }} onCommit={onCommit} />)
    const Range = Div.querySelector<HTMLInputElement>('input[type=range]')!
    act(() => {
      for (let i = 0; i < 10; i++) setValue(Range, String(i % 2 ? 1.5 : 2))
    })
    expect(onCommit).not.toHaveBeenCalled()
    act(() => Range.dispatchEvent(new Event('change', { bubbles: true })))
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('speed', 1.5)
  })

  it('no edit when value unchanged', () => {
    const onCommit = vi.fn()
    const Div = mount(<Controls config={Config} values={{ speed: 1, loop: true, labels: { a: '가', b: '나' } }} onCommit={onCommit} />)
    const Range = Div.querySelector<HTMLInputElement>('input[type=range]')!
    act(() => Range.dispatchEvent(new Event('change', { bubbles: true })))
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('text object commits whole object', () => {
    const onCommit = vi.fn()
    const Div = mount(<Controls config={Config} values={{ speed: 1, loop: true, labels: { a: '가', b: '나' } }} onCommit={onCommit} />)
    const Inp = Div.querySelector<HTMLInputElement>('input[data-key="labels.b"]')!
    act(() => setValue(Inp, '다'))
    act(() => Inp.dispatchEvent(new Event('change', { bubbles: true })))
    expect(onCommit).toHaveBeenCalledWith('labels', { a: '가', b: '다' })
  })

  it('toggle commits on click', () => {
    const onCommit = vi.fn()
    const Div = mount(<Controls config={Config} values={{ speed: 1, loop: true, labels: { a: '가', b: '나' } }} onCommit={onCommit} />)
    act(() => Div.querySelector<HTMLInputElement>('input[type=checkbox]')!.click())
    expect(onCommit).toHaveBeenCalledWith('loop', false)
  })

  it('select commits new value', () => {
    const onCommit = vi.fn()
    const Cfg: VizConfig = { mode: { type: 'select', options: ['a', 'b'], value: 'a', label: '모드' } }
    const Div = mount(<Controls config={Cfg} values={{ mode: 'a' }} onCommit={onCommit} />)
    const Sel = Div.querySelector('select')!
    act(() => {
      Sel.value = 'b'
      Sel.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(onCommit).toHaveBeenCalledWith('mode', 'b')
  })

  it('disabled when read only', () => {
    const Div = mount(<Controls config={Config} values={{ speed: 1, loop: true, labels: { a: '가', b: '나' } }} onCommit={() => {}} readOnly />)
    expect(Div.querySelector<HTMLInputElement>('input[type=range]')!.disabled).toBe(true)
  })
})

describe('ReviewBar', () => {
  beforeEach(() => (document.body.innerHTML = ''))

  it('read only shows notice and disables buttons', () => {
    const Div = mount(<ReviewBar canWrite={false} onReview={() => {}} />)
    expect(Div.textContent).toContain('기록할 수 없음')
    Div.querySelectorAll('button').forEach((b) => expect(b.disabled).toBe(true))
  })

  it('reject sends note', () => {
    const onReview = vi.fn()
    const Div = mount(<ReviewBar canWrite onReview={onReview} />)
    const Note = Div.querySelector('textarea')!
    act(() => {
      const Set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
      Set.call(Note, '색이 어두움')
      Note.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => Div.querySelector<HTMLButtonElement>('button[data-act="rejected"]')!.click())
    expect(onReview).toHaveBeenCalledWith('rejected', '색이 어두움')
  })
})
