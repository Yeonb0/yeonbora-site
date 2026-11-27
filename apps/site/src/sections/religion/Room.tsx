// 종교학 방 섬 : 상자 골격만 그리고, 장면과 연출은 room.ts 가 맡는다
import { useEffect, useRef } from 'react'
import { mountRoom } from './room'
import type { Religion } from './types'
import './room.css'

interface Props {
  religions: Religion[]
  velvet: { wide: string; tall: string }
}

export default function Room({ religions, velvet }: Props) {
  const RootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const Root = RootRef.current
    if (!Root) return
    return mountRoom({ root: Root, religions, velvet, fromHub: document.documentElement.hasAttribute('data-enter-hub') })
  }, [religions, velvet])

  return (
    <div className="religion-room" ref={RootRef}>
      <div className="stage">
        <div className="box">
          <div className="floor-shadow" />
          <div className="tray">
            <div className="lining">
              <img className="velvet" src={velvet.wide} alt="" draggable={false} />
              <canvas className="badges3d" />
              <div className="hits" />
            </div>
          </div>
          <div className="lid">
            <div className="frame" />
          </div>
          <span className="latch l" />
          <span className="latch r" />
        </div>
      </div>
      <div className="dimmer" />
      <canvas className="lift3d" />
      <section className="docs" aria-live="polite">
        <button className="docs-back" type="button" aria-label="뱃지로 돌아가기">
          ← 돌아가기
        </button>
        <div className="docs-inner">
          <h1 />
          <ol className="docs-list" />
        </div>
      </section>
    </div>
  )
}
