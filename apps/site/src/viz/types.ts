// 시각화 계약 : config.json · review.json 모양과 컴포넌트 props (규칙은 docs/content-rules.md)
import type { ComponentType } from 'react'

export type ConfigField = { label: string } & (
  | { type: 'range'; min: number; max: number; step: number; value: number }
  | { type: 'color'; value: string }
  | { type: 'toggle'; value: boolean }
  | { type: 'select'; options: string[]; value: string }
  | { type: 'text'; value: string | Record<string, string> }
)

export type FieldValue = ConfigField['value']
export type VizConfig = Record<string, ConfigField>
export type Values = Record<string, FieldValue>
export type VizProps = { values: Values }
export type VizComponent = ComponentType<VizProps>

export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export interface Review {
  status: ReviewStatus
  post: string
  note: string
  updated: string
}

export type Validated = { ok: true; value: FieldValue } | { ok: false; reason: string }

const HexRe = /^#[0-9a-fA-F]{6}$/

export function toValues(Config: VizConfig): Values {
  return Object.fromEntries(Object.entries(Config).map(([k, f]) => [k, f.value]))
}

const isStringRecord = (v: unknown): v is Record<string, string> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'string')

export function validateValue(Field: ConfigField, value: unknown): Validated {
  const fail = (reason: string): Validated => ({ ok: false, reason })
  switch (Field.type) {
    case 'range': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return fail('숫자가 아님')
      if (value < Field.min || value > Field.max) return fail(`범위 밖 (${Field.min} ~ ${Field.max})`)
      // 소수 오차를 감안해 step 배수인지 본다
      const n = (value - Field.min) / Field.step
      if (Math.abs(n - Math.round(n)) > 1e-6) return fail(`step ${Field.step} 배수가 아님`)
      return { ok: true, value }
    }
    case 'color':
      return typeof value === 'string' && HexRe.test(value) ? { ok: true, value } : fail('#rrggbb 형식이 아님')
    case 'toggle':
      return typeof value === 'boolean' ? { ok: true, value } : fail('true / false 가 아님')
    case 'select':
      return typeof value === 'string' && Field.options.includes(value) ? { ok: true, value } : fail('options 에 없는 값')
    case 'text': {
      if (typeof Field.value === 'string') return typeof value === 'string' ? { ok: true, value } : fail('문자열이 아님')
      if (!isStringRecord(value)) return fail('문구 객체가 아님')
      const Want = Object.keys(Field.value).sort().join('\n')
      const Got = Object.keys(value).sort().join('\n')
      return Want === Got ? { ok: true, value } : fail('문구 키가 다름')
    }
  }
}
