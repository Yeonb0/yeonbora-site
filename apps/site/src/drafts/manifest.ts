// 묶음 index.html 에 들어 있는 목록 (bundle.ts 가 주입)
import type { DraftViz } from '../../scripts/drafts/collect'

export interface DraftsManifest {
  builtAt: string
  Viz: DraftViz[]
  // 글 경로 → data/post-<hash>.json
  Posts: Record<string, string>
}

export function readManifest(): DraftsManifest {
  const El = document.getElementById('manifest')
  return JSON.parse(El?.textContent || '{"builtAt":"","Viz":[],"Posts":{}}') as DraftsManifest
}
