// config.json 으로 그리는 조절판 : 입력 중에는 미리보기만 바꾸고, 놓았을 때 (change) 한 건만 기록한다
import { useEffect, useRef, useState } from 'react'
import { validateValue, type ConfigField, type FieldValue, type Values, type VizConfig } from '../viz/types'

interface Props {
  config: VizConfig
  values: Values
  onCommit: (key: string, value: FieldValue) => void
  // 미리보기용 : 끄는 중의 값
  onPreview?: (key: string, value: FieldValue) => void
  readOnly?: boolean
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// React 의 onChange 는 input 마다 불리므로 진짜 change 이벤트를 따로 듣는다
function useNativeChange<T extends HTMLElement>(fn: () => void) {
  const Ref = useRef<T>(null)
  const Fn = useRef(fn)
  Fn.current = fn
  useEffect(() => {
    const El = Ref.current
    if (!El) return
    const on = () => Fn.current()
    El.addEventListener('change', on)
    return () => El.removeEventListener('change', on)
  }, [])
  return Ref
}

function Field({ name, field, value, onCommit, onPreview, readOnly }: { name: string; field: ConfigField; value: FieldValue } & Omit<Props, 'config' | 'values'>) {
  const [draft, setDraft] = useState<FieldValue>(value)
  const Draft = useRef(draft)
  Draft.current = draft
  useEffect(() => setDraft(value), [JSON.stringify(value)])

  const commit = (v: FieldValue) => {
    if (same(v, value)) return
    if (validateValue(field, v).ok) onCommit(name, v)
  }
  const change = (v: FieldValue) => {
    setDraft(v)
    onPreview?.(name, v)
  }
  const Ref = useNativeChange<HTMLInputElement>(() => commit(Draft.current))
  const SelRef = useNativeChange<HTMLSelectElement>(() => commit(Draft.current))

  switch (field.type) {
    case 'range':
      return (
        <label className="ctl">
          <span>{field.label}</span>
          <input ref={Ref} type="range" min={field.min} max={field.max} step={field.step} value={Number(draft)} disabled={readOnly} onChange={(e) => change(Number(e.currentTarget.value))} />
          <output>{String(draft)}</output>
        </label>
      )
    case 'color':
      return (
        <label className="ctl">
          <span>{field.label}</span>
          <input ref={Ref} type="color" value={String(draft)} disabled={readOnly} onChange={(e) => change(e.currentTarget.value)} />
          <output>{String(draft)}</output>
        </label>
      )
    case 'toggle':
      return (
        <label className="ctl">
          <span>{field.label}</span>
          <input
            type="checkbox"
            checked={Boolean(draft)}
            disabled={readOnly}
            onChange={(e) => {
              const V = e.currentTarget.checked
              change(V)
              commit(V)
            }}
          />
        </label>
      )
    case 'select':
      return (
        <label className="ctl">
          <span>{field.label}</span>
          <select ref={SelRef} value={String(draft)} disabled={readOnly} onChange={(e) => change(e.currentTarget.value)}>
            {field.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      )
    case 'text':
      if (typeof field.value === 'string')
        return (
          <label className="ctl ctl-text">
            <span>{field.label}</span>
            <input ref={Ref} type="text" value={String(draft)} disabled={readOnly} onChange={(e) => change(e.currentTarget.value)} />
          </label>
        )
      return (
        <fieldset className="ctl-group">
          <legend>{field.label}</legend>
          {Object.keys(field.value).map((k) => (
            <TextKey key={k} name={name} k={k} draft={draft as Record<string, string>} readOnly={readOnly} change={change} commit={commit} />
          ))}
        </fieldset>
      )
  }
}

function TextKey({ name, k, draft, readOnly, change, commit }: { name: string; k: string; draft: Record<string, string>; readOnly?: boolean; change: (v: FieldValue) => void; commit: (v: FieldValue) => void }) {
  const Draft = useRef(draft)
  Draft.current = draft
  const Ref = useNativeChange<HTMLInputElement>(() => commit(Draft.current))
  return (
    <label className="ctl ctl-text">
      <span>{k}</span>
      <input ref={Ref} data-key={`${name}.${k}`} type="text" value={draft[k] ?? ''} disabled={readOnly} onChange={(e) => change({ ...draft, [k]: e.currentTarget.value })} />
    </label>
  )
}

export function Controls({ config, values, ...rest }: Props) {
  return (
    <div className="controls">
      {Object.entries(config).map(([k, f]) => (
        <Field key={k} name={k} field={f} value={values[k] ?? f.value} {...rest} />
      ))}
    </div>
  )
}
