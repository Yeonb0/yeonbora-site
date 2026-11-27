// glob loader 감싸기 : 링크 대상 (제목 · aliases · slug · 첨부) 이 바뀌면 모든 노트를 다시 렌더한다
// glob loader 는 파일 내용 digest 가 같으면 렌더를 건너뛰어, 새 노트로 가는 링크가 다른 노트에서 낡은 채 남았다
import type { Loader, LoaderContext } from 'astro/loaders'
import { getGraph, getGraphSignature, invalidateContentIndex } from './index-fs'

const assertNoDuplicates = (contentDir: string) => {
  const Dup = getGraph(contentDir).duplicates
  if (Dup.length > 0) throw new Error(`제목 · 파일명 (slug) 중복 : ${Dup.join(', ')}`)
}

export const graphAware = (inner: Loader, contentDir: string): Loader => ({
  name: `graph-aware-${inner.name}`,
  load: async (ctx: LoaderContext) => {
    assertNoDuplicates(contentDir)
    let Sig = getGraphSignature(contentDir)
    // 렌더 캐시 열쇠에 그래프 서명을 섞는다
    const withGraph = (c: LoaderContext): LoaderContext => ({ ...c, generateDigest: (data) => c.generateDigest(`${typeof data === 'string' ? data : JSON.stringify(data)}\u0000${Sig}`) })
    await inner.load(withGraph(ctx))
    const W = ctx.watcher
    if (!W) return
    // 개발 서버 : 노트 · 첨부가 바뀌면 색인을 무효화하고, 서명이 달라졌으면 전체를 다시 동기화한다
    let Busy = Promise.resolve()
    const onFs = (path: string) => {
      if (!path.startsWith(contentDir) || path.includes('/.obsidian/')) return
      Busy = Busy.then(async () => {
        invalidateContentIndex(contentDir)
        const Next = getGraphSignature(contentDir)
        if (Next === Sig) return
        Sig = Next
        try {
          assertNoDuplicates(contentDir)
        } catch (e) {
          ctx.logger.warn((e as Error).message)
          return
        }
        ctx.logger.info('링크 대상이 바뀌어 노트를 다시 렌더한다')
        // watcher 없이 다시 불러 감시 등록이 겹치지 않게 한다
        await inner.load(withGraph({ ...ctx, watcher: undefined }))
      })
    }
    W.on('add', onFs)
    W.on('change', onFs)
    W.on('unlink', onFs)
  },
})
