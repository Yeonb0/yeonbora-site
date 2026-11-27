// 시안 작업대에 올릴 것 : review.json status 가 pending 인 시각화와 그 글
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Review, VizConfig } from '../../src/viz/types'

export interface DraftViz {
  id: string
  config: VizConfig
  review: Review
  post: string
}

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T

export const postFile = (siteDir: string, post: string) => join(siteDir, 'src/content', `${post}.md`)

export function collectPending(siteDir: string): { Viz: DraftViz[]; postPaths: string[] } {
  const VizDir = join(siteDir, 'src/viz')
  const Viz: DraftViz[] = []
  for (const id of readdirSync(VizDir).sort()) {
    const ReviewPath = join(VizDir, id, 'review.json')
    if (!existsSync(ReviewPath)) continue
    const review = readJson<Review>(ReviewPath)
    if (review.status !== 'pending') continue
    const File = postFile(siteDir, review.post)
    if (!existsSync(File)) throw new Error(`viz ${id} : 글이 없음 (${review.post})`)
    const BlockRe = new RegExp(`^\`\`\`viz[ \\t]+${id}[ \\t]*$`, 'm')
    if (!BlockRe.test(readFileSync(File, 'utf8'))) throw new Error(`viz ${id} : ${review.post} 에 viz 블록이 없음`)
    Viz.push({ id, config: readJson<VizConfig>(join(VizDir, id, 'config.json')), review, post: review.post })
  }
  return { Viz, postPaths: [...new Set(Viz.map((v) => v.post))] }
}
