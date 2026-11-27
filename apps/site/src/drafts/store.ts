// 아티팩트 db 연결 : 없거나 10초 안에 답이 없으면 null (보기 전용)
import { editId, type Edit } from './edits'

export type StoredEdit = Edit & { id: string }

export interface Store {
  add(e: Edit): Promise<void>
  subscribe(cb: (Edits: StoredEdit[]) => void, onError: (code: string) => void): () => void
}

type Snap = { id: string; data(): Record<string, unknown> | undefined }
type Col = {
  doc(id: string): { set(d: Record<string, unknown>): Promise<void> }
  where(f: string, op: string, v: unknown): { onSnapshot(n: (s: { docs: Snap[] }) => void, e: (err: { code: string }) => void): () => void }
}
type Db = { collection(path: string): Col }
type ClaudeRuntime = { use(name: string): Promise<unknown> }

const sleep = (ms: number) => new Promise<null>((r) => setTimeout(() => r(null), ms))

async function runtime(deadline: number): Promise<ClaudeRuntime | null> {
  while (Date.now() < deadline) {
    const C = (window as { claude?: ClaudeRuntime }).claude
    if (C?.use) return C
    await sleep(200)
  }
  return null
}

export async function openStore(timeoutMs = 10000): Promise<Store | null> {
  const Deadline = Date.now() + timeoutMs
  const C = await runtime(Deadline)
  if (!C) return null
  let D: Db | null
  try {
    D = (await Promise.race([C.use('db'), sleep(Math.max(Deadline - Date.now(), 0))])) as Db | null
  } catch {
    return null
  }
  if (!D) return null
  const Edits = D.collection('edits')
  return {
    add: (e) => Edits.doc(editId(e)).set(e as unknown as Record<string, unknown>),
    subscribe: (cb, onError) =>
      Edits.where('applied', '==', false).onSnapshot(
        (s) => cb(s.docs.map((d) => ({ ...(d.data() as Edit), id: d.id }))),
        (err) => onError(err.code),
      ),
  }
}

// 쓰기 실패 뒤의 상태 : 일시적인 것만 계속 쓸 수 있게 둔다
const Transient = new Set(['unavailable', 'resource_exhausted'])
export function writeErrorState(code: string | undefined): { canWrite: boolean; message: string } {
  if (code === 'quota_exceeded') return { canWrite: true, message: '기록 공간이 가득 참' }
  if (code && Transient.has(code)) return { canWrite: true, message: '기록하지 못함 (잠시 뒤 다시)' }
  return { canWrite: false, message: '기록할 수 없음' }
}
