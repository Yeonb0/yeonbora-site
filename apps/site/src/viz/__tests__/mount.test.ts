// @vitest-environment jsdom
import { createElement } from 'react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountViz, observeViz, type Loader } from '../mount'
import type { VizProps } from '../types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const Show = ({ values }: VizProps) => createElement('span', null, `speed=${values.speed}`)
const Config = { speed: { type: 'range' as const, min: 0, max: 3, step: 0.5, value: 1, label: '속도' } }
const load: Loader = (id) => (id === 'demo' ? Promise.resolve({ default: Show, config: Config }) : undefined)

const figure = (id: string) => {
  const El = document.createElement('figure')
  El.dataset.viz = id
  El.innerHTML = '<div class="viz-mount"></div>'
  document.body.append(El)
  return El
}

describe('mountViz', () => {
  beforeEach(() => (document.body.innerHTML = ''))

  it('renders config values', async () => {
    const El = figure('demo')
    await act(() => mountViz(El, load))
    expect(El.querySelector('.viz-mount')!.textContent).toBe('speed=1')
  })

  it('uses override values', async () => {
    const El = figure('demo')
    await act(() => mountViz(El, load, { speed: 2.5 }))
    expect(El.textContent).toBe('speed=2.5')
  })
})

describe('observeViz', () => {
  let Callbacks: ((Entries: { isIntersecting: boolean; target: Element }[]) => void)[] = []
  beforeEach(() => {
    document.body.innerHTML = ''
    Callbacks = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (typeof Callbacks)[number]) {
          Callbacks.push(cb)
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('loads once even if intersecting twice', async () => {
    const El = figure('demo')
    const spy = vi.fn(load)
    observeViz(document, spy)
    await act(async () => {
      Callbacks[0]([{ isIntersecting: true, target: El }])
      Callbacks[0]([{ isIntersecting: true, target: El }])
    })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(El.textContent).toBe('speed=1')
  })

  it('cleanup unmounts mounted viz', async () => {
    const El = figure('demo')
    const stop = observeViz(document, load)
    await act(async () => Callbacks[0]([{ isIntersecting: true, target: El }]))
    expect(El.textContent).toBe('speed=1')
    await act(async () => stop())
    expect(El.querySelector('.viz-mount')!.innerHTML).toBe('')
  })

  it('warns and leaves figure for unknown id', async () => {
    const El = figure('nope')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    observeViz(document, load)
    await act(async () => Callbacks[0]([{ isIntersecting: true, target: El }]))
    expect(warn).toHaveBeenCalled()
    expect(El.querySelector('.viz-mount')!.innerHTML).toBe('')
  })
})
