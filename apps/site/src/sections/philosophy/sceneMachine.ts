// 장면 전환 상태 기계 : idle → leaving (지금 장면이 확대되며 사라짐) → entering (새 장면이 내려앉음) → idle
// 전환 중에는 새 go 를 받지 않고, 전환 중 들어온 뒤로가기 (pop) 는 전환이 끝난 뒤 이어서 처리한다
import { sceneToSearch } from './route'
import type { Rect, Scene } from './types'

export type Phase = 'idle' | 'leaving' | 'entering'

export interface MachineState {
  scene: Scene
  phase: Phase
  next: Scene | null
  // 확대 원점 : 누른 아치 · 문 · 액자 영역 (뒤로가기는 null)
  origin: Rect | null
  pendingPop: Scene | null
}

export type Event =
  | { type: 'go'; to: Scene; origin: Rect | null }
  | { type: 'left' }
  | { type: 'entered' }
  | { type: 'pop'; to: Scene }

export const idle = (scene: Scene): MachineState => ({ scene, phase: 'idle', next: null, origin: null, pendingPop: null })

const same = (a: Scene, b: Scene) => sceneToSearch(a) === sceneToSearch(b)

export const reduce = (s: MachineState, e: Event): MachineState => {
  switch (e.type) {
    case 'go':
      if (s.phase !== 'idle' || same(s.scene, e.to)) return s
      return { ...s, phase: 'leaving', next: e.to, origin: e.origin }
    case 'pop':
      if (s.phase !== 'idle') return { ...s, pendingPop: e.to }
      if (same(s.scene, e.to)) return s
      return { ...s, phase: 'leaving', next: e.to, origin: null }
    case 'left':
      if (s.phase !== 'leaving' || !s.next) return s
      return { ...s, scene: s.next, phase: 'entering', next: null }
    case 'entered': {
      if (s.phase !== 'entering') return s
      const Done = { ...s, phase: 'idle' as const, origin: null, pendingPop: null }
      return s.pendingPop && !same(s.pendingPop, s.scene) ? { ...Done, phase: 'leaving', next: s.pendingPop } : Done
    }
  }
}
