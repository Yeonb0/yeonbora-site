// "시안 반영" : 작업대 db 의 미반영 기록을 저장소 파일 (config.json · review.json · 글) 에 적용한다
import type { Edit } from '../../src/drafts/edits'
import { validateValue, type Review, type VizConfig } from '../../src/viz/types'

export interface Repo {
  Configs: Record<string, VizConfig>
  Reviews: Record<string, Review>
  // 글 경로 → 파일 전체 (frontmatter 포함)
  Posts: Record<string, string>
}

export type StoredEdit = Edit & { id: string }

export interface ApplyResult {
  Repo: Repo
  Applied: string[]
  Skipped: { id: string; reason: string }[]
}

const count = (s: string, sub: string) => (sub ? s.split(sub).length - 1 : 0)

export function applyEdits(Input: Repo, Edits: StoredEdit[], today: string): ApplyResult {
  const Repo: Repo = structuredClone(Input)
  const Applied: string[] = []
  const Skipped: ApplyResult['Skipped'] = []
  const Todo = Edits.filter((e) => e.applied === false).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))

  // 같은 블록을 여러 번 고쳤으면 마지막 것만 원문에 적용하고, 앞의 것은 함께 반영된 것으로 본다
  const BodyKey = (e: Extract<Edit, { kind: 'body' }>) => `${e.post}\n${e.find}`
  const LastBody = new Map<string, string>()
  for (const e of Todo) if (e.kind === 'body') LastBody.set(BodyKey(e), e.id)
  const Superseded = new Map<string, string[]>()
  for (const e of Todo) {
    if (e.kind !== 'body') continue
    const Last = LastBody.get(BodyKey(e))!
    if (Last !== e.id) Superseded.set(Last, [...(Superseded.get(Last) ?? []), e.id])
  }

  for (const e of Todo) {
    const skip = (reason: string) => Skipped.push({ id: e.id, reason })
    if (e.kind === 'config') {
      const Field = Repo.Configs[e.vizId]?.[e.key]
      if (!Repo.Configs[e.vizId]) skip(`없는 시각화 : ${e.vizId}`)
      else if (!Field) skip(`없는 키 : ${e.vizId}.${e.key}`)
      else {
        const V = validateValue(Field, e.value)
        if (!V.ok) skip(`${e.vizId}.${e.key} : ${V.reason}`)
        else {
          // 문구 객체는 원래 키 순서를 지켜 diff 를 바뀐 줄만으로
          const Old = Field.value
          const Value = typeof Old === 'object' && Old && typeof V.value === 'object' ? Object.fromEntries(Object.keys(Old).map((k) => [k, (V.value as Record<string, string>)[k]])) : V.value
          Field.value = Value as never
          Applied.push(e.id)
        }
      }
    } else if (e.kind === 'review') {
      const R = Repo.Reviews[e.vizId]
      if (!R) skip(`없는 시각화 : ${e.vizId}`)
      else {
        Repo.Reviews[e.vizId] = { ...R, status: e.status, note: e.note, updated: today }
        Applied.push(e.id)
      }
    } else {
      if (LastBody.get(BodyKey(e)) !== e.id) continue
      const Text = Repo.Posts[e.post]
      const Group = [...(Superseded.get(e.id) ?? []), e.id]
      const N = Text === undefined ? -1 : count(Text, e.find)
      if (N === 1) {
        Repo.Posts[e.post] = Text.replace(e.find, () => e.replace)
        Applied.push(...Group)
      } else {
        const Why = N === -1 ? `없는 글 : ${e.post}` : N === 0 ? '원문에서 찾지 못함' : `원문에 ${N}번 나옴`
        for (const id of Group) Skipped.push({ id, reason: Why })
      }
    }
  }
  return { Repo, Applied, Skipped }
}
