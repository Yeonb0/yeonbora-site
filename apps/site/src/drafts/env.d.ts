declare module 'virtual:drafts-viz' {
  import type { VizComponent } from '@/viz/types'
  const Table: Record<string, () => Promise<{ default: VizComponent }>>
  export default Table
}
