// 글 본문 : viz 자리에 미리보기를 붙이고, 블록을 누르면 원문 수정 창을 연다
import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { DraftPost } from '../../scripts/drafts/render-post'
import type { Values } from '../viz/types'
import { VizView } from './VizView'

interface Props {
  post: Omit<DraftPost, 'Images'>
  vizValues: (id: string) => Values | undefined
  edited: (find: string) => string | undefined
  onBlock: (index: number) => void
}

export function PostView({ post, vizValues, edited, onBlock }: Props) {
  const Ref = useRef<HTMLDivElement>(null)
  const Roots = useRef<Root[]>([])

  // 본문 HTML 은 저장소의 글에서 만든 것 (db 값은 넣지 않는다)
  useEffect(() => {
    const El = Ref.current!
    El.innerHTML = post.html
    return () => {
      const Old = Roots.current
      setTimeout(() => Old.forEach((r) => r.unmount()))
      Roots.current = []
    }
  }, [post.html])

  // 수정한 블록은 고친 원문을 글자 그대로 보여 준다
  useEffect(() => {
    const El = Ref.current!
    El.querySelectorAll<HTMLElement>('[data-block]').forEach((b) => {
      const I = Number(b.dataset.block)
      const New = edited(post.Blocks[I]?.text ?? '')
      if (New === undefined) return
      b.classList.add('edited')
      b.textContent = New
    })
  })

  useEffect(() => {
    const El = Ref.current!
    El.querySelectorAll<HTMLElement>('figure[data-viz]').forEach((f, i) => {
      const V = vizValues(f.dataset.viz ?? '')
      const Mount = f.querySelector<HTMLElement>('.viz-mount')
      if (!V || !Mount) return
      if (!Roots.current[i]) Roots.current[i] = createRoot(Mount)
      Roots.current[i].render(<VizView id={f.dataset.viz!} values={V} />)
    })
  })

  return (
    <div
      ref={Ref}
      className="post-body"
      onClick={(e) => {
        const T = e.target as HTMLElement
        if (T.closest('a')) e.preventDefault()
        if (T.closest('figure[data-viz]')) return
        const B = T.closest<HTMLElement>('[data-block]')
        if (B) onBlock(Number(B.dataset.block))
      }}
    />
  )
}
