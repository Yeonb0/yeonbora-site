// 인문 블로그 도서관 섬 : 골격만 그리고, 도서관 · 책 연출은 library.ts 가 맡는다
import { useEffect, useRef } from 'react'
import { mountLibrary } from './library'
import type { PostLink } from './library'
import './library.css'

interface Props {
  urls: Record<string, string>
  posts: Record<string, PostLink[]>
}

export default function Library({ urls, posts }: Props) {
  const RootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const Root = RootRef.current
    if (!Root) return
    return mountLibrary({ root: Root, urls, posts })
  }, [urls, posts])

  return (
    <div className="humanities-library" ref={RootRef}>
      <aside className="side">
        <div className="tabs" role="tablist" aria-label="분야" />
        <nav aria-label="분류" />
      </aside>
      <div className="room">
        <div className="lib overview">
          <div className="world" />
        </div>
        <div className="scroller">
          <div className="scene hidden">
            <img className="bg" alt="" draggable={false} />
          </div>
        </div>
        <button className="overview-btn" type="button" aria-label="도서관 전체 보기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
          </svg>
        </button>
        <div className="dim" />
        <div className="stage" />
        <button className="close" type="button" aria-label="책 덮기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
