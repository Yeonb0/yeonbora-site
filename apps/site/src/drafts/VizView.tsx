// 시각화 미리보기 : 묶음에 든 컴포넌트만 (virtual:drafts-viz)
import { createElement, lazy, Suspense, type LazyExoticComponent } from 'react'
import Table from 'virtual:drafts-viz'
import type { Values, VizComponent } from '../viz/types'

const Cache = new Map<string, LazyExoticComponent<VizComponent>>()

export const vizComponent = (id: string) => {
  const Load = Table[id]
  if (!Load) return undefined
  if (!Cache.has(id)) Cache.set(id, lazy(Load))
  return Cache.get(id)!
}

export function VizView({ id, values }: { id: string; values: Values }) {
  const C = vizComponent(id)
  if (!C) return null
  return <Suspense fallback={<div className="viz-loading" />}>{createElement(C, { values })}</Suspense>
}
