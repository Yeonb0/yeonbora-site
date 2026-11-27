// 작업대 기록 : 수정 한 건 = db 문서 하나 (edits/<id>). "시안 반영" 이 이 모양 그대로 읽는다
import { toValues, type FieldValue, type Values, type VizConfig } from '../viz/types'

export type Applied = false | { commit: string; at: string }

export type Edit = { at: string; vizId: string; applied: Applied } & (
  | { kind: 'config'; key: string; value: FieldValue }
  | { kind: 'body'; post: string; find: string; replace: string }
  | { kind: 'review'; status: 'approved' | 'rejected'; note: string }
)

export type ConfigEdit = Extract<Edit, { kind: 'config' }>
export type BodyEdit = Extract<Edit, { kind: 'body' }>
export type ReviewEdit = Extract<Edit, { kind: 'review' }>

const now = () => new Date().toISOString()

export const configEdit = (vizId: string, key: string, value: FieldValue): ConfigEdit => ({ kind: 'config', vizId, key, value, at: now(), applied: false })
export const bodyEdit = (vizId: string, post: string, find: string, replace: string): BodyEdit => ({ kind: 'body', vizId, post, find, replace, at: now(), applied: false })
export const reviewEdit = (vizId: string, status: 'approved' | 'rejected', note: string): ReviewEdit => ({ kind: 'review', vizId, status, note, at: now(), applied: false })

// 아직 반영하지 않은 기록을 시간순으로
export const pendingSorted = (Edits: Edit[]): Edit[] => Edits.filter((e) => e.applied === false).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))

export function overlay(Config: VizConfig, Edits: Edit[], vizId: string): Values {
  const Out = toValues(Config)
  for (const e of pendingSorted(Edits)) {
    if (e.kind === 'config' && e.vizId === vizId && e.key in Config) Out[e.key] = e.value
  }
  return Out
}

export function latestBody(Edits: Edit[], post: string, find: string): string | undefined {
  let Last: string | undefined
  for (const e of pendingSorted(Edits)) if (e.kind === 'body' && e.post === post && e.find === find) Last = e.replace
  return Last
}

export function latestReview(Edits: Edit[], vizId: string): ReviewEdit | undefined {
  let Last: ReviewEdit | undefined
  for (const e of pendingSorted(Edits)) if (e.kind === 'review' && e.vizId === vizId) Last = e
  return Last
}

// 문서 id : 시각 + 난수 (경로 문법에 맞게 : 를 - 로)
export const editId = (e: Edit) => `${e.at.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 6)}`
