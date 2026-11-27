// figure[data-viz] 에 시각화 컴포넌트를 붙인다 : 사이트와 시안 작업대가 함께 쓴다
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { toValues, type Values, type VizComponent, type VizConfig } from './types'

export type Loaded = { default: VizComponent; config: VizConfig }
export type Loader = (id: string) => Promise<Loaded> | undefined

export async function mountViz(el: HTMLElement, load: Loader, override?: Values): Promise<() => void> {
  const Id = el.dataset.viz ?? ''
  const Pending = load(Id)
  if (!Pending) {
    console.warn(`[viz] 없는 시각화 : ${Id}`)
    return () => {}
  }
  const { default: Viz, config } = await Pending
  const Target = el.querySelector<HTMLElement>('.viz-mount') ?? el
  const Root = createRoot(Target)
  Root.render(createElement(Viz, { values: { ...toValues(config), ...override } }))
  return () => Root.unmount()
}

export function observeViz(root: ParentNode, load: Loader): () => void {
  const Seen = new WeakSet<Element>()
  const Stops: Promise<() => void>[] = []
  const Io = new IntersectionObserver(
    (Entries) => {
      for (const e of Entries) {
        if (!e.isIntersecting || Seen.has(e.target)) continue
        Seen.add(e.target)
        Io.unobserve(e.target)
        Stops.push(mountViz(e.target as HTMLElement, load).catch((err) => {
          console.warn('[viz] 불러오지 못함', err)
          return () => {}
        }))
      }
    },
    { rootMargin: '200px' },
  )
  root.querySelectorAll('figure[data-viz]').forEach((el) => Io.observe(el))
  return () => {
    Io.disconnect()
    Stops.forEach((p) => void p.then((stop) => stop()))
  }
}

// 사이트용 : 컴포넌트는 보일 때 받고, config 는 작아서 함께 싣는다
const Components = import.meta.glob<{ default: VizComponent }>('./*/index.tsx')
const Configs = import.meta.glob<VizConfig>('./*/config.json', { eager: true, import: 'default' })

export const siteLoader: Loader = (id) => {
  const get = Components[`./${id}/index.tsx`]
  const config = Configs[`./${id}/config.json`]
  if (!get || !config) return undefined
  return get().then((m) => ({ default: m.default, config }))
}
