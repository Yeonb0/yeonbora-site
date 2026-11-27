import { describe, expect, it } from 'vitest'
import { initSteps, stepReducer, type StepState } from '../steps'

const S = (k: number, playing: boolean, last = 4): StepState => ({ k, playing, last })

describe('initSteps', () => {
  it('autoplays from the start by default', () => {
    expect(initSteps(4, false)).toEqual(S(0, true))
  })
  it('reduced motion starts paused on the last frame', () => {
    expect(initSteps(4, true)).toEqual(S(4, false))
  })
})

describe('stepReducer', () => {
  it('tick advances while playing', () => {
    expect(stepReducer(S(1, true), { type: 'tick', loop: true })).toEqual(S(2, true))
  })
  it('tick at end loops to start when loop', () => {
    expect(stepReducer(S(4, true), { type: 'tick', loop: true })).toEqual(S(0, true))
  })
  it('tick at end stops when not loop', () => {
    expect(stepReducer(S(4, true), { type: 'tick', loop: false })).toEqual(S(4, false))
  })
  it('tick does nothing when paused', () => {
    expect(stepReducer(S(1, false), { type: 'tick', loop: true })).toEqual(S(1, false))
  })
  it('next and prev pause and clamp', () => {
    expect(stepReducer(S(1, true), { type: 'next' })).toEqual(S(2, false))
    expect(stepReducer(S(4, false), { type: 'next' })).toEqual(S(4, false))
    expect(stepReducer(S(1, true), { type: 'prev' })).toEqual(S(0, false))
    expect(stepReducer(S(0, false), { type: 'prev' })).toEqual(S(0, false))
  })
  it('replay restarts and plays', () => {
    expect(stepReducer(S(3, false), { type: 'replay' })).toEqual(S(0, true))
  })
  it('toggle pauses, resumes, restarts at end', () => {
    expect(stepReducer(S(2, true), { type: 'toggle' })).toEqual(S(2, false))
    expect(stepReducer(S(2, false), { type: 'toggle' })).toEqual(S(2, true))
    expect(stepReducer(S(4, false), { type: 'toggle' })).toEqual(S(0, true))
  })
  it('reset keeps frame in range when frame count shrinks', () => {
    expect(stepReducer(S(4, false), { type: 'reset', last: 2, reduced: false })).toEqual(S(0, true, 2))
    expect(stepReducer(S(4, false), { type: 'reset', last: 2, reduced: true })).toEqual(S(2, false, 2))
  })
})
