// 장면 ↔ 주소 (?wing=&room=)
import { RoomsOf } from './types'
import type { RoomId, Scene, Wing } from './types'

const Wings: Wing[] = ['west', 'east']

export const sceneToSearch = (scene: Scene): string => {
  if (scene.kind === 'crossroads') return ''
  if (scene.kind === 'hall') return `?wing=${scene.wing}`
  return `?wing=${scene.wing}&room=${scene.room}`
}

// 잘못된 값은 고칠 수 있는 만큼 고친다 : 없는 wing → 갈림길, 다른 관의 room → 그 관의 홀
export const parseScene = (search: string): { scene: Scene; canonical: string } => {
  const Params = new URLSearchParams(search)
  const WingRaw = Params.get('wing')
  const RoomRaw = Params.get('room')
  let scene: Scene = { kind: 'crossroads' }
  if (WingRaw && (Wings as string[]).includes(WingRaw)) {
    const wing = WingRaw as Wing
    scene = RoomRaw && (RoomsOf[wing] as string[]).includes(RoomRaw) ? { kind: 'room', wing, room: RoomRaw as RoomId } : { kind: 'hall', wing }
  }
  return { scene, canonical: sceneToSearch(scene) }
}

export const parentOf = (scene: Scene): Scene | null => {
  if (scene.kind === 'room') return { kind: 'hall', wing: scene.wing }
  if (scene.kind === 'hall') return { kind: 'crossroads' }
  return null
}

export const AllScenes: Scene[] = [
  { kind: 'crossroads' },
  ...Wings.flatMap((wing): Scene[] => [{ kind: 'hall', wing }, ...RoomsOf[wing].map((room): Scene => ({ kind: 'room', wing, room }))]),
]
